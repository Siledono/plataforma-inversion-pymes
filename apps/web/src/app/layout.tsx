import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Conecta Inversión — Secretaría de Economía',
  description: 'Plataforma gubernamental que conecta PyMEs con bancos e inversionistas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
