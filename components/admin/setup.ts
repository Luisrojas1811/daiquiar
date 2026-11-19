import type { SiteContent } from '@/lib/content'
import type { Product } from '@/lib/types'
import { totalStock } from '@/lib/stock'

// Pasos para dejar la tienda lista. Algunos se tildan solos (productos, email); el resto los marca la dueña al guardar.
export type SetupStep = {
  id: string
  title: string
  why: string
  keys?: string[]
  link?: { href: string; label: string }
  optional?: boolean
  auto?: (ctx: SetupContext) => boolean
}
export type SetupContext = { content: SiteContent; products: Product[]; emailReady: boolean }

export const isExampleImage = (url: string) => /images\.unsplash\.com/.test(url)
export const demoProducts = (products: Product[]) => products.filter(p => p.images.some(isExampleImage) || isExampleImage(p.image))

export const SETUP_STEPS: SetupStep[] = [
  { id: 'contacto', title: 'Datos de contacto', why: 'A este WhatsApp llegan los pedidos y las consultas. Se muestran en la tienda.', keys: ['whatsapp_number', 'instagram_url', 'store_location'] },
  { id: 'pagos', title: 'Cómo te pagan', why: 'Los datos para transferir aparecen cuando la clienta confirma la compra.', keys: ['payment_transfer_enabled', 'payment_transfer_details', 'payment_transfer_discount', 'payment_cash_enabled'] },
  { id: 'envios', title: 'Precios de envío', why: 'La clienta ve estos precios al poner su código postal. Hoy tienen valores de ejemplo.', keys: ['shipping_free_from', 'shipping_caba_enabled', 'shipping_moto_caba_cost', 'shipping_moto_amba_cost', 'shipping_country_enabled', 'shipping_zone_caba', 'shipping_zone_amba', 'shipping_zone_centro', 'shipping_zone_norte', 'shipping_zone_patagonia', 'shipping_pickup_enabled', 'shipping_pickup_label'] },
  { id: 'productos', title: 'Tus productos', why: 'Cargá tus prendas con fotos, colores y stock por talle. Las de ejemplo conviene ocultarlas.', link: { href: '/admin/productos/nuevo', label: 'Cargar un producto' },
    auto: ({ products }) => products.some(p => p.active && totalStock(p) > 0 && !demoProducts([p]).length) && !demoProducts(products).some(p => p.active) },
  { id: 'fotos', title: 'Fotos de la portada', why: 'La foto principal y la del banner bordó. Hoy son fotos de ejemplo de internet.', keys: ['hero_image', 'banner_image'] },
  { id: 'talles', title: 'Guía de talles', why: 'Las tablas que ve la clienta en cada producto. Hoy tienen medidas de ejemplo.', link: { href: '/admin/guia-de-talles', label: 'Editar guía de talles' } },
  { id: 'textos', title: 'Políticas y presentación', why: 'Cambios, medios de pago, envíos y el texto del pie de página.', keys: ['returns_text', 'payments_text', 'shipping_text', 'footer_text'] },
  { id: 'email', title: 'Aviso de pedidos por email', why: 'Para que cada compra te llegue al mail con todo el detalle.', keys: ['order_notify_email'],
    auto: ({ content, emailReady }) => emailReady && Boolean(content.order_notify_email?.trim()) },
  { id: 'categorias', title: 'Fotos de categorías', why: 'Opcional: si no subís una, se usa la foto de un producto de esa categoría.', link: { href: '/admin/categorias', label: 'Ir a Categorías' }, optional: true },
]

export function doneSteps(raw: string | undefined): string[] {
  try { const value = JSON.parse(raw ?? '[]'); return Array.isArray(value) ? value.map(String) : [] } catch { return [] }
}

export function setupStatus(ctx: SetupContext) {
  const marked = doneSteps(ctx.content.setup_done)
  const steps = SETUP_STEPS.map(step => ({ ...step, done: step.auto ? step.auto(ctx) : marked.includes(step.id) }))
  const required = steps.filter(s => !s.optional)
  return { steps, done: required.filter(s => s.done).length, total: required.length }
}
