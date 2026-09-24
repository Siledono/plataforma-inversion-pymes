import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { Resend } from 'resend'

@Injectable()
export class DeviceService {
  private resend: Resend

  constructor(private prisma: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  /**
   * Genera un hash identificador del dispositivo a partir del User-Agent.
   * En producción se puede enriquecer con fingerprint del cliente.
   */
  generarDeviceHash(userAgent: string, ip: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userAgent}|${ip}`)
      .digest('hex')
      .substring(0, 32)
  }

  /**
   * Verifica si el dispositivo es conocido y verificado para el usuario.
   */
  async esDispositivoConocido(userId: string, deviceHash: string): Promise<boolean> {
    const dispositivo = await this.prisma.dispositivoConocido.findFirst({
      where: { userId, deviceHash, verificado: true },
    })
    return !!dispositivo
  }

  /**
   * Registra un nuevo dispositivo como pendiente de verificación
   * y envía un magic link al email del usuario.
   */
  async enviarMagicLinkVerificacion(userId: string, deviceHash: string, email: string, userAgent: string) {
    // Registrar dispositivo como no verificado
    await this.prisma.dispositivoConocido.upsert({
      where: { userId_deviceHash: { userId, deviceHash } },
      update: {},
      create: { userId, deviceHash, nombre: this.nombreDispositivoDesdeUA(userAgent), verificado: false },
    })

    // Crear token de verificación (expira en 30 minutos)
    const expiraEn = new Date()
    expiraEn.setMinutes(expiraEn.getMinutes() + 30)

    const tokenRecord = await this.prisma.deviceVerificationToken.create({
      data: { userId, token: crypto.randomUUID(), deviceHash, expiraEn },
    })

    // Enviar magic link
    const url = `${process.env.FRONTEND_URL}/verificar-dispositivo?token=${tokenRecord.token}`
    this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@conecta-inversion.gob.mx',
      to: email,
      subject: 'Nuevo dispositivo detectado — Conecta Inversión',
      html: this.templateMagicLink(url),
    }).catch(() => {})

    return tokenRecord.token
  }

  /**
   * Verifica el magic link y marca el dispositivo como verificado.
   */
  async verificarMagicLink(token: string): Promise<boolean> {
    const record = await this.prisma.deviceVerificationToken.findUnique({ where: { token } })
    if (!record || record.usado || record.expiraEn < new Date()) return false

    await this.prisma.$transaction([
      this.prisma.deviceVerificationToken.update({
        where: { id: record.id },
        data: { usado: true },
      }),
      this.prisma.dispositivoConocido.updateMany({
        where: { userId: record.userId, deviceHash: record.deviceHash },
        data: { verificado: true },
      }),
    ])

    return true
  }

  /**
   * Registra automáticamente el primer dispositivo del usuario como verificado.
   * Se llama en el primer login exitoso.
   */
  async registrarPrimerDispositivo(userId: string, deviceHash: string, userAgent: string) {
    await this.prisma.dispositivoConocido.upsert({
      where: { userId_deviceHash: { userId, deviceHash } },
      update: {},
      create: {
        userId,
        deviceHash,
        nombre: this.nombreDispositivoDesdeUA(userAgent),
        verificado: true,
      },
    })
  }

  private nombreDispositivoDesdeUA(userAgent: string): string {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'Dispositivo iOS'
    if (userAgent.includes('Android')) return 'Dispositivo Android'
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'Mac'
    if (userAgent.includes('Linux')) return 'Linux'
    return 'Dispositivo desconocido'
  }

  private templateMagicLink(url: string): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1f2328">Nuevo dispositivo detectado</h2>
        <p>Hemos detectado un inicio de sesión desde un dispositivo o ubicación no reconocida.</p>
        <p>Si fuiste tú, confirma este dispositivo haciendo clic en el botón:</p>
        <a href="${url}"
           style="background:#3b82d4;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:12px">
          Confirmar dispositivo
        </a>
        <p style="margin-top:16px">Este enlace expira en <strong>30 minutos</strong>.</p>
        <p>Si <strong>no</strong> fuiste tú, cambia tu contraseña inmediatamente.</p>
        <p style="color:#57606a;font-size:12px;margin-top:24px">Secretaría de Economía — Conecta Inversión</p>
      </div>`
  }
}
