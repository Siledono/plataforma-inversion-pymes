'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Estadisticas {
  totalEmpresas: number; totalBancos: number; bancosSuspendidos: number
  totalInversores: number; totalProyectos: number; proyectosPublicados: number
  financiamientosCompletados: number; montoTotalMovilizado: number
}

// Dashboard Admin: Pantalla de estadísticas globales
export default function AdminEstadisticasPage() {
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Estadisticas>('/admin/estadisticas').then((d) => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const tarjetas = stats ? [
    { label: 'Empresas Registradas', value: stats.totalEmpresas, icon: '🏢', color: 'bg-blue-50 text-blue-700' },
    { label: 'Bancos Activos', value: stats.totalBancos, icon: '🏦', color: 'bg-green-50 text-green-700' },
    { label: 'Bancos Suspendidos', value: stats.bancosSuspendidos, icon: '⛔', color: 'bg-red-50 text-red-700' },
    { label: 'Inversores', value: stats.totalInversores, icon: '💼', color: 'bg-purple-50 text-purple-700' },
    { label: 'Proyectos Activos', value: stats.proyectosPublicados, icon: '📋', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Financiamientos Completados', value: stats.financiamientosCompletados, icon: '✅', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Monto Total Movilizado', value: `$${Number(stats.montoTotalMovilizado).toLocaleString('es-MX')}`, icon: '💰', color: 'bg-indigo-50 text-indigo-700', wide: true },
  ] : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas Generales</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando estadísticas...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tarjetas.map((t) => (
            <div key={t.label} className={`bg-white rounded-xl border p-5 ${(t as any).wide ? 'col-span-2' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`text-2xl p-2 rounded-lg ${t.color.split(' ')[0]}`}>{t.icon}</span>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{t.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
