import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // CORS — solo el frontend autorizado
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Cabeceras de seguridad HTTP (TLS 1.3 + HSTS en producción)
  app.use((_req: any, res: any, next: () => void) => {
    // HSTS: forzar HTTPS por 1 año incluyendo subdominios
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY')
    // Prevenir MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    // Política de permisos
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    // Content Security Policy básico
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'",
    )
    next()
  })

  // Prefijo global de la API
  app.setGlobalPrefix('api')

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`🚀 API corriendo en: http://localhost:${port}/api`)
  console.log(`🔐 Seguridad: HSTS=${process.env.NODE_ENV === 'production' ? 'activo' : 'solo producción'}, Rate limiting: activo`)
}

bootstrap()
