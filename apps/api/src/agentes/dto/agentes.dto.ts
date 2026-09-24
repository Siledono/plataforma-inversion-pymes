import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class MensajeHistorialDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'assistant'

  @IsString()
  @IsNotEmpty()
  content: string
}

export class ChatAgenteDto {
  @IsString()
  @IsNotEmpty()
  mensaje: string

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MensajeHistorialDto)
  historial?: MensajeHistorialDto[]
}
