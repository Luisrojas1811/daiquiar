import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { fetchOrders } from '@/lib/orders'
import { fetchProducts, totalStock } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

// Números del Inicio del panel: ventas, pedidos por atender, stock bajo y más vendidos.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [orders, products] = await Promise.all([fetchOrders(), fetchProducts()])
  const valid = orders.filter(order => order.status !== 'cancelled')
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const inRange = (from: number, to: number) => valid.filter(order => { const t = new Date(order.createdAt).getTime(); return t >= from && t < to })
  const month = inRange(monthStart, Infinity)
  const prevMonth = inRange(prevMonthStart, monthStart)
  const sum = (list: typeof valid) => list.reduce((total, order) => total + order.total, 0)

  // Ventas de los últimos 14 días para el gráfico.
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + index)
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    const list = inRange(day.getTime(), next.getTime())
    return { date: day.toISOString().slice(0, 10), total: sum(list), orders: list.length }
  })

  const sold = new Map<number, { id: number; name: string; image: string | null; units: number; revenue: number }>()
  for (const order of valid) for (const item of order.items) {
    const entry = sold.get(item.id) ?? { id: item.id, name: item.name, image: item.image, units: 0, revenue: 0 }
    entry.units += item.quantity; entry.revenue += item.subtotal
    sold.set(item.id, entry)
  }

  const lowStock = products.filter(product => {
    if (!product.active) return false
    if (product.sizes.length) return product.sizes.some(size => (product.sizeStock[size] ?? 0) <= product.lowStockThreshold)
    return product.stock <= product.lowStockThreshold
  }).map(product => ({ id: product.id, name: product.name, image: product.image, total: totalStock(product), sizes: product.sizes.map(size => ({ size, stock: product.sizeStock[size] ?? 0 })), stock: product.stock, threshold: product.lowStockThreshold }))

  return NextResponse.json({
    monthRevenue: sum(month), prevMonthRevenue: sum(prevMonth), monthOrders: month.length, prevMonthOrders: prevMonth.length,
    averageTicket: month.length ? sum(month) / month.length : 0,
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    toShip: orders.filter(order => order.status === 'confirmed' || order.status === 'paid').length,
    activeProducts: products.filter(product => product.active).length, hiddenProducts: products.filter(product => !product.active).length,
    days, topProducts: [...sold.values()].sort((a, b) => b.units - a.units).slice(0, 5), lowStock: lowStock.slice(0, 8), lowStockCount: lowStock.length,
    recentOrders: orders.slice(0, 6),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
