'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Banco { id: string; nombreInstitucional: string; claveBanxico: string; rfc: string; suspendido: boolean; user: { email: string } }

// Dashboard Admin: Gestión de bancos
export default function AdminBancosPage() {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<any[]>([])
  const [generando, setGenerando] = useState(false)
  const [rolToken, setRolToken] = useState('banco')

  useEffect(() => {
    Promise.all([
      api.get<Banco[]>('/admin/bancos'),
      api.get<any[]>('/admin/tokens'),
    ]).then(([b, t]) => { setBancos(b); setTokens(t); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const toggleSuspender = async (id: string, suspendido: boolean) => {
    await api.patch(`/admin/bancos/${id}/suspender`)
    setBancos((prev) => prev.map((b) => b.id === id ? { ...b, suspendido: !suspendido } : b))
  }

  const generarToken = async () => {
    setGenerando(true)
    try {
      const data: any = await api.post('/admin/tokens', { rolDestino: rolToken })
      setTokens((prev) => [data, ...prev])
    } catch (e: any) { alert(e.message) }
    setGenerando(false)
  }

  return (
    <div className="space-y-8">
      {/* Generar token */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔑 Generar Token de Registro</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol de destino</label>
            <select value={rolToken} onChange={(e) => setRolToken(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="empresa">Empresa</option>
              <option value="banco">Banco</option>
              <option value="inversor">Inversor</option>
            </select>
          </div>
          <button onClick={generarToken} disabled={generando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {generando ? 'Generando...' : '+ Generar Token'}
          </button>
        </div>
        {tokens.length > 0 && (
          <div className="mt-4 space-y-2">
            {tokens.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <code className="flex-1 font-mono text-xs text-gray-700 break-all">{t.token}</code>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.usado ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                  {t.usado ? 'Usado' : 'Activo'}
                </span>
                <span className="text-xs text-gray-400 capitalize">{t.rolDestino}</span>
                {!t.usado && (
                  <button onClick={() => navigator.clipboard.writeText(t.token)} className="text-xs text-blue-600 hover:underline">Copiar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de bancos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🏦 Bancos Registrados</h2>
        {loading ? <div className="text-center py-8 text-gray-400">Cargando...</div> : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Institución', 'Clave Banxico', 'RFC', 'Email', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bancos.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.nombreInstitucional}</td>
                    <td className="px-4 py-3 text-gray-500">{b.claveBanxico}</td>
                    <td className="px-4 py-3 text-gray-500">{b.rfc}</td>
                    <td className="px-4 py-3 text-gray-500">{b.user?.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.suspendido ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {b.suspendido ? 'Suspendido' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSuspender(b.id, b.suspendido)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${b.suspendido ? 'text-green-600 border-green-300 hover:bg-green-50' : 'text-red-600 border-red-300 hover:bg-red-50'}`}
                      >
                        {b.suspendido ? 'Reactivar' : 'Suspender'}
                      </button>
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
