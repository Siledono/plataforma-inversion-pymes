'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Proyecto {
  id: string
  titulo: string
  descripcion: string
  estado: string
  montoMin: number
  montoMax: number
  totalInvertido: number
  tipoFinanciamiento: string
  createdAt: string
}

// Pantalla 5+6 — Dashboard Empresa: lista de proyectos
export default function EmpresaProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'empresa' | 'banco' | 'inversor'>('empresa')

  useEffect(() => {
    api.get<Proyecto[]>('/proyectos/mis-proyectos').then((data) => {
      setProyectos(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const estadoColor: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-600',
    publicado: 'bg-green-100 text-green-700',
    en_revision_banco: 'bg-yellow-100 text-yellow-700',
    financiado_banco: 'bg-blue-100 text-blue-700',
    financiado_inversor: 'bg-purple-100 text-purple-700',
    financiado_total: 'bg-emerald-100 text-emerald-700',
    eliminado: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      {/* Filtros de rol — Pantalla 5 */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border w-fit">
        {(['empresa', 'banco', 'inversor'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFiltro(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filtro === r ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {r === 'empresa' ? '🏢 Empresa' : r === 'banco' ? '🏦 Banco' : '💼 Inversor'}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Proyectos</h1>
        <Link
          href="/empresa/proyectos/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
        >
          + Agregar Proyecto
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando proyectos...</div>
      ) : proyectos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 mb-4">No tienes proyectos aún</p>
          <Link href="/empresa/proyectos/nuevo" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Crear primer proyecto
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {proyectos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-gray-800">{p.titulo}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[p.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{p.descripcion}</p>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>💰 ${Number(p.montoMin).toLocaleString()} – ${Number(p.montoMax).toLocaleString()}</span>
                    <span>📊 Invertido: ${Number(p.totalInvertido).toLocaleString()}</span>
                    <span className="capitalize">📌 {p.tipoFinanciamiento}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/empresa/proyectos/${p.id}/editar`}
                    className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    Editar
                  </Link>
                  {p.estado === 'borrador' && (
                    <button
                      onClick={async () => {
                        await api.patch(`/proyectos/${p.id}/publicar`)
                        setProyectos((prev) => prev.map((x) => x.id === p.id ? { ...x, estado: 'publicado' } : x))
                      }}
                      className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Publicar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
