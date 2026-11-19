import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureSchema } from '@/lib/db/ensure'
import { getSiteContent } from '@/lib/settings'
import { computeTotals, paymentOptions, shippingOptions, type Coupon, type PaymentMethod, type ShippingMethod } from '@/lib/pricing'
import { findValidCoupon } from '@/lib/coupons'
import { fetchOrders } from '@/lib/orders'
import { sendOrderEmail } from '@/lib/email'
import { cleanColors, hasVariants, variantKey, variantKeys } from '@/lib/stock'

type OrderItem = { id: number; color: string; size: string; quantity: number }

export async function POST(request: Request) {
  try {
    await ensureSchema()
    const body = await request.json()
    const rawItems = Array.isArray(body.items) ? body.items : []
    const items: OrderItem[] = rawItems.map((item: unknown) => {
      const value = item as Record<string, unknown>
      return { id: Number(value.id), color: value.color == null ? '' : String(value.color), size: value.size == null ? '' : String(value.size), quantity: Number(value.quantity) }
    }).filter((item: OrderItem) => Number.isInteger(item.id) && item.id > 0 && item.quantity > 0 && Number.isInteger(item.quantity))
    if (!items.length || items.length !== rawItems.length) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })

    const customerName = String(body.customerName ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const customerEmail = String(body.customerEmail ?? '').trim()
    const customerAddress = String(body.customerAddress ?? '').trim().slice(0, 500)
    const customerZip = String(body.customerZip ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 8)
    const customerDni = String(body.customerDni ?? '').replace(/[^0-9A-Za-z]/g, '').slice(0, 20)
    const notes = String(body.notes ?? '').trim().slice(0, 1000)
    const content = await getSiteContent()

    // Envío y pago: si no vienen (carrito viejo), se usa la primera opción habilitada.
    const options = shippingOptions(content, customerZip)
    const chosen = options.find(option => option.id === body.shippingMethod) ?? options[0]
    const shipping = chosen?.id ?? ''
    const payment = (paymentOptions(content).find(option => option.id === body.paymentMethod) ?? paymentOptions(content)[0])?.id ?? ''
    if (!customerName || !customerPhone) return NextResponse.json({ error: 'Completá nombre y teléfono' }, { status: 400 })
    if (shipping !== 'pickup' && !customerAddress) return NextResponse.json({ error: 'Completá la dirección de entrega' }, { status: 400 })
    if (shipping !== 'pickup' && chosen?.cost == null) return NextResponse.json({ error: 'Ingresá un código postal válido para calcular el envío' }, { status: 400 })

    const order = await db.transaction(async tx => {
      const grouped = new Map<string, number>()
      for (const item of items) {
        const key = `${item.id}::${variantKey(item.color, item.size)}`
        grouped.set(key, (grouped.get(key) ?? 0) + item.quantity)
      }

      const products = new Map<number, { id: number; name: string; price: number; stock: number; image: string | null; sizes: string[]; colors: ReturnType<typeof cleanColors>; sizeStock: Record<string, number>; active: boolean }>()
      for (const item of items) {
        if (products.has(item.id)) continue
        const result = await tx.execute(sql`SELECT id, name, price, stock, image, sizes, colors, size_stock AS "sizeStock", active FROM products WHERE id = ${item.id} FOR UPDATE`)
        const row = result.rows[0]
        if (!row || row.active === false) throw new Error(`PRODUCT_NOT_FOUND:${item.id}`)
        const sizes = Array.isArray(row.sizes) ? row.sizes.map(String) : []
        const raw = row.sizeStock && typeof row.sizeStock === 'object' && !Array.isArray(row.sizeStock) ? row.sizeStock as Record<string, unknown> : {}
        products.set(item.id, { id: Number(row.id), name: String(row.name), price: Number(row.price), stock: Number(row.stock), image: row.image == null ? null : String(row.image), sizes, colors: cleanColors(row.colors), sizeStock: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Number(value) || 0])), active: true })
      }

      for (const [key, quantity] of grouped) {
        const [idText, ...sizeParts] = key.split('::')
        const product = products.get(Number(idText))!
        const variant = sizeParts.join('::')
        if (hasVariants(product)) {
          if (!variantKeys(product).includes(variant)) throw new Error(`INVALID_SIZE:${product.name}`)
          const available = product.sizeStock[variant]
          if (available === undefined || available < quantity) throw new Error(`INSUFFICIENT_SIZE_STOCK:${product.name}:${variant}`)
        } else if (product.stock < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`)
        }
      }

      const snapshotItems = items.map(item => {
        const product = products.get(item.id)!
        const colorImage = product.colors.find(c => c.name === item.color)?.image
        return { id: product.id, name: product.name, color: item.color, size: item.size, quantity: item.quantity, price: product.price, subtotal: product.price * item.quantity, image: colorImage ?? product.image }
      })
      const subtotal = snapshotItems.reduce((sum, item) => sum + item.subtotal, 0)

      let coupon: (Coupon & { id: number }) | null = null
      if (body.couponCode) {
        coupon = await findValidCoupon(String(body.couponCode), subtotal, tx)
        if (!coupon) throw new Error('INVALID_COUPON')
        await tx.execute(sql`UPDATE coupons SET uses = uses + 1 WHERE id = ${coupon.id}`)
      }
      const totals = computeTotals(content, subtotal, shipping as ShippingMethod, payment as PaymentMethod, coupon, customerZip)

      for (const [key, quantity] of grouped) {
        const [idText, ...sizeParts] = key.split('::')
        const id = Number(idText)
        const variant = sizeParts.join('::')
        const product = products.get(id)!
        if (hasVariants(product)) {
          const next = { ...product.sizeStock, [variant]: product.sizeStock[variant] - quantity }
          await tx.execute(sql`UPDATE products SET size_stock = ${JSON.stringify(next)}::jsonb WHERE id = ${id}`)
        } else {
          await tx.execute(sql`UPDATE products SET stock = stock - ${quantity} WHERE id = ${id}`)
        }
      }

      const result = await tx.execute(sql`
        INSERT INTO orders (customer_name, customer_phone, customer_email, customer_dni, customer_zip, customer_address, subtotal, discount, coupon_code, shipping_method, shipping_cost, payment_method, notes, total, items)
        VALUES (${customerName}, ${customerPhone}, ${customerEmail || null}, ${customerDni || null}, ${customerZip || null}, ${customerAddress || null}, ${subtotal}, ${totals.discount}, ${coupon?.code ?? null},
          ${shipping}, ${totals.shippingCost}, ${payment}, ${notes || null}, ${totals.total},
          ${JSON.stringify({ address: customerAddress, items: snapshotItems })}::jsonb)
        RETURNING id, status, created_at
      `)
      return { ...result.rows[0], id: Number(result.rows[0].id), ...totals, shippingMethod: shipping, paymentMethod: payment, items: snapshotItems }
    })

    // Aviso por email a la dueña con todo el detalle. Si falla, la compra igual queda guardada.
    const [saved] = await fetchOrders(sql`id = ${order.id}`)
    if (saved && await sendOrderEmail(saved, content.order_notify_email)) await db.execute(sql`UPDATE orders SET email_sent = true WHERE id = ${order.id}`)

    return NextResponse.json({ ...order, transferDetails: payment === 'transfer' ? content.payment_transfer_details : '' }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'INVALID_COUPON') return NextResponse.json({ error: 'El cupón no es válido o ya venció' }, { status: 409 })
    if (message.startsWith('PRODUCT_NOT_FOUND:')) return NextResponse.json({ error: 'Uno de los productos ya no está disponible' }, { status: 409 })
    if (message.startsWith('INVALID_SIZE:')) return NextResponse.json({ error: `El color o talle elegido ya no está disponible para ${message.split(':')[1]}` }, { status: 409 })
    if (message.startsWith('INSUFFICIENT_SIZE_STOCK:')) {
      const [, name, size] = message.split(':')
      return NextResponse.json({ error: `No hay stock suficiente de ${name} (${size})` }, { status: 409 })
    }
    if (message.startsWith('INSUFFICIENT_STOCK:')) return NextResponse.json({ error: `No hay stock suficiente de ${message.slice('INSUFFICIENT_STOCK:'.length)}` }, { status: 409 })
    console.error('Error al crear pedido', error)
    return NextResponse.json({ error: 'No se pudo guardar el pedido' }, { status: 500 })
  }
}
