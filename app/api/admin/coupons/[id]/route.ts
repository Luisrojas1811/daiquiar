import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { mapCoupon } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const set = []
  if (body.active !== undefined) set.push(sql`active = ${body.active === true}`)
  if (body.value !== undefined) set.push(sql`value = ${Math.max(0, Number(body.value) || 0)}`)
  if (body.minTotal !== undefined) set.push(sql`min_total = ${Math.max(0, Number(body.minTotal) || 0)}`)
  if (body.maxUses !== undefined) set.push(sql`max_uses = ${body.maxUses ? Math.floor(Number(body.maxUses)) : null}`)
  if (body.expiresAt !== undefined) set.push(sql`expires_at = ${body.expiresAt || null}`)
  if (!set.length) return NextResponse.json({ error: 'No hay cambios' }, { status: 400 })
  const result = await db.execute(sql`UPDATE coupons SET ${sql.join(set, sql`, `)} WHERE id = ${Number(id)} RETURNING *`)
  if (!result.rows[0]) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 })
  return NextResponse.json(mapCoupon(result.rows[0] as Record<string, unknown>))
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await db.execute(sql`DELETE FROM coupons WHERE id = ${Number(id)}`)
  return NextResponse.json({ ok: true })
}
