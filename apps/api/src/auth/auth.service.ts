import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { EFirmaService } from './efirma/efirma.service'
import { TotpService } from './totp/totp.service'
import { WebAuthnService } from './webauthn/webauthn.service'
import { DeviceService } from './device/device.service'
import { IpWhitelistService } from './ip-whitelist/ip-whitelist.service'
import { BruteForceService } from './brute-force/brute-force.service'
import {
  LoginDto,
  RegisterDto,
  LoginEFirmaDto,
  LoginWebAuthnDto,
  LoginBancoDto,
  VerificarTotpDto,
} from './dto/auth.dto'

// Duración de tokens por rol
const TOKEN_DURATIONS = {
  empresa: { access: '15m', refresh: '7d' },
  inversor: { access: '15m', refresh: '7d' },
  banco: { access: '4m', refresh: '30m' },  // DPoP: 3-5 min para banco
  admin: { access: '15m', refresh: '8h' },
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private eFirmaService: EFirmaService,
    private totpService: TotpService,
    private webAuthnService: WebAuthnService,
    private deviceService: DeviceService,
    private ipWhitelistService: IpWhitelistService,
    private bruteForceService: BruteForceService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // REGISTRO (común para todos los roles)
  // ═══════════════════════════════════════════════════════

  async register(dto: RegisterDto) {
    const tokenRecord = await this.prisma.tokenRegistro.findUnique({ where: { token: dto.token } })
    if (!tokenRecord) throw new BadRequestException('Token de registro inválido')
    if (tokenRecord.usado) throw new BadRequestException('El token ya fue utilizado')
    if (tokenRecord.expiraEn < new Date()) throw new BadRequestException('El token ha expirado')

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new BadRequestException('Este email ya está registrado')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, rol: tokenRecord.rolDestino, activo: true },
    })

    await this.prisma.tokenRegistro.update({
      where: { id: tokenRecord.id },
      data: { usado: true, usadoPorUserId: user.id },
    })

    return { message: 'Cuenta creada exitosamente', rol: user.rol }
  }

  // ═══════════════════════════════════════════════════════
  // LOGIN ESTÁNDAR (con protección brute-force)
  // ═══════════════════════════════════════════════════════

  async login(dto: LoginDto, ip: string) {
    // 1. Verificar brute-force
    const bloqueo = await this.bruteForceService.estaBloqueado(dto.email, ip)
    if (bloqueo.bloqueado) throw new ForbiddenException(bloqueo.razon)

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.activo) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    if (user.rol === 'banco') {
      const banco = await this.prisma.banco.findUnique({ where: { userId: user.id } })
      if (banco?.suspendido) throw new UnauthorizedException('Cuenta de banco suspendida')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    await this.bruteForceService.registrarIntento(dto.email, ip, true)

    // 2. Si tiene TOTP habilitado, retornar flag para pedir el código
    const mfaHabilitado = await this.totpService.estaHabilitado(user.id)
    if (mfaHabilitado) {
      return {
        requiereMfa: true,
        userId: user.id,
        mensaje: 'Ingresa el código de tu aplicación de autenticación',
      }
    }

    return this.generateTokens(user.id, user.email, user.rol)
  }

  // ═══════════════════════════════════════════════════════
  // LOGIN E.FIRMA (EMPRESAS)
  // ═══════════════════════════════════════════════════════

  async loginEFirma(dto: LoginEFirmaDto, ip: string) {
    const bloqueo = await this.bruteForceService.estaBloqueado(dto.email, ip)
    if (bloqueo.bloqueado) throw new ForbiddenException(bloqueo.razon)

    // 1. Parsear y validar el certificado .cer
    const cerBuffer = Buffer.from(dto.cerBase64, 'base64')
    const efirmaData = this.eFirmaService.parseCertificado(cerBuffer)

    // 2. Validar cadena de confianza SAT
    const cadenaValida = this.eFirmaService.validarCadenaSAT(efirmaData.cerPem)
    if (!cadenaValida) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('El certificado no fue emitido por el SAT o su cadena de confianza no es válida')
    }

    // 3. Verificar que la llave privada corresponde al certificado
    const keyBuffer = Buffer.from(dto.keyBase64, 'base64')
    const llaveValida = this.eFirmaService.validarLlavePrivada(keyBuffer, dto.keyPassword, efirmaData.cerPem)
    if (!llaveValida) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('La llave privada no corresponde al certificado o la contraseña es incorrecta')
    }

    // 4. Buscar usuario por email
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.activo || user.rol !== 'empresa') {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Usuario no encontrado o sin permisos de empresa')
    }

    // 5. Verificar LCR (Lista de Certificados Revocados)
    const eFirmaRecord = await this.prisma.eFirmaEmpresa.findUnique({ where: { userId: user.id } })
    const noRevocado = await this.eFirmaService.verificarLCR(
      efirmaData.serial,
      eFirmaRecord?.revocado ?? false,
    )
    if (!noRevocado) throw new UnauthorizedException('El certificado e.Firma ha sido revocado')

    // 6. Actualizar/crear registro e.Firma
    await this.prisma.eFirmaEmpresa.upsert({
      where: { userId: user.id },
      update: {
        rfcExtraido: efirmaData.rfc,
        razonSocialExtraida: efirmaData.razonSocial,
        serialCertificado: efirmaData.serial,
        vigenciaDesde: efirmaData.vigenciaDesde,
        vigenciaHasta: efirmaData.vigenciaHasta,
      },
      create: {
        userId: user.id,
        rfcExtraido: efirmaData.rfc,
        razonSocialExtraida: efirmaData.razonSocial,
        serialCertificado: efirmaData.serial,
        vigenciaDesde: efirmaData.vigenciaDesde,
        vigenciaHasta: efirmaData.vigenciaHasta,
      },
    })

    await this.bruteForceService.registrarIntento(dto.email, ip, true)

    // 7. Verificar si requiere TOTP
    const mfaHabilitado = await this.totpService.estaHabilitado(user.id)
    if (mfaHabilitado) {
      return { requiereMfa: true, userId: user.id, mensaje: 'Ingresa el código TOTP de tu aplicación' }
    }

    return this.generateTokens(user.id, user.email, user.rol)
  }

  // ═══════════════════════════════════════════════════════
  // LOGIN BANCO (con IP Whitelist + DPoP corta duración)
  // ═══════════════════════════════════════════════════════

  async loginBanco(dto: LoginBancoDto, ip: string, userAgent: string) {
    const bloqueo = await this.bruteForceService.estaBloqueado(dto.email, ip)
    if (bloqueo.bloqueado) throw new ForbiddenException(bloqueo.razon)

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.activo || user.rol !== 'banco') {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const banco = await this.prisma.banco.findUnique({ where: { userId: user.id } })
    if (banco?.suspendido) throw new UnauthorizedException('Cuenta de banco suspendida')

    // Verificar IP Whitelist ANTES de validar contraseña (seguridad perimetral)
    await this.ipWhitelistService.verificarIpBanco(user.id, ip)

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    await this.bruteForceService.registrarIntento(dto.email, ip, true)

    // Registrar sesión activa con IP y User-Agent
    const tokens = await this.generateTokens(user.id, user.email, 'banco')

    // Guardar sesión banco para control de IP
    const expiraEn = new Date()
    expiraEn.setMinutes(expiraEn.getMinutes() + 4)
    const tokenHash = await bcrypt.hash(tokens.accessToken, 5)
    await this.prisma.sesionBanco.create({
      data: { userId: user.id, accessToken: tokenHash, ip, userAgent, expiraEn },
    })

    return tokens
  }

  // ═══════════════════════════════════════════════════════
  // VERIFICACIÓN TOTP (segundo factor)
  // ═══════════════════════════════════════════════════════

  async verificarTotp(dto: VerificarTotpDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!user) throw new UnauthorizedException('Usuario no encontrado')

    const valido = await this.totpService.verificar(user.id, dto.codigo)
    if (!valido) throw new UnauthorizedException('Código TOTP inválido o expirado')

    return this.generateTokens(user.id, user.email, user.rol)
  }

  // ═══════════════════════════════════════════════════════
  // LOGIN INVERSOR CON VERIFICACIÓN DE DISPOSITIVO
  // ═══════════════════════════════════════════════════════

  async loginInversor(dto: LoginDto, ip: string, userAgent: string) {
    const bloqueo = await this.bruteForceService.estaBloqueado(dto.email, ip)
    if (bloqueo.bloqueado) throw new ForbiddenException(bloqueo.razon)

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.activo || user.rol !== 'inversor') {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    await this.bruteForceService.registrarIntento(dto.email, ip, true)

    // Verificar dispositivo conocido
    const deviceHash = this.deviceService.generarDeviceHash(userAgent, ip)
    const esConocido = await this.deviceService.esDispositivoConocido(user.id, deviceHash)

    if (!esConocido) {
      // Primer login o dispositivo nuevo: registrar y enviar magic link
      const countDispositivos = await this.prisma.dispositivoConocido.count({ where: { userId: user.id } })
      if (countDispositivos === 0) {
        // Primer dispositivo: registrar automáticamente como verificado
        await this.deviceService.registrarPrimerDispositivo(user.id, deviceHash, userAgent)
      } else {
        // Dispositivo nuevo: enviar magic link y pausar login
        await this.deviceService.enviarMagicLinkVerificacion(user.id, deviceHash, user.email, userAgent)
        return {
          requiereVerificacionDispositivo: true,
          mensaje: 'Hemos enviado un enlace de confirmación a tu correo. Verifica el nuevo dispositivo para continuar.',
        }
      }
    }

    // Verificar TOTP si está habilitado
    const mfaHabilitado = await this.totpService.estaHabilitado(user.id)
    if (mfaHabilitado) {
      return { requiereMfa: true, userId: user.id, mensaje: 'Ingresa el código de tu aplicación de autenticación' }
    }

    return this.generateTokens(user.id, user.email, user.rol)
  }

  // ═══════════════════════════════════════════════════════
  // WEBAUTHN — Registro e inicio de sesión con Passkeys
  // ═══════════════════════════════════════════════════════

  async webauthnOpcRegistro(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return this.webAuthnService.generarOpcionesRegistro(userId, user.email)
  }

  async webauthnVerRegistro(userId: string, response: any, nombre?: string) {
    const ok = await this.webAuthnService.verificarRegistro(userId, response, nombre)
    if (!ok) throw new BadRequestException('No se pudo verificar el Passkey. Inténtalo de nuevo.')
    return { message: 'Passkey registrado exitosamente' }
  }

  async webauthnOpcAutenticacion(dto: LoginWebAuthnDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Usuario no encontrado')
    return this.webAuthnService.generarOpcionesAutenticacion(user.id)
  }

  async webauthnVerAutenticacion(dto: LoginWebAuthnDto, response: any, ip: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Usuario no encontrado')

    const ok = await this.webAuthnService.verificarAutenticacion(user.id, response)
    if (!ok) {
      await this.bruteForceService.registrarIntento(dto.email, ip, false)
      throw new UnauthorizedException('Autenticación con Passkey fallida')
    }

    await this.bruteForceService.registrarIntento(dto.email, ip, true)
    return this.generateTokens(user.id, user.email, user.rol)
  }

  // ═══════════════════════════════════════════════════════
  // KYC INVERSORES
  // ═══════════════════════════════════════════════════════

  async iniciarKyc(userId: string, documentoUrl: string, livenessUrl?: string) {
    await this.prisma.kycInversor.upsert({
      where: { userId },
      update: { documentoUrl, livenessUrl, estado: 'en_revision' },
      create: { userId, documentoUrl, livenessUrl, estado: 'en_revision' },
    })
    return { message: 'Documentos KYC recibidos. El proceso de verificación puede tomar hasta 24 horas.' }
  }

  async aprobarKyc(userId: string, adminId: string, aprobado: boolean, notas?: string) {
    return this.prisma.kycInversor.update({
      where: { userId },
      data: {
        estado: aprobado ? 'aprobado' : 'rechazado',
        revisadoPorAdmin: true,
        notas,
      },
    })
  }

  async getEstadoKyc(userId: string) {
    const kyc = await this.prisma.kycInversor.findUnique({ where: { userId } })
    return kyc ?? { estado: 'pendiente', mensaje: 'Sin documentos enviados aún' }
  }

  // ═══════════════════════════════════════════════════════
  // TOTP — Gestión de MFA
  // ═══════════════════════════════════════════════════════

  async configurarTotp(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    return this.totpService.generarSecreto(userId, user.email)
  }

  async confirmarTotp(userId: string, codigo: string) {
    const ok = await this.totpService.confirmarYHabilitar(userId, codigo)
    if (!ok) throw new BadRequestException('Código TOTP inválido. Verifica tu aplicación de autenticación.')
    return { message: 'MFA habilitado exitosamente' }
  }

  // ═══════════════════════════════════════════════════════
  // REFRESH Y LOGOUT
  // ═══════════════════════════════════════════════════════

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; rol: string }
    try {
      payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET })
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado')
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, expiraEn: { gt: new Date() } },
    })
    if (!stored) throw new UnauthorizedException('Sesión expirada, inicia sesión nuevamente')

    return this.generateTokens(payload.sub, payload.email, payload.rol)
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } })
    // Invalidar sesiones de banco también
    await this.prisma.sesionBanco.deleteMany({ where: { userId } })
    return { message: 'Sesión cerrada' }
  }

  // ═══════════════════════════════════════════════════════
  // VALIDACIÓN DE SESIÓN BANCO (bloqueo por cambio de IP)
  // ═══════════════════════════════════════════════════════

  async validarSesionBanco(userId: string, tokenHash: string, ipActual: string): Promise<boolean> {
    const sesion = await this.prisma.sesionBanco.findFirst({
      where: { userId, expiraEn: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!sesion) return false
    if (sesion.ip !== ipActual) {
      // IP cambió: invalidar toda la sesión inmediatamente
      await this.prisma.sesionBanco.deleteMany({ where: { userId } })
      return false
    }

    return true
  }

  // ═══════════════════════════════════════════════════════
  // VERIFICACIÓN DE DISPOSITIVO (magic link)
  // ═══════════════════════════════════════════════════════

  async verificarDispositivo(token: string) {
    const ok = await this.deviceService.verificarMagicLink(token)
    if (!ok) throw new BadRequestException('Enlace inválido, expirado o ya utilizado')
    return { message: 'Dispositivo verificado. Ya puedes iniciar sesión.' }
  }

  // ═══════════════════════════════════════════════════════
  // HELPER PRIVADO: genera tokens según rol
  // ═══════════════════════════════════════════════════════

  async generateTokens(userId: string, email: string, rol: string) {
    const durations = TOKEN_DURATIONS[rol] ?? TOKEN_DURATIONS.empresa
    const payload = { sub: userId, email, rol }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: durations.access,
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: durations.refresh,
    })

    const tokenHash = await bcrypt.hash(refreshToken, 5)
    const expiraEn = new Date()
    // Refresh token expira según duración del rol (7d para empresa/inversor, 30m para banco)
    const refreshMinutes = durations.refresh.endsWith('d')
      ? parseInt(durations.refresh) * 24 * 60
      : durations.refresh.endsWith('h')
      ? parseInt(durations.refresh) * 60
      : parseInt(durations.refresh)
    expiraEn.setMinutes(expiraEn.getMinutes() + refreshMinutes)

    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiraEn } })

    return { accessToken, refreshToken, rol }
  }

  // Helper para verificar si un inversor tiene KYC aprobado
  async kycAprobado(userId: string): Promise<boolean> {
    const kyc = await this.prisma.kycInversor.findUnique({ where: { userId } })
    return kyc?.estado === 'aprobado'
  }

  async puedeVerDatosPrivados(userId: string, proyectoId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return false
    if (user.rol === 'admin') return true

    if (user.rol === 'banco') {
      const banco = await this.prisma.banco.findUnique({ where: { userId } })
      if (!banco) return false
      const solicitud = await this.prisma.solicitudBanco.findFirst({
        where: { proyectoId, propuestaBanco: { bancoId: banco.id }, estado: { in: ['en_revision', 'contraoferta_pendiente', 'aceptada'] } },
      })
      return !!solicitud
    }

    if (user.rol === 'inversor') {
      const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
      if (!inversor) return false
      const negociacion = await this.prisma.negociacion.findFirst({
        where: { proyectoId, inversorId: inversor.id, estado: { in: ['pendiente', 'contraoferta', 'aceptada'] } },
      })
      return !!negociacion
    }

    return false
  }
}
