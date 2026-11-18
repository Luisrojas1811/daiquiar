import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import type { Coupon } from '@/lib/pricing'

type Executor = Pick<typeof db, 'execute'>

export function mapCoupon(row: Record<string, unknown>) {
  return {
    id: Number(row.id), code: String(row.code), type: (row.type === 'fixed' ? 'fixed' : 'percent') as 'fixed' | 'percent',
    value: Number(row.value), minTotal: Number(row.min_total ?? row.minTotal ?? 0), maxUses: row.max_uses == null ? null : Number(row.max_uses),
    uses: Number(row.uses ?? 0), active: row.active !== false, expiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : null,
  }
}

// Devuelve el cupón si existe, está activo, no venció, no superó sus usos y el subtotal alcanza el mínimo.
export async function findValidCoupon(code: string, subtotal: number, executor: Executor = db): Promise<(Coupon & { id: number }) | null> {
  const clean = code.trim().toUpperCase()
  if (!clean) return null
  const result = await executor.execute(sql`SELECT * FROM coupons WHERE upper(code) = ${clean} LIMIT 1`)
  const row = result.rows[0]
  if (!row) return null
  const coupon = mapCoupon(row as Record<string, unknown>)
  if (!coupon.active) return null
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return null
  if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) return null
  if (subtotal < coupon.minTotal) return null
  return coupon
}
