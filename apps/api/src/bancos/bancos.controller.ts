import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { BancosService } from './bancos.service'
import {
  CreatePropuestaDto,
  CreateSolicitudDto,
  EmpresaRespondeDto,
  ResponderSolicitudBancoDto,
  UpdatePropuestaDto,
} from './dto/bancos.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BancosController {
  constructor(private bancosService: BancosService) {}

  // ─── PROPUESTAS ───────────────────────────────────────

  // POST /api/propuestas
  @Post('propuestas')
  @Roles('banco')
  createPropuesta(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePropuestaDto,
  ) {
    return this.bancosService.createPropuesta(user.id, dto)
  }

  // GET /api/propuestas — lista propuestas activas (todos)
  @Get('propuestas')
  @Roles('empresa', 'banco', 'inversor', 'admin')
  getPropuestas() {
    return this.bancosService.getPropuestas()
  }

  // GET /api/propuestas/mias — propuestas del banco autenticado
  @Get('propuestas/mias')
  @Roles('banco')
  getMisPropuestas(@CurrentUser() user: { id: string }) {
    return this.bancosService.getMisPropuestas(user.id)
  }

  // PATCH /api/propuestas/:id — banco edita (sin montos)
  @Patch('propuestas/:id')
  @Roles('banco')
  updatePropuesta(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePropuestaDto,
  ) {
    return this.bancosService.updatePropuesta(user.id, id, dto)
  }

  // ─── SOLICITUDES ──────────────────────────────────────

  // POST /api/solicitudes — empresa envía solicitud
  @Post('solicitudes')
  @Roles('empresa')
  createSolicitud(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSolicitudDto,
  ) {
    return this.bancosService.createSolicitud(user.id, dto)
  }

  // GET /api/solicitudes — banco ve las suyas / empresa ve las suyas
  @Get('solicitudes')
  @Roles('banco', 'empresa')
  getMisSolicitudes(@CurrentUser() user: { id: string; rol: string }) {
    if (user.rol === 'banco') return this.bancosService.getMisSolicitudes(user.id)
    return this.bancosService.getMisSolicitudesEmpresa(user.id)
  }

  // PATCH /api/solicitudes/:id/responder — banco acepta/rechaza/contraoferta
  @Patch('solicitudes/:id/responder')
  @Roles('banco')
  responderSolicitud(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ResponderSolicitudBancoDto,
  ) {
    return this.bancosService.responderSolicitud(user.id, id, dto)
  }

  // PATCH /api/solicitudes/:id/empresa-responde — empresa acepta/rechaza contraoferta
  @Patch('solicitudes/:id/empresa-responde')
  @Roles('empresa')
  empresaResponde(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: EmpresaRespondeDto,
  ) {
    return this.bancosService.empresaResponde(user.id, id, dto)
  }
}
