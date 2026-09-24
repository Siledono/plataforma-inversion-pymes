import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProyectoDto, FilterProyectosDto, UpdateProyectoDto } from './dto/proyectos.dto'

// Estados en los que NO se puede editar un proyecto
const ESTADOS_BLOQUEADOS = ['financiado_banco', 'financiado_inversor', 'financiado_total', 'eliminado']

// Campos privados que no se muestran en listado público
const CAMPOS_PRIVADOS = {
  empresa: {
    ingresosAnuales: false,
    deudasActuales: false,
    documentoUrl: false,
  },
}

@Injectable()
export class ProyectosService {
  constructor(private prisma: PrismaService) {}

  // ─── Crear proyecto (solo empresa) ───────────────────────
  async create(userId: string, dto: CreateProyectoDto) {
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden crear proyectos')

    return this.prisma.proyecto.create({
      data: {
        empresaId: empresa.id,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        montoMin: dto.montoMin,
        montoMax: dto.montoMax,
        tipoFinanciamiento: dto.tipoFinanciamiento as any,
        porcentajeAcciones: dto.porcentajeAcciones,
        documentoUrl: dto.documentoUrl,
        estado: 'borrador',
        totalInvertido: 0,
      },
    })
  }

  // ─── Publicar proyecto ────────────────────────────────────
  async publicar(userId: string, id: string) {
    const proyecto = await this.findOwnProject(userId, id)
    if (proyecto.estado !== 'borrador') {
      throw new BadRequestException('Solo proyectos en borrador pueden publicarse')
    }
    return this.prisma.proyecto.update({
      where: { id },
      data: { estado: 'publicado' },
    })
  }

  // ─── Editar proyecto ──────────────────────────────────────
  async update(userId: string, id: string, dto: UpdateProyectoDto) {
    const proyecto = await this.findOwnProject(userId, id)
    if (ESTADOS_BLOQUEADOS.includes(proyecto.estado)) {
      throw new BadRequestException(`No se puede editar un proyecto en estado: ${proyecto.estado}`)
    }
    return this.prisma.proyecto.update({
      where: { id },
      data: { ...dto } as any,
    })
  }

  // ─── Eliminar proyecto (soft delete) ─────────────────────
  async remove(userId: string, id: string) {
    await this.findOwnProject(userId, id)
    return this.prisma.proyecto.update({
      where: { id },
      data: { estado: 'eliminado' },
    })
  }

  // ─── Listar proyectos publicados ──────────────────────────
  async findAll(filters: FilterProyectosDto) {
    const where: any = { estado: 'publicado' }

    if (filters.sector) where.empresa = { sectorScian: { contains: filters.sector } }
    if (filters.tipoFinanciamiento) where.tipoFinanciamiento = filters.tipoFinanciamiento
    if (filters.montoMinimo) where.montoMin = { gte: filters.montoMinimo }
    if (filters.montoMaximo) where.montoMax = { lte: filters.montoMaximo }

    const proyectos = await this.prisma.proyecto.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nombreEmpresa: true,
            sectorScian: true,
            aniosOperacion: true,
            numEmpleados: true,
            // Datos privados excluidos del listado público
            ingresosAnuales: false,
            deudasActuales: false,
            documentoUrl: false,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return proyectos
  }

  // ─── Ver detalle de proyecto (con control de privacidad) ─
  async findOne(id: string, userId: string, userRol: string) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: {
        empresa: true,
      },
    })

    if (!proyecto || proyecto.estado === 'eliminado') {
      throw new NotFoundException('Proyecto no encontrado')
    }

    const puedeVerPrivado = await this.puedeVerDatosPrivados(userId, userRol, id)

    if (!puedeVerPrivado) {
      // Ocultar datos financieros privados
      const { empresa, ...resto } = proyecto
      return {
        ...resto,
        empresa: {
          id: empresa.id,
          nombreEmpresa: empresa.nombreEmpresa,
          sectorScian: empresa.sectorScian,
          aniosOperacion: empresa.aniosOperacion,
          numEmpleados: empresa.numEmpleados,
        },
      }
    }

    return proyecto
  }

  // ─── Mis proyectos (para el dashboard de empresa) ────────
  async findMios(userId: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden ver sus proyectos')

    return this.prisma.proyecto.findMany({
      where: {
        empresaId: empresa.id,
        estado: { not: 'eliminado' },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ─── Helper: verificar que el proyecto pertenece a la empresa ──
  private async findOwnProject(userId: string, proyectoId: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden gestionar proyectos')

    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: proyectoId } })
    if (!proyecto || proyecto.estado === 'eliminado') throw new NotFoundException('Proyecto no encontrado')
    if (proyecto.empresaId !== empresa.id) throw new ForbiddenException('No tienes permiso sobre este proyecto')

    return proyecto
  }

  // ─── Helper: verificar si puede ver datos privados ───────
  async puedeVerDatosPrivados(userId: string, userRol: string, proyectoId: string): Promise<boolean> {
    if (userRol === 'admin') return true

    // La empresa dueña siempre puede ver sus propios datos
    if (userRol === 'empresa') {
      const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
      const proyecto = await this.prisma.proyecto.findUnique({ where: { id: proyectoId } })
      return empresa?.id === proyecto?.empresaId
    }

    if (userRol === 'banco') {
      const banco = await this.prisma.banco.findUnique({ where: { userId } })
      if (!banco) return false
      const solicitud = await this.prisma.solicitudBanco.findFirst({
        where: {
          proyectoId,
          propuestaBanco: { bancoId: banco.id },
          estado: { in: ['en_revision', 'contraoferta_pendiente', 'aceptada'] },
        },
      })
      return !!solicitud
    }

    if (userRol === 'inversor') {
      const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
      if (!inversor) return false
      const negociacion = await this.prisma.negociacion.findFirst({
        where: {
          proyectoId,
          inversorId: inversor.id,
          estado: { in: ['pendiente', 'contraoferta', 'aceptada'] },
        },
      })
      return !!negociacion
    }

    return false
  }
}
