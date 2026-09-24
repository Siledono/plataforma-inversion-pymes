import { Injectable, ForbiddenException } from '@nestjs/common'
import * as net from 'net'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class IpWhitelistService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica si una IP está dentro de los rangos CIDR autorizados para el banco.
   */
  async verificarIpBanco(userId: string, ip: string): Promise<void> {
    const banco = await this.prisma.banco.findUnique({ where: { userId } })
    if (!banco) return // Si no hay perfil de banco, no aplica

    const whitelist = await this.prisma.ipWhitelistBanco.findMany({
      where: { bancoId: banco.id, activa: true },
    })

    // Si no hay IPs configuradas, permitir (modo abierto hasta que el admin configure)
    if (whitelist.length === 0) return

    const ipPermitida = whitelist.some((entry) => this.ipEnCidr(ip, entry.cidr))
    if (!ipPermitida) {
      throw new ForbiddenException(
        `Acceso denegado: la IP ${ip} no está en la lista blanca de IPs autorizadas para este banco`,
      )
    }
  }

  /**
   * Agrega una IP/CIDR a la whitelist del banco (solo Admin).
   */
  async agregarIp(bancoId: string, cidr: string, descripcion?: string) {
    // Validar formato CIDR
    if (!this.esCidrValido(cidr)) {
      throw new ForbiddenException(`El formato CIDR '${cidr}' no es válido. Ejemplos: 192.168.1.0/24, 10.0.0.1/32`)
    }

    return this.prisma.ipWhitelistBanco.create({
      data: { bancoId, cidr, descripcion, activa: true },
    })
  }

  /**
   * Lista las IPs autorizadas de un banco.
   */
  async listarIps(bancoId: string) {
    return this.prisma.ipWhitelistBanco.findMany({
      where: { bancoId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Elimina una IP de la whitelist.
   */
  async eliminarIp(id: string, bancoId: string) {
    return this.prisma.ipWhitelistBanco.deleteMany({ where: { id, bancoId } })
  }

  // ─── Helpers CIDR ────────────────────────────────────────────

  private ipEnCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/')
      const maskBits = parseInt(bits, 10)

      if (net.isIPv4(ip) && net.isIPv4(range)) {
        return this.ipv4EnCidr(ip, range, maskBits)
      }
      if (net.isIPv6(ip) && net.isIPv6(range)) {
        return this.ipv6EnCidr(ip, range, maskBits)
      }
      return false
    } catch {
      return false
    }
  }

  private ipv4EnCidr(ip: string, range: string, bits: number): boolean {
    const ipNum = this.ipv4ToNum(ip)
    const rangeNum = this.ipv4ToNum(range)
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    return (ipNum & mask) === (rangeNum & mask)
  }

  private ipv4ToNum(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }

  private ipv6EnCidr(ip: string, range: string, bits: number): boolean {
    // Simplificado para IPv6 — comparar los primeros N bits
    const ipBytes = this.ipv6ToBytes(ip)
    const rangeBytes = this.ipv6ToBytes(range)
    const fullBytes = Math.floor(bits / 8)
    const remainBits = bits % 8

    for (let i = 0; i < fullBytes; i++) {
      if (ipBytes[i] !== rangeBytes[i]) return false
    }
    if (remainBits > 0) {
      const mask = 0xff & (0xff << (8 - remainBits))
      if ((ipBytes[fullBytes] & mask) !== (rangeBytes[fullBytes] & mask)) return false
    }
    return true
  }

  private ipv6ToBytes(ip: string): number[] {
    const full = ip.includes('::')
      ? this.expandirIPv6(ip)
      : ip
    return full.split(':').flatMap((h) => {
      const n = parseInt(h, 16)
      return [(n >> 8) & 0xff, n & 0xff]
    })
  }

  private expandirIPv6(ip: string): string {
    const parts = ip.split('::')
    const left = parts[0] ? parts[0].split(':') : []
    const right = parts[1] ? parts[1].split(':') : []
    const missing = 8 - left.length - right.length
    const middle = Array(missing).fill('0000')
    return [...left, ...middle, ...right].map((h) => h.padStart(4, '0')).join(':')
  }

  private esCidrValido(cidr: string): boolean {
    const [ip, bits] = cidr.split('/')
    if (!bits) return false
    const n = parseInt(bits, 10)
    if (net.isIPv4(ip)) return n >= 0 && n <= 32
    if (net.isIPv6(ip)) return n >= 0 && n <= 128
    return false
  }
}
