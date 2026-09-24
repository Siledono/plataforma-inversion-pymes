import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { ProyectosModule } from './proyectos/proyectos.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProyectosModule,
    // Los módulos de dominio se irán agregando en cada sub-tarea:
    // BancosModule    — Sub-Tarea 5
    // NegociacionesModule — Sub-Tarea 6
    // NotificacionesModule — Sub-Tarea 7
    // CmsModule       — Sub-Tarea 8
    // AgentesModule   — Sub-Tarea 9
    // AdminModule     — Sub-Tarea 11
  ],
})
export class AppModule {}
