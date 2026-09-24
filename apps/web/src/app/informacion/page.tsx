'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Articulo { id: string; titulo: string; cuerpo: string; archivoUrl?: string; createdAt: string }

// Pantalla 12 — Sección Informativa / CMS (pública)
export default function InformacionPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<Articulo | null>(null)

  useEffect(() => {
    api.get<Articulo[]>('/cms').then((d) => { setArticulos(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">CI</span>
          </div>
          <span className="font-semibold text-gray-800">Conecta Inversión</span>
        </a>
        <div className="flex gap-4 text-sm text-gray-600">
          <a href="/login" className="hover:text-blue-600">Iniciar Sesión</a>
          <a href="/registro" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">Registrarme</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Secretaría de Economía</h1>
        <p className="text-gray-500 mb-8">Información oficial sobre la plataforma Conecta Inversión y sus convocatorias.</p>

        {seleccionado ? (
          <div className="bg-white rounded-xl border p-8">
            <button onClick={() => setSeleccionado(null)} className="text-sm text-blue-600 hover:underline mb-4 block">← Volver</button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{seleccionado.titulo}</h2>
            <p className="text-xs text-gray-400 mb-6">{new Date(seleccionado.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{seleccionado.cuerpo}</div>
            {seleccionado.archivoUrl && (
              <a href={seleccionado.archivoUrl} target="_blank" rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                📄 Descargar documento PDF
              </a>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : articulos.length === 0 ? (
          <div className="text-center py-12"><div className="text-4xl mb-3">📰</div><p className="text-gray-500">Sin publicaciones disponibles</p></div>
        ) : (
          <div className="grid gap-4">
            {articulos.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border p-6 hover:shadow-md cursor-pointer transition-shadow"
                onClick={() => setSeleccionado(a)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{a.titulo}</h3>
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {a.archivoUrl && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">PDF</span>}
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sección de contacto */}
        <div id="contacto" className="mt-12 bg-white rounded-xl border p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contacto</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div><div className="font-medium text-gray-700 mb-1">📞 Teléfono</div><p>800 000 3000</p></div>
            <div><div className="font-medium text-gray-700 mb-1">✉️ Email</div><p>contacto@conecta-inversion.gob.mx</p></div>
            <div><div className="font-medium text-gray-700 mb-1">🌐 Web</div><p>www.economia.gob.mx</p></div>
          </div>
        </div>
      </main>
    </div>
  )
}
