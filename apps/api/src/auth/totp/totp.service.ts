import { Injectable } from '@nestjs/common'
import * as OTPAuth from 'otpauth'
import * as QRCode from 'qrcode'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class TotpService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera un secreto TOTP nuevo para el usuario y devuelve la URI y el QR.
   * El secreto se guarda en BD deshabilitado hasta que el usuario lo confirme.
   */
  async generarSecreto(userId: string, email: string) {
    const secret = new OTPAuth.Secret({ size: 20 })
    const totp = new OTPAuth.TOTP({
      issuer: 'Conecta Inversión',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    })

    // Guardar secreto en BD (no habilitado hasta confirmación)
    await this.prisma.mfaSecret.upsert({
      where: { userId },
      update: { secret: secret.base32, habilitado: false },
      create: { userId, secret: secret.base32, habilitado: false },
    })

    const uri = totp.toString()
    const qrDataUrl = await QRCode.toDataURL(uri)

    return { secret: secret.base32, uri, qrDataUrl }
  }

  /**
   * Confirma y habilita el TOTP verificando el primer código del usuario.
   */
  async confirmarYHabilitar(userId: string, codigo: string): Promise<boolean> {
    const record = await this.prisma.mfaSecret.findUnique({ where: { userId } })
    if (!record) return false

    const esValido = this.verificarCodigo(record.secret, codigo)
    if (esValido) {
      await this.prisma.mfaSecret.update({
        where: { userId },
        data: { habilitado: true },
      })
    }
    return esValido
  }

  /**
   * Verifica un código TOTP contra el secreto almacenado del usuario.
   * Permite ±1 ventana de tiempo (30s adelante/atrás).
   */
  async verificar(userId: string, codigo: string): Promise<boolean> {
    const record = await this.prisma.mfaSecret.findUnique({ where: { userId } })
    if (!record || !record.habilitado) return false
    return this.verificarCodigo(record.secret, codigo)
  }

  /**
   * Retorna si el usuario tiene MFA habilitado.
   */
  async estaHabilitado(userId: string): Promise<boolean> {
    const record = await this.prisma.mfaSecret.findUnique({ where: { userId } })
    return record?.habilitado ?? false
  }

  private verificarCodigo(secretBase32: string, codigo: string): boolean {
    const secret = OTPAuth.Secret.fromBase32(secretBase32)
    const totp = new OTPAuth.TOTP({ secret, digits: 6, period: 30, algorithm: 'SHA1' })
    const delta = totp.validate({ token: codigo, window: 1 })
    return delta !== null
  }
}
