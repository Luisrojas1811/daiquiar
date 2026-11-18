import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'

// Estado de las integraciones (sin exponer secretos): para mostrar avisos en Configuración.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ email: Boolean(process.env.RESEND_API_KEY), emailFrom: process.env.EMAIL_FROM || 'onboarding@resend.dev', database: Boolean(process.env.DATABASE_URL) })
}
