'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Entrada {
  id: string
  titulo: string
  contenido: string
  publicado: boolean
  createdAt: string
}

export default function AdminCmsPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titulo: '', contenido: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Entrada[]>('/cms').then((d) => { setEntradas(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const crearEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const nueva = await api.post<Entrada>('/cms', form)
      setEntradas((prev) => [nueva, ...prev])
      setForm({ titulo: '', contenido: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const togglePublicar = async (id: string, publicado: boolean) => {
    await api.patch(`/cms/${id}`, { publicado: !publicado })
    setEntradas((prev) => prev.map((e) => e.id === id ? { ...e, publicado: !publicado } : e))
  }

  const eliminar = async (id: string) => {
    await api.delete(`/cms/${id}`)
    setEntradas((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Gestion de Contenido (CMS)</h1>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Nueva Entrada</h2>
        {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
        <form onSubmit={crearEntrada} className="space-y-3">
          <input type="text" required placeholder="Titulo" value={form.titulo}
            onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea required rows={4} placeholder="Contenido..." value={form.contenido}
            onChange={(e) => setForm((p) => ({ ...p, contenido: e.target.value }))}
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button type="submit" disabled={guardando}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {guardando ? 'Guardando...' : '+ Crear Entrada'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Entradas Publicadas</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        ) : entradas.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">Sin entradas aun</div>
        ) : (
          <div className="space-y-3">
            {entradas.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-800">{e.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.publicado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {e.publicado ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{e.contenido}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(e.createdAt).toLocaleDateString('es-MX')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => togglePublicar(e.id, e.publicado)}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${e.publicado ? 'text-gray-600 border-gray-300 hover:bg-gray-50' : 'text-green-600 border-green-300 hover:bg-green-50'}`}>
                    {e.publicado ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button onClick={() => eliminar(e.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border text-red-600 border-red-300 hover:bg-red-50">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
