import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Resend } from 'resend'

export type TipoNotif = 'oferta_recibida' | 'contraoferta' | 'proyecto_aceptado'

interface CrearNotifOptions {
  userId: string
  tipo: TipoNotif
  mensaje: string
  emailDestino: string
  emailAsunto: string
  emailCuerpo: string
}

@Injectable()
export class NotificacionesService {
  private resend: Resend

  constructor(private prisma: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  // ─── Crear notificación in-app + enviar email ─────────
  async crear(opts: CrearNotifOptions) {
    // 1. Guardar en BD (in-app)
    await this.prisma.notificacion.create({
      data: {
        userId: opts.userId,
        mensaje: opts.mensaje,
        tipo: opts.tipo,
        leida: false,
      },
    })

    // 2. Enviar email de forma asíncrona (no bloquea el request)
    this.enviarEmail(opts.emailDestino, opts.emailAsunto, opts.emailCuerpo).catch(() => {
      // Email falla silenciosamente — la notificación in-app ya se guardó
    })
  }

  // ─── Listar notificaciones del usuario ────────────────
  async getMias(userId: string) {
    return this.prisma.notificacion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  // ─── Contar no leídas ─────────────────────────────────
  async contarNoLeidas(userId: string) {
    const count = await this.prisma.notificacion.count({
      where: { userId, leida: false },
    })
    return { count }
  }

  // ─── Marcar como leída ────────────────────────────────
  async marcarLeida(userId: string, id: string) {
    return this.prisma.notificacion.updateMany({
      where: { id, userId },
      data: { leida: true },
    })
  }

  // ─── Marcar todas como leídas ─────────────────────────
  async marcarTodasLeidas(userId: string) {
    return this.prisma.notificacion.updateMany({
      where: { userId, leida: false },
      data: { leida: true },
    })
  }

  // ─── Envío de email ───────────────────────────────────
  private async enviarEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_xxx')) return
    await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@conecta-inversion.gob.mx',
      to,
      subject,
      html,
    })
  }

  // ─── Helpers para disparar notificaciones específicas ─

  async notificarOfertaRecibida(empresaUserId: string, emailEmpresa: string, nombreProyecto: string, nombreInversor: string) {
    await this.crear({
      userId: empresaUserId,
      tipo: 'oferta_recibida',
      mensaje: `${nombreInversor} ha hecho una oferta sobre tu proyecto "${nombreProyecto}"`,
      emailDestino: emailEmpresa,
      emailAsunto: 'Nueva oferta recibida — Conecta Inversión',
      emailCuerpo: this.templateOfertaRecibida(nombreProyecto, nombreInversor),
    })
  }

  async notificarContraoferta(userId: string, email: string, nombreProyecto: string, de: string) {
    await this.crear({
      userId,
      tipo: 'contraoferta',
      mensaje: `${de} ha enviado una contraoferta para el proyecto "${nombreProyecto}"`,
      emailDestino: email,
      emailAsunto: 'Contraoferta recibida — Conecta Inversión',
      emailCuerpo: this.templateContraoferta(nombreProyecto, de),
    })
  }

  async notificarProyectoAceptado(empresaUserId: string, emailEmpresa: string, nombreProyecto: string, nombreInversor: string) {
    await this.crear({
      userId: empresaUserId,
      tipo: 'proyecto_aceptado',
      mensaje: `¡Tu proyecto "${nombreProyecto}" fue aceptado por ${nombreInversor}!`,
      emailDestino: emailEmpresa,
      emailAsunto: '¡Proyecto aceptado! — Conecta Inversión',
      emailCuerpo: this.templateProyectoAceptado(nombreProyecto, nombreInversor),
    })
  }

  // ─── Plantillas de email ──────────────────────────────

  private templateOfertaRecibida(proyecto: string, inversor: string) {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1f2328">Nueva oferta recibida</h2>
        <p><strong>${inversor}</strong> ha hecho una oferta sobre tu proyecto <strong>"${proyecto}"</strong>.</p>
        <p>Ingresa a la plataforma para ver los detalles y responder.</p>
        <a href="${process.env.FRONTEND_URL}/empresa/negociaciones"
           style="background:#3b82d4;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:12px">
          Ver oferta
        </a>
        <p style="color:#57606a;font-size:12px;margin-top:24px">Secretaría de Economía — Conecta Inversión</p>
      </div>`
  }

  private templateContraoferta(proyecto: string, de: string) {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1f2328">Contraoferta recibida</h2>
        <p><strong>${de}</strong> ha enviado una contraoferta para el proyecto <strong>"${proyecto}"</strong>.</p>
        <p>Tienes <strong>24 horas</strong> para responder antes de que expire.</p>
        <a href="${process.env.FRONTEND_URL}"
           style="background:#3b82d4;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:12px">
          Ver contraoferta
        </a>
        <p style="color:#57606a;font-size:12px;margin-top:24px">Secretaría de Economía — Conecta Inversión</p>
      </div>`
  }

  private templateProyectoAceptado(proyecto: string, inversor: string) {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1f2328">¡Felicidades! Tu proyecto fue aceptado</h2>
        <p><strong>${inversor}</strong> ha aceptado invertir en tu proyecto <strong>"${proyecto}"</strong>.</p>
        <p>Ingresa a la plataforma para coordinar los siguientes pasos.</p>
        <a href="${process.env.FRONTEND_URL}/empresa/proyectos"
           style="background:#3b82d4;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:12px">
          Ver proyecto
        </a>
        <p style="color:#57606a;font-size:12px;margin-top:24px">Secretaría de Economía — Conecta Inversión</p>
      </div>`
  }
}
