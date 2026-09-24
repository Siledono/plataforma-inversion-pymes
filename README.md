# Conecta Inversión — Plataforma de Inversión para PyMEs
**Secretaría de Economía de México**

Plataforma web gubernamental que conecta a empresas pequeñas y medianas (PyMEs) con bancos e inversionistas independientes para facilitar su primer financiamiento.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | JWT (access + refresh tokens) |
| Email | Resend |
| Agentes IA | OpenAI GPT-4o |
| Storage | Cloudinary |
| Monorepo | Turborepo |

---

## Estructura del Proyecto

```
conecta-inversion/
├── apps/
│   ├── web/          ← Frontend Next.js (4 portales por rol)
│   └── api/          ← Backend NestJS (API REST)
├── packages/
│   └── types/        ← Tipos y enums compartidos
├── docs/             ← Documentación adicional
└── plan-plataforma-inversion-pymes.md  ← Plan de desarrollo completo
```

---

## Roles del Sistema

| Rol | Descripción |
|---|---|
| **Empresa** | PyME que publica proyectos y busca financiamiento |
| **Banco** | Institución financiera con propuestas de inversión fijas |
| **Inversionista Independiente** | Persona que invierte directamente en proyectos |
| **Admin** | Secretaría de Economía — administra la plataforma |

---

## Inicio Rápido

### Requisitos
- Node.js 22 LTS
- PostgreSQL 16+
- pnpm

### Instalación
```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Levantar en desarrollo
pnpm dev
```

---

## Plan de Desarrollo

Ver [`plan-plataforma-inversion-pymes.md`](./plan-plataforma-inversion-pymes.md) para el plan completo con las 12 sub-tareas, modelo de datos, flujos y reglas de negocio.
