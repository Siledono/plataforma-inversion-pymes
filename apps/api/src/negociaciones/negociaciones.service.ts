import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import {
  AccionEmpresa,
  AccionInversor,
  CrearNegociacionDto,
  EmpresaRespondeNegociacionDto,
  InversorRespondeNegociacionDto,
} from './dto/negociaciones.dto'

@Injectable()
export class NegociacionesService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CREAR OFERTA (inversor → proyecto)
  // ═══════════════════════════════════════════════════════

  async crear(userId: string, dto: CrearNegociacionDto) {
    // Verificar que el usuario tiene perfil de inversor
    const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
    if (!inversor) throw new ForbiddenException('Solo inversores pueden hacer ofertas')

    // Verificar que el proyecto existe y está en estado válido
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: dto.proyectoId },
      include: { empresa: { include: { user: true } } },
    })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')
    if (!['publicado', 'en_revision_banco'].includes(proyecto.estado)) {
      throw new BadRequestException('El proyecto no está disponible para negociación')
    }

    // Un inversor solo puede tener 1 negociación activa por proyecto
    const negociacionExistente = await this.prisma.negociacion.findFirst({
      where: {
        proyectoId: dto.proyectoId,
        inversorId: inversor.id,
        estado: { in: ['pendiente', 'contraoferta'] },
      },
    })
    if (negociacionExistente) throw new ConflictException('Ya tienes una negociación activa en este proyecto')

    const expiraEn = new Date()
    expiraEn.setHours(expiraEn.getHours() + 24)

    const negociacion = await this.prisma.negociacion.create({
      data: {
        proyectoId: dto.proyectoId,
        inversorId: inversor.id,
        montoOfertado: dto.montoOfertado,
        tipo: dto.tipo,
        estado: 'pendiente',
        expiraEn,
      },
    })

    // Notificar a la empresa
    await this.notificaciones.notificarOfertaRecibida(
      proyecto.empresa.userId,
      proyecto.empresa.user.email,
      proyecto.titulo,
      inversor.nombreCompleto,
    )

    return negociacion
  }

  // ═══════════════════════════════════════════════════════
  // EMPRESA RESPONDE (acepta / rechaza / contraoferta)
  // ═══════════════════════════════════════════════════════

  async empresaResponde(userId: string, id: string, dto: EmpresaRespondeNegociacionDto) {
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden responder negociaciones')

    const negociacion = await this.prisma.negociacion.findUnique({
      where: { id },
      include: {
        proyecto: { include: { empresa: true } },
        inversor: { include: { user: true } },
      },
    })
    if (!negociacion) throw new NotFoundException('Negociación no encontrada')
    if (negociacion.proyecto.empresaId !== empresa.id) throw new ForbiddenException('No tienes permiso sobre esta negociación')
    if (negociacion.estado !== 'pendiente') throw new BadRequestException('La negociación no está en estado pendiente')
    if (negociacion.expiraEn && negociacion.expiraEn < new Date()) throw new BadRequestException('La oferta ha expirado')

    if (dto.accion === AccionEmpresa.ACEPTAR) {
      return this.finalizarNegociacion(negociacion, 'empresa')
    }

    if (dto.accion === AccionEmpresa.RECHAZAR) {
      await this.prisma.negociacion.update({ where: { id }, data: { estado: 'rechazada' } })
      await this.regresarAPublicado(negociacion.proyectoId, negociacion.proyecto.estado)
      return { message: 'Oferta rechazada', estado: 'rechazada' }
    }

    // Contraofertar
    if (!dto.montoContraoferta) throw new BadRequestException('Debes especificar el monto de la contraoferta')
    const expiraEn = new Date()
    expiraEn.setHours(expiraEn.getHours() + 24)

    await this.prisma.negociacion.update({
      where: { id },
      data: { estado: 'contraoferta', montoContraoferta: dto.montoContraoferta, expiraEn },
    })

    // Notificar al inversor
    await this.notificaciones.notificarContraoferta(
      negociacion.inversor.userId,
      negociacion.inversor.user.email,
      negociacion.proyecto.titulo,
      empresa.nombreEmpresa,
    )

    return { message: 'Contraoferta enviada', estado: 'contraoferta' }
  }

  // ═══════════════════════════════════════════════════════
  // INVERSOR RESPONDE a la contraoferta de la empresa
  // ═══════════════════════════════════════════════════════

  async inversorResponde(userId: string, id: string, dto: InversorRespondeNegociacionDto) {
    const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
    if (!inversor) throw new ForbiddenException('Solo inversores pueden responder contraofertass')

    const negociacion = await this.prisma.negociacion.findUnique({
      where: { id },
      include: {
        proyecto: { include: { empresa: { include: { user: true } } } },
        inversor: true,
      },
    })
    if (!negociacion) throw new NotFoundException('Negociación no encontrada')
    if (negociacion.inversorId !== inversor.id) throw new ForbiddenException('No tienes permiso sobre esta negociación')
    if (negociacion.estado !== 'contraoferta') throw new BadRequestException('No hay contraoferta pendiente de respuesta')
    if (negociacion.expiraEn && negociacion.expiraEn < new Date()) throw new BadRequestException('La contraoferta ha expirado')

    if (dto.accion === AccionInversor.ACEPTAR) {
      return this.finalizarNegociacion(negociacion, 'inversor')
    }

    // Rechazar → única ronda agotada, proyecto regresa a publicado
    await this.prisma.negociacion.update({ where: { id }, data: { estado: 'rechazada' } })
    await this.regresarAPublicado(negociacion.proyectoId, negociacion.proyecto.estado)
    return { message: 'Contraoferta rechazada, proyecto de vuelta en disponible', estado: 'rechazada' }
  }

  // ═══════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════

  // Solo las dos partes involucradas pueden ver una negociación
  async findById(userId: string, id: string) {
    const negociacion = await this.prisma.negociacion.findUnique({
      where: { id },
      include: {
        proyecto: { include: { empresa: true } },
        inversor: true,
      },
    })
    if (!negociacion) throw new NotFoundException('Negociación no encontrada')

    const esEmpresa = negociacion.proyecto.empresa.userId === userId
    const esInversor = negociacion.inversor.userId === userId
    if (!esEmpresa && !esInversor) throw new ForbiddenException('No tienes acceso a esta negociación')

    return negociacion
  }

  // Lista las negociaciones propias según el rol
  async findMias(userId: string, rol: string) {
    if (rol === 'empresa') {
      const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
      if (!empresa) throw new ForbiddenException('Perfil de empresa no encontrado')
      return this.prisma.negociacion.findMany({
        where: { proyecto: { empresaId: empresa.id } },
        include: {
          proyecto: { select: { id: true, titulo: true, estado: true } },
          inversor: { select: { nombreCompleto: true } },
        },
        orderBy: { createdAt: 'desc' } as any,
      })
    }

    const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
    if (!inversor) throw new ForbiddenException('Perfil de inversor no encontrado')
    return this.prisma.negociacion.findMany({
      where: { inversorId: inversor.id },
      include: {
        proyecto: { select: { id: true, titulo: true, estado: true } },
      },
      orderBy: { createdAt: 'desc' } as any,
    })
  }

  // ═══════════════════════════════════════════════════════
  // CRON: expirar negociaciones vencidas cada hora
  // ═══════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_HOUR)
  async expirarNegociaciones() {
    const vencidas = await this.prisma.negociacion.findMany({
      where: {
        estado: { in: ['pendiente', 'contraoferta'] },
        expiraEn: { lt: new Date() },
      },
      include: { proyecto: true },
    })

    for (const neg of vencidas) {
      await this.prisma.negociacion.update({ where: { id: neg.id }, data: { estado: 'expirada' } })
      await this.regresarAPublicado(neg.proyectoId, neg.proyecto.estado)
    }
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════

  private async finalizarNegociacion(negociacion: any, quienAcepto: 'empresa' | 'inversor') {
    // El monto final es la contraoferta si existe, si no la oferta original
    const montoFinal = Number(negociacion.montoContraoferta ?? negociacion.montoOfertado)

    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: negociacion.proyectoId } })

    // Estado del proyecto: si ya tiene banco → financiado_total, si no → financiado_inversor
    const nuevoEstado = ['financiado_banco', 'en_revision_banco'].includes(proyecto.estado)
      ? 'financiado_total'
      : 'financiado_inversor'

    await this.prisma.$transaction([
      this.prisma.negociacion.update({ where: { id: negociacion.id }, data: { estado: 'aceptada' } }),
      this.prisma.proyecto.update({
        where: { id: negociacion.proyectoId },
        data: {
          estado: nuevoEstado,
          totalInvertido: { increment: montoFinal },
        },
      }),
    ])

    // Notificar a la empresa que fue aceptado
    await this.notificaciones.notificarProyectoAceptado(
      negociacion.proyecto.empresa.userId,
      negociacion.proyecto.empresa.user.email,
      negociacion.proyecto.titulo,
      negociacion.inversor.nombreCompleto,
    )

    return { message: 'Negociación aceptada exitosamente', estado: 'aceptada', montoFinal }
  }

  // Solo regresar a publicado si el proyecto no está en un estado financiado
  private async regresarAPublicado(proyectoId: string, estadoActual: string) {
    if (['financiado_banco', 'financiado_inversor', 'financiado_total'].includes(estadoActual)) return
    await this.prisma.proyecto.update({ where: { id: proyectoId }, data: { estado: 'publicado' } })
  }
}
