'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Proyecto {
  id: string; titulo: string; descripcion: string; estado: string
  montoMin: number; montoMax: number; totalInvertido: number
  tipoFinanciamiento: string
  empresa: { nombreEmpresa: string; sectorScian: string; aniosOperacion: number; numEmpleados: number }
}

// Pantalla 5+7 — Dashboard Inversor: explorar proyectos + hacer ofertas
export default function InversorExplorarPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [oferta, setOferta] = useState<Record<string, { monto: number; tipo: string }>>({})
  const [enviando, setEnviando] = useState<Record<string, boolean>>({})
  const [filtro, setFiltro] = useState<'empresa' | 'banco' | 'inversor'>('inversor')

  useEffect(() => {
    api.get<Proyecto[]>('/proyectos').then((d) => { setProyectos(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const hacerOferta = async (proyectoId: string) => {
    const datos = oferta[proyectoId]
    if (!datos?.monto) return
    setEnviando((p) => ({ ...p, [proyectoId]: true }))
    try {
      await api.post('/negociaciones', { proyectoId, montoOfertado: datos.monto, tipo: datos.tipo || 'prestamo' })
      alert('Oferta enviada exitosamente')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setEnviando((p) => ({ ...p, [proyectoId]: false }))
    }
  }

  return (
    <div>
      {/* Filtros de rol */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm border w-fit">
        {(['empresa', 'banco', 'inversor'] as const).map((r) => (
          <button key={r} onClick={() => setFiltro(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filtro === r ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {r === 'empresa' ? '🏢 Empresa' : r === 'banco' ? '🏦 Banco' : '💼 Inversor'}
          </button>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Proyectos Disponibles</h1>
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {proyectos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-800 mb-1">{p.titulo}</h3>
              <p className="text-xs text-gray-400 mb-2">{p.empresa.nombreEmpresa} · {p.empresa.sectorScian} · {p.empresa.aniosOperacion} años</p>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.descripcion}</p>
              <div className="flex gap-4 text-xs text-gray-500 mb-4">
                <span>💰 ${Number(p.montoMin).toLocaleString()} – ${Number(p.montoMax).toLocaleString()}</span>
                <span>📊 Invertido: <strong className="text-gray-700">${Number(p.totalInvertido).toLocaleString()}</strong></span>
              </div>
              {/* Pantalla 11 — Hacer oferta */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex gap-2">
                  <input type="number" placeholder="Monto a ofrecer $"
                    onChange={(e) => setOferta((prev) => ({ ...prev, [p.id]: { ...prev[p.id], monto: Number(e.target.value) } }))}
                    className="flex-1 border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <select onChange={(e) => setOferta((prev) => ({ ...prev, [p.id]: { ...prev[p.id], tipo: e.target.value } }))}
                    className="border rounded px-2 py-1.5 text-sm">
                    <option value="prestamo">Préstamo</option>
                    <option value="acciones">Acciones</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <button onClick={() => hacerOferta(p.id)} disabled={enviando[p.id]}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {enviando[p.id] ? 'Enviando...' : '💼 Hacer Oferta'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
