import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren sesión activa por prefijo
const RUTAS_PROTEGIDAS = ['/empresa', '/banco', '/inversor', '/admin']
// Rutas que solo pueden ver usuarios no autenticados
const RUTAS_AUTH = ['/login', '/registro']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('accessToken')?.value

  const esRutaProtegida = RUTAS_PROTEGIDAS.some((r) => pathname.startsWith(r))
  const esRutaAuth = RUTAS_AUTH.some((r) => pathname.startsWith(r))

  if (esRutaProtegida && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (esRutaAuth && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
