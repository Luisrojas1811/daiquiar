'use client'

import { useStore } from '@/components/store'
import { money } from '@/lib/pricing'
import { ShippingCalculator } from '@/components/shop/shipping-calculator'
import { SizeGuideTables } from '@/components/shop/size-guide'

export default function HelpPage() {
  const { content } = useStore()
  const faqs = [1, 2, 3].map(n => ({ q: content[`faq_${n}_question`], a: content[`faq_${n}_answer`] })).filter(f => f.q)
  const section = 'scroll-mt-28 border-b border-border py-10'
  const h2 = 'font-display text-2xl font-semibold text-primary'
  return <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <h1 className="font-display text-5xl font-semibold text-primary">Ayuda</h1>
    <p className="mt-2 text-muted-foreground">Todo lo que necesitás saber para comprar en Daiquiar.</p>
    <div id="como-comprar" className={section}><h2 className={h2}>Cómo comprar</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/80"><li>Elegí tus prendas y el talle, y tocá “{content.add_to_cart_label}”.</li><li>En el carrito tocá “Iniciar compra”.</li><li>Completá tus datos y elegí cómo recibirlo.</li><li>Elegí el medio de pago y tocá “Finalizar compra”.</li><li>Te contactamos por WhatsApp para confirmar el pago y coordinar la entrega.</li></ol></div>
    <div id="pagos" className={section}><h2 className={h2}>{content.payments_title}</h2><p className="mt-4 text-foreground/80">{content.payments_text}</p>{Number(content.payment_transfer_discount) > 0 && <p className="mt-2 font-semibold text-primary">{content.payment_transfer_discount}% de descuento pagando por transferencia.</p>}</div>
    <div id="envios" className={section}><h2 className={h2}>{content.shipping_title}</h2><p className="mt-4 text-foreground/80">{content.shipping_text}</p><div className="mt-4"><ShippingCalculator /></div>{Number(content.shipping_free_from) > 0 && <p className="mt-3 text-sm font-semibold text-primary">Envío gratis desde {money(Number(content.shipping_free_from))}.</p>}</div>
    <div id="cambios" className={section}><h2 className={h2}>{content.returns_title}</h2><p className="mt-4 text-foreground/80">{content.returns_text}</p></div>
    <div id="talles" className={section}><h2 className={h2}>Guía de talles</h2><div className="mt-4"><SizeGuideTables raw={content.size_guide_tables} /></div></div>
    <div id="faq" className="scroll-mt-28 py-10"><h2 className={h2}>{content.faq_title}</h2><div className="mt-4 space-y-3">{faqs.map(f => <details key={f.q} className="rounded-xl border border-border bg-card px-5 py-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-3 text-foreground/80">{f.a}</p></details>)}</div></div>
  </section>
}
