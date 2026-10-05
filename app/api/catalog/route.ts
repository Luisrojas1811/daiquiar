import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { fetchProducts } from '@/lib/catalog'
import { pgTextArray } from '@/lib/pg'

// El stock cambia con cada compra: esta ruta nunca debe quedar cacheada.
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET() {
  try {
    return NextResponse.json(await fetchProducts(), { headers: noStore })
  } catch (error) {
    console.error('Error al leer el catálogo', error)
    return NextResponse.json({ error: 'No se pudo leer el catálogo' }, { status: 500, headers: noStore })
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const category = String(body.category ?? '').trim()
    const price = Number(body.price)
    const stock = Math.max(0, Math.floor(Number(body.stock) || 0))
    const sizes: string[] = Array.isArray(body.sizes) ? body.sizes.map(String).map((size: string) => size.trim()).filter(Boolean) : []
    const sizeStock = sizes.length && body.sizeStock && typeof body.sizeStock === 'object' && !Array.isArray(body.sizeStock)
      ? Object.fromEntries(sizes.map(size => [size, Math.max(0, Math.floor(Number(body.sizeStock[size]) || 0))]))
      : {}
    const images: string[] = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : []
    const image = images[0] ?? (body.image ? String(body.image) : null)
    if (!name || !category || !Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const categoryResult = await db.execute(sql`
      INSERT INTO categories (name) VALUES (${category})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `)
    const categoryId = categoryResult.rows[0]?.id
    const inserted = await db.execute(sql`
      INSERT INTO products (name, category_id, price, old_price, color, image, images, badge, description, stock, low_stock_threshold, sizes, size_stock)
      VALUES (${name}, ${categoryId}, ${price}, ${body.oldPrice != null && body.oldPrice !== '' ? Number(body.oldPrice) : null},
        ${body.color ?? null}, ${image}, ${pgTextArray(images)}::text[], ${body.badge ?? null}, ${body.description ?? null}, ${sizes.length ? 0 : stock},
        ${Math.max(1, Math.floor(Number(body.lowStockThreshold) || 3))}, ${pgTextArray(sizes)}::text[], ${JSON.stringify(sizeStock)}::jsonb)
      RETURNING id
    `)
    const [product] = await fetchProducts(sql`p.id = ${Number(inserted.rows[0].id)}`)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto', error)
    return NextResponse.json({ error: 'No se pudo guardar el producto' }, { status: 500 })
  }
}
