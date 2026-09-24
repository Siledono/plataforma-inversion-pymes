'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Solicitud {
  id: string
  estado: string
  montoSolicitado: number
  plazoMeses: number
  tasaInteresAnual?: number
  createdAt: string
  proyecto: { titulo: string; empresa: { nombreEmpresa: string; rfc: string } }
}

export default function BancoSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get<Solicitud[]>('/bancos/solicitudes').then((d) => { setSolicitudes(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const responder = async (id: string, accion: 'aprobar' | 'rechazar', tasa?: number) => {
    setProcesando((p) => ({ ...p, [id]: true }))
    try {
      await api.patch(`/bancos/solicitudes/${id}/${accion}`, tasa ? { tasaInteresAnual: tasa } : {})
      setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, estado: accion === 'aprobar' ? 'aprobada' : 'rechazada' } : s))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcesando((p) => ({ ...p, [id]: false }))
    }
  }

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Solicitudes de Financiamiento</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-3">📨</div>
          <p className="text-gray-500">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-800">{s.proyecto.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {s.proyecto.empresa.nombreEmpresa} · RFC: {s.proyecto.empresa.rfc}
                  </p>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>Monto: <strong>${Number(s.montoSolicitado).toLocaleString()}</strong></span>
                    <span>Plazo: <strong>{s.plazoMeses} meses</strong></span>
                    {s.tasaInteresAnual && <span>Tasa: <strong>{s.tasaInteresAnual}% anual</strong></span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(s.createdAt).toLocaleDateString('es-MX')}</p>
                </div>
              </div>

              {s.estado === 'pendiente' && (
                <div className="flex gap-2 border-t pt-3">
                  <button
                    onClick={() => responder(s.id, 'aprobar')}
                    disabled={procesando[s.id]}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    Aprobar
                  </button>
                  <button
                    onClick={() => responder(s.id, 'rechazar')}
                    disabled={procesando[s.id]}
                    className="border text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                    Rechazar
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
