import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
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
    // Rate limiting global: máx 100 req/min por IP (endpoints auth tienen límite menor via decorador)
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 100 },
      { name: 'auth', ttl: 900_000, limit: 5 },   // 5 intentos en 15 min para auth
    ]),
    PrismaModule,
    AuthModule,
    ProyectosModule,
    BancosModule,
    NotificacionesModule,
    NegociacionesModule,
    CmsModule,
    AgentesModule,
    AdminModule,
  ],
  providers: [
    // Aplicar ThrottlerGuard globalmente
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
