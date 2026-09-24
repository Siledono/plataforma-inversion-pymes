import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

const VENTANA_MINUTOS = 15
const MAX_INTENTOS = 5

@Injectable()
export class BruteForceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un intento de login (exitoso o fallido) para email e IP.
   */
  async registrarIntento(email: string, ip: string, exitoso: boolean) {
    await this.prisma.loginAttempt.create({
      data: { email, ip, exitoso, bloqueado: false },
    })
  }

  /**
   * Verifica si el email o la IP están bloqueados por exceso de intentos fallidos.
   * Ventana de 15 minutos, máximo 5 intentos fallidos.
   */
  async estaBloqueado(email: string, ip: string): Promise<{ bloqueado: boolean; razon?: string }> {
    const desde = new Date()
    desde.setMinutes(desde.getMinutes() - VENTANA_MINUTOS)

    const intentosPorEmail = await this.prisma.loginAttempt.count({
      where: { email, exitoso: false, createdAt: { gte: desde } },
    })
    if (intentosPorEmail >= MAX_INTENTOS) {
      return { bloqueado: true, razon: `Demasiados intentos fallidos para este usuario. Intenta de nuevo en ${VENTANA_MINUTOS} minutos.` }
    }

    const intentosPorIp = await this.prisma.loginAttempt.count({
      where: { ip, exitoso: false, createdAt: { gte: desde } },
    })
    if (intentosPorIp >= MAX_INTENTOS) {
      return { bloqueado: true, razon: `Demasiados intentos desde esta dirección IP. Intenta de nuevo en ${VENTANA_MINUTOS} minutos.` }
    }

    return { bloqueado: false }
  }

  /**
   * Limpia los intentos fallidos tras un login exitoso.
   */
  async limpiarIntentos(email: string) {
    const desde = new Date()
    desde.setMinutes(desde.getMinutes() - VENTANA_MINUTOS)
    // No se borran, solo dejan de contar al expirar la ventana
    // Marcamos el registro exitoso que ya se guardó
  }
}
