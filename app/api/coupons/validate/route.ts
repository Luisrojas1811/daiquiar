import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db/ensure'
import { findValidCoupon } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

// Valida un cupón desde el checkout. El descuento definitivo lo vuelve a calcular el servidor al crear el pedido.
export async function POST(request: Request) {
  try {
    await ensureSchema()
    const body = await request.json().catch(() => ({}))
    const coupon = await findValidCoupon(String(body.code ?? ''), Number(body.subtotal) || 0)
    if (!coupon) return NextResponse.json({ error: 'Cupón inválido, vencido o el monto no alcanza el mínimo' }, { status: 404 })
    return NextResponse.json({ code: coupon.code, type: coupon.type, value: coupon.value, minTotal: coupon.minTotal })
  } catch (error) {
    console.error('Error al validar cupón', error)
    return NextResponse.json({ error: 'No se pudo validar el cupón' }, { status: 500 })
  }
}
