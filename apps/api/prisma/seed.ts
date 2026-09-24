import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const passwordHash = await bcrypt.hash('Admin123!', 10)

  // ─── Admin ───────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@economia.gob.mx' },
    update: {},
    create: {
      email: 'admin@economia.gob.mx',
      passwordHash,
      rol: 'admin',
      activo: true,
    },
  })
  console.log('✅ Admin creado:', admin.email)

  // ─── Banco de prueba ─────────────────────────────────────
  const bancoPrueba = await prisma.user.upsert({
    where: { email: 'gestor@bbva.com.mx' },
    update: {},
    create: {
      email: 'gestor@bbva.com.mx',
      passwordHash,
      rol: 'banco',
      activo: true,
      banco: {
        create: {
          nombreInstitucional: 'BBVA México',
          claveBanxico: 'BCMRMXMM',
          contactoGestor: 'Juan García',
          rfc: 'BBV930209UP3',
          suspendido: false,
        },
      },
    },
    include: { banco: true },
  })
  console.log('✅ Banco creado:', bancoPrueba.email)

  // ─── Empresa de prueba ───────────────────────────────────
  const empresaPrueba = await prisma.user.upsert({
    where: { email: 'contacto@cafmex.com' },
    update: {},
    create: {
      email: 'contacto@cafmex.com',
      passwordHash,
      rol: 'empresa',
      activo: true,
      empresa: {
        create: {
          nombreEmpresa: 'Café de México',
          rfc: 'CMX200101AB1',
          sectorScian: '722',
          aniosOperacion: 3,
          numEmpleados: 12,
          ingresosAnuales: 850000,
          deudasActuales: 120000,
        },
      },
    },
    include: { empresa: true },
  })
  console.log('✅ Empresa creada:', empresaPrueba.email)

  // ─── Inversionista de prueba ─────────────────────────────
  const inversorPrueba = await prisma.user.upsert({
    where: { email: 'melanie@inversiones.mx' },
    update: {},
    create: {
      email: 'melanie@inversiones.mx',
      passwordHash,
      rol: 'inversor',
      activo: true,
      inversor: {
        create: {
          nombreCompleto: 'Melanie Hernández',
          rfcCurp: 'HEM900101MDFRRN09',
          capitalDisponible: 500000,
          preferencia: 'ambos',
          sectoresInteres: '722,461,519',
        },
      },
    },
    include: { inversor: true },
  })
  console.log('✅ Inversor creado:', inversorPrueba.email)

  // ─── Propuesta de banco de prueba ────────────────────────
  const banco = await prisma.banco.findFirst({ where: { rfc: 'BBV930209UP3' } })
  if (banco) {
    await prisma.propuestaBanco.upsert({
      where: { id: 'seed-propuesta-bbva' },
      update: {},
      create: {
        id: 'seed-propuesta-bbva',
        bancoId: banco.id,
        nombre: 'Crédito PyME BBVA',
        requisitos: 'Empresa con mínimo 1 año de operación, RFC activo, estados financieros',
        montoFijo: 300000,
        tasaInteres: 12.5,
        activa: true,
      },
    })
    console.log('✅ Propuesta de banco creada')
  }

  console.log('🌱 Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
