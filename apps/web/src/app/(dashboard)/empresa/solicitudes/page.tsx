'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface Solicitud {
  id: string
  estado: string
  montoSolicitado: number
  plazoMeses: number
  tasaInteresAnual?: number
  createdAt: string
  banco?: { nombreInstitucional: string }
  proyecto: { titulo: string }
}

export default function EmpresaSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ proyectoId: '', bancoId: '', montoSolicitado: '', plazoMeses: '' })
  const [enviando, setEnviando] = useState(false)
  const [proyectos, setProyectos] = useState<{ id: string; titulo: string }[]>([])
  const [bancos, setBancos] = useState<{ id: string; nombreInstitucional: string }[]>([])

  useEffect(() => {
    Promise.all([
      api.get<Solicitud[]>('/bancos/mis-solicitudes'),
      api.get<{ id: string; titulo: string }[]>('/proyectos/mis-proyectos'),
      api.get<{ id: string; nombreInstitucional: string }[]>('/bancos'),
    ]).then(([s, p, b]) => {
      setSolicitudes(s)
      setProyectos(p)
      setBancos(b)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      const nueva = await api.post<Solicitud>('/bancos/solicitudes', {
        proyectoId: form.proyectoId,
        bancoId: form.bancoId,
        montoSolicitado: Number(form.montoSolicitado),
        plazoMeses: Number(form.plazoMeses),
      })
      setSolicitudes((prev) => [nueva, ...prev])
      setShowForm(false)
      setForm({ proyectoId: '', bancoId: '', montoSolicitado: '', plazoMeses: '' })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes a Bancos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          {showForm ? 'Cancelar' : '+ Nueva Solicitud'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Enviar Solicitud a Banco</h2>
          <form onSubmit={enviarSolicitud} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <select required value={form.proyectoId} onChange={(e) => setForm((p) => ({ ...p, proyectoId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Selecciona un proyecto</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
              <select required value={form.bancoId} onChange={(e) => setForm((p) => ({ ...p, bancoId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Selecciona un banco</option>
                {bancos.map((b) => <option key={b.id} value={b.id}>{b.nombreInstitucional}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto solicitado ($)</label>
              <input type="number" required min={1} value={form.montoSolicitado}
                onChange={(e) => setForm((p) => ({ ...p, montoSolicitado: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="500000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plazo (meses)</label>
              <input type="number" required min={1} max={360} value={form.plazoMeses}
                onChange={(e) => setForm((p) => ({ ...p, plazoMeses: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="36" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={enviando}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {enviando ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-3">🏦</div>
          <p className="text-gray-500">No has enviado solicitudes a bancos aun</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-800">{s.proyecto.titulo}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                  {s.estado}
                </span>
              </div>
              {s.banco && <p className="text-sm text-gray-400 mb-1">{s.banco.nombreInstitucional}</p>}
              <div className="flex gap-6 text-sm text-gray-600">
                <span>Monto: <strong>${Number(s.montoSolicitado).toLocaleString()}</strong></span>
                <span>Plazo: <strong>{s.plazoMeses} meses</strong></span>
                {s.tasaInteresAnual && <span>Tasa aprobada: <strong>{s.tasaInteresAnual}% anual</strong></span>}
              </div>
              <p className="text-xs text-gray-400 mt-1">{new Date(s.createdAt).toLocaleDateString('es-MX')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
