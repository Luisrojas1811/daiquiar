import type { SiteContent } from '@/lib/content'

// Cálculo único de totales: lo usan el checkout (para mostrar) y el servidor (para guardar).
export type ShippingMethod = 'caba' | 'country' | 'pickup'
export type PaymentMethod = 'transfer' | 'cash'
export type Coupon = { code: string; type: 'percent' | 'fixed'; value: number; minTotal: number }

const num = (value: string | undefined) => Number(String(value ?? '').replace(',', '.')) || 0
const on = (value: string | undefined) => value === '1'

export const SHIPPING_NAMES: Record<string, string> = { caba: 'Envío CABA/GBA', country: 'Envío al país', pickup: 'Retiro' }
export const PAYMENT_NAMES: Record<string, string> = { transfer: 'Transferencia', cash: 'Efectivo' }

export function shippingOptions(content: SiteContent) {
  return ([
    { id: 'caba', label: content.shipping_caba_label, cost: num(content.shipping_caba_cost), enabled: on(content.shipping_caba_enabled) },
    { id: 'country', label: content.shipping_country_label, cost: num(content.shipping_country_cost), enabled: on(content.shipping_country_enabled) },
    { id: 'pickup', label: content.shipping_pickup_label, cost: 0, enabled: on(content.shipping_pickup_enabled) },
  ] as { id: ShippingMethod; label: string; cost: number; enabled: boolean }[]).filter(option => option.enabled)
}

export function paymentOptions(content: SiteContent) {
  const discount = num(content.payment_transfer_discount)
  return ([
    { id: 'transfer', label: 'Transferencia', note: discount > 0 ? `${discount}% OFF` : '', enabled: on(content.payment_transfer_enabled) },
    { id: 'cash', label: 'Efectivo', note: '', enabled: on(content.payment_cash_enabled) },
  ] as { id: PaymentMethod; label: string; note: string; enabled: boolean }[]).filter(option => option.enabled)
}

export function computeTotals(content: SiteContent, subtotal: number, shipping: ShippingMethod | '', payment: PaymentMethod | '', coupon?: Coupon | null) {
  const couponDiscount = coupon && subtotal >= coupon.minTotal
    ? Math.min(subtotal, coupon.type === 'percent' ? subtotal * coupon.value / 100 : coupon.value)
    : 0
  const afterCoupon = subtotal - couponDiscount
  const transferDiscount = payment === 'transfer' ? afterCoupon * num(content.payment_transfer_discount) / 100 : 0
  const freeFrom = num(content.shipping_free_from)
  const option = shippingOptions(content).find(item => item.id === shipping)
  const freeShipping = freeFrom > 0 && subtotal >= freeFrom
  const shippingCost = option && !freeShipping ? option.cost : 0
  const discount = Math.round((couponDiscount + transferDiscount) * 100) / 100
  const total = Math.max(0, Math.round((subtotal - discount + shippingCost) * 100) / 100)
  return { subtotal, couponDiscount, transferDiscount, discount, shippingCost, freeShipping, freeFrom, total, deposit: Math.round(total * num(content.payment_deposit_percent)) / 100 }
}

export const money = (value: number) => `$${Math.round(value).toLocaleString('es-AR')}`
