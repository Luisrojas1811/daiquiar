import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { sql } from 'drizzle-orm'

export async function GET() {
  const result = await db.execute(sql`SELECT shipping_threshold AS "shippingThreshold" FROM store_settings WHERE id = 1`)
  const threshold = result.rows[0]?.shippingThreshold
  return NextResponse.json({ shippingThreshold: threshold == null ? 100000 : Number(threshold) })
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  const shippingThreshold = Number(body.shippingThreshold)
  if (!Number.isFinite(shippingThreshold) || shippingThreshold < 0) return NextResponse.json({ error: 'Monto mínimo inválido' }, { status: 400 })
  await db.execute(sql`
    INSERT INTO store_settings (id, shipping_threshold, updated_at)
    VALUES (1, ${shippingThreshold}, now())
    ON CONFLICT (id) DO UPDATE SET shipping_threshold = EXCLUDED.shipping_threshold, updated_at = now()
  `)
  return NextResponse.json({ shippingThreshold })
}
