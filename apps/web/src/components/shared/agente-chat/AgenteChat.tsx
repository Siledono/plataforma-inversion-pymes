'use client'
import { useState, useEffect, useRef } from 'react'
import api from '@/lib/api'

// Pantalla 13 — ChatBot flotante accesible desde cualquier dashboard
export default function AgenteChat() {
  const [abierto, setAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historial])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensaje.trim()) return
    const userMsg = mensaje.trim()
    setMensaje('')
    const nuevoHistorial = [...historial, { role: 'user' as const, content: userMsg }]
    setHistorial(nuevoHistorial)
    setLoading(true)
    try {
      const data: any = await api.post('/agentes/chat', {
        mensaje: userMsg,
        historial: historial,
      })
      setHistorial([...nuevoHistorial, { role: 'assistant', content: data.respuesta }])
    } catch {
      setHistorial([...nuevoHistorial, { role: 'assistant', content: '⚠️ Error al conectar con el asistente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl z-50"
        title="Asistente IA"
      >
        {abierto ? '✕' : '🤖'}
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div className="fixed bottom-24 right-6 w-80 h-[450px] bg-white rounded-xl shadow-2xl border flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Asistente IA</div>
              <div className="text-xs text-blue-200">Conecta Inversión</div>
            </div>
            <button onClick={() => setHistorial([])} className="text-blue-200 hover:text-white text-xs">
              Limpiar
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {historial.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <div className="text-3xl mb-2">🤖</div>
                <p>¡Hola! Soy tu asistente de inversión.</p>
                <p className="text-xs mt-1">Pregúntame sobre proyectos, bancos o inversiones.</p>
              </div>
            )}
            {historial.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={enviar} className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !mensaje.trim()}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  )
}
