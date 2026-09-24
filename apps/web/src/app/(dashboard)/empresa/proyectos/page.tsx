'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Proyecto {
  id: string; titulo: string; descripcion: string; estado: string
  montoMin: number; montoMax: number; totalInvertido: number
  tipoFinanciamiento: string; createdAt: string
}
interface Perfil { nombreEmpresa: string; rfc: string; direccion: string }

const ESTADO_MAP: Record<string, { label: string; cls: string }> = {
  borrador:          { label: 'Borrador',        cls: 'badge-gray'   },
  publicado:         { label: 'Publicado',        cls: 'badge-green'  },
  en_revision_banco: { label: 'En revisión',      cls: 'badge-yellow' },
  financiado_banco:  { label: 'Financiado banco', cls: 'badge-navy'   },
  financiado_total:  { label: 'Financiado total', cls: 'badge-green'  },
}

export default function EmpresaProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [perfil, setPerfil]       = useState<Perfil | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Proyecto[]>('/proyectos/mis-proyectos').catch(() => []),
      api.get<Perfil>('/auth/me').catch(() => null),
    ]).then(([p, u]) => { setProyectos(p as Proyecto[]); setPerfil(u as Perfil | null); setLoading(false) })
  }, [])

  return (
    <div className="flex gap-6">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="w-60 shrink-0">
        <div className="card p-5 sticky top-20">
          {/* Avatar empresa */}
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <p className="font-bold text-gov-dark text-sm text-center leading-tight mb-0.5">
            {perfil?.nombreEmpresa ?? 'Mi Empresa'}
          </p>
          <p className="text-gov-muted text-xs text-center mb-5">Perfil Empresa</p>

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

          {/* Nav secundario */}
          <nav className="space-y-1">
            <span className="sidebar-item-active w-full">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Mis proyectos
            </span>
            <Link href="/empresa/solicitudes" className="sidebar-item w-full">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Solicitudes
            </Link>
            <Link href="/empresa/negociaciones" className="sidebar-item w-full">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Negociaciones
            </Link>
          </nav>
        </div>
      </aside>

      {/* ── Contenido ────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Header de sección */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gov-dark">Mis Proyectos</h1>
            <p className="text-gov-muted text-sm mt-0.5">Gestiona tus proyectos de inversión</p>
          </div>
          <Link href="/empresa/proyectos/nuevo" className="btn-green">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar proyecto
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded-lg w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded-lg w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : proyectos.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="font-bold text-gov-dark mb-1">Sin proyectos aún</h3>
            <p className="text-gov-muted text-sm mb-5">Crea tu primer proyecto para empezar a recibir propuestas</p>
            <Link href="/empresa/proyectos/nuevo" className="btn-green">
              Crear primer proyecto
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {proyectos.map((p) => {
              const estado = ESTADO_MAP[p.estado] ?? { label: p.estado, cls: 'badge-gray' }
              const progreso = Math.min(100, Math.round((p.totalInvertido / (p.montoMax || 1)) * 100))
              return (
                <div key={p.id} className="card-hover p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="font-bold text-gov-dark text-base">{p.titulo}</h2>
                        <span className={estado.cls}>{estado.label}</span>
                      </div>
                      <p className="text-sm text-gov-muted mb-3 line-clamp-2 leading-relaxed">{p.descripcion}</p>

                      {/* Stats inline */}
                      <div className="flex flex-wrap gap-4 text-xs text-gov-muted mb-3">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gov-navy/30 inline-block" />
                          Inversión semilla: <strong className="text-gov-dark ml-0.5">—</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gov-green/30 inline-block" />
                          Donativos: <strong className="text-gov-navy ml-0.5">${Number(p.totalInvertido).toLocaleString('es-MX')}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400/40 inline-block" />
                          Inversión pública: <strong className="text-gov-dark ml-0.5">—</strong>
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="flex items-center gap-3">
                        <div className="progress-bar flex-1">
                          <div className="progress-fill" style={{ width: `${progreso}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gov-muted w-8 text-right">{progreso}%</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/empresa/proyectos/${p.id}`}
                        className="btn-ghost text-xs px-3 py-1.5">
                        Ver detalle
                      </Link>
                      {p.estado === 'borrador' && (
                        <button
                          onClick={async () => {
                            await api.patch(`/proyectos/${p.id}/publicar`)
                            setProyectos((prev) => prev.map((x) => x.id === p.id ? { ...x, estado: 'publicado' } : x))
                          }}
                          className="btn-green text-xs px-3 py-1.5">
                          Publicar
                        </button>
                      )}
                    </div>
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
