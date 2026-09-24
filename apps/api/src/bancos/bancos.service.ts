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
  AdminUpdatePropuestaDto,
  CreatePropuestaDto,
  CreateSolicitudDto,
  EmpresaRespondeDto,
  ResponderSolicitudBancoDto,
  UpdatePropuestaDto,
} from './dto/bancos.dto'

@Injectable()
export class BancosService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // PROPUESTAS DE BANCO
  // ═══════════════════════════════════════════════════════

  async createPropuesta(userId: string, dto: CreatePropuestaDto) {
    const banco = await this.getBancoOrThrow(userId)
    return this.prisma.propuestaBanco.create({
      data: {
        bancoId: banco.id,
        nombre: dto.nombre,
        requisitos: dto.requisitos,
        montoFijo: dto.montoFijo,
        tasaInteres: dto.tasaInteres,
        activa: true,
      },
    })
  }

  // Banco puede editar todo EXCEPTO montoFijo y tasaInteres
  async updatePropuesta(userId: string, id: string, dto: UpdatePropuestaDto) {
    const banco = await this.getBancoOrThrow(userId)
    const propuesta = await this.prisma.propuestaBanco.findUnique({ where: { id } })
    if (!propuesta) throw new NotFoundException('Propuesta no encontrada')
    if (propuesta.bancoId !== banco.id) throw new ForbiddenException('No tienes permiso sobre esta propuesta')

    return this.prisma.propuestaBanco.update({
      where: { id },
      data: { nombre: dto.nombre, requisitos: dto.requisitos, activa: dto.activa },
    })
  }

  // Solo Admin puede editar montos/tasas
  async adminUpdatePropuesta(id: string, dto: AdminUpdatePropuestaDto) {
    const propuesta = await this.prisma.propuestaBanco.findUnique({ where: { id } })
    if (!propuesta) throw new NotFoundException('Propuesta no encontrada')
    return this.prisma.propuestaBanco.update({ where: { id }, data: { ...dto } as any })
  }

  async getPropuestas() {
    return this.prisma.propuestaBanco.findMany({
      where: { activa: true },
      include: {
        banco: {
          select: { nombreInstitucional: true, claveBanxico: true },
        },
      },
      orderBy: { montoFijo: 'asc' },
    })
  }

  async getMisPropuestas(userId: string) {
    const banco = await this.getBancoOrThrow(userId)
    return this.prisma.propuestaBanco.findMany({
      where: { bancoId: banco.id },
      orderBy: { createdAt: 'desc' } as any,
    })
  }

  // ═══════════════════════════════════════════════════════
  // SOLICITUDES
  // ═══════════════════════════════════════════════════════

  async createSolicitud(userId: string, dto: CreateSolicitudDto) {
    // Verificar que la empresa existe
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden enviar solicitudes')

    // Verificar que el proyecto existe, pertenece a la empresa y está publicado
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id: dto.proyectoId } })
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado')
    if (proyecto.empresaId !== empresa.id) throw new ForbiddenException('No tienes permiso sobre este proyecto')
    if (!['publicado', 'en_revision_banco'].includes(proyecto.estado)) {
      throw new BadRequestException('El proyecto debe estar publicado para enviar solicitudes')
    }

    // Verificar que la propuesta existe y está activa
    const propuesta = await this.prisma.propuestaBanco.findUnique({ where: { id: dto.propuestaBancoId } })
    if (!propuesta || !propuesta.activa) throw new NotFoundException('Propuesta de banco no disponible')

    // Una empresa solo puede tener 1 solicitud activa por propuesta
    const solicitudExistente = await this.prisma.solicitudBanco.findFirst({
      where: {
        proyectoId: dto.proyectoId,
        propuestaBancoId: dto.propuestaBancoId,
        estado: { in: ['en_revision', 'contraoferta_pendiente'] },
      },
    })
    if (solicitudExistente) throw new ConflictException('Ya existe una solicitud activa para esta propuesta')

    // Crear solicitud y actualizar estado del proyecto
    const [solicitud] = await this.prisma.$transaction([
      this.prisma.solicitudBanco.create({
        data: {
          proyectoId: dto.proyectoId,
          propuestaBancoId: dto.propuestaBancoId,
          estado: 'en_revision',
        },
      }),
      this.prisma.proyecto.update({
        where: { id: dto.proyectoId },
        data: { estado: 'en_revision_banco' },
      }),
    ])

    // Notificar al banco que recibió una solicitud
    const bancoUser = await this.prisma.user.findFirst({
      where: { banco: { id: propuesta.bancoId } },
    })
    if (bancoUser) {
      await this.notificaciones.notificarOfertaRecibida(
        bancoUser.id, bancoUser.email,
        proyecto.titulo, empresa.nombreEmpresa,
      )
    }

    return solicitud
  }

  // Banco responde: acepta / rechaza / contraoferta
  async responderSolicitud(userId: string, solicitudId: string, dto: ResponderSolicitudBancoDto) {
    const banco = await this.getBancoOrThrow(userId)

    const solicitud = await this.prisma.solicitudBanco.findUnique({
      where: { id: solicitudId },
      include: { propuestaBanco: true, proyecto: true },
    })
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada')
    if (solicitud.propuestaBanco.bancoId !== banco.id) throw new ForbiddenException('No tienes permiso sobre esta solicitud')
    if (solicitud.estado !== 'en_revision') throw new BadRequestException('Esta solicitud ya fue respondida')

    if (dto.decision === 'aceptada') {
      // Calcular nuevo estado del proyecto
      const nuevoEstado = solicitud.proyecto.estado === 'financiado_inversor'
        ? 'financiado_total'
        : 'financiado_banco'

      await this.prisma.$transaction([
        this.prisma.solicitudBanco.update({
          where: { id: solicitudId },
          data: { estado: 'aceptada' },
        }),
        this.prisma.proyecto.update({
          where: { id: solicitud.proyectoId },
          data: {
            estado: nuevoEstado,
            totalInvertido: { increment: solicitud.propuestaBanco.montoFijo },
          },
        }),
      ])
      // Notificar a la empresa que su proyecto fue aceptado
      const empresaUser = await this.prisma.user.findFirst({ where: { empresa: { id: solicitud.proyecto.empresaId } } })
      if (empresaUser) {
        await this.notificaciones.notificarProyectoAceptado(
          empresaUser.id, empresaUser.email,
          solicitud.proyecto.titulo, banco.nombreInstitucional,
        )
      }
      return { message: 'Solicitud aceptada', estado: 'aceptada' }
    }

    if (dto.decision === 'rechazada') {
      await this.prisma.$transaction([
        this.prisma.solicitudBanco.update({
          where: { id: solicitudId },
          data: { estado: 'rechazada' },
        }),
        this.prisma.proyecto.update({
          where: { id: solicitud.proyectoId },
          data: { estado: 'publicado' },
        }),
      ])
      return { message: 'Solicitud rechazada', estado: 'rechazada' }
    }

    // Contraoferta: 24hrs para responder
    if (dto.decision === 'contraoferta') {
      if (!dto.contraofertaDetalle) throw new BadRequestException('Debes incluir el detalle de la contraoferta')
      const expiraEn = new Date()
      expiraEn.setHours(expiraEn.getHours() + 24)

      await this.prisma.solicitudBanco.update({
        where: { id: solicitudId },
        data: {
          estado: 'contraoferta_pendiente',
          contraofertaDetalle: dto.contraofertaDetalle,
          expiraEn,
        },
      })
      // Notificar a la empresa la contraoferta
      const empresaUser = await this.prisma.user.findFirst({ where: { empresa: { id: solicitud.proyecto.empresaId } } })
      if (empresaUser) {
        await this.notificaciones.notificarContraoferta(
          empresaUser.id, empresaUser.email,
          solicitud.proyecto.titulo, banco.nombreInstitucional,
        )
      }
      return { message: 'Contraoferta enviada', estado: 'contraoferta_pendiente' }
    }
  }

  // Empresa responde a contraoferta del banco
  async empresaResponde(userId: string, solicitudId: string, dto: EmpresaRespondeDto) {
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden responder solicitudes')

    const solicitud = await this.prisma.solicitudBanco.findUnique({
      where: { id: solicitudId },
      include: { propuestaBanco: true, proyecto: true },
    })
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada')
    if (solicitud.proyecto.empresaId !== empresa.id) throw new ForbiddenException('No tienes permiso sobre esta solicitud')
    if (solicitud.estado !== 'contraoferta_pendiente') throw new BadRequestException('No hay contraoferta pendiente')
    if (solicitud.expiraEn && solicitud.expiraEn < new Date()) throw new BadRequestException('La contraoferta ha expirado')

    if (dto.decision === 'aceptada') {
      const nuevoEstado = solicitud.proyecto.estado === 'financiado_inversor'
        ? 'financiado_total'
        : 'financiado_banco'

      await this.prisma.$transaction([
        this.prisma.solicitudBanco.update({ where: { id: solicitudId }, data: { estado: 'aceptada' } }),
        this.prisma.proyecto.update({
          where: { id: solicitud.proyectoId },
          data: {
            estado: nuevoEstado,
            totalInvertido: { increment: solicitud.propuestaBanco.montoFijo },
          },
        }),
      ])
      return { message: 'Contraoferta aceptada', estado: 'aceptada' }
    }

    // Rechazada → proyecto vuelve a publicado
    await this.prisma.$transaction([
      this.prisma.solicitudBanco.update({ where: { id: solicitudId }, data: { estado: 'rechazada' } }),
      this.prisma.proyecto.update({ where: { id: solicitud.proyectoId }, data: { estado: 'publicado' } }),
    ])
    return { message: 'Contraoferta rechazada, proyecto de vuelta en disponible', estado: 'rechazada' }
  }

  // Ver solicitudes del banco
  async getMisSolicitudes(userId: string) {
    const banco = await this.getBancoOrThrow(userId)
    return this.prisma.solicitudBanco.findMany({
      where: { propuestaBanco: { bancoId: banco.id } },
      include: {
        proyecto: {
          include: { empresa: { select: { nombreEmpresa: true, sectorScian: true, aniosOperacion: true } } },
        },
        propuestaBanco: { select: { nombre: true, montoFijo: true } },
      },
      orderBy: { createdAt: 'desc' } as any,
    })
  }

  // Ver solicitudes de la empresa
  async getMisSolicitudesEmpresa(userId: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { userId } })
    if (!empresa) throw new ForbiddenException('Solo empresas pueden ver sus solicitudes')
    return this.prisma.solicitudBanco.findMany({
      where: { proyecto: { empresaId: empresa.id } },
      include: {
        propuestaBanco: {
          include: { banco: { select: { nombreInstitucional: true } } },
        },
        proyecto: { select: { titulo: true, estado: true } },
      },
      orderBy: { createdAt: 'desc' } as any,
    })
  }

  // ═══════════════════════════════════════════════════════
  // CRON: expirar solicitudes vencidas cada hora
  // ═══════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_HOUR)
  async expirarSolicitudes() {
    const vencidas = await this.prisma.solicitudBanco.findMany({
      where: {
        estado: 'contraoferta_pendiente',
        expiraEn: { lt: new Date() },
      },
      include: { proyecto: true },
    })

    for (const solicitud of vencidas) {
      await this.prisma.$transaction([
        this.prisma.solicitudBanco.update({
          where: { id: solicitud.id },
          data: { estado: 'expirada' },
        }),
        this.prisma.proyecto.update({
          where: { id: solicitud.proyectoId },
          data: { estado: 'publicado' },
        }),
      ])
    }
  }

  // ─── Helper privado ───────────────────────────────────
  private async getBancoOrThrow(userId: string) {
    const banco = await this.prisma.banco.findUnique({ where: { userId } })
    if (!banco) throw new ForbiddenException('Solo bancos pueden realizar esta acción')
    if (banco.suspendido) throw new ForbiddenException('Cuenta de banco suspendida')
    return banco
  }
}
