import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── Registro con token de un solo uso ───────────────────
  async register(dto: RegisterDto) {
    // 1. Validar token
    const tokenRecord = await this.prisma.tokenRegistro.findUnique({
      where: { token: dto.token },
    })

    if (!tokenRecord) throw new BadRequestException('Token de registro inválido')
    if (tokenRecord.usado) throw new BadRequestException('El token ya fue utilizado')
    if (tokenRecord.expiraEn < new Date()) throw new BadRequestException('El token ha expirado')

    // 2. Verificar que el email no exista
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new BadRequestException('Este email ya está registrado')

    // 3. Crear usuario con el rol del token
    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        rol: tokenRecord.rolDestino,
        activo: true,
      },
    })

    // 4. Marcar token como usado
    await this.prisma.tokenRegistro.update({
      where: { id: tokenRecord.id },
      data: { usado: true, usadoPorUserId: user.id },
    })

    return { message: 'Cuenta creada exitosamente', rol: user.rol }
  }

  // ─── Login ───────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Credenciales inválidas')
    if (!user.activo) throw new UnauthorizedException('Cuenta suspendida')

    // Verificar si es banco suspendido
    if (user.rol === 'banco') {
      const banco = await this.prisma.banco.findUnique({ where: { userId: user.id } })
      if (banco?.suspendido) throw new UnauthorizedException('Cuenta de banco suspendida')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas')

    const tokens = await this.generateTokens(user.id, user.email, user.rol)
    return { ...tokens, rol: user.rol }
  }

  // ─── Refresh token ───────────────────────────────────────
  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; rol: string }
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      })
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado')
    }

    const tokenHash = await bcrypt.hash(refreshToken, 5)
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, expiraEn: { gt: new Date() } },
    })
    if (!stored) throw new UnauthorizedException('Sesión expirada, inicia sesión nuevamente')

    return this.generateTokens(payload.sub, payload.email, payload.rol)
  }

  // ─── Logout ──────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } })
    return { message: 'Sesión cerrada' }
  }

  // ─── Helper: genera access + refresh tokens ──────────────
  private async generateTokens(userId: string, email: string, rol: string) {
    const payload = { sub: userId, email, rol }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    })

    // Guardar refresh token hasheado en BD
    const tokenHash = await bcrypt.hash(refreshToken, 5)
    const expiraEn = new Date()
    expiraEn.setDate(expiraEn.getDate() + 7)

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiraEn },
    })

    return { accessToken, refreshToken }
  }

  // ─── Verificar si usuario puede ver datos privados ───────
  async puedeVerDatosPrivados(userId: string, proyectoId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return false
    if (user.rol === 'admin') return true

    if (user.rol === 'banco') {
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

    if (user.rol === 'inversor') {
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
