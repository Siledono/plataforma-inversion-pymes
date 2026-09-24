import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
  Max,
  IsEnum,
  IsUUID,
} from 'class-validator'

// ─── Propuestas de Banco ──────────────────────────────────

export class CreatePropuestaDto {
  @IsString()
  @MaxLength(120)
  nombre: string

  @IsString()
  @MaxLength(1000)
  requisitos: string

  @IsNumber()
  @IsPositive()
  montoFijo: number

  @IsNumber()
  @Min(0)
  @Max(100)
  tasaInteres: number
}

export class UpdatePropuestaDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requisitos?: string

  @IsOptional()
  @IsBoolean()
  activa?: boolean
}

// Solo el Admin puede editar montos y tasa
export class AdminUpdatePropuestaDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requisitos?: string

  @IsOptional()
  @IsNumber()
  @IsPositive()
  montoFijo?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tasaInteres?: number

  @IsOptional()
  @IsBoolean()
  activa?: boolean
}

// ─── Solicitudes ──────────────────────────────────────────

export class CreateSolicitudDto {
  @IsUUID()
  proyectoId: string

  @IsUUID()
  propuestaBancoId: string
}

export enum RespuestaBancoEnum {
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  CONTRAOFERTA = 'contraoferta',
}

export class ResponderSolicitudBancoDto {
  @IsEnum(RespuestaBancoEnum)
  decision: RespuestaBancoEnum

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  contraofertaDetalle?: string
}

export enum RespuestaEmpresaEnum {
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
}

export class EmpresaRespondeDto {
  @IsEnum(RespuestaEmpresaEnum)
  decision: RespuestaEmpresaEnum
}
