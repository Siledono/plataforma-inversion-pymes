import Link from 'next/link'

// Pantalla 2 — Landing Pública
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-900 font-bold text-xs">CI</span>
          </div>
          <span className="text-white font-semibold text-lg">Conecta Inversión</span>
        </div>
        <div className="flex gap-6 text-white/80 text-sm">
          <Link href="/informacion" className="hover:text-white transition-colors">Nosotros</Link>
          <Link href="/informacion#contacto" className="hover:text-white transition-colors">Contacto</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="mb-4">
          <span className="text-blue-300 text-sm font-medium uppercase tracking-widest">
            Secretaría de Economía
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Desarrollo de Empresas<br />de México
        </h1>
        <p className="text-xl text-blue-200 mb-3 max-w-xl">
          ¿Tienes dificultades para encontrar una primera inversión?
        </p>
        <p className="text-blue-300 mb-10 max-w-lg text-base">
          Conectamos PyMEs con bancos e inversionistas independientes para facilitar tu primer financiamiento.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/registro"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Registrarme
          </Link>
          <Link
            href="/login"
            className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Estadísticas decorativas */}
        <div className="grid grid-cols-3 gap-8 mt-16 text-center">
          {[
            { label: 'PyMEs Conectadas', value: '500+' },
            { label: 'Inversiones Realizadas', value: '$120M' },
            { label: 'Bancos Participantes', value: '12' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-blue-300 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-blue-400 text-xs py-4">
        © {new Date().getFullYear()} Secretaría de Economía — Gobierno de México
      </footer>
    </div>
  )
}
