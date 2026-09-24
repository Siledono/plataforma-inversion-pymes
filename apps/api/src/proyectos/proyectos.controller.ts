import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ProyectosService } from './proyectos.service'
import { CreateProyectoDto, FilterProyectosDto, UpdateProyectoDto } from './dto/proyectos.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProyectosController {
  constructor(private proyectosService: ProyectosService) {}

  // POST /api/proyectos — crea un proyecto (solo empresa)
  @Post()
  @Roles('empresa')
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProyectoDto,
  ) {
    return this.proyectosService.create(user.id, dto)
  }

  // GET /api/proyectos — lista proyectos publicados (banco, inversor, admin)
  @Get()
  @Roles('banco', 'inversor', 'admin', 'empresa')
  findAll(@Query() filters: FilterProyectosDto) {
    return this.proyectosService.findAll(filters)
  }

  // GET /api/proyectos/mios — proyectos de la empresa autenticada
  @Get('mios')
  @Roles('empresa')
  findMios(@CurrentUser() user: { id: string }) {
    return this.proyectosService.findMios(user.id)
  }

  // GET /api/proyectos/:id — detalle con control de privacidad
  @Get(':id')
  @Roles('banco', 'inversor', 'admin', 'empresa')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    return this.proyectosService.findOne(id, user.id, user.rol)
  }

  // PATCH /api/proyectos/:id — editar proyecto (solo empresa dueña)
  @Patch(':id')
  @Roles('empresa')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProyectoDto,
  ) {
    return this.proyectosService.update(user.id, id, dto)
  }

  // PATCH /api/proyectos/:id/publicar — publicar proyecto
  @Patch(':id/publicar')
  @Roles('empresa')
  publicar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.proyectosService.publicar(user.id, id)
  }

  // DELETE /api/proyectos/:id — eliminar proyecto (soft delete)
  @Delete(':id')
  @Roles('empresa')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.proyectosService.remove(user.id, id)
  }
}
