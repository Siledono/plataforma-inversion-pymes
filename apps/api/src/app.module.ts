import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { ProyectosModule } from './proyectos/proyectos.module'
import { BancosModule } from './bancos/bancos.module'
import { NotificacionesModule } from './notificaciones/notificaciones.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProyectosModule,
    BancosModule,
    NotificacionesModule,
    // Los módulos de dominio se irán agregando en cada sub-tarea:
    // NegociacionesModule — Sub-Tarea 6 (PC2)
    // CmsModule       — Sub-Tarea 8
    // AgentesModule   — Sub-Tarea 9
    // AdminModule     — Sub-Tarea 11
  ],
})
export class AppModule {}
