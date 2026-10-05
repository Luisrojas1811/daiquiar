import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, createSessionToken } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const password = String(body.password ?? '')
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    return NextResponse.json({ error: 'El panel no está configurado (falta ADMIN_PASSWORD)' }, { status: 500 })
  }
  if (password !== expected) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const token = createSessionToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
