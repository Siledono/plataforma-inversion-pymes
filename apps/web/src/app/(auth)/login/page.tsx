'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type Rol = 'inversor' | 'empresa' | 'banco'

const ROLES: { id: Rol; label: string; icon: string; hint: string }[] = [
  { id: 'inversor', label: 'Cliente',  icon: '💼', hint: 'Inversionista independiente' },
  { id: 'empresa',  label: 'Empresa',  icon: '🏢', hint: 'PyME o negocio' },
  { id: 'banco',    label: 'Banco',    icon: '🏦', hint: 'Institución financiera' },
]

export default function LoginPage() {
  const router = useRouter()
  const [rol, setRol] = useState<Rol>('inversor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [keyPassword, setKeyPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mfaState, setMfaState] = useState<{ requiere: boolean; userId: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer)
        let binary = ''
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        resolve(btoa(binary))
      }
      reader.onerror = reject
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let data: any
      data = await api.post('/auth/login', { email, password })
      if (data.requiereMfa) { setMfaState({ requiere: true, userId: data.userId }); return }
      if (data.requiereVerificacionDispositivo) {
        setError('Hemos enviado un enlace de verificación a tu correo.')
        return
      }
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify({ email, rol: data.rol }))
      const destinos: Record<string, string> = {
        empresa: '/empresa/proyectos', banco: '/banco/solicitudes',
        inversor: '/inversor/explorar', admin: '/admin/estadisticas',
      }
      router.push(destinos[data.rol] ?? '/')
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data: any = await api.post('/auth/totp/verificar', { userId: mfaState!.userId, codigo: totpCode })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify({ email, rol: data.rol }))
      const destinos: Record<string, string> = {
        empresa: '/empresa/proyectos', banco: '/banco/solicitudes',
        inversor: '/inversor/explorar', admin: '/admin/estadisticas',
      }
      router.push(destinos[data.rol] ?? '/')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  /* ── MFA screen ─────── */
  if (mfaState?.requiere) {
    return (
      <div className="min-h-screen bg-hero-grad flex items-center justify-center px-4" style={{ paddingTop: '4px' }}>
        <div className="bg-white rounded-3xl shadow-card-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gov-navy rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h2 className="text-xl font-bold text-gov-dark">Verificación MFA</h2>
            <p className="text-gov-muted text-sm mt-1">Ingresa el código de 6 dígitos</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4 flex gap-2"><span>⚠️</span>{error}</div>}
          <form onSubmit={handleTotp} className="space-y-4">
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={totpCode} onChange={(e) => setTotpCode(e.target.value)}
              className="input text-center text-2xl tracking-[0.5em] font-mono" />
            <button type="submit" disabled={loading || totpCode.length !== 6} className="btn-primary w-full py-3">
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-grad flex flex-col" style={{ paddingTop: '4px' }}>

      {/* Navbar mínima */}
      <header className="border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white font-black text-xs">DM</span>
            </div>
            <span className="text-white font-bold text-sm">DeMex</span>
          </Link>
          <Link href="/registro" className="text-white/60 text-sm hover:text-white transition-colors font-medium">
            Crear cuenta →
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card principal */}
          <div className="bg-white rounded-3xl shadow-card-lg overflow-hidden">
            {/* Franja tricolor top */}
            <div className="h-1 bg-tricolor" />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-gov-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white font-black text-lg tracking-tight">DM</span>
                </div>
                <h1 className="text-2xl font-black text-gov-dark">Iniciar Sesión</h1>
                <p className="text-gov-muted text-sm mt-1">Plataforma DeMex — Secretaría de Economía</p>
              </div>

              {/* Selector de rol */}
              <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 rounded-2xl p-1.5 border border-slate-200">
                {ROLES.map((r) => (
                  <button key={r.id} onClick={() => setRol(r.id)}
                    className={`flex flex-col items-center py-3 px-1 rounded-xl transition-all text-xs font-semibold gap-1
                      ${rol === r.id
                        ? 'bg-white shadow-sm text-gov-navy border border-slate-200'
                        : 'text-gov-muted hover:text-gov-dark'}`}>
                    <span className="text-xl">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5 flex items-start gap-2">
                  <span className="shrink-0">⚠️</span><span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Correo electrónico</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input" placeholder="correo@empresa.com" />
                </div>

                <div>
                  <label className="label">Contraseña</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder={rol === 'banco' ? 'Contraseña institucional' : 'Tu contraseña'} />
                  {rol === 'banco' && (
                    <p className="text-xs text-gov-muted mt-1.5 flex items-center gap-1">
                      <span>🔒</span> Acceso validado por IP institucional autorizada
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3 mt-1 text-base">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Ingresando...
                    </span>
                  ) : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="text-center mt-5 text-sm text-gov-muted">
                ¿No tienes cuenta?{' '}
                <Link href="/registro" className="text-gov-blue font-semibold hover:underline">
                  Regístrate con tu código
                </Link>
              </div>
            </div>
          </div>

          {/* Nota de seguridad */}
          <p className="text-center text-xs text-white/40 mt-4 flex items-center justify-center gap-1.5">
            <span>🔒</span> Sitio oficial del Gobierno de México. Verifica el candado en tu navegador.
          </p>
        </div>
      </main>
    </div>
  )
}
