import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { fetchOrders, mapOrder, ORDER_STATUS_IDS } from '@/lib/orders'
import { variantKey } from '@/lib/stock'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const [order] = await fetchOrders(sql`id = ${Number(id)}`)
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  return NextResponse.json(order)
}

// Cambia estado y notas internas. Al CANCELAR, el stock vuelve automáticamente a la tienda.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const orderId = Number(id)
  const body = await request.json().catch(() => ({}))
  if (body.status !== undefined && !ORDER_STATUS_IDS.includes(String(body.status))) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  try {
    await db.transaction(async tx => {
      const current = await tx.execute(sql`SELECT * FROM orders WHERE id = ${orderId} FOR UPDATE`)
      if (!current.rows[0]) throw new Error('NOT_FOUND')
      const order = mapOrder(current.rows[0] as Record<string, unknown>)
      if (body.status !== undefined && body.status !== order.status) {
        if (order.status === 'cancelled') throw new Error('CANCELLED')
        if (body.status === 'cancelled') {
          for (const item of order.items) {
            const key = variantKey(item.color ?? '', item.size)
            if (key) await tx.execute(sql`UPDATE products SET size_stock = jsonb_set(size_stock, ARRAY[${key}], to_jsonb(COALESCE((size_stock->>${key})::int, 0) + ${item.quantity})) WHERE id = ${item.id} AND size_stock ? ${key}`)
            else await tx.execute(sql`UPDATE products SET stock = stock + ${item.quantity} WHERE id = ${item.id}`)
          }
        }
        await tx.execute(sql`UPDATE orders SET status = ${String(body.status)}, updated_at = now() WHERE id = ${orderId}`)
      }
      if (body.adminNotes !== undefined) await tx.execute(sql`UPDATE orders SET admin_notes = ${String(body.adminNotes).slice(0, 2000)}, updated_at = now() WHERE id = ${orderId}`)
    })
    const [order] = await fetchOrders(sql`id = ${orderId}`)
    return NextResponse.json(order)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    if (message === 'CANCELLED') return NextResponse.json({ error: 'Un pedido cancelado no se puede reabrir (el stock ya se devolvió). Creá uno nuevo.' }, { status: 409 })
    console.error('Error al actualizar pedido', error)
    return NextResponse.json({ error: 'No se pudo actualizar el pedido' }, { status: 500 })
  }
}
