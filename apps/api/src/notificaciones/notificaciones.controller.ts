import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common'
import { NotificacionesService } from './notificaciones.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private notificacionesService: NotificacionesService) {}

  // GET /api/notificaciones
  @Get()
  getMias(@CurrentUser() user: { id: string }) {
    return this.notificacionesService.getMias(user.id)
  }

  // GET /api/notificaciones/no-leidas
  @Get('no-leidas')
  contarNoLeidas(@CurrentUser() user: { id: string }) {
    return this.notificacionesService.contarNoLeidas(user.id)
  }

  // PATCH /api/notificaciones/:id/leer
  @Patch(':id/leer')
  marcarLeida(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificacionesService.marcarLeida(user.id, id)
  }

  // PATCH /api/notificaciones/leer-todas
  @Patch('leer-todas')
  marcarTodasLeidas(@CurrentUser() user: { id: string }) {
    return this.notificacionesService.marcarTodasLeidas(user.id)
  }
}
