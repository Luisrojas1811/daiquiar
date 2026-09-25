import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const result = await db.execute(sql`
    SELECT p.id, p.name, c.name AS category, p.price, p.old_price AS "oldPrice", p.color,
      p.image, p.badge, p.description, p.stock, p.low_stock_threshold AS "lowStockThreshold", p.sizes
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
  `)
  return NextResponse.json(result.rows.map(row => ({ ...row, price: Number(row.price), oldPrice: row.oldPrice == null ? undefined : Number(row.oldPrice), stock: Number(row.stock), lowStockThreshold: Number(row.lowStockThreshold) })))
}

export async function POST(request: Request) {
  const body = await request.json()
  const name = String(body.name ?? '').trim()
  const category = String(body.category ?? '').trim()
  const price = Number(body.price)
  const stock = Math.max(0, Number(body.stock) || 0)
  const sizes = Array.isArray(body.sizes) ? body.sizes.map(String).filter(Boolean) : []
  if (!name || !category || !Number.isFinite(price)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const result = await db.execute(sql`
    INSERT INTO categories (name) VALUES (${category}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `)
  const categoryId = result.rows[0]?.id
  const product = await db.execute(sql`
    INSERT INTO products (name, category_id, price, old_price, color, image, badge, description, stock, low_stock_threshold, sizes)
    VALUES (${name}, ${categoryId}, ${price}, ${body.oldPrice ? Number(body.oldPrice) : null}, ${body.color ?? null}, ${body.image ?? null}, ${body.badge ?? null}, ${body.description ?? null}, ${stock}, ${Math.max(1, Number(body.lowStockThreshold) || 3)}, ${sizes})
    RETURNING *
  `)
  const created = product.rows[0]
  return NextResponse.json({ ...created, price: Number(created.price), oldPrice: created.oldPrice == null ? undefined : Number(created.oldPrice), stock: Number(created.stock), lowStockThreshold: Number(created.lowStockThreshold) }, { status: 201 })
}
