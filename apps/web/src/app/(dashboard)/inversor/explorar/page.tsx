'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Proyecto {
  id: string; titulo: string; descripcion: string; estado: string
  montoMin: number; montoMax: number; totalInvertido: number
  tipoFinanciamiento: string
  empresa: { nombreEmpresa: string; sectorScian: string; aniosOperacion: number }
}

interface PerfilInversor {
  nombreCompleto: string
  rfc: string
  direccion?: string
}

export default function InversorExplorarPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [perfil, setPerfil] = useState<PerfilInversor | null>(null)
  const [loading, setLoading] = useState(true)
  const [oferta, setOferta] = useState<Record<string, { monto: number; tipo: string }>>({})
  const [enviando, setEnviando] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      api.get<Proyecto[]>('/proyectos').catch(() => []),
      api.get<PerfilInversor>('/auth/me').catch(() => null),
    ]).then(([p, u]) => {
      setProyectos(p as Proyecto[])
      setPerfil(u as PerfilInversor | null)
      setLoading(false)
    })
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
    <div className="flex gap-6">

      {/* ── Sidebar perfil inversor ───────────────────────── */}
      <aside className="w-60 shrink-0">
        <div className="card p-5 sticky top-20">
          {/* Avatar */}
          <div className="w-16 h-16 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💼</span>
          </div>
          <p className="font-bold text-gov-dark text-sm text-center leading-tight mb-0.5">
            {perfil?.nombreCompleto ?? 'Mi Perfil'}
          </p>
          <p className="text-gov-muted text-xs text-center mb-5">Perfil Inversor</p>

          {/* Info */}
          <div className="space-y-3 text-xs mb-5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-gov-muted font-medium">RFC</span>
              <span className="font-semibold text-gov-dark font-mono text-[11px]">{perfil?.rfc ?? '—'}</span>
            </div>
            <div className="border-t border-slate-200 pt-2.5">
              <span className="text-gov-muted block mb-1 font-medium">Dirección</span>
              <span className="text-gov-dark">{perfil?.direccion ?? '—'}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            <span className="sidebar-item-active w-full">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar proyectos
            </span>
            <span className="sidebar-item w-full opacity-50 cursor-default select-none">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Mis inversiones
            </span>
          </nav>
        </div>
      </aside>

      {/* ── Grid de proyectos ────────────────────────────── */}
      <div className="flex-1 min-w-0">

        <div className="mb-6">
          <h1 className="text-2xl font-black text-gov-dark">Proyectos Disponibles</h1>
          <p className="text-gov-muted text-sm mt-0.5">Explora y realiza ofertas de inversión</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded-lg w-1/2 mb-3" />
                <div className="h-3 bg-slate-100 rounded-lg w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded-lg w-2/3 mb-4" />
                <div className="h-8 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : proyectos.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="font-bold text-gov-dark mb-1">Sin proyectos disponibles</h3>
            <p className="text-gov-muted text-sm">Vuelve más tarde para ver nuevos proyectos</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {proyectos.map((p) => {
              const progreso = Math.min(100, Math.round((p.totalInvertido / (p.montoMax || 1)) * 100))
              return (
                <div key={p.id} className="card-hover p-5">
                  {/* Header tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gov-light rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                        <span className="text-lg">🏢</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gov-dark text-sm leading-tight">{p.titulo}</h3>
                        <p className="text-xs text-gov-muted mt-0.5">
                          {p.empresa.nombreEmpresa} · {p.empresa.aniosOperacion} años
                        </p>
                      </div>
                    </div>
                    <span className="badge-green text-[10px] shrink-0">Activo</span>
                  </div>

                  {/* Sector chip */}
                  {p.empresa.sectorScian && (
                    <span className="inline-flex items-center text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full mb-2">
                      {p.empresa.sectorScian}
                    </span>
                  )}

                  <p className="text-xs text-gov-muted mb-3 line-clamp-2 leading-relaxed">{p.descripcion}</p>

                  {/* Stats */}
                  <div className="flex gap-3 text-xs text-gov-muted mb-3 flex-wrap">
                    <span>Semilla: <strong className="text-gov-dark">—</strong></span>
                    <span>Donativos: <strong className="text-gov-navy">${Number(p.totalInvertido).toLocaleString('es-MX')}</strong></span>
                  </div>

                  {/* Progreso */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="progress-bar flex-1">
                      <div className="progress-fill" style={{ width: `${progreso}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gov-muted w-7 text-right">{progreso}%</span>
                  </div>

                  {/* Formulario oferta */}
                  <div className="border-t border-slate-100 pt-4 space-y-2.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-muted text-xs font-medium">$</span>
                        <input
                          type="number"
                          placeholder="Monto a ofrecer"
                          onChange={(e) => setOferta((prev) => ({ ...prev, [p.id]: { ...prev[p.id], monto: Number(e.target.value) } }))}
                          className="w-full border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs focus:ring-2 focus:ring-gov-blue/25 focus:border-gov-blue focus:outline-none transition bg-white"
                        />
                      </div>
                      <select
                        onChange={(e) => setOferta((prev) => ({ ...prev, [p.id]: { ...prev[p.id], tipo: e.target.value } }))}
                        className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gov-blue/25 transition">
                        <option value="prestamo">Préstamo</option>
                        <option value="acciones">Acciones</option>
                        <option value="ambos">Ambos</option>
                      </select>
                    </div>
                    <button
                      onClick={() => hacerOferta(p.id)}
                      disabled={enviando[p.id] || !oferta[p.id]?.monto}
                      className="btn-primary w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {enviando[p.id] ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                          </svg>
                          Enviando...
                        </span>
                      ) : 'Enviar oferta'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
