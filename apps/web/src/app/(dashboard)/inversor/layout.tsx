'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import NotificacionesBadge from '@/components/shared/notificaciones/NotificacionesBadge'
import AgenteChat from '@/components/shared/agente-chat/AgenteChat'
import api from '@/lib/api'

const NAV = [
  { href: '/inversor/explorar',    label: 'Inicio' },
  { href: '/inversor/perfil',      label: 'Perfil' },
  { href: '/informacion',          label: 'Nosotros' },
  { href: '/informacion#contacto', label: 'Contacto' },
]

export default function InversorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [busqueda, setBusqueda] = useState('')

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gov-surface" style={{ paddingTop: '4px' }}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="bg-gov-dark sticky top-1 z-40 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">

          {/* Logo */}
          <Link href="/inversor/explorar" className="flex items-center gap-2 mr-4 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <span className="text-white font-black text-xs">DM</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm leading-none">DeMex</span>
              <p className="text-white/35 text-[9px] leading-none mt-0.5">Secretaría de Economía</p>
            </div>
          </Link>

          {/* Buscador */}
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="search" placeholder="Buscar..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white/8 border border-white/12 rounded-xl pl-9 pr-3 py-1.5 text-sm text-white
                           placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/12 transition" />
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex gap-0.5 ml-2">
            {NAV.map((link) => {
              const active = pathname === link.href || (!link.href.includes('#') && link.href !== '/informacion' && pathname.startsWith(link.href))
              return (
                <Link key={link.href + link.label} href={link.href}
                  className={`px-3.5 py-1.5 text-sm rounded-xl transition-all font-medium
                    ${active
                      ? 'bg-white/15 text-white'
                      : 'text-white/55 hover:text-white hover:bg-white/8'}`}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 ml-auto">
            <NotificacionesBadge />
            <button onClick={handleLogout}
              className="text-white/50 hover:text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/8 transition-all flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <AgenteChat />

      <footer className="border-t border-slate-200 mt-16 py-5 text-center text-xs text-gov-muted bg-white">
        <div className="flex justify-center items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gov-green" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gov-red" />
        </div>
        © {new Date().getFullYear()} Gobierno de México — Secretaría de Economía
      </footer>
    </div>
  )
}
