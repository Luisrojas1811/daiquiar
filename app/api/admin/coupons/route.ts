import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { ensureSchema } from '@/lib/db/ensure'
import { mapCoupon } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await ensureSchema()
  const result = await db.execute(sql`SELECT * FROM coupons ORDER BY created_at DESC`)
  return NextResponse.json(result.rows.map(row => mapCoupon(row as Record<string, unknown>)))
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await ensureSchema()
  const body = await request.json().catch(() => ({}))
  const code = String(body.code ?? '').trim().toUpperCase().replace(/\s+/g, '')
  const value = Number(body.value)
  const type = body.type === 'fixed' ? 'fixed' : 'percent'
  if (!code || !Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) return NextResponse.json({ error: 'Completá el código y un valor válido' }, { status: 400 })
  try {
    const result = await db.execute(sql`
      INSERT INTO coupons (code, type, value, min_total, max_uses, expires_at, active)
      VALUES (${code}, ${type}, ${value}, ${Math.max(0, Number(body.minTotal) || 0)}, ${body.maxUses ? Math.floor(Number(body.maxUses)) : null}, ${body.expiresAt || null}, ${body.active !== false})
      RETURNING *`)
    return NextResponse.json(mapCoupon(result.rows[0] as Record<string, unknown>), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ya existe un cupón con ese código' }, { status: 409 })
  }
}
