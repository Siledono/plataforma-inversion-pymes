import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════
  // ESTADÍSTICAS GENERALES
  // ═══════════════════════════════════════════════════════

  async getEstadisticas() {
    const [
      totalEmpresas,
      totalBancos,
      totalInversores,
      totalProyectos,
      proyectosPublicados,
      financiamientosCompletados,
    ] = await Promise.all([
      this.prisma.empresa.count(),
      this.prisma.banco.count({ where: { suspendido: false } }),
      this.prisma.inversor.count(),
      this.prisma.proyecto.count({ where: { estado: { not: 'eliminado' } } }),
      this.prisma.proyecto.count({ where: { estado: 'publicado' } }),
      this.prisma.proyecto.count({
        where: { estado: { in: ['financiado_banco', 'financiado_inversor', 'financiado_total'] } },
      }),
    ])

    const montoMovilizado = await this.prisma.proyecto.aggregate({
      _sum: { totalInvertido: true },
      where: { estado: { in: ['financiado_banco', 'financiado_inversor', 'financiado_total'] } },
    })

    const bancosTotal = await this.prisma.banco.count()
    const bancosSuspendidos = await this.prisma.banco.count({ where: { suspendido: true } })

    return {
      totalEmpresas,
      totalBancos,
      bancosSuspendidos,
      totalInversores,
      totalProyectos,
      proyectosPublicados,
      financiamientosCompletados,
      montoTotalMovilizado: montoMovilizado._sum.totalInvertido ?? 0,
      bancosActivos: bancosTotal - bancosSuspendidos,
    }
  }

  // ═══════════════════════════════════════════════════════
  // GESTIÓN DE USUARIOS
  // ═══════════════════════════════════════════════════════

  async getUsuarios(rol?: string) {
    return this.prisma.user.findMany({
      where: rol ? { rol: rol as any } : undefined,
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        empresa: { select: { nombreEmpresa: true, rfc: true } },
        banco: { select: { nombreInstitucional: true, suspendido: true } },
        inversor: { select: { nombreCompleto: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ═══════════════════════════════════════════════════════
  // GESTIÓN DE BANCOS
  // ═══════════════════════════════════════════════════════

  async getBancos() {
    return this.prisma.banco.findMany({
      include: {
        user: { select: { email: true, activo: true } },
        propuestas: { select: { id: true, nombre: true, montoFijo: true, activa: true } },
      },
      orderBy: { nombreInstitucional: 'asc' },
    })
  }

  async toggleSuspenderBanco(bancoId: string) {
    const banco = await this.prisma.banco.findUnique({ where: { id: bancoId } })
    if (!banco) throw new Error('Banco no encontrado')
    return this.prisma.banco.update({
      where: { id: bancoId },
      data: { suspendido: !banco.suspendido },
    })
  }
}
