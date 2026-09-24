'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

// Pantalla 3 — Login diferenciado por rol
type Rol = 'empresa' | 'inversor' | 'banco'

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

      if (rol === 'empresa') {
        if (!cerFile || !keyFile) throw new Error('Debes subir tu certificado .cer y llave .key')
        const cerBase64 = await fileToBase64(cerFile)
        const keyBase64 = await fileToBase64(keyFile)
        data = await api.post('/auth/login/efirma', { email, cerBase64, keyBase64, keyPassword })
      } else if (rol === 'banco') {
        data = await api.post('/auth/login/banco', { email, password })
      } else {
        data = await api.post('/auth/login/inversor', { email, password })
      }

      if (data.requiereMfa) {
        setMfaState({ requiere: true, userId: data.userId })
        return
      }
      if (data.requiereVerificacionDispositivo) {
        setError('Hemos enviado un enlace de verificación a tu correo. Confirma el dispositivo y vuelve a iniciar sesión.')
        return
      }

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify({ email, rol: data.rol }))

      const destinos: Record<string, string> = {
        empresa: '/empresa/proyectos',
        banco: '/banco/solicitudes',
        inversor: '/inversor/explorar',
        admin: '/admin/estadisticas',
      }
      router.push(destinos[data.rol] ?? '/')
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (mfaState?.requiere) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Verificación MFA</h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Ingresa el código de 6 dígitos de tu aplicación autenticadora
          </p>
          {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
          <form onSubmit={handleTotp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-3">
            <span className="text-white font-bold">CI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="text-gray-500 text-sm mt-1">Conecta Inversión — Secretaría de Economía</p>
        </div>

        {/* Selector de rol */}
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
          {(['inversor', 'empresa', 'banco'] as Rol[]).map((r) => (
            <button
              key={r}
              onClick={() => setRol(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                rol === r ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'inversor' ? 'Inversor' : r === 'empresa' ? 'Empresa' : 'Banco'}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@empresa.com"
            />
          </div>

          {/* Empresa usa e.Firma */}
          {rol === 'empresa' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>🔐 e.Firma SAT</strong> — Sube tu certificado digital para autenticarte de forma segura.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificado público (.cer)</label>
                <input
                  type="file"
                  accept=".cer"
                  required
                  onChange={(e) => setCerFile(e.target.files?.[0] ?? null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Llave privada (.key)</label>
                <input
                  type="file"
                  accept=".key"
                  required
                  onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de la llave privada</label>
                <input
                  type="password"
                  required
                  value={keyPassword}
                  onChange={(e) => setKeyPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contraseña de tu e.Firma"
                />
              </div>
            </>
          ) : (
            /* Banco e Inversor usan contraseña */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={rol === 'banco' ? 'Contraseña institucional' : 'Contraseña (mínimo 12 caracteres)'}
              />
              {rol === 'banco' && (
                <p className="text-xs text-gray-500 mt-1">
                  🔒 Tu acceso está validado por IP institucional autorizada
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-blue-600 hover:underline">
            Regístrate con tu token
          </Link>
        </div>
      </div>
    </div>
  )
}
