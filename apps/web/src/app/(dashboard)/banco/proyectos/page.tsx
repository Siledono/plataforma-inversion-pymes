'use client'
import { useState, useEffect } from 'react'
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
  empresa: { nombreEmpresa: string; rfc: string }
}

export default function BancoProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Proyecto[]>('/proyectos').then((d) => { setProyectos(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const estadoColor: Record<string, string> = {
    publicado: 'bg-green-100 text-green-700',
    en_revision_banco: 'bg-yellow-100 text-yellow-700',
    financiado_banco: 'bg-blue-100 text-blue-700',
    financiado_total: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Proyectos en la Plataforma</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando proyectos...</div>
      ) : proyectos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">No hay proyectos disponibles aun</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {proyectos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-semibold text-gray-800">{p.titulo}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[p.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{p.empresa.nombreEmpresa} · RFC: {p.empresa.rfc}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.descripcion}</p>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>Solicitud: ${Number(p.montoMin).toLocaleString()} - ${Number(p.montoMax).toLocaleString()}</span>
                    <span>Invertido: ${Number(p.totalInvertido).toLocaleString()}</span>
                    <span className="capitalize">{p.tipoFinanciamiento}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
