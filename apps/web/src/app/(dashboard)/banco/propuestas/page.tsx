'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Propuesta {
  id: string
  estado: string
  tasaInteresAnual: number
  plazoMeses: number
  montoAprobado: number
  condiciones?: string
  createdAt: string
  proyecto: { titulo: string; empresa: { nombreEmpresa: string } }
}

export default function BancoPropuestasPage() {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Propuesta[]>('/bancos/propuestas').then((d) => { setPropuestas(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const estadoColor: Record<string, string> = {
    enviada: 'bg-blue-100 text-blue-700',
    aceptada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    contraoferta: 'bg-orange-100 text-orange-700',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Propuestas Enviadas</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando propuestas...</div>
      ) : propuestas.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-3">📤</div>
          <p className="text-gray-500">No has enviado propuestas aun</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {propuestas.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-800">{p.proyecto.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[p.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{p.proyecto.empresa.nombreEmpresa}</p>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>Monto aprobado: <strong>${Number(p.montoAprobado).toLocaleString()}</strong></span>
                    <span>Tasa: <strong>{p.tasaInteresAnual}% anual</strong></span>
                    <span>Plazo: <strong>{p.plazoMeses} meses</strong></span>
                  </div>
                  {p.condiciones && <p className="text-xs text-gray-500 mt-1">Condiciones: {p.condiciones}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString('es-MX')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
