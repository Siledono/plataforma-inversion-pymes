import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator'

export class RegisterDto {
  @IsUUID()
  token: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class RefreshDto {
  @IsString()
  refreshToken: string
}
