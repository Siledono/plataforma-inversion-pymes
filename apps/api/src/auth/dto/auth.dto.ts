import {
  IsEmail, IsString, MinLength, IsUUID, IsBase64,
  IsOptional, IsBoolean, Length, Matches,
} from 'class-validator'

export class RegisterDto {
  @IsUUID()
  token: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas, números y símbolos',
  })
  password: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

// Login específico para empresas con e.Firma
export class LoginEFirmaDto {
  @IsEmail()
  email: string

  @IsString()
  cerBase64: string  // Contenido del .cer codificado en Base64

  @IsString()
  keyBase64: string  // Contenido del .key codificado en Base64

  @IsString()
  keyPassword: string  // Contraseña de la llave privada
}

// Login específico para bancos
export class LoginBancoDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

// Login con Passkeys/WebAuthn (solo para inversores)
export class LoginWebAuthnDto {
  @IsEmail()
  email: string
}

export class RefreshDto {
  @IsString()
  refreshToken: string
}

// Verificación del segundo factor TOTP
export class VerificarTotpDto {
  @IsString()
  userId: string

  @IsString()
  @Length(6, 6, { message: 'El código TOTP debe tener exactamente 6 dígitos' })
  codigo: string
}

// Confirmar TOTP en la configuración inicial
export class ConfirmarTotpDto {
  @IsString()
  @Length(6, 6, { message: 'El código TOTP debe tener exactamente 6 dígitos' })
  codigo: string
}

// Subida de documentos KYC
export class IniciarKycDto {
  @IsString()
  documentoUrl: string  // URL del documento subido a Cloudinary

  @IsString()
  @IsOptional()
  livenessUrl?: string  // URL del video de liveness
}

// Aprobación o rechazo KYC (solo Admin)
export class AprobarKycDto {
  @IsBoolean()
  aprobado: boolean

  @IsString()
  @IsOptional()
  notas?: string
}

// Registro de Passkey (nombre del dispositivo)
export class RegistrarPasskeyDto {
  @IsString()
  @IsOptional()
  nombre?: string
}
