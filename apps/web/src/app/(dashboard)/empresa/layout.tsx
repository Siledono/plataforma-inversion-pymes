'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NotificacionesBadge from '@/components/shared/notificaciones/NotificacionesBadge'
import AgenteChat from '@/components/shared/agente-chat/AgenteChat'
import api from '@/lib/api'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/empresa/proyectos', label: 'Inicio' },
  { href: '/empresa/proyectos', label: 'Proyectos' },
  { href: '/empresa/solicitudes', label: 'Solicitudes' },
  { href: '/empresa/negociaciones', label: 'Negociaciones' },
]

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
        <Link href="/empresa/proyectos" className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">CI</span>
          </div>
          <span className="font-semibold text-gray-800 hidden sm:block">Conecta Inversión</span>
        </Link>

        {/* Búsqueda */}
        <div className="flex-1 max-w-md">
          <input
            type="search"
            placeholder="Buscar bancos, proyectos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Links */}
        <div className="hidden md:flex gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                pathname.startsWith(link.href) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/informacion" className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Nosotros</Link>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <NotificacionesBadge />
          <Link href="/empresa/perfil" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">👤 Perfil</Link>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm">Salir</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <AgenteChat />
    </div>
  )
}
