# API — Backend NestJS

Aplicación backend del proyecto Conecta Inversión.

## Estructura de módulos

- `src/auth/` — Autenticación JWT, registro con token, login, refresh
- `src/proyectos/` — CRUD de proyectos de empresa
- `src/bancos/` — Propuestas bancarias y solicitudes
- `src/negociaciones/` — Negociaciones empresa ↔ inversionista independiente
- `src/notificaciones/` — Notificaciones in-app y email (Resend)
- `src/agentes/` — Agentes IA por rol (OpenAI GPT-4o con function calling)
- `src/cms/` — Contenido informativo de la Secretaría de Economía
- `src/admin/` — Endpoints exclusivos del Admin (tokens, bancos, estadísticas)
- `src/common/guards/` — JwtAuthGuard, RolesGuard
- `src/common/decorators/` — @Roles(), @CurrentUser()
- `src/common/filters/` — Filtros globales de errores
- `src/common/pipes/` — ValidationPipe global
- `prisma/` — Schema de base de datos y migraciones

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores.
