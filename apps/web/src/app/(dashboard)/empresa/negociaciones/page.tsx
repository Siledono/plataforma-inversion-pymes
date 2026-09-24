'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Negociacion {
  id: string
  estado: string
  montoOfertado: number
  montoContraoferta?: number
  tipo: string
  expiraEn?: string
  proyecto: { id: string; titulo: string }
  inversor: { nombreCompleto: string }
}

// Pantalla 14 — Propuestas Recibidas (negociaciones activas para la empresa)
export default function EmpresaNegociacionesPage() {
  const [negociaciones, setNegociaciones] = useState<Negociacion[]>([])
  const [loading, setLoading] = useState(true)
  const [contraoferta, setContraoferta] = useState<Record<string, number>>({})

  useEffect(() => {
    api.get<Negociacion[]>('/negociaciones').then((d) => { setNegociaciones(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const responder = async (id: string, accion: 'aceptar' | 'rechazar' | 'contraofertar', monto?: number) => {
    await api.patch(`/negociaciones/${id}/empresa-responde`, {
      accion,
      ...(monto ? { montoContraoferta: monto } : {}),
    })
    setNegociaciones((prev) => prev.map((n) => n.id === id ? { ...n, estado: accion === 'aceptar' ? 'aceptada' : accion === 'rechazar' ? 'rechazada' : 'contraoferta' } : n))
  }

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    contraoferta: 'bg-orange-100 text-orange-700',
    aceptada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    expirada: 'bg-gray-100 text-gray-500',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Negociaciones Recibidas</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : negociaciones.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-gray-500">No tienes negociaciones activas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {negociaciones.map((n) => (
            <div key={n.id} className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-800">{n.proyecto.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[n.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {n.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">De: {n.inversor.nombreCompleto}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Oferta: <strong>${Number(n.montoOfertado).toLocaleString()}</strong>
                    {n.montoContraoferta && <> → Contraoferta: <strong>${Number(n.montoContraoferta).toLocaleString()}</strong></>}
                    <span className="ml-2 capitalize text-gray-400">({n.tipo})</span>
                  </p>
                  {n.expiraEn && <p className="text-xs text-orange-500 mt-1">⏰ Expira: {new Date(n.expiraEn).toLocaleString('es-MX')}</p>}
                </div>
              </div>

              {n.estado === 'pendiente' && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => responder(n.id, 'aceptar')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                    ✅ Aceptar oferta
                  </button>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Tu contraoferta $"
                      value={contraoferta[n.id] ?? ''}
                      onChange={(e) => setContraoferta((prev) => ({ ...prev, [n.id]: Number(e.target.value) }))}
                      className="border rounded-lg px-3 py-2 text-sm w-36 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => contraoferta[n.id] && responder(n.id, 'contraofertar', contraoferta[n.id])}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      🤝 Contraofertar
                    </button>
                  </div>
                  <button onClick={() => responder(n.id, 'rechazar')} className="border text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
                    ✕ Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
