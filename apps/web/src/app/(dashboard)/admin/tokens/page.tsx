'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Token {
  id: string
  token: string
  rolDestino: string
  usado: boolean
  createdAt: string
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [rolDestino, setRolDestino] = useState('empresa')
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Token[]>('/admin/tokens').then((d) => { setTokens(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const generarToken = async () => {
    setGenerando(true)
    setError('')
    try {
      const nuevo = await api.post<Token>('/admin/tokens', { rolDestino })
      setTokens((prev) => [nuevo, ...prev])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerando(false)
    }
  }

  const revocar = async (id: string) => {
    await api.delete(`/admin/tokens/${id}`)
    setTokens((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Tokens de Registro</h1>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Generar Nuevo Token</h2>
        {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol de destino</label>
            <select value={rolDestino} onChange={(e) => setRolDestino(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="empresa">Empresa</option>
              <option value="banco">Banco</option>
              <option value="inversor">Inversor</option>
            </select>
          </div>
          <button onClick={generarToken} disabled={generando}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {generando ? 'Generando...' : '+ Generar Token'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Todos los Tokens</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        ) : tokens.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">Sin tokens generados</div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Token', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-gray-700 break-all">{t.token}</code>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{t.rolDestino}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.usado ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                        {t.usado ? 'Usado' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString('es-MX')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!t.usado && (
                          <button onClick={() => navigator.clipboard.writeText(t.token)}
                            className="text-xs text-blue-600 hover:underline">Copiar</button>
                        )}
                        <button onClick={() => revocar(t.id)}
                          className="text-xs text-red-600 hover:underline">Revocar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
