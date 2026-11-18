import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { fetchOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    return NextResponse.json(await fetchOrders(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error al leer pedidos', error)
    return NextResponse.json({ error: 'No se pudieron leer los pedidos' }, { status: 500 })
  }
}
