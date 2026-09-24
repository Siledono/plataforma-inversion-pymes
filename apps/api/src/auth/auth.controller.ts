import {
  Controller, Post, Get, Body, UseGuards, HttpCode,
  HttpStatus, Request, Param, Req,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  LoginDto, RegisterDto, RefreshDto,
  LoginEFirmaDto, LoginBancoDto, LoginWebAuthnDto,
  VerificarTotpDto, ConfirmarTotpDto, IniciarKycDto,
  AprobarKycDto, RegistrarPasskeyDto,
} from './dto/auth.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Registro (todos los roles con token) ────────────────────
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  // ─── Login estándar (admin y fallback) ───────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip ?? req.connection?.remoteAddress ?? '0.0.0.0'
    return this.authService.login(dto, ip)
  }

  // ─── Login EMPRESA con e.Firma ───────────────────────────────
  @Post('login/efirma')
  @HttpCode(HttpStatus.OK)
  loginEFirma(@Body() dto: LoginEFirmaDto, @Req() req: any) {
    const ip = req.ip ?? '0.0.0.0'
    return this.authService.loginEFirma(dto, ip)
  }

  // ─── Login BANCO con IP Whitelist + DPoP ─────────────────────
  @Post('login/banco')
  @HttpCode(HttpStatus.OK)
  loginBanco(@Body() dto: LoginBancoDto, @Req() req: any) {
    const ip = req.ip ?? '0.0.0.0'
    const ua = req.headers['user-agent'] ?? 'unknown'
    return this.authService.loginBanco(dto, ip, ua)
  }

  // ─── Login INVERSOR con verificación de dispositivo ──────────
  @Post('login/inversor')
  @HttpCode(HttpStatus.OK)
  loginInversor(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip ?? '0.0.0.0'
    const ua = req.headers['user-agent'] ?? 'unknown'
    return this.authService.loginInversor(dto, ip, ua)
  }

  // ─── Verificar TOTP (segundo factor) ─────────────────────────
  @Post('totp/verificar')
  @HttpCode(HttpStatus.OK)
  verificarTotp(@Body() dto: VerificarTotpDto) {
    return this.authService.verificarTotp(dto)
  }

  // ─── Configurar TOTP (genera secreto + QR) ───────────────────
  @Get('totp/configurar')
  @UseGuards(JwtAuthGuard)
  configurarTotp(@CurrentUser() user: { id: string }) {
    return this.authService.configurarTotp(user.id)
  }

  // ─── Confirmar TOTP (primer código para activar) ─────────────
  @Post('totp/confirmar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  confirmarTotp(@CurrentUser() user: { id: string }, @Body() dto: ConfirmarTotpDto) {
    return this.authService.confirmarTotp(user.id, dto.codigo)
  }

  // ─── WebAuthn: generar opciones de registro ──────────────────
  @Get('passkey/registro-opciones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('inversor')
  webauthnOpcRegistro(@CurrentUser() user: { id: string }) {
    return this.authService.webauthnOpcRegistro(user.id)
  }

  // ─── WebAuthn: verificar registro (guardar credencial) ───────
  @Post('passkey/registro-verificar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('inversor')
  webauthnVerRegistro(
    @CurrentUser() user: { id: string },
    @Body() body: { response: any; nombre?: string },
  ) {
    return this.authService.webauthnVerRegistro(user.id, body.response, body.nombre)
  }

  // ─── WebAuthn: generar opciones de autenticación ─────────────
  @Post('passkey/login-opciones')
  @HttpCode(HttpStatus.OK)
  webauthnOpcAuth(@Body() dto: LoginWebAuthnDto) {
    return this.authService.webauthnOpcAutenticacion(dto)
  }

  // ─── WebAuthn: verificar autenticación ───────────────────────
  @Post('passkey/login-verificar')
  @HttpCode(HttpStatus.OK)
  webauthnVerAuth(@Body() body: { email: string; response: any }, @Req() req: any) {
    const ip = req.ip ?? '0.0.0.0'
    return this.authService.webauthnVerAutenticacion({ email: body.email }, body.response, ip)
  }

  // ─── KYC: enviar documentos ───────────────────────────────────
  @Post('kyc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('inversor')
  iniciarKyc(@CurrentUser() user: { id: string }, @Body() dto: IniciarKycDto) {
    return this.authService.iniciarKyc(user.id, dto.documentoUrl, dto.livenessUrl)
  }

  // ─── KYC: estado de verificación ─────────────────────────────
  @Get('kyc/estado')
  @UseGuards(JwtAuthGuard)
  getKyc(@CurrentUser() user: { id: string }) {
    return this.authService.getEstadoKyc(user.id)
  }

  // ─── KYC: aprobar/rechazar (solo Admin) ──────────────────────
  @Post('kyc/:userId/revisar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  aprobarKyc(
    @CurrentUser() admin: { id: string },
    @Param('userId') userId: string,
    @Body() dto: AprobarKycDto,
  ) {
    return this.authService.aprobarKyc(userId, admin.id, dto.aprobado, dto.notas)
  }

  // ─── Verificar dispositivo con magic link ────────────────────
  @Get('verificar-dispositivo/:token')
  verificarDispositivo(@Param('token') token: string) {
    return this.authService.verificarDispositivo(token)
  }

  // ─── Refresh token ───────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken)
  }

  // ─── Logout ──────────────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: { id: string }) {
    return this.authService.logout(user.id)
  }
}
