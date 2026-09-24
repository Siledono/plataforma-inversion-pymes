'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  rol: 'empresa' | 'banco' | 'inversor' | 'admin'
}

const ROL_REDIRECT: Record<string, string> = {
  empresa: '/empresa/proyectos',
  banco: '/banco/solicitudes',
  inversor: '/inversor/explorar',
  admin: '/admin/estadisticas',
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data: any = await api.post('/auth/login', { email, password })
    if (data.requiereMfa) return { requiereMfa: true, userId: data.userId }
    if (data.requiereVerificacionDispositivo) return { requiereVerificacionDispositivo: true }
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const userObj: AuthUser = { id: '', email, rol: data.rol }
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    router.push(ROL_REDIRECT[data.rol] ?? '/')
    return data
  }, [router])

  const loginEFirma = useCallback(async (email: string, cerBase64: string, keyBase64: string, keyPassword: string) => {
    const data: any = await api.post('/auth/login/efirma', { email, cerBase64, keyBase64, keyPassword })
    if (data.requiereMfa) return { requiereMfa: true, userId: data.userId }
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const userObj: AuthUser = { id: '', email, rol: data.rol }
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    router.push(ROL_REDIRECT[data.rol] ?? '/')
    return data
  }, [router])

  const verificarTotp = useCallback(async (userId: string, codigo: string) => {
    const data: any = await api.post('/auth/totp/verificar', { userId, codigo })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const userObj: AuthUser = { id: userId, email: '', rol: data.rol }
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    router.push(ROL_REDIRECT[data.rol] ?? '/')
  }, [router])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignorar */ }
    localStorage.clear()
    setUser(null)
    router.push('/login')
  }, [router])

  return { user, loading, login, loginEFirma, verificarTotp, logout, ROL_REDIRECT }
}
