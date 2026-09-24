import { Module } from '@nestjs/common'
import { AgentesController } from './agentes.controller'
import { AgentesService } from './agentes.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AgentesController],
  providers: [AgentesService],
})
export class AgentesModule {}
