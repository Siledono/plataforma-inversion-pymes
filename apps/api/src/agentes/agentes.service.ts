import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import OpenAI from 'openai'

// ─── Fórmula del Simulador de Riesgo ──────────────────────────────────────────
// score_anios     = normalizar(anios_operacion, 0, 20) * 0.30
// score_deuda     = (1 - deudas / ingresos) * 0.40
// score_sector    = tabla_volatilidad_sector[sector] * 0.20
// score_historial = normalizar(num_inversiones_previas, 0, 5) * 0.10
// riesgo_total    = 1 - (score_anios + score_deuda + score_sector + score_historial)

const VOLATILIDAD_SECTOR: Record<string, number> = {
  tecnologia: 0.7,
  manufactura: 0.5,
  comercio: 0.55,
  servicios: 0.6,
  agricultura: 0.45,
  construccion: 0.65,
  salud: 0.4,
  educacion: 0.35,
  turismo: 0.7,
  otros: 0.55,
}

function normalizar(valor: number, min: number, max: number): number {
  if (max === min) return 0
  return Math.max(0, Math.min(1, (valor - min) / (max - min)))
}

function calcularRiesgo(
  aniosOperacion: number,
  ingresosAnuales: number,
  deudasActuales: number,
  sectorScian: string,
  numInversionesPrevias: number,
): { porcentaje: number; nivel: 'Bajo' | 'Medio' | 'Alto' } {
  const scoreAnios = normalizar(aniosOperacion, 0, 20) * 0.3
  const scoreDeuda = ingresosAnuales > 0
    ? (1 - Math.min(1, deudasActuales / ingresosAnuales)) * 0.4
    : 0
  const volatilidad = VOLATILIDAD_SECTOR[sectorScian?.toLowerCase()] ?? 0.55
  const scoreSector = (1 - volatilidad) * 0.2
  const scoreHistorial = normalizar(numInversionesPrevias, 0, 5) * 0.1
  const puntaje = scoreAnios + scoreDeuda + scoreSector + scoreHistorial
  const riesgo = Math.round((1 - puntaje) * 100)

  let nivel: 'Bajo' | 'Medio' | 'Alto'
  if (riesgo <= 30) nivel = 'Bajo'
  else if (riesgo <= 60) nivel = 'Medio'
  else nivel = 'Alto'

  return { porcentaje: riesgo, nivel }
}

// ─── Definición de tools por rol ──────────────────────────────────────────────

const TOOLS_EMPRESA: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_banco',
      description: 'Busca información pública de un banco por nombre',
      parameters: {
        type: 'object',
        properties: { nombre: { type: 'string', description: 'Nombre del banco a buscar' } },
        required: ['nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_propuestas_activas',
      description: 'Lista todas las propuestas de banco activas disponibles',
      parameters: { type: 'object', properties: {} },
    },
  },
]

const TOOLS_INVERSOR_BANCO: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_proyecto',
      description: 'Busca información pública de un proyecto por ID o parte del título',
      parameters: {
        type: 'object',
        properties: { busqueda: { type: 'string', description: 'ID del proyecto o fragmento del título' } },
        required: ['busqueda'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calcular_riesgo',
      description: 'Calcula el score de riesgo de un proyecto usando la fórmula ponderada',
      parameters: {
        type: 'object',
        properties: { proyectoId: { type: 'string', description: 'ID del proyecto' } },
        required: ['proyectoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'historial_negociaciones',
      description: 'Obtiene el historial de negociaciones pasadas (aceptadas/rechazadas) de un proyecto',
      parameters: {
        type: 'object',
        properties: { proyectoId: { type: 'string', description: 'ID del proyecto' } },
        required: ['proyectoId'],
      },
    },
  },
]

const TOOLS_ADMIN: OpenAI.Chat.ChatCompletionTool[] = [
  ...TOOLS_EMPRESA,
  ...TOOLS_INVERSOR_BANCO,
  {
    type: 'function',
    function: {
      name: 'estadisticas_plataforma',
      description: 'Obtiene estadísticas generales de la plataforma',
      parameters: { type: 'object', properties: {} },
    },
  },
]

// ─── System prompts por rol ────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  empresa: `Eres el asistente de IA de Conecta Inversión para empresas (PyMEs).
Ayudas a la empresa a entender la plataforma, explorar opciones de financiamiento disponibles y gestionar sus proyectos.
Solo puedes proporcionar información pública de bancos e inversores. NUNCA reveles datos financieros privados de otras empresas.
Responde siempre en español, de manera profesional y concisa.`,

  banco: `Eres el asistente de IA de Conecta Inversión para instituciones bancarias.
Ayudas al banco a evaluar proyectos de PyMEs, calcular el riesgo de inversión y gestionar sus solicitudes.
Puedes calcular el score de riesgo de cualquier proyecto publicado. Los datos financieros privados solo son visibles si hay una solicitud activa.
Responde siempre en español, de manera profesional y concisa.`,

  inversor: `Eres el asistente de IA de Conecta Inversión para inversionistas independientes.
Ayudas al inversionista a descubrir proyectos de PyMEs, evaluar su riesgo y gestionar sus negociaciones.
Puedes calcular el score de riesgo de cualquier proyecto publicado. Los datos financieros privados solo son visibles si hay una negociación activa.
Responde siempre en español, de manera profesional y concisa.`,

  admin: `Eres el asistente de IA de Conecta Inversión para el equipo de la Secretaría de Economía.
Tienes acceso completo a información de la plataforma: estadísticas, usuarios, proyectos, propuestas y negociaciones.
Ayudas al equipo administrativo a supervisar la plataforma y tomar decisiones informadas.
Responde siempre en español, de manera profesional y concisa.`,
}

// ─── Servicio principal ────────────────────────────────────────────────────────

@Injectable()
export class AgentesService {
  private openai: OpenAI

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async chat(userId: string, rol: string, mensaje: string, historial: Array<{ role: string; content: string }> = []) {
    const tools = this.getToolsByRol(rol)
    const systemPrompt = SYSTEM_PROMPTS[rol] ?? SYSTEM_PROMPTS.empresa

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...historial.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: mensaje },
    ]

    // Primera llamada al modelo
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
    })

    const choice = response.choices[0]

    // Si el modelo quiere llamar a una función, ejecutarla y continuar
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      const toolResults: OpenAI.Chat.ChatCompletionMessageParam[] = [
        choice.message,
      ]

      for (const toolCall of choice.message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || '{}')
        const result = await this.ejecutarFunction(userId, rol, toolCall.function.name, args)

        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }

      // Segunda llamada con los resultados de las funciones
      const secondResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [...messages, ...toolResults],
      })

      return { respuesta: secondResponse.choices[0].message.content }
    }

    return { respuesta: choice.message.content }
  }

  // ─── Dispatcher de funciones ──────────────────────────────────────────────

  private async ejecutarFunction(userId: string, rol: string, nombre: string, args: any): Promise<any> {
    switch (nombre) {
      case 'buscar_banco':
        return this.fnBuscarBanco(args.nombre)
      case 'listar_propuestas_activas':
        return this.fnListarPropuestasActivas()
      case 'buscar_proyecto':
        return this.fnBuscarProyecto(userId, rol, args.busqueda)
      case 'calcular_riesgo':
        return this.fnCalcularRiesgo(userId, rol, args.proyectoId)
      case 'historial_negociaciones':
        return this.fnHistorialNegociaciones(userId, rol, args.proyectoId)
      case 'estadisticas_plataforma':
        return this.fnEstadisticas()
      default:
        return { error: 'Función no disponible' }
    }
  }

  // ─── Implementación de cada función ──────────────────────────────────────

  private async fnBuscarBanco(nombre: string) {
    const bancos = await this.prisma.banco.findMany({
      where: { nombreInstitucional: { contains: nombre, mode: 'insensitive' }, suspendido: false },
      select: {
        nombreInstitucional: true,
        claveBanxico: true,
        propuestas: {
          where: { activa: true },
          select: { nombre: true, montoFijo: true, tasaInteres: true },
        },
      },
    })
    return bancos
  }

  private async fnListarPropuestasActivas() {
    return this.prisma.propuestaBanco.findMany({
      where: { activa: true },
      include: {
        banco: { select: { nombreInstitucional: true } },
      },
      select: {
        id: true,
        nombre: true,
        montoFijo: true,
        tasaInteres: true,
        requisitos: true,
        banco: true,
      },
    })
  }

  private async fnBuscarProyecto(userId: string, rol: string, busqueda: string) {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        estado: { in: ['publicado', 'en_revision_banco'] },
        OR: [
          { id: busqueda },
          { titulo: { contains: busqueda, mode: 'insensitive' } },
        ],
      },
      include: {
        empresa: {
          select: {
            nombreEmpresa: true,
            sectorScian: true,
            aniosOperacion: true,
            numEmpleados: true,
          },
        },
      },
      take: 5,
    })
    return proyectos
  }

  private async fnCalcularRiesgo(userId: string, rol: string, proyectoId: string) {
    // Verificar que el proyecto existe
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: { empresa: true },
    })
    if (!proyecto) return { error: 'Proyecto no encontrado' }

    // Verificar si tiene relación activa para ver datos financieros
    let tieneAccesoPrivado = rol === 'admin'

    if (!tieneAccesoPrivado && rol === 'banco') {
      const bancoUser = await this.prisma.banco.findUnique({ where: { userId } })
      if (bancoUser) {
        const solicitudActiva = await this.prisma.solicitudBanco.findFirst({
          where: {
            proyectoId,
            propuestaBanco: { bancoId: bancoUser.id },
            estado: { in: ['en_revision', 'contraoferta_pendiente'] },
          },
        })
        tieneAccesoPrivado = !!solicitudActiva
      }
    }

    if (!tieneAccesoPrivado && rol === 'inversor') {
      const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
      if (inversor) {
        const negociacionActiva = await this.prisma.negociacion.findFirst({
          where: { proyectoId, inversorId: inversor.id, estado: { in: ['pendiente', 'contraoferta'] } },
        })
        tieneAccesoPrivado = !!negociacionActiva
      }
    }

    // Calcular con datos reales si tiene acceso, o con datos genéricos si no
    const anios = proyecto.empresa.aniosOperacion
    const ingresos = tieneAccesoPrivado ? Number(proyecto.empresa.ingresosAnuales) : 500000
    const deudas = tieneAccesoPrivado ? Number(proyecto.empresa.deudasActuales) : 100000
    const sector = proyecto.empresa.sectorScian

    // Contar inversiones previas del proyecto (negociaciones + solicitudes aceptadas)
    const inversionesPrevias = await this.prisma.negociacion.count({
      where: { proyectoId, estado: 'aceptada' },
    })

    const resultado = calcularRiesgo(anios, ingresos, deudas, sector, inversionesPrevias)

    return {
      proyecto: proyecto.titulo,
      riesgo: resultado,
      nota: tieneAccesoPrivado
        ? 'Calculado con datos financieros reales'
        : 'Calculado con datos estimados (sin relación activa con el proyecto)',
    }
  }

  private async fnHistorialNegociaciones(userId: string, rol: string, proyectoId: string) {
    if (rol === 'admin') {
      return this.prisma.negociacion.findMany({
        where: { proyectoId, estado: { in: ['aceptada', 'rechazada', 'expirada'] } },
        select: {
          estado: true, montoOfertado: true, montoContraoferta: true, tipo: true, createdAt: true,
        },
      })
    }

    // Para inversor: solo su propio historial
    if (rol === 'inversor') {
      const inversor = await this.prisma.inversor.findUnique({ where: { userId } })
      if (!inversor) return { error: 'Perfil no encontrado' }
      return this.prisma.negociacion.findMany({
        where: { proyectoId, inversorId: inversor.id, estado: { in: ['aceptada', 'rechazada', 'expirada'] } },
        select: { estado: true, montoOfertado: true, montoContraoferta: true, tipo: true, createdAt: true },
      })
    }

    // Para banco: historial de solicitudes del proyecto
    const banco = await this.prisma.banco.findUnique({ where: { userId } })
    if (!banco) return { error: 'Perfil no encontrado' }
    return this.prisma.solicitudBanco.findMany({
      where: {
        proyectoId,
        propuestaBanco: { bancoId: banco.id },
        estado: { in: ['aceptada', 'rechazada', 'expirada'] },
      },
      select: { estado: true, contraofertaDetalle: true, createdAt: true },
    })
  }

  private async fnEstadisticas() {
    const [empresas, proyectos, financiados, bancos, inversores] = await Promise.all([
      this.prisma.empresa.count(),
      this.prisma.proyecto.count({ where: { estado: { not: 'eliminado' } } }),
      this.prisma.proyecto.count({ where: { estado: { in: ['financiado_banco', 'financiado_inversor', 'financiado_total'] } } }),
      this.prisma.banco.count({ where: { suspendido: false } }),
      this.prisma.inversor.count(),
    ])

    const montoTotal = await this.prisma.proyecto.aggregate({
      _sum: { totalInvertido: true },
      where: { estado: { in: ['financiado_banco', 'financiado_inversor', 'financiado_total'] } },
    })

    return {
      empresasRegistradas: empresas,
      proyectosPublicados: proyectos,
      financiamientosCompletados: financiados,
      bancosActivos: bancos,
      inversoresRegistrados: inversores,
      montoTotalMovilizado: montoTotal._sum.totalInvertido ?? 0,
    }
  }

  // ─── Helper: tools por rol ────────────────────────────────────────────────

  private getToolsByRol(rol: string): OpenAI.Chat.ChatCompletionTool[] {
    switch (rol) {
      case 'empresa': return TOOLS_EMPRESA
      case 'banco': return TOOLS_INVERSOR_BANCO
      case 'inversor': return TOOLS_INVERSOR_BANCO
      case 'admin': return TOOLS_ADMIN
      default: return []
    }
  }
}
