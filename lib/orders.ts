import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureSchema } from '@/lib/db/ensure'

import { ORDER_STATUSES, ORDER_STATUS_IDS, type OrderStatus } from '@/lib/order-status'
export { ORDER_STATUSES, ORDER_STATUS_IDS, type OrderStatus }

export type OrderLine = { id: number; name: string; color?: string; size: string; quantity: number; price: number; subtotal: number; image: string | null }

export function mapOrder(row: Record<string, unknown>) {
  // Los pedidos viejos guardaban { address, items } dentro de "items"; los nuevos además tienen columnas propias.
  const raw = row.items as unknown
  const payload = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as { address?: string; items?: OrderLine[] } : { items: Array.isArray(raw) ? raw as OrderLine[] : [] }
  const items = (payload.items ?? []).map(item => ({ ...item, price: Number(item.price), subtotal: Number(item.subtotal), quantity: Number(item.quantity) }))
  const total = Number(row.total)
  return {
    id: Number(row.id),
    status: String(row.status ?? 'pending') as OrderStatus,
    customerName: String(row.customer_name ?? ''),
    customerPhone: String(row.customer_phone ?? ''),
    customerEmail: row.customer_email ? String(row.customer_email) : '',
    customerDni: row.customer_dni ? String(row.customer_dni) : '',
    customerZip: row.customer_zip ? String(row.customer_zip) : '',
    emailSent: row.email_sent === true,
    customerAddress: String(row.customer_address ?? payload.address ?? ''),
    items,
    subtotal: row.subtotal == null ? items.reduce((sum, item) => sum + item.subtotal, 0) : Number(row.subtotal),
    discount: Number(row.discount ?? 0),
    couponCode: row.coupon_code ? String(row.coupon_code) : '',
    shippingMethod: row.shipping_method ? String(row.shipping_method) : '',
    shippingCost: Number(row.shipping_cost ?? 0),
    paymentMethod: row.payment_method ? String(row.payment_method) : '',
    notes: row.notes ? String(row.notes) : '',
    adminNotes: row.admin_notes ? String(row.admin_notes) : '',
    total,
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }
}
export type AdminOrder = ReturnType<typeof mapOrder>

export async function fetchOrders(where?: ReturnType<typeof sql>) {
  await ensureSchema()
  const result = await db.execute(sql`SELECT * FROM orders ${where ? sql`WHERE ${where}` : sql``} ORDER BY created_at DESC, id DESC`)
  return result.rows.map(row => mapOrder(row as Record<string, unknown>))
}
