import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(request: Request) {
  const body = await request.json()
  const items = Array.isArray(body.items) ? body.items : []
  const total = Number(body.total)
  if (!items.length || !Number.isFinite(total) || total < 0) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  const result = await db.execute(sql`INSERT INTO orders (customer_name, customer_phone, total, items) VALUES (${body.customerName ?? null}, ${body.customerPhone ?? null}, ${total}, ${JSON.stringify(items)}::jsonb) RETURNING id, status, created_at`)
  return NextResponse.json(result.rows[0], { status: 201 })
}
