import { IsString, IsNumber, IsPositive, IsEnum, IsOptional, ValidateIf } from 'class-validator'

export enum TipoFinanciamientoDto {
  ACCIONES = 'acciones',
  PRESTAMO = 'prestamo',
  AMBOS = 'ambos',
}

export class CrearNegociacionDto {
  @IsString()
  proyectoId: string

  @IsNumber()
  @IsPositive()
  montoOfertado: number

  @IsEnum(TipoFinanciamientoDto)
  tipo: TipoFinanciamientoDto
}

export enum AccionEmpresa {
  ACEPTAR = 'aceptar',
  RECHAZAR = 'rechazar',
  CONTRAOFERTAR = 'contraofertar',
}

export class EmpresaRespondeNegociacionDto {
  @IsEnum(AccionEmpresa)
  accion: AccionEmpresa

  @ValidateIf((o) => o.accion === AccionEmpresa.CONTRAOFERTAR)
  @IsNumber()
  @IsPositive()
  montoContraoferta?: number
}

export enum AccionInversor {
  ACEPTAR = 'aceptar',
  RECHAZAR = 'rechazar',
}

export class InversorRespondeNegociacionDto {
  @IsEnum(AccionInversor)
  accion: AccionInversor
}
