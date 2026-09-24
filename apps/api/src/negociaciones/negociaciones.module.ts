import { Module } from '@nestjs/common'
import { NegociacionesController } from './negociaciones.controller'
import { NegociacionesService } from './negociaciones.service'
import { PrismaModule } from '../prisma/prisma.module'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [NegociacionesController],
  providers: [NegociacionesService],
  exports: [NegociacionesService],
})
export class NegociacionesModule {}
