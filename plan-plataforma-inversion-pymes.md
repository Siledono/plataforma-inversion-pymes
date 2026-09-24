# Plan de Desarrollo — Plataforma de Inversión para PyMEs
**Secretaría de Economía — Conecta Inversión**

---

## Visión General

Plataforma web gubernamental que conecta a empresas pequeñas y medianas (PyMEs) con bancos e inversionistas independientes para facilitar su primer financiamiento. El sistema gestiona publicación de proyectos, solicitudes de inversión, negociaciones privadas con contraoferta única, y agentes de IA por rol que asisten a los usuarios dentro de sus permisos.

### Alcance
- 4 roles: Empresa, Banco, Inversionista Independiente, Admin (Secretaría de Economía)
- Flujos de solicitud banco → aceptación/contraoferta/rechazo
- Flujos de negociación empresa ↔ inversionista independiente (privada, 1 ronda, 12-24hrs)
- Inversión simultánea banco + inversionista independiente sobre el mismo proyecto
- Agentes IA por rol con acceso restringido a datos según permisos
- Simulador de riesgo de inversión (% ponderado)
- CMS para contenido de la Secretaría de Economía (solo Admin)
- Notificaciones in-app y por email en 3 eventos clave

### Fuera del Alcance
- Procesamiento de pagos reales (la plataforma es un conector; las transferencias ocurren fuera)
- Integración con SAT o IMSS para validación de datos fiscales
- App móvil nativa
- Soporte multilenguaje

---

## Stack Tecnológico Seleccionado

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript | SSR para SEO gubernamental, App Router, tipado estricto, un solo repositorio para los 4 portales via layouts |
| **Estilos** | Tailwind CSS + shadcn/ui | Componentes accesibles, rápidos de implementar, look institucional |
| **Backend** | NestJS + TypeScript | Arquitectura modular por dominio, decoradores para RBAC, ideal para proyectos de escala mediana-grande |
| **Base de datos** | PostgreSQL + Prisma ORM | Relaciones complejas entre roles, migraciones controladas, tipado desde el esquema |
| **Autenticación Empresa** | e.Firma SAT (PKI) + TOTP MFA | Certificado .cer/.key, validación cadena de confianza SAT, RBAC interno |
| **Autenticación Inversor** | Passkeys/WebAuthn + TOTP MFA | Login biométrico o email+contraseña, verificación de dispositivo conocido, KYC |
| **Autenticación Banco** | mTLS + IP Whitelist + JWT DPoP | Autenticación mutua TLS, sesiones de 3-5 min, bloqueo por cambio de IP |
| **Seguridad transversal** | TLS 1.3 + HSTS + Rate limiting | Protección fuerza bruta, autenticación adaptativa, cifrado en tránsito y reposo |
| **Storage** | Cloudinary o AWS S3 | PDFs de documentos empresariales, convocatorias del CMS, certificados e.Firma |
| **Email** | Resend | API simple, plantillas React, magic links de verificación de dispositivo |
| **Agentes IA** | OpenAI API (GPT-4o) con function calling | Contexto dinámico por rol, function calling para consultar BD en tiempo real |
| **Deploy** | Railway (backend + BD) + Vercel (frontend) | Costo bajo, CI/CD automático, adecuado para fase gubernamental inicial |
| **Monorepo** | Turborepo | Comparte tipos TypeScript entre frontend y backend desde el inicio |

---

## Modelo de Datos — Referencia

### Tablas principales

```
users             — id, email, password_hash, rol (empresa|banco|inversor|admin), activo
empresas          — id, user_id, rfc, razon_social, sector_scian, anios_operacion, num_empleados,
                    ingresos_anuales, deudas_actuales, documento_url
bancos            — id, user_id, nombre_institucional, clave_banxico, contacto_gestor, suspendido
inversores        — id, user_id, nombre_completo, rfc_curp, capital_disponible,
                    preferencia (acciones|prestamo|ambos), sectores_interes
proyectos         — id, empresa_id, titulo, descripcion, monto_min, monto_max,
                    porcentaje_acciones, tipo_financiamiento, estado (ver estados), total_invertido
propuestas_banco  — id, banco_id, nombre, requisitos, monto_fijo, tasa_interes, activa
solicitudes_banco — id, proyecto_id, propuesta_banco_id, estado, contraoferta_detalle, expira_en
negociaciones     — id, proyecto_id, inversor_id, monto_ofertado, monto_contraoferta,
                    tipo, estado, expira_en
notificaciones    — id, user_id, mensaje, tipo, leida, created_at
cms_contenido     — id, admin_id, titulo, cuerpo, archivo_url, created_at
tokens_registro   — id, token (uuid único), rol_destino (empresa|banco|inversor), usado (bool),
                    creado_por_admin_id, expira_en, used_by_user_id (nullable)
```

### Estados válidos de un Proyecto
`borrador` → `publicado` → `en_revision_banco` (paralelo con negociación inversor) →
`financiado_banco` | `financiado_inversor` | `financiado_total` | `eliminado`

### Estados de Solicitud Banco
`en_revision` → `aceptada` | `rechazada` | `contraoferta_pendiente` | `expirada`

### Estados de Negociación Inversor
`pendiente` → `contraoferta` → `aceptada` | `rechazada` | `expirada`

---

## Reglas de Negocio Clave

1. Un proyecto puede recibir solicitudes de banco E negociaciones de inversionistas independientes al mismo tiempo.
2. Solo se permite 1 ronda de contraoferta por negociación (empresa o banco pueden hacer la contra, no ambos).
3. Si nadie acepta tras la contraoferta, el proyecto regresa a estado `publicado`.
4. Las negociaciones son privadas: solo las dos partes involucradas pueden verlas.
5. El historial de negociaciones pasadas es visible a quien lo solicite explícitamente al agente de IA.
6. Los datos financieros privados (ingresos, deudas) solo son visibles para quien recibe una solicitud activa.
7. El total invertido en un proyecto es información pública.
8. El banco no puede modificar sus montos; solo el Admin puede editar los parámetros de las propuestas bancarias.
9. El Admin crea y suspende cuentas de bancos.
10. Ningún rol puede registrarse sin un token de registro válido generado por el Admin.
11. Cada token de registro es de un solo uso, tiene rol destino fijo y expira en 48 horas.
12. El Admin genera tokens desde su panel y los entrega al banco, empresa o inversionista por fuera de la plataforma (email, mensaje, etc).

### Fórmula del Simulador de Riesgo
```
score_anios     = normalizar(anios_operacion, 0, 20) * 0.30    // más años = menos riesgo
score_deuda     = (1 - deudas / ingresos) * 0.40              // más deuda relativa = más riesgo
score_sector    = tabla_volatilidad_sector[sector_scian] * 0.20
score_historial = normalizar(num_inversiones_previas, 0, 5) * 0.10
riesgo_total    = 1 - (score_anios + score_deuda + score_sector + score_historial)
// Resultado: Bajo 0-30% / Medio 31-60% / Alto 61-100%
```

---

## Sub-Tareas de Desarrollo

---

### Sub-Tarea 1 — Inicialización del Monorepo y Configuración Base

**Estado:** [x] done

**Intent**
Crear la estructura base del proyecto con Turborepo que contenga la aplicación Next.js (frontend), la aplicación NestJS (backend), y el paquete de tipos compartidos. Configurar herramientas de calidad de código y variables de entorno.

**Expected Outcomes**
- Repositorio inicializado con estructura `apps/web`, `apps/api`, `packages/types`
- Next.js 14 corriendo en `localhost:3000`
- NestJS corriendo en `localhost:3001`
- Tipos TypeScript compartidos accesibles desde ambas apps
- ESLint y Prettier configurados
- Archivos `.env.example` con todas las variables necesarias documentadas

**Todo List**
- [x] Estructura de monorepo creada: `apps/web`, `apps/api`, `packages/types`
- [x] `package.json` raíz con Turborepo, Prettier y ESLint
- [x] `apps/web/package.json` con Next.js 14, React 18, Tailwind, TypeScript
- [x] `apps/api/package.json` con NestJS, Prisma, JWT, bcrypt, OpenAI, Resend, Cloudinary
- [x] `packages/types/src/index.ts` con todos los enums del sistema
- [x] `tsconfig.json` para web y api con paths a `@conecta/types`
- [x] `next.config.js` con `transpilePackages` para tipos compartidos
- [x] `tailwind.config.js` y `globals.css` en web
- [x] `layout.tsx` y `page.tsx` base en web
- [x] `.prettierrc` y `.eslintrc.json` en raíz
- [x] `nest-cli.json` en api
- [x] `.env.example` en api y web con todas las variables documentadas
- [ ] Instalar dependencias con `npm install` — pendiente: requiere nueva terminal con Node 22

**Notas de Implementación**
- nvm-windows instalado, Node 22 LTS activo. Abrir nueva terminal y ejecutar `npm install` en raíz para instalar todas las dependencias del monorepo.

**Relevant Context**
- Todos los enums de roles y estados del proyecto deben definirse en `packages/types/src/enums.ts`
- El paquete de tipos debe exportar: `UserRol`, `EstadoProyecto`, `EstadoSolicitudBanco`, `EstadoNegociacion`, `TipoFinanciamiento`, `TipoNotificacion`

---

### Sub-Tarea 2 — Base de Datos: Esquema Prisma y Migraciones

**Estado:** [x] done

**Intent**
Definir el esquema completo de la base de datos en Prisma reflejando todas las entidades del sistema, sus relaciones y restricciones. Ejecutar la migración inicial contra PostgreSQL.

**Expected Outcomes**
- Archivo `schema.prisma` completo con todas las tablas del modelo de datos
- Migración inicial aplicada exitosamente en base de datos local
- Prisma Client generado y tipado disponible en `apps/api`
- Seed script con datos de prueba básicos (1 admin, 1 banco, 1 empresa, 1 inversor)

**Todo List**
- [ ] Instalar Prisma en `apps/api` y configurar `DATABASE_URL`
- [ ] Definir modelos en `schema.prisma`: `User`, `Empresa`, `Banco`, `Inversor`, `Proyecto`, `PropuestaBanco`, `SolicitudBanco`, `Negociacion`, `Notificacion`, `CmsContenido`
- [ ] Configurar relaciones: `User` 1:1 con cada perfil, `Empresa` 1:N con `Proyecto`, `Proyecto` 1:N con `SolicitudBanco` y `Negociacion`
- [ ] Agregar índices en campos de búsqueda frecuente: `user_id`, `proyecto_id`, `estado`
- [ ] Ejecutar `prisma migrate dev --name init`
- [ ] Crear `prisma/seed.ts` con datos de prueba para los 4 roles
- [ ] Generar Prisma Client y verificar tipos

**Relevant Context**
- Ver sección "Modelo de Datos — Referencia" en este plan
- Los campos `expira_en` en `SolicitudBanco` y `Negociacion` deben ser `DateTime?` para calcular expiración de 12-24hrs
- El campo `suspendido` en `Banco` es gestionado exclusivamente por el Admin

---

### Sub-Tarea 3 — Autenticación y Control de Roles (RBAC)

**Estado:** [x] done

**Intent**
Implementar el sistema de autenticación con JWT (access token corto + refresh token largo), el control de acceso basado en roles, y el sistema de tokens de registro de un solo uso generados por el Admin. Ningún usuario puede registrarse sin un token válido.

**Expected Outcomes**
- Endpoints funcionales: `POST /auth/register` (requiere token), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Guard de autenticación JWT aplicado globalmente en NestJS
- Decorator `@Roles()` funcional que restringe endpoints por rol
- Admin puede generar tokens de registro con rol destino fijo (empresa, banco o inversor)
- Cada token es de un solo uso y expira en 48 horas
- El registro valida el token, crea el usuario con el rol del token y marca el token como usado
- Admin no puede auto-registrarse; su cuenta es la cuenta semilla del sistema
- Un banco suspendido recibe `401` al intentar hacer login

**Todo List**
- [ ] Instalar `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt` en `apps/api`
- [ ] Crear módulo `AuthModule` con servicio, controlador y estrategia JWT
- [ ] Agregar modelo `TokenRegistro` en Prisma: `id`, `token` (uuid), `rol_destino`, `usado`, `creado_por_admin_id`, `expira_en`, `used_by_user_id`
- [ ] Crear endpoint `POST /admin/tokens` — solo Admin; genera un token uuid con rol destino y expiración de 48hrs
- [ ] Crear endpoint `GET /admin/tokens` — solo Admin; lista tokens generados y su estado (usado/activo/expirado)
- [ ] Implementar `POST /auth/register` — recibe `{ token, email, password, ...datosPerfil }`; valida que el token exista, no esté usado, no haya expirado y asigna el rol del token al nuevo usuario
- [ ] Al completar registro: marcar token como `usado: true` y guardar `used_by_user_id`
- [ ] Implementar `login` que retorna `access_token` (15min) y `refresh_token` (7 días)
- [ ] Crear `JwtAuthGuard` global y `RolesGuard` con decorator `@Roles(...UserRol[])`
- [ ] Crear endpoint `PATCH /admin/bancos/:id/suspender` para suspender/reactivar bancos
- [ ] Escribir tests de integración para: registro con token válido, registro con token inválido/expirado/usado, login, acceso denegado por rol, banco suspendido

**Relevant Context**
- El `UserRol` enum: `empresa | banco | inversor | admin`
- Los refresh tokens deben almacenarse hasheados en BD para poder invalidarlos en logout
- Un banco suspendido (`suspendido: true`) debe recibir `401` al intentar hacer login
- El Admin entrega el token al usuario por fuera de la plataforma (email, mensaje directo, etc.)
- El panel Admin debe mostrar un botón "Generar token" con selector de rol y mostrar el token generado para que el Admin pueda copiarlo y enviarlo

---

### Sub-Tarea 4 — Módulo de Proyectos (CRUD)

**Estado:** [x] done

**Intent**
Implementar la gestión completa de proyectos de empresa: crear, publicar, editar, eliminar y listar proyectos. Incluir las reglas de visibilidad de datos financieros privados.

**Expected Outcomes**
- Empresa puede crear, editar y eliminar sus propios proyectos
- Empresa puede publicar un proyecto (cambio de estado `borrador` → `publicado`)
- Bancos e inversionistas pueden listar proyectos publicados SIN ver datos financieros privados
- Cuando banco o inversor tiene una solicitud/negociación activa, puede ver datos financieros del proyecto
- El campo `total_invertido` es visible para todos
- No se puede editar un proyecto en estado `financiado_*`

**Todo List**
- [ ] Crear módulo `ProyectosModule` en NestJS con controlador, servicio y DTOs
- [ ] Implementar `POST /proyectos` — solo rol `empresa`
- [ ] Implementar `PATCH /proyectos/:id` — solo la empresa dueña, estados permitidos
- [ ] Implementar `DELETE /proyectos/:id` — soft delete, cambia estado a `eliminado`
- [ ] Implementar `PATCH /proyectos/:id/publicar` — cambia `borrador` → `publicado`
- [ ] Implementar `GET /proyectos` — lista proyectos publicados con filtros de sector, tipo financiamiento, rango de monto
- [ ] Implementar `GET /proyectos/:id` — retorna datos completos o censurados según rol y relación activa
- [ ] Crear helper `puedeVerDatosPrivados(userId, proyectoId)` que consulta si existe solicitud/negociación activa
- [ ] Agregar validación: no se puede editar proyecto en estados `financiado_*` o `eliminado`

**Relevant Context**
- Datos privados a ocultar en listado público: `ingresos_anuales`, `deudas_actuales`, `documento_url`
- Datos siempre públicos: `titulo`, `descripcion`, `sector_scian`, `monto_min`, `monto_max`, `tipo_financiamiento`, `total_invertido`, `anios_operacion`, `num_empleados`

---

### Sub-Tarea 5 — Módulo de Propuestas de Banco y Solicitudes

**Estado:** [x] done

**Intent**
Implementar el flujo completo de inversión bancaria: el banco publica propuestas fijas, las empresas envían solicitudes a esas propuestas, el banco acepta/rechaza/contraoferta, y la empresa responde a la contraoferta.

**Expected Outcomes**
- Banco puede crear, editar y desactivar sus propuestas de inversión
- Empresa puede enviar su proyecto a una propuesta de banco activa
- Banco puede aceptar, rechazar o hacer contraoferta a una solicitud
- Si banco contraoferta, empresa tiene 12-24hrs para aceptar o rechazar
- Si empresa acepta → proyecto pasa a `financiado_banco`; si rechaza → proyecto regresa a `publicado`
- Solo el Admin puede modificar los parámetros base de las propuestas bancarias

**Todo List**
- [ ] Crear módulo `BancosModule` con propuestas y solicitudes
- [ ] Implementar `POST /propuestas` — solo rol `banco`
- [ ] Implementar `PATCH /propuestas/:id` — banco dueño de la propuesta (no puede cambiar montos sin Admin)
- [ ] Implementar `GET /propuestas` — lista todas las propuestas activas (público para empresas)
- [ ] Implementar `POST /solicitudes` — empresa envía proyecto a propuesta de banco; crea registro con `estado: en_revision`
- [ ] Implementar `PATCH /solicitudes/:id/responder` — banco acepta/rechaza/contraoferta; al contraoferta, setear `expira_en = now + 24hs`
- [ ] Implementar `PATCH /solicitudes/:id/empresa-responde` — empresa acepta o rechaza contraoferta del banco
- [ ] Crear job de expiración: cada hora revisar solicitudes con `expira_en < now` y marcarlas `expirada`
- [ ] Al aceptar → actualizar estado del proyecto y `total_invertido`
- [ ] Implementar `PATCH /admin/propuestas/:id` — solo Admin puede editar montos de propuestas bancarias

**Relevant Context**
- Una empresa solo puede tener 1 solicitud activa por propuesta de banco al mismo tiempo
- El banco recibe notificación tipo `oferta_recibida` cuando llega una solicitud
- La empresa recibe notificación tipo `contraoferta` cuando el banco contraoferta
- La empresa recibe notificación tipo `proyecto_aceptado` cuando el banco acepta

---

### Sub-Tarea 6 — Módulo de Negociaciones con Inversionista Independiente

**Estado:** [x] done

**Intent**
Implementar el flujo privado de negociación entre inversionista independiente y empresa: el inversionista hace una oferta sobre un proyecto publicado, la empresa puede aceptar o hacer una contraoferta única, y el inversionista responde a esa contra.

**Expected Outcomes**
- Inversionista puede hacer oferta sobre proyecto publicado especificando monto y tipo (acciones/préstamo)
- Empresa recibe notificación y puede aceptar, rechazar o hacer contraoferta en 12-24hrs
- Si empresa contraoferta, inversionista tiene 12-24hrs para aceptar o rechazar (única ronda)
- Si nadie acepta → proyecto regresa a `publicado`
- Si se acepta → `total_invertido` se actualiza; proyecto puede estar `financiado_inversor` o `financiado_total` si ya tenía banco
- La negociación completa es privada; solo las dos partes la ven

**Todo List**
- [ ] Crear módulo `NegociacionesModule` en NestJS
- [ ] Implementar `POST /negociaciones` — inversor hace oferta sobre un proyecto publicado
- [ ] Validar que el proyecto existe, está publicado y no está eliminado
- [ ] Implementar `PATCH /negociaciones/:id/empresa-responde` — empresa acepta, rechaza o contraoferta; si contraoferta setear `expira_en`
- [ ] Implementar `PATCH /negociaciones/:id/inversor-responde` — inversor acepta o rechaza la contraoferta de la empresa
- [ ] Implementar `GET /negociaciones/:id` — solo accesible para las dos partes involucradas
- [ ] Implementar `GET /negociaciones` — empresa ve sus negociaciones activas; inversor ve las suyas
- [ ] Crear job de expiración para negociaciones vencidas (misma lógica que solicitudes banco)
- [ ] Al aceptar → actualizar `total_invertido` del proyecto y calcular nuevo estado del proyecto

**Relevant Context**
- Un proyecto en `en_revision_banco` también puede recibir negociaciones de inversores simultáneamente
- Si el proyecto ya tiene `financiado_banco`, al aceptar negociación → estado pasa a `financiado_total`
- El historial de negociaciones pasadas (aceptadas/rechazadas) es accesible solo si el agente lo consulta explícitamente

---

### Sub-Tarea 7 — Módulo de Notificaciones

**Estado:** [x] done

**Intent**
Implementar el sistema de notificaciones que dispara mensajes in-app y por email en los 3 eventos clave: oferta recibida, contraoferta recibida, proyecto aceptado.

**Expected Outcomes**
- Notificaciones in-app creadas en BD al ocurrir cada evento
- Endpoint `GET /notificaciones` retorna notificaciones no leídas del usuario autenticado
- Endpoint `PATCH /notificaciones/:id/leer` marca como leída
- Email enviado automáticamente via Resend con plantilla HTML para cada tipo de evento
- El frontend muestra badge con conteo de notificaciones no leídas

**Todo List**
- [ ] Crear módulo `NotificacionesModule` con servicio reutilizable `NotificacionesService`
- [ ] Implementar método `crear(userId, tipo, mensaje, metadatos)` en el servicio
- [ ] Implementar `GET /notificaciones` — retorna notificaciones del usuario autenticado, ordenadas por fecha
- [ ] Implementar `PATCH /notificaciones/:id/leer`
- [ ] Instalar y configurar Resend en `apps/api`
- [ ] Crear plantillas de email HTML para los 3 tipos: `oferta_recibida`, `contraoferta`, `proyecto_aceptado`
- [ ] Inyectar `NotificacionesService` en `BancosModule` y `NegociacionesModule` para disparar notificaciones en los eventos correctos
- [ ] Implementar envío de email asíncrono (no bloqueante para el request principal)

**Relevant Context**
- Los 3 eventos que disparan notificación: `oferta_recibida`, `contraoferta`, `proyecto_aceptado`
- Cada notificación debe llevar suficiente contexto para que el email sea útil: nombre del proyecto, monto, nombre de la contraparte

---

### Sub-Tarea 8 — CMS de la Secretaría de Economía

**Estado:** [x] done

**Intent**
Implementar el módulo de contenido informativo de la Secretaría de Economía, accesible para lectura pública y editable solo por el Admin. Incluye soporte para documentos descargables (PDFs, convocatorias).

**Expected Outcomes**
- Admin puede crear, editar y eliminar artículos del CMS con título, cuerpo y archivo adjunto opcional
- Archivos PDF subidos y almacenados en Cloudinary/S3
- Endpoint público `GET /cms` lista todos los artículos publicados
- Endpoint `GET /cms/:id` retorna detalle con URL de descarga del archivo
- Frontend muestra sección informativa accesible desde la navegación principal para todos los roles

**Todo List**
- [ ] Configurar cliente de almacenamiento (Cloudinary SDK o AWS S3) en `apps/api`
- [ ] Crear módulo `CmsModule` con controlador, servicio y DTOs
- [ ] Implementar `POST /cms` con upload de archivo — solo Admin; aceptar `multipart/form-data`
- [ ] Implementar `PATCH /cms/:id` — solo Admin, permite actualizar texto y reemplazar archivo
- [ ] Implementar `DELETE /cms/:id` — solo Admin
- [ ] Implementar `GET /cms` — público, lista artículos con título, fecha y link de descarga
- [ ] Implementar `GET /cms/:id` — público, detalle completo
- [ ] Crear componente de sección informativa en el frontend visible para todos los roles sin login requerido

**Relevant Context**
- Los archivos deben tener un tamaño máximo (sugerido: 10MB por archivo)
- Los formatos aceptados deben restringirse a PDF para documentos oficiales

---

### Sub-Tarea 9 — Agentes de IA por Rol

**Estado:** [x] done

**Intent**
Implementar los 4 agentes de IA conversacionales (Empresa, Banco, Inversionista Independiente, Admin) con acceso controlado a datos según el rol, incluyendo el simulador de riesgo para los agentes de banco e inversor.

**Expected Outcomes**
- Cada rol tiene un chatbot accesible en su dashboard
- El agente responde preguntas sobre la plataforma, otros usuarios (dentro de permisos) y guía en el uso del sistema
- El agente de inversionista independiente y de banco puede calcular y mostrar el % de riesgo de un proyecto
- El agente de empresa puede consultar información pública de bancos e inversores
- Los agentes NO revelan datos privados que el usuario no tiene permiso de ver
- Las conversaciones son por sesión (no persistentes entre sesiones)

**Todo List**
- [ ] Crear módulo `AgentesModule` en NestJS con un controlador y servicio base
- [ ] Configurar cliente de OpenAI con GPT-4o y function calling habilitado
- [ ] Definir system prompt base con instrucciones de rol para cada tipo: empresa, banco, inversor, admin
- [ ] Implementar `POST /agentes/chat` — recibe `{ mensaje, historial[] }`, retorna respuesta del agente según rol del usuario autenticado
- [ ] Definir functions disponibles por rol:
  - `empresa`: `buscar_banco(nombre)`, `buscar_inversor(nombre)`, `listar_propuestas_activas()`
  - `inversor` y `banco`: `buscar_proyecto(id_o_nombre)`, `calcular_riesgo(proyecto_id)`, `historial_negociaciones(proyecto_id)`
  - `admin`: acceso completo a todas las functions anteriores
- [ ] Implementar la función `calcular_riesgo(proyecto_id)` que consulta la BD y aplica la fórmula del simulador
- [ ] Agregar validación en cada function que verifica permisos antes de retornar datos (no retornar datos privados sin relación activa)
- [ ] Crear componente de chat flotante en el frontend con historial de sesión en estado local

**Relevant Context**
- Fórmula del simulador de riesgo definida en sección "Reglas de Negocio Clave" de este plan
- El historial de negociaciones pasadas se puede retornar vía agente si el usuario lo solicita explícitamente
- Las functions del agente deben ser llamadas server-side; el frontend nunca llama directamente a OpenAI

---

### Sub-Tarea 10 — Interfaces de Usuario por Rol (Frontend)

**Estado:** [ ] pending

**Intent**
Construir las 4 interfaces de usuario correspondientes a cada rol, con navegación protegida por autenticación, dashboards específicos, y la integración de todos los módulos del backend ya implementados.

**Expected Outcomes**
- Páginas de login y registro funcionando con redirección por rol
- Dashboard de Empresa: lista de proyectos, crear/editar/publicar proyecto, ver solicitudes y negociaciones activas
- Dashboard de Banco: lista de proyectos publicados, gestión de propuestas, bandeja de solicitudes recibidas
- Dashboard de Inversionista Independiente: explorar proyectos, hacer ofertas, ver negociaciones activas
- Dashboard de Admin: gestión de bancos (crear/suspender), CMS, vista global de estadísticas
- Agente de IA flotante visible en todos los dashboards
- Notificaciones in-app con badge en navbar
- Sección informativa de Secretaría de Economía accesible desde la página principal sin login

**Todo List**
- [ ] Configurar middleware de autenticación en Next.js que redirige según rol
- [ ] Crear layout base con navbar, badge de notificaciones y botón de agente IA para cada rol
- [ ] Implementar páginas de autenticación: `/login`, `/registro` (empresa), `/registro/inversor`
- [ ] Implementar dashboard de Empresa: `/empresa/proyectos`, `/empresa/proyectos/nuevo`, `/empresa/proyectos/:id/editar`, `/empresa/solicitudes`, `/empresa/negociaciones`
- [ ] Implementar dashboard de Banco: `/banco/propuestas`, `/banco/proyectos`, `/banco/solicitudes`
- [ ] Implementar dashboard de Inversionista: `/inversor/explorar`, `/inversor/negociaciones`
- [ ] Implementar dashboard de Admin: `/admin/bancos`, `/admin/cms`, `/admin/estadisticas`
- [ ] Implementar componente `<AgenteChat />` reutilizable con estado de sesión local
- [ ] Implementar componente `<NotificacionesBadge />` con polling cada 30 segundos
- [ ] Crear página pública `/informacion` con contenido del CMS sin requerir login
- [ ] Implementar formulario de proyecto con todos los campos del modelo de datos

**Relevant Context**
- Usar shadcn/ui para tablas, formularios, badges, dialogs y toasts
- Los datos financieros privados solo se muestran si la sesión activa tiene relación (solicitud/negociación) con ese proyecto
- El formulario de proyecto debe incluir: título, descripción, sector, monto mín/máx, porcentaje acciones, tipo financiamiento, carga de documento PDF

---

### Sub-Tarea 11 — Panel de Admin y Estadísticas Globales

**Estado:** [x] done

**Intent**
Implementar el panel de administración completo para el rol Admin de la Secretaría de Economía, incluyendo gestión de bancos, edición de propuestas bancarias, CMS y vista de estadísticas generales de la plataforma.

**Expected Outcomes**
- Admin puede ver, crear y suspender/reactivar cuentas de banco
- Admin puede editar los parámetros (montos, tasas) de cualquier propuesta bancaria
- Admin puede gestionar contenido del CMS
- Admin ve estadísticas: total empresas registradas, proyectos publicados, financiamientos completados, monto total movilizado

**Todo List**
- [ ] Implementar `GET /admin/estadisticas` que agrega métricas generales desde la BD
- [ ] Implementar `GET /admin/usuarios` con filtros por rol para visualización global
- [ ] Crear página `/admin/estadisticas` con tarjetas de métricas y gráficas básicas (usar Recharts)
- [ ] Crear página `/admin/bancos` con tabla, botón crear banco y toggle suspender/activar
- [ ] Crear formulario de creación de banco con todos los campos del modelo
- [ ] Integrar edición de propuestas bancarias en el panel admin
- [ ] Integrar el CMS ya implementado en la Sub-Tarea 8 al panel admin

**Relevant Context**
- El Admin es el único rol que puede ver datos de todos los usuarios sin restricción
- Las estadísticas no requieren datos en tiempo real; pueden calcularse en el momento de la consulta

---

### Sub-Tarea 12 — Testing, Validaciones y Deploy

**Estado:** [ ] pending

**Intent**
Agregar validación de datos en todos los endpoints, escribir tests de integración para los flujos críticos y configurar el pipeline de deploy en Railway (API + BD) y Vercel (frontend).

**Expected Outcomes**
- Todos los endpoints validan su input con `class-validator` y retornan errores descriptivos
- Tests de integración cubren los 3 flujos críticos: solicitud banco, negociación inversor, autenticación por rol
- Deploy automático en cada push a rama `main`
- Variables de entorno configuradas en Railway y Vercel

**Todo List**
- [ ] Instalar `class-validator` y `class-transformer` en `apps/api` y agregar `ValidationPipe` global
- [ ] Agregar decoradores de validación en todos los DTOs de todos los módulos
- [ ] Escribir tests de integración para flujo completo de solicitud banco (envío → contraoferta → aceptación)
- [ ] Escribir tests de integración para flujo completo de negociación inversor (oferta → contraoferta → rechazo → proyecto publicado)
- [ ] Escribir tests de autenticación: registro, login, acceso denegado por rol incorrecto, banco suspendido
- [ ] Configurar proyecto en Railway con servicio PostgreSQL y servicio API
- [ ] Configurar proyecto en Vercel con variables de entorno del frontend
- [ ] Configurar `NEXTAUTH_URL` y `NEXT_PUBLIC_API_URL` para apuntar al backend en Railway
- [ ] Verificar flujos críticos en entorno de producción antes de entregar

**Relevant Context**
- Los jobs de expiración (solicitudes y negociaciones vencidas) deben ejecutarse también en producción; configurar como cron job en Railway
- Usar `@nestjs/testing` y `supertest` para tests de integración del API

---

---

## Documentación de Pantallas — Diseño Visual

### Herramientas Globales (presentes en todas las pantallas con sesión activa)

**Barra de búsqueda**
Ubicada arriba a la derecha. Permite buscar bancos por nombre institucional y proyectos por título o sector. Muestra resultados en tiempo real mientras el usuario escribe.

**Barra de navegación**
4 botones:
- **Inicio** — regresa a la pantalla principal o la actualiza con contenido reciente
- **Perfil** — accede al perfil del usuario autenticado
- **Nosotros** — información sobre la plataforma, colaboradores y objetivo
- **Contacto** — teléfono, email y redes sociales de la plataforma

---

### Pantalla 1 — Selección de Rol (única vez al registrarse)
Aparece una sola vez inmediatamente después del primer registro. Presenta 3 opciones visuales con imagen representativa: **Banco**, **Empresa** y **Cliente**. Al seleccionar, la pantalla no vuelve a mostrarse y el correo queda vinculado al rol permanentemente. El token que recibió el usuario ya define el rol; esta pantalla lo confirma visualmente.

### Pantalla 2 — Landing Pública
Pantalla de bienvenida con título "Desarrollo de Empresas de México" y texto "¿Tienes dificultades para encontrar una primera inversión?". Contiene:
- Botón **Registrarme** → pantalla de creación de cuenta
- Botón **Iniciar Sesión** → pantalla de login
- Barra de navegación accesible sin login (Nosotros, Contacto)
- Fondo personalizable por el programador

### Pantalla 3 — Iniciar Sesión
Dos variantes según rol:
- **Empresa y Banco** — solicita ID y contraseña (e.Firma o credencial institucional)
- **Inversor** — solicita correo electrónico y contraseña (o Passkey biométrico)

Incluye enlaces: *¿Olvidaste tu contraseña?* y *¿Olvidaste tu usuario?*

### Pantalla 4 — Crear Cuenta
Formulario con campos según rol:

**Empresa y Banco:** RFC, Dirección, Teléfono, Correo electrónico, Código de creación de cuenta (token del Admin), Dirección de la empresa/institución

**Inversor:** Correo electrónico, Contraseña, RFC, Teléfono, Ciudad

### Pantalla 5 — Inicio (dashboard con sesión activa)
Pantalla principal del dashboard con 3 filtros tipo botón que se iluminan al seleccionarse:
- **Empresa** — muestra proyectos publicados por empresas buscando inversión
- **Banco** — muestra propuestas activas de bancos
- **Inversor** — muestra perfiles de inversionistas activos

Por defecto se activa el filtro del rol del usuario logueado.

Cada tarjeta de proyecto muestra: nombre empresa, inversión semilla (banco que invirtió), inversión pública (total inversionistas independientes), monto acumulado, número de inversionistas.

### Pantalla 6 — Perfil de Empresa
Datos del perfil: Nombre, ID, RFC, Dirección. Incluye lista de proyectos publicados y botón **Agregar** para crear nuevo proyecto.

### Pantalla 7 — Perfil de Inversor
Datos del perfil: Nombre, ID, RFC, Dirección. Incluye lista "Mis inversiones" y tarjetas de proyectos disponibles.

### Pantalla 8 — Perfil de Banco
Datos del perfil: Nombre institucional, ID, RFC, Dirección. Incluye lista "Mis inversiones" y botones **Proponer** y **Solicitar**.

### Pantalla 9 — Vista Detalle de Proyecto
Descripción completa, inversión semilla, inversión pública, monto y número de inversionistas. Contacto: Gmail, Teléfono, Redes Sociales, Ubicación. Pestañas: Propuesta / Información / Datos. Botón **Aceptar Propuesta**.

### Pantalla 10 — Vista Detalle de Banco
Nombre institucional, descripción de propuesta, contacto. Pestañas: Propuesta / Información / Datos. Botones **Proponer** y **Solicitar**.

### Pantalla 11 — Crear Proyecto / Crear Propuesta
Formulario con: Texto descriptivo, Información adicional, Link externo del proyecto, Link de Facebook/redes sociales.

### Pantalla 12 — Nosotros
Descripción del objetivo de la plataforma. Información de contacto: Teléfono, Gmail, Redes Sociales.

### Pantalla 13 — ChatBot
Asistente de IA flotante accesible desde cualquier pantalla con sesión activa. Varía según el rol y responde dentro de los permisos de ese rol.

### Pantalla 14 — Propuestas Recibidas
Lista de propuestas u ofertas recibidas. Cada entrada muestra: De / Para, fecha y hora, mensaje, botón **Iniciar negociación**, botón **Rechazar propuesta**, flecha de expansión para ver detalle.

### Pantalla 15 — Chat de Negociación
Historial de mensajes del hilo de negociación. Campo de texto **Escribir:**, botón **Guardar**, botón **Enviar**, fecha y hora de cada mensaje.

### Pantalla 16 — Propuestas a Enviar
Lista de propuestas redactadas por el usuario. Cada entrada muestra: De / Para, fecha, botón **Eliminar**, botón **Guardar**, botón **Enviar**.

---

## Autenticación Avanzada por Rol

### Perfil: Empresas (Corporate / B2B)

**Modo de Autenticación Principal — e.Firma SAT (PKI):**
- Subida del Certificado Público (.cer)
- Subida de la Llave Privada (.key)
- Contraseña de la llave privada

**Validaciones en Backend:**
- Comprobación matemática de la cadena de confianza con el Certificado Raíz del SAT
- Extracción automática del RFC corporativo y Razón Social desde el .cer
- Verificación del estatus contra la Lista de Certificados Revocados (LCR)

**Control de Acceso:**
- MFA Obligatorio: Código TOTP dinámico (Google Authenticator, Microsoft Authenticator o YubiKey)
- RBAC interno: separación de permisos dentro del panel (Rol Lectura/Finanzas, Rol Firmante/Representante Legal, Rol Operador)

---

### Perfil: Inversores Independientes (Personas Físicas / Retail)

**Modo de Autenticación Principal (el usuario elige):**
- **Passkeys / WebAuthn (Recomendado):** Login biométrico directo desde el dispositivo (FaceID, Huella dactilar, Windows Hello o PIN)
- **Credencial Tradicional + MFA:** Email/Usuario + Contraseña mínimo 12 caracteres (mayúsculas, minúsculas, números y símbolos)

**Seguridad Obligatoria:**
- 2FA/MFA: Aplicación de autenticación TOTP (se desaconseja SMS por riesgo de SIM Swapping)
- Verificación de Dispositivo Conocido: si el login se detecta desde navegador o ubicación inusual, se envía notificación Push o magic link al correo registrado

**Prerrequisito para Operar (Post-Login):**
- Estatus KYC Validado: para ejecutar transacciones la cuenta debe haber completado análisis de documento de identidad (INE/Pasaporte) con prueba de vida (liveness test)

---

### Perfil: Bancos e Instituciones Financieras (Institutional)

**Modo de Autenticación Principal:**
- Autenticación Mutua TLS (mTLS): verificación técnica a nivel de red donde la plataforma y la infraestructura del banco validan mutuamente sus certificados SSL/TLS antes de mostrar el login
- Credenciales de Alta Seguridad: ID institucional + Contraseña compleja o Token criptográfico de hardware

**Seguridad Perimetral:**
- IP Whitelisting: solo se permite acceso desde rangos de IPs estáticas institucionales previamente registradas
- Tokens de sesión JWT con firmas DPoP, expiración máxima 3-5 minutos
- Cierre de sesión automático por inactividad
- Bloqueo inmediato ante cualquier cambio de IP o alteración de cabeceras HTTP

---

### Capas Transversales de Seguridad (Todos los Roles)

- **Autenticación Adaptativa:** evaluación en tiempo real de patrones de comportamiento (horario, ubicación, tipo de dispositivo)
- **Protección contra Fuerza Bruta:** bloqueo temporal de cuenta/IP tras 3-5 intentos fallidos consecutivos
- **Cifrado en Tránsito y Reposo:** HTTPS con TLS 1.3 y directivas HSTS activas

---

### Sub-Tarea 13 — Autenticación Avanzada por Rol

**Estado:** [ ] pending

**Intent**
Reemplazar el sistema de autenticación base JWT/bcrypt por los mecanismos de seguridad específicos de cada rol: e.Firma SAT para empresas, Passkeys/WebAuthn para inversores y mTLS con IP Whitelist para bancos. Agregar capas transversales de seguridad.

**Expected Outcomes**
- Empresas se autentican subiendo su certificado .cer y llave .key con validación contra SAT
- Inversores pueden usar Passkey biométrico o email+contraseña con TOTP
- Bancos usan mTLS con restricción por IP Whitelist y tokens DPoP de 3-5 min
- Rate limiting activo en todos los endpoints de autenticación
- TLS 1.3 + HSTS configurado en producción

**Todo List**
- [ ] Implementar parser de e.Firma SAT: recibir .cer y .key, validar cadena de confianza, extraer RFC y Razón Social
- [ ] Integrar verificación contra LCR (Lista de Certificados Revocados) del SAT
- [ ] Implementar TOTP MFA con `otplib` para empresas y como opción para inversores
- [ ] Implementar WebAuthn/Passkeys con `@simplewebauthn/server` para inversores
- [ ] Implementar verificación de dispositivo conocido: guardar huella de navegador+IP, enviar magic link si cambia
- [ ] Implementar flujo KYC básico para inversores: subida de INE/Pasaporte y marcado de estatus validado
- [ ] Implementar IP Whitelist para bancos: tabla `banco_ips_autorizadas` en BD, validar en cada request
- [ ] Configurar tokens JWT DPoP de 3-5 min para sesiones de banco
- [ ] Agregar cierre de sesión automático por inactividad para bancos
- [ ] Implementar rate limiting con `@nestjs/throttler`: max 5 intentos por IP en 15 minutos
- [ ] Configurar TLS 1.3 y cabeceras HSTS en deploy de Railway/Vercel
- [ ] Agregar RBAC interno de empresa: sub-roles Lectura, Firmante, Operador dentro del mismo perfil de empresa

**Relevant Context**
- La validación de e.Firma requiere acceso al Certificado Raíz del SAT (descargable de sat.gob.mx)
- WebAuthn funciona solo en HTTPS — no funciona en localhost sin configuración especial
- El IP Whitelisting de bancos se gestiona desde el panel Admin

---

### Sub-Tarea 14 — Frontend Completo (ST-10 ampliada)

**Estado:** [ ] pending

**Intent**
Construir las 16 pantallas del diseño visual con Next.js 14, conectadas al backend completo, incluyendo los nuevos flujos de autenticación por rol, barra de búsqueda global, filtros del inicio, chat de negociación y ChatBot flotante.

**Expected Outcomes**
- Las 16 pantallas del diseño implementadas y funcionales
- Autenticación visual diferenciada por rol (e.Firma para empresa, Passkey para inversor, mTLS para banco)
- Pantalla de selección de rol que aparece una sola vez post-registro
- Filtros Empresa/Banco/Inversor en el inicio con botón iluminado activo
- Tarjetas de proyecto con inversión semilla, inversión pública y contador de inversionistas
- Chat de negociación funcional entre las partes
- ChatBot flotante en todos los dashboards
- Barra de búsqueda global con resultados en tiempo real
- Badge de notificaciones con polling cada 30 segundos

**Todo List**
- [ ] Pantalla 1: Selección de rol visual (Banco/Empresa/Cliente) — mostrar una sola vez con flag en localStorage + BD
- [ ] Pantalla 2: Landing pública con fondo personalizable, botones Registrarme/Iniciar Sesión
- [ ] Pantalla 3: Login diferenciado por rol (e.Firma uploader para empresa, Passkey/email para inversor, credencial institucional para banco)
- [ ] Pantalla 4: Crear cuenta con formulario según rol + campo de token del Admin
- [ ] Pantalla 5: Inicio con filtros Empresa/Banco/Inversor iluminados, tarjetas con inversión semilla e inversión pública
- [ ] Pantalla 6: Perfil Empresa con lista de proyectos y botón Agregar
- [ ] Pantalla 7: Perfil Inversor con Mis inversiones y tarjetas disponibles
- [ ] Pantalla 8: Perfil Banco con Mis inversiones, botones Proponer y Solicitar
- [ ] Pantalla 9: Vista detalle de proyecto con pestañas Propuesta/Información/Datos y botón Aceptar Propuesta
- [ ] Pantalla 10: Vista detalle de banco con botones Proponer y Solicitar
- [ ] Pantalla 11: Formulario Crear Proyecto/Propuesta con campo de redes sociales y link externo
- [ ] Pantalla 12: Sección Nosotros con descripción de la plataforma y datos de contacto
- [ ] Pantalla 13: ChatBot flotante con historial de sesión por rol
- [ ] Pantalla 14: Propuestas Recibidas con botones Iniciar negociación y Rechazar
- [ ] Pantalla 15: Chat de Negociación con historial de mensajes, campo Escribir, botones Guardar/Enviar
- [ ] Pantalla 16: Propuestas a Enviar con botones Eliminar/Guardar/Enviar
- [ ] Componente `<BarraBusqueda />` global con resultados en tiempo real
- [ ] Componente `<NotificacionesBadge />` con polling cada 30 segundos
- [ ] Middleware Next.js que redirige por rol al dashboard correcto post-login

**Relevant Context**
- Usar shadcn/ui para tablas, formularios, badges, dialogs, toasts y tabs
- El campo "Donadores" del PDF se mapea a `total_invertido` e inversionistas en el modelo de datos
- Los links de redes sociales del formulario de proyecto requieren agregar campo `redes_url` en la tabla `proyectos` de Prisma

---

## Orden de Ejecución Actualizado

```
ST-1 → ST-2 → ST-3 → ST-4 → ST-5 → ST-6 → ST-7 → ST-8 → ST-9 → ST-11
                                                                      ↓
                                                              ST-13 (Auth avanzada)
                                                                      ↓
                                                              ST-14 (Frontend completo)
                                                                      ↓
                                                              ST-12 (Testing y Deploy)
```
