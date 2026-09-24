'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function RegistroInversorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    token: '',
    email: '',
    password: '',
    nombreCompleto: '',
    rfc: '',
    telefono: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register/inversor', form)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cuenta de Inversor creada</h2>
          <p className="text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-3">
            <span className="text-white font-bold">CI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Registro de Inversor</h1>
          <p className="text-gray-500 text-sm mt-1">Necesitas un codigo de registro de la Secretaria de Economia</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codigo de registro</label>
            <input type="text" required value={form.token} onChange={set('token')}
              className="w-full border rounded-lg px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" required value={form.nombreCompleto} onChange={set('nombreCompleto')}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Juan Perez Lopez" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
            <input type="text" required value={form.rfc} onChange={set('rfc')}
              className="w-full border rounded-lg px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="PELJ800101XXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input type="tel" value={form.telefono} onChange={set('telefono')}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="+52 55 1234 5678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
            <input type="email" required value={form.email} onChange={set('email')}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input type="password" required minLength={12} value={form.password} onChange={set('password')}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Minimo 12 caracteres" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Creando cuenta...' : 'Crear Cuenta de Inversor'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="text-purple-600 hover:underline">Iniciar Sesion</Link>
        </p>
      </div>
    </div>
  )
}
