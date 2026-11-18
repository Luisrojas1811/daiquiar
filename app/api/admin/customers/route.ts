import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { fetchOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'

// Las clientas se arman a partir de los pedidos (agrupadas por teléfono).
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const orders = await fetchOrders()
  const map = new Map<string, { key: string; name: string; phone: string; email: string; address: string; orders: number; spent: number; lastOrderAt: string; orderIds: number[] }>()
  for (const order of orders) {
    const key = order.customerPhone.replace(/\D/g, '') || order.customerName.toLowerCase()
    const entry = map.get(key) ?? { key, name: order.customerName, phone: order.customerPhone, email: order.customerEmail, address: order.customerAddress, orders: 0, spent: 0, lastOrderAt: order.createdAt, orderIds: [] }
    entry.orders += 1
    entry.orderIds.push(order.id)
    if (order.status !== 'cancelled') entry.spent += order.total
    if (!entry.email && order.customerEmail) entry.email = order.customerEmail
    map.set(key, entry)
  }
  return NextResponse.json([...map.values()].sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt)))
}
