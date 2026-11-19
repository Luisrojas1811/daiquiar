import type { SiteContent } from '@/lib/content'
import { zoneForZip, type Zone } from '@/lib/shipping-zones'

// Cálculo único de totales: lo usan la tienda (para mostrar) y el servidor (para guardar).
export type ShippingMethod = 'caba' | 'country' | 'pickup'   // caba = moto · country = Correo Argentino · pickup = retiro
export type PaymentMethod = 'transfer' | 'cash'
export type Coupon = { code: string; type: 'percent' | 'fixed'; value: number; minTotal: number }
export type ShippingOption = { id: ShippingMethod; label: string; cost: number | null; enabled: boolean }

const num = (value: string | undefined) => Number(String(value ?? '').replace(',', '.')) || 0
const on = (value: string | undefined) => value === '1'

export const SHIPPING_NAMES: Record<string, string> = { caba: 'Moto', country: 'Correo Argentino', pickup: 'Retiro' }
export const PAYMENT_NAMES: Record<string, string> = { transfer: 'Transferencia', cash: 'Efectivo' }

// Opciones de envío para un código postal. Sin CP, el costo queda en null ("ingresá tu CP").
export function shippingOptions(content: SiteContent, zip = ''): ShippingOption[] {
  const zone: Zone | null = zoneForZip(zip)
  const hasZip = Boolean(zip.trim())
  const moto: ShippingOption = { id: 'caba', label: content.shipping_caba_label, cost: zone === 'caba' ? num(content.shipping_moto_caba_cost) : zone === 'amba' ? num(content.shipping_moto_amba_cost) : null, enabled: on(content.shipping_caba_enabled) && (!hasZip || zone === 'caba' || zone === 'amba') }
  const correo: ShippingOption = { id: 'country', label: content.shipping_country_label, cost: zone ? num(content[`shipping_zone_${zone}`]) : null, enabled: on(content.shipping_country_enabled) && (!hasZip || Boolean(zone)) }
  const pickup: ShippingOption = { id: 'pickup', label: content.shipping_pickup_label, cost: 0, enabled: on(content.shipping_pickup_enabled) }
  return [moto, correo, pickup].filter(option => option.enabled)
}

export function paymentOptions(content: SiteContent) {
  const discount = num(content.payment_transfer_discount)
  return ([
    { id: 'transfer', label: 'Transferencia', note: discount > 0 ? `${discount}% OFF` : '', enabled: on(content.payment_transfer_enabled) },
    { id: 'cash', label: 'Efectivo', note: '', enabled: on(content.payment_cash_enabled) },
  ] as { id: PaymentMethod; label: string; note: string; enabled: boolean }[]).filter(option => option.enabled)
}

export function computeTotals(content: SiteContent, subtotal: number, shipping: ShippingMethod | '', payment: PaymentMethod | '', coupon?: Coupon | null, zip = '') {
  const couponDiscount = coupon && subtotal >= coupon.minTotal
    ? Math.min(subtotal, coupon.type === 'percent' ? subtotal * coupon.value / 100 : coupon.value)
    : 0
  const afterCoupon = subtotal - couponDiscount
  const transferDiscount = payment === 'transfer' ? afterCoupon * num(content.payment_transfer_discount) / 100 : 0
  const freeFrom = num(content.shipping_free_from)
  const option = shippingOptions(content, zip).find(item => item.id === shipping)
  const freeShipping = freeFrom > 0 && subtotal >= freeFrom
  const shippingCost = option && !freeShipping ? option.cost ?? 0 : 0
  const discount = Math.round((couponDiscount + transferDiscount) * 100) / 100
  const total = Math.max(0, Math.round((subtotal - discount + shippingCost) * 100) / 100)
  return { subtotal, couponDiscount, transferDiscount, discount, shippingCost, freeShipping, freeFrom, total }
}

export const money = (value: number) => `$${Math.round(value).toLocaleString('es-AR')}`
