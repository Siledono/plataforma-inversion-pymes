'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Articulo { id: string; titulo: string; cuerpo: string; archivoUrl?: string; createdAt: string }

export default function InformacionPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Articulo | null>(null)

  useEffect(() => {
    api.get<Articulo[]>('/cms').then((d) => { setArticulos(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gov-surface flex flex-col" style={{ paddingTop: '4px' }}>

      {/* ── Navbar ────────────────────────────────────────── */}
      <header className="bg-gov-dark sticky top-1 z-40 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <span className="text-white font-black text-xs">DM</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm leading-none">DeMex</span>
              <p className="text-white/35 text-[9px] leading-none mt-0.5">Secretaría de Economía</p>
            </div>
          </Link>
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="search" placeholder="Buscar..."
                className="w-full bg-white/8 border border-white/12 rounded-xl pl-9 pr-3 py-1.5 text-sm text-white
                           placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition" />
            </div>
          </div>
          <div className="hidden md:flex gap-0.5 ml-2">
            {[
              { href: '/', label: 'Inicio' },
              { href: '/login', label: 'Perfil' },
              { href: '/informacion', label: 'Nosotros', active: true },
              { href: '/informacion#contacto', label: 'Contacto' },
            ].map((link) => (
              <Link key={link.href + link.label} href={link.href}
                className={`px-3.5 py-1.5 text-sm rounded-xl transition-all font-medium
                  ${(link as any).active ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white hover:bg-white/8'}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 w-full flex-1">

        {/* ── Hero Nosotros ──────────────────────────────── */}
        <div className="card overflow-hidden mb-8">
          <div className="h-1 bg-tricolor" />
          <div className="p-8">
            <div className="flex items-start gap-5 mb-5">
              <div className="w-16 h-16 bg-gov-dark rounded-2xl flex items-center justify-center shadow-md shrink-0">
                <span className="text-white font-black text-xl">DM</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gov-dark">DeMex</h1>
                <p className="text-gov-muted text-sm">Plataforma de Inversión para PyMEs · Secretaría de Economía</p>
              </div>
            </div>
            <p className="text-gov-muted leading-relaxed text-sm max-w-2xl mb-5">
              Somos una empresa enfocada en relacionar a empresas medianas y pequeñas con inversionistas
              que puedan aportar a su proyecto. Conectamos PyMEs con bancos e inversores independientes
              para facilitar el primer financiamiento y el crecimiento empresarial en México.
            </p>
            {/* Stats horizontales */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
              {[
                { value: '500+',  label: 'PyMEs conectadas',      color: 'text-gov-green' },
                { value: '$120M', label: 'En inversiones',          color: 'text-gov-navy'  },
                { value: '12',    label: 'Bancos participantes',     color: 'text-gov-blue'  },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-black mb-0.5 ${s.color}`}>{s.value}</div>
                  <div className="text-gov-muted text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Artículos CMS ──────────────────────────────── */}
        {seleccionado ? (
          <div className="card p-8 mb-8">
            <button onClick={() => setSeleccionado(null)}
              className="text-sm text-gov-blue hover:underline mb-5 flex items-center gap-1 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a publicaciones
            </button>
            <h2 className="text-xl font-black text-gov-dark mb-1">{seleccionado.titulo}</h2>
            <p className="text-xs text-gov-muted mb-6">
              {new Date(seleccionado.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="text-sm text-gov-muted leading-relaxed whitespace-pre-wrap">{seleccionado.cuerpo}</div>
            {seleccionado.archivoUrl && (
              <a href={seleccionado.archivoUrl} target="_blank" rel="noreferrer"
                className="btn-primary mt-6 inline-flex gap-2">
                <span>📄</span> Descargar documento
              </a>
            )}
          </div>
        ) : !loading && articulos.length > 0 && (
          <div className="space-y-3 mb-8">
            <p className="section-title">Publicaciones</p>
            {articulos.map((a) => (
              <div key={a.id} className="card-hover p-5 cursor-pointer"
                onClick={() => setSeleccionado(a)}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gov-dark mb-0.5">{a.titulo}</h3>
                    <p className="text-xs text-gov-muted">
                      {new Date(a.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {a.archivoUrl && <span className="badge-navy text-[10px]">PDF</span>}
                    <svg className="w-4 h-4 text-gov-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Contacto ───────────────────────────────────── */}
        <div id="contacto" className="card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gov-navy to-gov-blue" />
          <div className="p-8">
            <p className="section-title">Contacto</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '📞', label: 'Teléfono',      value: '800 000 3000',        bg: 'bg-gov-light border-blue-100',     text: 'text-gov-navy' },
                { icon: '✉️', label: 'Correo',         value: 'contacto@demex.gob.mx', bg: 'bg-red-50 border-red-100',       text: 'text-red-700'  },
                { icon: '🌐', label: 'Redes Sociales', value: '@DeMexOficial',        bg: 'bg-purple-50 border-purple-100',  text: 'text-purple-700' },
              ].map((c) => (
                <div key={c.label} className={`${c.bg} border rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow`}>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <span className="text-xl">{c.icon}</span>
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${c.text} mb-0.5`}>{c.label}</p>
                    <p className="text-sm text-gov-dark font-semibold">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-5 text-center bg-white">
        <div className="flex justify-center items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gov-green" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gov-red" />
        </div>
        <p className="text-xs text-gov-muted">© {new Date().getFullYear()} Gobierno de México — Secretaría de Economía</p>
      </footer>
    </div>
  )
}
