import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsPositive,
  Min,
  IsUrl,
  MaxLength,
} from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'

export enum TipoFinanciamientoDto {
  ACCIONES = 'acciones',
  PRESTAMO = 'prestamo',
  AMBOS = 'ambos',
}

export class CreateProyectoDto {
  @IsString()
  @MaxLength(120)
  titulo: string

  @IsString()
  @MaxLength(2000)
  descripcion: string

  @IsNumber()
  @IsPositive()
  montoMin: number

  @IsNumber()
  @IsPositive()
  montoMax: number

  @IsEnum(TipoFinanciamientoDto)
  tipoFinanciamiento: TipoFinanciamientoDto

  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentajeAcciones?: number

  @IsOptional()
  @IsUrl()
  documentoUrl?: string
}

export class UpdateProyectoDto extends PartialType(CreateProyectoDto) {}

export class FilterProyectosDto {
  @IsOptional()
  @IsString()
  sector?: string

  @IsOptional()
  @IsEnum(TipoFinanciamientoDto)
  tipoFinanciamiento?: TipoFinanciamientoDto

  @IsOptional()
  @IsNumber()
  montoMinimo?: number

  @IsOptional()
  @IsNumber()
  montoMaximo?: number
}
