import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { AgentesService } from './agentes.service'
import { ChatAgenteDto } from './dto/agentes.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@Controller('agentes')
@UseGuards(JwtAuthGuard)
export class AgentesController {
  constructor(private readonly agentesService: AgentesService) {}

  // POST /agentes/chat — disponible para todos los roles autenticados
  @Post('chat')
  chat(@Request() req, @Body() dto: ChatAgenteDto) {
    return this.agentesService.chat(
      req.user.id,
      req.user.rol,
      dto.mensaje,
      dto.historial ?? [],
    )
  }
}
