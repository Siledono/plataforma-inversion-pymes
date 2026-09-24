import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/estadisticas — métricas generales de la plataforma
  @Get('estadisticas')
  getEstadisticas() {
    return this.adminService.getEstadisticas()
  }

  // GET /admin/usuarios?rol=empresa|banco|inversor — lista usuarios con filtro opcional
  @Get('usuarios')
  getUsuarios(@Query('rol') rol?: string) {
    return this.adminService.getUsuarios(rol)
  }

  // GET /admin/bancos — lista todos los bancos con propuestas
  @Get('bancos')
  getBancos() {
    return this.adminService.getBancos()
  }

  // PATCH /admin/bancos/:id/suspender — toggle suspender/reactivar banco
  @Patch('bancos/:id/suspender')
  toggleSuspender(@Param('id') id: string) {
    return this.adminService.toggleSuspenderBanco(id)
  }
}
