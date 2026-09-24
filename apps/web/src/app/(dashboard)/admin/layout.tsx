'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import api from '@/lib/api'

const NAV_LINKS = [
  { href: '/admin/estadisticas', label: 'Estadisticas' },
  { href: '/admin/bancos', label: 'Bancos' },
  { href: '/admin/tokens', label: 'Tokens' },
  { href: '/admin/cms', label: 'CMS' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
        <Link href="/admin/estadisticas" className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">AD</span>
          </div>
          <span className="font-semibold text-gray-800 hidden sm:block">Admin</span>
        </Link>

        <div className="hidden md:flex gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                pathname.startsWith(link.href) ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 hidden sm:block">Administrador</span>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm">Salir</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
