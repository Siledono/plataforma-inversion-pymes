import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { ProyectosModule } from './proyectos/proyectos.module'
import { BancosModule } from './bancos/bancos.module'
import { NotificacionesModule } from './notificaciones/notificaciones.module'
import { NegociacionesModule } from './negociaciones/negociaciones.module'
import { CmsModule } from './cms/cms.module'
import { AgentesModule } from './agentes/agentes.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProyectosModule,
    BancosModule,
    NotificacionesModule,
    // Sub-Tarea 6 (PC2)
    NegociacionesModule,
    // Sub-Tarea 8 (PC2)
    CmsModule,
    // Sub-Tarea 9 (PC2)
    AgentesModule,
    // Sub-Tarea 11 (PC2)
    AdminModule,
  ],
})
export class AppModule {}
