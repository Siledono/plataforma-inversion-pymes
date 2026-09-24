'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function RegistroPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', { token, email, password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-hero-grad flex items-center justify-center px-4" style={{ paddingTop: '4px' }}>
        <div className="bg-white rounded-3xl shadow-card-lg p-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-black text-gov-dark mb-2">¡Cuenta creada!</h2>
          <p className="text-gov-muted text-sm">Redirigiendo al inicio de sesión...</p>
          <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gov-green rounded-full animate-pulse" />
          </div>
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
          <Link href="/login" className="text-white/60 text-sm hover:text-white transition-colors font-medium">
            Ya tengo cuenta →
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-3xl shadow-card-lg overflow-hidden">
            <div className="h-1 bg-tricolor" />
            <div className="p-8">

              {/* Header */}
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-gov-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white font-black text-lg tracking-tight">DM</span>
                </div>
                <h1 className="text-2xl font-black text-gov-dark">Crear Cuenta</h1>
                <p className="text-gov-muted text-sm mt-1 leading-relaxed">
                  Necesitas un código de registro proporcionado<br />por la Secretaría de Economía
                </p>
              </div>

              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm mb-6 flex gap-2.5">
                <span className="text-lg shrink-0">📋</span>
                <div>
                  <p className="font-semibold text-amber-800 text-xs mb-0.5">Código de un solo uso</p>
                  <p className="text-amber-700 text-xs">El token fue proporcionado por el administrador de la plataforma.</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5 flex items-start gap-2">
                  <span className="shrink-0">⚠️</span><span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Código de registro</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="input font-mono text-sm tracking-wide"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="label">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Mínimo 12 caracteres, mayúsculas, números y símbolos"
                  />
                  <p className="text-xs text-gov-muted mt-1.5">Mínimo 12 caracteres con mayúsculas, números y símbolos</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-green w-full py-3 mt-1 text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Creando cuenta...
                    </span>
                  ) : 'Crear Cuenta'}
                </button>
              </form>

              <div className="text-center mt-5 text-sm text-gov-muted">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-gov-blue font-semibold hover:underline">
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/40 mt-4 flex items-center justify-center gap-1.5">
            <span>🔒</span> Sitio oficial del Gobierno de México. Verifica el candado en tu navegador.
          </p>
        </div>
      </main>
    </div>
  )
}
