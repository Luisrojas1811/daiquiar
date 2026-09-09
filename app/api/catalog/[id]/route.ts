import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const stock = Math.max(0, Number(body.stock))
  if (!Number.isInteger(stock)) return NextResponse.json({ error: 'Stock inválido' }, { status: 400 })
  const result = await db.execute(sql`UPDATE products SET stock = ${stock} WHERE id = ${Number(id)} RETURNING id, stock`)
  if (!result.rows[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  return NextResponse.json(result.rows[0])
}
