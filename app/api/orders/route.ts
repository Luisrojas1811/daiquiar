import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

type OrderItem = { id: number; size: string; quantity: number }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawItems = Array.isArray(body.items) ? body.items : []
    const items: OrderItem[] = rawItems.map((item: unknown) => {
      const value = item as Record<string, unknown>
      return { id: Number(value.id), size: value.size == null ? '' : String(value.size), quantity: Number(value.quantity) }
    }).filter((item: OrderItem) => Number.isInteger(item.id) && item.id > 0 && item.quantity > 0 && Number.isInteger(item.quantity))
    if (!items.length || items.length !== rawItems.length) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })

    const customerName = String(body.customerName ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const customerAddress = String(body.customerAddress ?? '').trim()
    if (!customerName || !customerPhone || !customerAddress) return NextResponse.json({ error: 'Completá nombre, teléfono y dirección' }, { status: 400 })

    const order = await db.transaction(async tx => {
      const grouped = new Map<string, number>()
      for (const item of items) {
        const key = `${item.id}::${item.size}`
        grouped.set(key, (grouped.get(key) ?? 0) + item.quantity)
      }

      const products = new Map<number, { id: number; name: string; price: number; stock: number; image: string | null; sizes: string[]; sizeStock: Record<string, number> }>()
      for (const item of items) {
        if (products.has(item.id)) continue
        const result = await tx.execute(sql`SELECT id, name, price, stock, image, sizes, size_stock AS "sizeStock" FROM products WHERE id = ${item.id} FOR UPDATE`)
        const row = result.rows[0]
        if (!row) throw new Error(`PRODUCT_NOT_FOUND:${item.id}`)
        const sizes = Array.isArray(row.sizes) ? row.sizes.map(String) : []
        const raw = row.sizeStock && typeof row.sizeStock === 'object' && !Array.isArray(row.sizeStock) ? row.sizeStock as Record<string, unknown> : {}
        products.set(item.id, { id: Number(row.id), name: String(row.name), price: Number(row.price), stock: Number(row.stock), image: row.image == null ? null : String(row.image), sizes, sizeStock: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Number(value) || 0])) })
      }

      for (const [key, quantity] of grouped) {
        const [idText, ...sizeParts] = key.split('::')
        const id = Number(idText)
        const size = sizeParts.join('::')
        const product = products.get(id)!
        if (product.sizes.length) {
          if (!product.sizes.includes(size)) throw new Error(`INVALID_SIZE:${product.name}`)
          const available = product.sizeStock[size]
          if (available === undefined || available < quantity) throw new Error(`INSUFFICIENT_SIZE_STOCK:${product.name}:${size}`)
        } else if (product.stock < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`)
        }
      }

      const snapshotItems = items.map(item => {
        const product = products.get(item.id)!
        return { id: product.id, name: product.name, size: item.size, quantity: item.quantity, price: product.price, subtotal: product.price * item.quantity, image: product.image }
      })
      const total = snapshotItems.reduce((sum, item) => sum + item.subtotal, 0)

      for (const [key, quantity] of grouped) {
        const [idText, ...sizeParts] = key.split('::')
        const id = Number(idText)
        const size = sizeParts.join('::')
        const product = products.get(id)!
        if (product.sizes.length) {
          const next = { ...product.sizeStock, [size]: product.sizeStock[size] - quantity }
          await tx.execute(sql`UPDATE products SET size_stock = ${JSON.stringify(next)}::jsonb WHERE id = ${id}`)
        } else {
          await tx.execute(sql`UPDATE products SET stock = stock - ${quantity} WHERE id = ${id}`)
        }
      }

      const result = await tx.execute(sql`
        INSERT INTO orders (customer_name, customer_phone, total, items)
        VALUES (${customerName}, ${customerPhone}, ${total}, ${JSON.stringify({ address: customerAddress, items: snapshotItems })}::jsonb)
        RETURNING id, status, created_at
      `)
      return { ...result.rows[0], id: Number(result.rows[0].id), total, items: snapshotItems }
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.startsWith('PRODUCT_NOT_FOUND:')) return NextResponse.json({ error: 'Uno de los productos ya no está disponible' }, { status: 409 })
    if (message.startsWith('INVALID_SIZE:')) return NextResponse.json({ error: `El talle elegido ya no está disponible para ${message.split(':')[1]}` }, { status: 409 })
    if (message.startsWith('INSUFFICIENT_SIZE_STOCK:')) {
      const [, name, size] = message.split(':')
      return NextResponse.json({ error: `No hay stock suficiente de ${name} en talle ${size}` }, { status: 409 })
    }
    if (message.startsWith('INSUFFICIENT_STOCK:')) return NextResponse.json({ error: `No hay stock suficiente de ${message.slice('INSUFFICIENT_STOCK:'.length)}` }, { status: 409 })
    console.error('Error al crear pedido', error)
    return NextResponse.json({ error: 'No se pudo guardar el pedido' }, { status: 500 })
  }
}
