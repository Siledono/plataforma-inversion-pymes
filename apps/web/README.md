# Web — Frontend Next.js 14

Aplicación frontend del proyecto Conecta Inversión.

## Estructura

- `src/app/(auth)/` — Páginas de login y registro
- `src/app/(dashboard)/empresa/` — Dashboard rol Empresa
- `src/app/(dashboard)/banco/` — Dashboard rol Banco
- `src/app/(dashboard)/inversor/` — Dashboard rol Inversionista Independiente
- `src/app/(dashboard)/admin/` — Dashboard rol Admin / Secretaría de Economía
- `src/app/informacion/` — Sección pública informativa (sin login)
- `src/components/shared/` — Componentes reutilizables (AgenteChat, Notificaciones)
- `src/components/empresa|banco|inversor|admin/` — Componentes específicos por rol
- `src/lib/` — Utilidades, cliente API, helpers
- `src/hooks/` — Custom hooks de React

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores.
