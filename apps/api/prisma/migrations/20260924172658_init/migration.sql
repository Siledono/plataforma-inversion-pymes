-- CreateEnum
CREATE TYPE "UserRol" AS ENUM ('empresa', 'banco', 'inversor', 'admin');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('borrador', 'publicado', 'en_revision_banco', 'financiado_banco', 'financiado_inversor', 'financiado_total', 'eliminado');

-- CreateEnum
CREATE TYPE "TipoFinanciamiento" AS ENUM ('acciones', 'prestamo', 'ambos');

-- CreateEnum
CREATE TYPE "EstadoSolicitudBanco" AS ENUM ('en_revision', 'aceptada', 'rechazada', 'contraoferta_pendiente', 'expirada');

-- CreateEnum
CREATE TYPE "EstadoNegociacion" AS ENUM ('pendiente', 'contraoferta', 'aceptada', 'rechazada', 'expirada');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('oferta_recibida', 'contraoferta', 'proyecto_aceptado');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "UserRol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "sector_scian" TEXT NOT NULL,
    "anios_operacion" INTEGER NOT NULL,
    "num_empleados" INTEGER NOT NULL,
    "ingresos_anuales" DECIMAL(65,30) NOT NULL,
    "deudas_actuales" DECIMAL(65,30) NOT NULL,
    "documento_url" TEXT,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bancos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nombre_institucional" TEXT NOT NULL,
    "clave_banxico" TEXT NOT NULL,
    "contacto_gestor" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "suspendido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inversores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "rfc_curp" TEXT NOT NULL,
    "capital_disponible" DECIMAL(65,30) NOT NULL,
    "preferencia" "TipoFinanciamiento" NOT NULL,
    "sectores_interes" TEXT NOT NULL,

    CONSTRAINT "inversores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto_min" DECIMAL(65,30) NOT NULL,
    "monto_max" DECIMAL(65,30) NOT NULL,
    "porcentaje_acciones" DECIMAL(65,30),
    "tipo_financiamiento" "TipoFinanciamiento" NOT NULL,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'borrador',
    "total_invertido" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propuestas_banco" (
    "id" TEXT NOT NULL,
    "banco_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL,
    "monto_fijo" DECIMAL(65,30) NOT NULL,
    "tasa_interes" DECIMAL(65,30) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "propuestas_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_banco" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "propuesta_banco_id" TEXT NOT NULL,
    "estado" "EstadoSolicitudBanco" NOT NULL DEFAULT 'en_revision',
    "contraoferta_detalle" TEXT,
    "expira_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negociaciones" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "inversor_id" TEXT NOT NULL,
    "monto_ofertado" DECIMAL(65,30) NOT NULL,
    "monto_contraoferta" DECIMAL(65,30),
    "tipo" "TipoFinanciamiento" NOT NULL,
    "estado" "EstadoNegociacion" NOT NULL DEFAULT 'pendiente',
    "expira_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negociaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_contenido" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "archivo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_contenido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_registro" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rol_destino" "UserRol" NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_por_admin_id" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_por_user_id" TEXT,

    CONSTRAINT "tokens_registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_user_id_key" ON "empresas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rfc_key" ON "empresas"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "bancos_user_id_key" ON "bancos"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bancos_rfc_key" ON "bancos"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "inversores_user_id_key" ON "inversores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_registro_token_key" ON "tokens_registro"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_registro_usado_por_user_id_key" ON "tokens_registro"("usado_por_user_id");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bancos" ADD CONSTRAINT "bancos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inversores" ADD CONSTRAINT "inversores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas_banco" ADD CONSTRAINT "propuestas_banco_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_banco" ADD CONSTRAINT "solicitudes_banco_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_banco" ADD CONSTRAINT "solicitudes_banco_propuesta_banco_id_fkey" FOREIGN KEY ("propuesta_banco_id") REFERENCES "propuestas_banco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negociaciones" ADD CONSTRAINT "negociaciones_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negociaciones" ADD CONSTRAINT "negociaciones_inversor_id_fkey" FOREIGN KEY ("inversor_id") REFERENCES "inversores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_registro" ADD CONSTRAINT "tokens_registro_creado_por_admin_id_fkey" FOREIGN KEY ("creado_por_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_registro" ADD CONSTRAINT "tokens_registro_usado_por_user_id_fkey" FOREIGN KEY ("usado_por_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
