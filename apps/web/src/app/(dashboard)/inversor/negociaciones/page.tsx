'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Negociacion {
  id: string; estado: string; montoOfertado: number; montoContraoferta?: number; tipo: string; expiraEn?: string
  proyecto: { titulo: string }
}

// Pantalla 15+16 — Negociaciones del Inversor
export default function InversorNegociacionesPage() {
  const [negs, setNegs] = useState<Negociacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Negociacion[]>('/negociaciones').then((d) => { setNegs(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const responder = async (id: string, accion: 'aceptar' | 'rechazar') => {
    await api.patch(`/negociaciones/${id}/inversor-responde`, { accion })
    setNegs((prev) => prev.map((n) => n.id === id ? { ...n, estado: accion === 'aceptar' ? 'aceptada' : 'rechazada' } : n))
  }

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700', contraoferta: 'bg-orange-100 text-orange-700',
    aceptada: 'bg-green-100 text-green-700', rechazada: 'bg-red-100 text-red-700', expirada: 'bg-gray-100 text-gray-500',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Negociaciones</h1>
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div> : negs.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center"><div className="text-4xl mb-3">📤</div><p className="text-gray-500">Sin negociaciones activas</p></div>
      ) : (
        <div className="grid gap-4">
          {negs.map((n) => (
            <div key={n.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-800">{n.proyecto.titulo}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[n.estado]}`}>{n.estado}</span>
              </div>
              <p className="text-sm text-gray-600">Mi oferta: <strong>${Number(n.montoOfertado).toLocaleString()}</strong>
                {n.montoContraoferta && <> → Contraoferta empresa: <strong>${Number(n.montoContraoferta).toLocaleString()}</strong></>}
              </p>
              {n.expiraEn && <p className="text-xs text-orange-500 mt-1">⏰ Expira: {new Date(n.expiraEn).toLocaleString('es-MX')}</p>}
              {n.estado === 'contraoferta' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => responder(n.id, 'aceptar')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✅ Aceptar contraoferta</button>
                  <button onClick={() => responder(n.id, 'rechazar')} className="border text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">✕ Rechazar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
