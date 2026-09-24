import { Injectable } from '@nestjs/common'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorDevice,
} from '@simplewebauthn/types'
import { PrismaService } from '../../prisma/prisma.service'

// En producción, usar el dominio real
const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost'
const RP_NAME = 'Conecta Inversión'
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:3000'

@Injectable()
export class WebAuthnService {
  constructor(private prisma: PrismaService) {}

  // ─── REGISTRO: Generar opciones ──────────────────────────────
  async generarOpcionesRegistro(userId: string, email: string) {
    // Obtener credenciales existentes para excluirlas
    const credsExistentes = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
    })

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(userId),
      userName: email,
      userDisplayName: email,
      attestationType: 'none',
      excludeCredentials: credsExistentes.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // preferir autenticador de plataforma (biométrico)
      },
    })

    // Guardar el challenge en caché temporal (aquí en la BD como campo temporal)
    // En producción usar Redis con TTL de 60s
    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: options.challenge } as any,
    })

    return options
  }

  // ─── REGISTRO: Verificar respuesta del navegador ──────────────
  async verificarRegistro(userId: string, response: RegistrationResponseJSON, nombre?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } }) as any
    if (!user?.webauthnChallenge) return false

    let verification: VerifiedRegistrationResponse
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      })
    } catch {
      return false
    }

    if (!verification.verified || !verification.registrationInfo) return false

    const { credentialID, credentialPublicKey, counter, credentialDeviceType } = verification.registrationInfo

    await this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        deviceType: credentialDeviceType,
        nombre: nombre ?? 'Passkey',
      },
    })

    // Limpiar challenge
    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: null } as any,
    })

    return true
  }

  // ─── AUTENTICACIÓN: Generar opciones ─────────────────────────
  async generarOpcionesAutenticacion(userId: string) {
    const creds = await this.prisma.webAuthnCredential.findMany({ where: { userId } })

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: creds.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
      })),
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: options.challenge } as any,
    })

    return options
  }

  // ─── AUTENTICACIÓN: Verificar respuesta ──────────────────────
  async verificarAutenticacion(userId: string, response: AuthenticationResponseJSON): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } }) as any
    if (!user?.webauthnChallenge) return false

    const credId = response.id
    const cred = await this.prisma.webAuthnCredential.findFirst({
      where: { userId, credentialId: credId },
    })
    if (!cred) return false

    const authenticator: AuthenticatorDevice = {
      credentialID: cred.credentialId,
      credentialPublicKey: new Uint8Array(cred.publicKey),
      counter: cred.counter,
    }

    let verification: VerifiedAuthenticationResponse
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator,
      })
    } catch {
      return false
    }

    if (!verification.verified) return false

    // Actualizar counter para prevenir ataques de replay
    await this.prisma.webAuthnCredential.update({
      where: { id: cred.id },
      data: { counter: verification.authenticationInfo.newCounter },
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: null } as any,
    })

    return true
  }

  // ─── Listar credenciales del usuario ─────────────────────────
  async listarCredenciales(userId: string) {
    return this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { id: true, nombre: true, deviceType: true, createdAt: true },
    })
  }

  // ─── Eliminar una credencial ─────────────────────────────────
  async eliminarCredencial(userId: string, credencialId: string) {
    return this.prisma.webAuthnCredential.deleteMany({
      where: { id: credencialId, userId },
    })
  }
}
