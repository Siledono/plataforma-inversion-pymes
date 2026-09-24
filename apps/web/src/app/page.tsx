import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ paddingTop: '4px' }}>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="bg-gov-dark sticky top-1 z-40 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white font-black text-xs tracking-tight">DM</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-tight leading-none">DeMex</span>
              <p className="text-white/40 text-[10px] leading-none mt-0.5">Secretaría de Economía</p>
            </div>
          </div>
          {/* Acciones */}
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-white/70 text-sm font-medium px-4 py-2 rounded-xl hover:bg-white/8 hover:text-white transition-all">
              Iniciar sesión
            </Link>
            <Link href="/registro"
              className="bg-gov-green text-white text-sm font-semibold px-5 py-2 rounded-xl hover:brightness-90 transition-all shadow-sm">
              Registrarme
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-grad flex-1 flex flex-col justify-center min-h-[560px]">
        {/* Orbs decorativos */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gov-navy/40 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-[300px] h-[300px] rounded-full bg-gov-green/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-tricolor opacity-60" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-3.5 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gov-green" />
                <span className="text-white/70 text-xs font-medium tracking-wide">Gobierno de México · Secretaría de Economía</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.05] tracking-tight">
                Desarrollo de<br />
                <span className="text-gov-gold">Empresas de México</span>
              </h1>
              <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-lg">
                ¿Tienes dificultades para encontrar una primera inversión?
                Conectamos PyMEs con bancos e inversionistas de manera segura y transparente.
              </p>

              {/* CTAs */}
              <div className="flex gap-3 flex-wrap">
                <Link href="/registro"
                  className="bg-gov-green text-white font-bold px-7 py-3 rounded-xl hover:brightness-90 transition-all shadow-lg text-sm">
                  Crear cuenta gratis
                </Link>
                <Link href="/login"
                  className="border border-white/25 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/8 hover:border-white/40 transition-all text-sm">
                  Iniciar sesión
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex gap-5 mt-8 flex-wrap">
                {[
                  { icon: '🔒', label: 'Sitio oficial seguro' },
                  { icon: '🇲🇽', label: 'Gobierno de México' },
                  { icon: '✅', label: 'PyMEs verificadas' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-white/45 text-xs font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cards flotantes */}
            <div className="hidden lg:flex flex-col gap-4">
              {/* Tarjeta principal */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/14 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gov-green/20 border border-gov-green/30 rounded-xl flex items-center justify-center">
                      <span className="text-lg">☕</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">CafMex</p>
                      <p className="text-white/40 text-xs">Cafetería · 3 años</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">Activo</span>
                </div>
                <div className="space-y-1.5 text-xs text-white/50 mb-3">
                  <div className="flex justify-between">
                    <span>Inversión semilla: <span className="text-white/75 font-medium">BBVA</span></span>
                    <span>Donativos: <span className="text-white/75 font-medium">$10,000</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Donadores: <span className="text-white/75 font-medium">240</span></span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-gov-green to-emerald-400" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-white/35 text-[10px]">Progreso financiamiento</span>
                  <span className="text-white/55 text-[10px] font-medium">62%</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/14 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                      <span className="text-lg">🍵</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">TeMex</p>
                      <p className="text-white/40 text-xs">Bebidas · 5 años</p>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium">En revisión</span>
                </div>
                <div className="space-y-1.5 text-xs text-white/50 mb-3">
                  <div className="flex justify-between">
                    <span>Inversión semilla: <span className="text-white/75 font-medium">Santander</span></span>
                    <span>Donativos: <span className="text-white/75 font-medium">$12,000</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Donadores: <span className="text-white/75 font-medium">312</span></span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-amber-400 to-yellow-300" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-white/35 text-[10px]">Progreso financiamiento</span>
                  <span className="text-white/55 text-[10px] font-medium">45%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ───────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gov-muted mb-10">¿Cómo funciona?</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏦', role: 'Banco',    color: 'bg-blue-50 border-blue-100',   iconBg: 'bg-blue-100',    text: 'text-blue-700',  desc: 'Institución financiera', detail: 'Envía propuestas de crédito e inversión a PyMEs verificadas.' },
              { icon: '🏢', role: 'Empresa',  color: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-700', desc: 'PyME o negocio',   detail: 'Publica tu proyecto y recibe propuestas de bancos e inversores.' },
              { icon: '💼', role: 'Inversor', color: 'bg-purple-50 border-purple-100',  iconBg: 'bg-purple-100',  text: 'text-purple-700', desc: 'Inversionista',    detail: 'Explora proyectos y diversifica tu portafolio de inversión.' },
            ].map((t) => (
              <div key={t.role} className={`rounded-2xl border p-6 ${t.color} hover:shadow-md transition-all`}>
                <div className={`w-12 h-12 ${t.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{t.icon}</span>
                </div>
                <h3 className={`font-bold text-base mb-0.5 ${t.text}`}>{t.role}</h3>
                <p className="text-gov-muted text-xs font-medium mb-2">{t.desc}</p>
                <p className="text-gov-muted text-sm leading-relaxed">{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="bg-gov-dark py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '500+',  label: 'PyMEs Conectadas',       color: 'text-gov-green' },
            { value: '$120M', label: 'Inversiones Realizadas',  color: 'text-gov-gold'  },
            { value: '12',    label: 'Bancos Participantes',    color: 'text-white'     },
          ].map((s) => (
            <div key={s.label}>
              <div className={`text-4xl md:text-5xl font-black mb-1.5 ${s.color}`}>{s.value}</div>
              <div className="text-white/45 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-gov-dark border-t border-white/8 text-white/40 text-xs text-center py-5">
        <div className="flex justify-center items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-gov-green" />
          <div className="w-2 h-2 rounded-full bg-white/60" />
          <div className="w-2 h-2 rounded-full bg-gov-red" />
        </div>
        © {new Date().getFullYear()} Gobierno de México — Secretaría de Economía. Todos los derechos reservados.
      </footer>
    </div>
  )
}
