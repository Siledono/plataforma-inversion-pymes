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

---

## Coordinación entre máquinas de desarrollo

### Máquina 1 (esta máquina)
Trabaja sobre la rama `main` — Sub-Tareas 1 a 4 completadas.

### Máquina 2 (segunda máquina con Bob)
Trabaja sobre la rama `desarrollo-st5-en-adelante` — Sub-Tareas 5 en adelante.

**Pasos para la segunda máquina:**
```bash
# 1. Clonar el repositorio
git clone https://github.com/Siledono/plataforma-inversion-pymes.git
cd plataforma-inversion-pymes

# 2. Cambiar a la rama de trabajo
git checkout desarrollo-st5-en-adelante

# 3. Instalar dependencias
npm install

# 4. Configurar entorno
copy apps\api\.env.example apps\api\.env
# Editar apps\api\.env con tu contraseña de PostgreSQL

# 5. Crear la base de datos local
# En psql: CREATE DATABASE conecta_inversion;

# 6. Ejecutar migraciones
cd apps\api
npx prisma migrate dev
npx ts-node -P tsconfig.seed.json prisma/seed.ts
cd ..\..

# 7. Leer el plan completo antes de empezar
# plan-plataforma-inversion-pymes.md — ST-5 es la siguiente tarea
```

**Flujo de trabajo diario:**
```bash
# Antes de empezar siempre jalar cambios
git pull origin desarrollo-st5-en-adelante

# Al terminar una sub-tarea
git add .
git commit -m "feat: ST-X descripcion"
git push origin desarrollo-st5-en-adelante
```

**Al terminar todas las sub-tareas de la rama**, hacer Pull Request en GitHub hacia `main`.
