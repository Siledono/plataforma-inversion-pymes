-- CreateEnum
CREATE TYPE "KycEstado" AS ENUM ('pendiente', 'en_revision', 'aprobado', 'rechazado');

-- CreateEnum
CREATE TYPE "SubRolEmpresaTipo" AS ENUM ('lectura', 'firmante', 'operador');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "webauthn_challenge" TEXT;

-- CreateTable
CREATE TABLE "mfa_secrets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_inversores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "estado" "KycEstado" NOT NULL DEFAULT 'pendiente',
    "documento_url" TEXT,
    "liveness_url" TEXT,
    "revisado_por_admin" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_inversores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos_conocidos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_hash" TEXT NOT NULL,
    "nombre" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivos_conocidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_whitelist_banco" (
    "id" TEXT NOT NULL,
    "banco_id" TEXT NOT NULL,
    "cidr" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_whitelist_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "exitoso" BOOLEAN NOT NULL DEFAULT false,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_banco" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "device_type" TEXT,
    "nombre" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "efirma_empresas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rfc_extraido" TEXT NOT NULL,
    "razon_social_extraida" TEXT NOT NULL,
    "serial_certificado" TEXT NOT NULL,
    "vigencia_desde" TIMESTAMP(3) NOT NULL,
    "vigencia_hasta" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "efirma_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_roles_empresa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sub_rol" "SubRolEmpresaTipo" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_roles_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_secrets_user_id_key" ON "mfa_secrets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_inversores_user_id_key" ON "kyc_inversores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_conocidos_user_id_device_hash_key" ON "dispositivos_conocidos"("user_id", "device_hash");

-- CreateIndex
CREATE UNIQUE INDEX "device_verification_tokens_token_key" ON "device_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "login_attempts_email_created_at_idx" ON "login_attempts"("email", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_ip_created_at_idx" ON "login_attempts"("ip", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_banco_access_token_key" ON "sesiones_banco"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_credentials_credential_id_key" ON "webauthn_credentials"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "efirma_empresas_user_id_key" ON "efirma_empresas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_roles_empresa_user_id_sub_rol_key" ON "sub_roles_empresa"("user_id", "sub_rol");

-- AddForeignKey
ALTER TABLE "mfa_secrets" ADD CONSTRAINT "mfa_secrets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_inversores" ADD CONSTRAINT "kyc_inversores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos_conocidos" ADD CONSTRAINT "dispositivos_conocidos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_verification_tokens" ADD CONSTRAINT "device_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_whitelist_banco" ADD CONSTRAINT "ip_whitelist_banco_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_banco" ADD CONSTRAINT "sesiones_banco_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efirma_empresas" ADD CONSTRAINT "efirma_empresas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_roles_empresa" ADD CONSTRAINT "sub_roles_empresa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
