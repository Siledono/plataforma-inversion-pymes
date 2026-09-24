import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator'

export class CreateCmsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string

  @IsString()
  @IsNotEmpty()
  cuerpo: string
}

export class UpdateCmsDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  titulo?: string

  @IsString()
  @IsOptional()
  cuerpo?: string
}
