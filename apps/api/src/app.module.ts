import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    // Los módulos de dominio se irán agregando en cada sub-tarea:
    // AuthModule      — Sub-Tarea 3
    // ProyectosModule — Sub-Tarea 4
    // BancosModule    — Sub-Tarea 5
    // NegociacionesModule — Sub-Tarea 6
    // NotificacionesModule — Sub-Tarea 7
    // CmsModule       — Sub-Tarea 8
    // AgentesModule   — Sub-Tarea 9
    // AdminModule     — Sub-Tarea 11
  ],
})
export class AppModule {}
