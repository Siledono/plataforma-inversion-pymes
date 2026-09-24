'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Notificacion {
  id: string
  mensaje: string
  tipo: string
  leida: boolean
  createdAt: string
}

// Componente de badge de notificaciones con polling cada 30 segundos
export default function NotificacionesBadge() {
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [abierto, setAbierto] = useState(false)
  const noLeidas = notifs.filter((n) => !n.leida).length

  const cargar = async () => {
    try {
      const data = await api.get<Notificacion[]>('/notificaciones')
      setNotifs(data)
    } catch { /* ignorar */ }
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 30_000)
    return () => clearInterval(intervalo)
  }, [])

  const marcarLeida = async (id: string) => {
    await api.patch(`/notificaciones/${id}/leer`)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
  }

  const tipoIcon: Record<string, string> = {
    oferta_recibida: '💰',
    contraoferta: '🤝',
    proyecto_aceptado: '✅',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={async () => {
                  await api.patch('/notificaciones/todas/leer')
                  setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })))
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">Sin notificaciones</div>
            ) : (
              notifs.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.leida && marcarLeida(n.id)}
                  className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${!n.leida ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{tipoIcon[n.tipo] ?? '📣'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-tight">{n.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.leida && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
