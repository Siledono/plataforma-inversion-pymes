import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common'
import { NegociacionesService } from './negociaciones.service'
import {
  CrearNegociacionDto,
  EmpresaRespondeNegociacionDto,
  InversorRespondeNegociacionDto,
} from './dto/negociaciones.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('negociaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NegociacionesController {
  constructor(private readonly negociacionesService: NegociacionesService) {}

  // POST /negociaciones — inversor hace oferta sobre un proyecto
  @Post()
  @Roles('inversor')
  crear(@Request() req, @Body() dto: CrearNegociacionDto) {
    return this.negociacionesService.crear(req.user.id, dto)
  }

  // PATCH /negociaciones/:id/empresa-responde — empresa acepta / rechaza / contraoferta
  @Patch(':id/empresa-responde')
  @Roles('empresa')
  empresaResponde(@Request() req, @Param('id') id: string, @Body() dto: EmpresaRespondeNegociacionDto) {
    return this.negociacionesService.empresaResponde(req.user.id, id, dto)
  }

  // PATCH /negociaciones/:id/inversor-responde — inversor acepta o rechaza la contraoferta
  @Patch(':id/inversor-responde')
  @Roles('inversor')
  inversorResponde(@Request() req, @Param('id') id: string, @Body() dto: InversorRespondeNegociacionDto) {
    return this.negociacionesService.inversorResponde(req.user.id, id, dto)
  }

  // GET /negociaciones/:id — solo las dos partes pueden ver la negociación
  @Get(':id')
  @Roles('empresa', 'inversor', 'admin')
  findById(@Request() req, @Param('id') id: string) {
    return this.negociacionesService.findById(req.user.id, id)
  }

  // GET /negociaciones — lista mis negociaciones según mi rol
  @Get()
  @Roles('empresa', 'inversor')
  findMias(@Request() req) {
    return this.negociacionesService.findMias(req.user.id, req.user.rol)
  }
}
