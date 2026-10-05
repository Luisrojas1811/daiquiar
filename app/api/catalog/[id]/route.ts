import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { fetchProducts } from '@/lib/catalog'
import { pgTextArray } from '@/lib/pg'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const result = await db.execute(sql`DELETE FROM products WHERE id = ${Number(id)} RETURNING id`)
  if (!result.rows[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  return NextResponse.json({ id: Number(result.rows[0].id) })
}

const toStockMap = (value: unknown, sizes?: string[]) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const keys = sizes ?? Object.keys(source)
  return Object.fromEntries(keys.map(size => [size, Math.max(0, Math.floor(Number(source[size]) || 0))]))
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const productId = Number(id)
  try {
    const body = await request.json()
    const set: ReturnType<typeof sql>[] = []

    if (body.name !== undefined) set.push(sql`name = ${String(body.name).trim()}`)
    if (body.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
      set.push(sql`price = ${price}`)
    }
    if (body.description !== undefined) set.push(sql`description = ${String(body.description)}`)
    if (body.color !== undefined) set.push(sql`color = ${String(body.color)}`)
    if (body.badge !== undefined) set.push(sql`badge = ${body.badge ? String(body.badge) : null}`)
    if (body.lowStockThreshold !== undefined) set.push(sql`low_stock_threshold = ${Math.max(1, Math.floor(Number(body.lowStockThreshold) || 3))}`)

    if (body.sizes !== undefined) {
      const sizes: string[] = Array.isArray(body.sizes) ? body.sizes.map(String).map((size: string) => size.trim()).filter(Boolean) : []
      set.push(sql`sizes = ${pgTextArray(sizes)}::text[]`)
      if (sizes.length) {
        set.push(sql`size_stock = ${JSON.stringify(toStockMap(body.sizeStock, sizes))}::jsonb`)
        set.push(sql`stock = 0`)
      } else {
        set.push(sql`size_stock = '{}'::jsonb`)
        if (body.stock !== undefined) set.push(sql`stock = ${Math.max(0, Math.floor(Number(body.stock) || 0))}`)
      }
    } else {
      if (body.stock !== undefined) set.push(sql`stock = ${Math.max(0, Math.floor(Number(body.stock) || 0))}`)
      if (body.sizeStock !== undefined) {
        if (!body.sizeStock || typeof body.sizeStock !== 'object' || Array.isArray(body.sizeStock)) return NextResponse.json({ error: 'Stock por talle inválido' }, { status: 400 })
        set.push(sql`size_stock = ${JSON.stringify(toStockMap(body.sizeStock))}::jsonb`)
      }
    }

    if (body.images !== undefined) {
      if (!Array.isArray(body.images)) return NextResponse.json({ error: 'Imágenes inválidas' }, { status: 400 })
      const images: string[] = body.images.map(String).filter(Boolean)
      set.push(sql`images = ${pgTextArray(images)}::text[]`)
      set.push(sql`image = ${images[0] ?? null}`)
    }

    if (body.category !== undefined) {
      const category = String(body.category).trim()
      if (category) {
        const categoryResult = await db.execute(sql`INSERT INTO categories (name) VALUES (${category}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`)
        set.push(sql`category_id = ${categoryResult.rows[0]?.id}`)
      }
    }

    const appendImages: string[] = Array.isArray(body.appendImages) ? body.appendImages.map(String).filter(Boolean) : []
    if (body.appendImages !== undefined && !Array.isArray(body.appendImages)) return NextResponse.json({ error: 'Imágenes inválidas' }, { status: 400 })
    if (!set.length && !appendImages.length) return NextResponse.json({ error: 'No hay cambios' }, { status: 400 })

    await db.transaction(async tx => {
      if (appendImages.length) {
        const current = await tx.execute(sql`SELECT image, images FROM products WHERE id = ${productId} FOR UPDATE`)
        if (!current.rows[0]) throw new Error('NOT_FOUND')
        const currentImages = Array.isArray(current.rows[0].images) ? current.rows[0].images.map(String) : []
        const merged = [...currentImages, ...appendImages]
        set.push(sql`images = ${pgTextArray(merged)}::text[]`)
        if (!current.rows[0].image) set.push(sql`image = ${merged[0]}`)
      }
      const result = await tx.execute(sql`UPDATE products SET ${sql.join(set, sql`, `)} WHERE id = ${productId} RETURNING id`)
      if (!result.rows[0]) throw new Error('NOT_FOUND')
    })

    const [product] = await fetchProducts(sql`p.id = ${productId}`)
    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    console.error('Error al actualizar producto', error)
    return NextResponse.json({ error: 'No se pudo actualizar el producto' }, { status: 500 })
  }
}
