'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Copy, Lock, ShoppingBag, Tag } from 'lucide-react'
import { EMPTY_IMAGE, Logo, WhatsAppIcon, colorImage, lineKey, useStore } from '@/components/store'
import { ZONE_NAMES, zoneForZip } from '@/lib/shipping-zones'
import { computeTotals, money, PAYMENT_NAMES, paymentOptions, shippingOptions, type Coupon, type PaymentMethod, type ShippingMethod } from '@/lib/pricing'
import { cn } from '@/lib/utils'

// Checkout en pasos, como Tiendanube:  1 Entrega → 2 Pago → 3 ¡Listo! (confirmación)
type Form = { email: string; firstName: string; lastName: string; phone: string; dni: string; street: string; number: string; floor: string; city: string; province: string; zip: string; notes: string }
const EMPTY: Form = { email: '', firstName: '', lastName: '', phone: '', dni: '', street: '', number: '', floor: '', city: '', province: '', zip: '', notes: '' }
const FORM_KEY = 'daiquiar_checkout_v1'
type Done = { id: number; total: number; paymentMethod: string; transferDetails: string; whatsappText: string }

const input = 'h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/10'
function F({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={cn('block', className)}><span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span><input {...props} className={input} /></label>
}
function Option({ checked, onSelect, title, detail, right }: { checked: boolean; onSelect: () => void; title: string; detail?: string; right?: string }) {
  return <button type="button" onClick={onSelect} className={cn('flex w-full items-center gap-4 rounded-xl border bg-card px-4 py-4 text-left transition', checked ? 'border-primary ring-2 ring-primary/15' : 'border-border hover:border-primary/40')}>
    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', checked ? 'border-primary' : 'border-border')}>{checked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}</span>
    <span className="flex-1"><span className="block text-[15px] font-semibold">{title}</span>{detail && <span className="block text-xs text-muted-foreground">{detail}</span>}</span>
    {right && <span className="text-sm font-bold">{right}</span>}
  </button>
}

export default function CheckoutPage() {
  const { cartLines, subtotal, content, clearCart, refreshCatalog, zip: savedZip, setZip } = useStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<Form>(EMPTY)
  const [shipping, setShipping] = useState<ShippingMethod | ''>('')
  const [payment, setPayment] = useState<PaymentMethod | ''>('')
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<Done | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { try { setForm({ ...EMPTY, ...JSON.parse(localStorage.getItem(FORM_KEY) ?? '{}') }) } catch {} }, [])
  useEffect(() => { try { const { notes, ...rest } = form; localStorage.setItem(FORM_KEY, JSON.stringify(rest)) } catch {} }, [form]) // eslint-disable-line @typescript-eslint/no-unused-vars
  // El CP que la clienta ya calculó en el producto o el carrito se usa acá; si lo cambia, se guarda.
  useEffect(() => { if (savedZip) setForm(f => (f.zip ? f : { ...f, zip: savedZip })) }, [savedZip])
  const zone = zoneForZip(form.zip)
  const shippingList = shippingOptions(content, zone ? form.zip : ''); const paymentList = paymentOptions(content)
  useEffect(() => { if (zone) setZip(form.zip.trim().toUpperCase()) }, [form.zip]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if ((!shipping || !shippingList.some(o => o.id === shipping)) && shippingList[0]) setShipping(shippingList[0].id); if (!payment && paymentList[0]) setPayment(paymentList[0].id) }, [content, form.zip]) // eslint-disable-line react-hooks/exhaustive-deps
  const totals = useMemo(() => computeTotals(content, subtotal, shipping, payment, coupon, zone ? form.zip : ''), [content, subtotal, shipping, payment, coupon, form.zip, zone])
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  const pickup = shipping === 'pickup'

  async function applyCoupon() {
    setCouponError('')
    const response = await fetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode, subtotal }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) { setCoupon(null); setCouponError(data.error || 'Cupón inválido'); return }
    setCoupon(data)
  }

  function next() {
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Ingresá un email válido.')
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) return setError('Completá nombre, apellido y teléfono.')
    if (!shipping) return setError('Elegí cómo querés recibir tu pedido.')
    if (!pickup && !zone) return setError('Ingresá un código postal válido para calcular el envío.')
    if (!pickup && (!form.street.trim() || !form.number.trim() || !form.city.trim() || !form.province.trim() || !form.zip.trim())) return setError('Completá la dirección de entrega.')
    setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function finish() {
    setError(''); if (!payment) return setError('Elegí un medio de pago.')
    setLoading(true)
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`
    const address = pickup ? '' : `${form.street} ${form.number}${form.floor ? `, ${form.floor}` : ''}, ${form.city}, ${form.province} (CP ${form.zip})`
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        customerName: name, customerPhone: form.phone, customerEmail: form.email, customerDni: form.dni, customerAddress: address,
        shippingMethod: shipping, paymentMethod: payment, couponCode: coupon?.code, notes: form.notes,
        customerZip: pickup ? '' : form.zip,
        items: cartLines.map(line => ({ id: line.id, color: line.color, size: line.size, quantity: line.quantity })),
      }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'No se pudo confirmar el pedido.'); refreshCatalog(); return }
      const lines = data.items.map((i: { name: string; color?: string; size: string; quantity: number; subtotal: number }) => `• ${i.name}${i.color ? ` · ${i.color}` : ''} · Talle ${i.size || 'Único'} · x${i.quantity} — ${money(i.subtotal)}`).join('\n')
      const whatsappText = `${content.whatsapp_intro} #${data.id}:\n\n${lines}\n\nTotal: ${money(data.total)} (${PAYMENT_NAMES[data.paymentMethod] ?? ''})\nNombre: ${name}\n${address ? `Dirección: ${address}\n` : 'Retiro en persona\n'}Teléfono: ${form.phone}`
      setDone({ id: data.id, total: data.total, paymentMethod: data.paymentMethod, transferDetails: data.transferDetails, whatsappText })
      clearCart(); refreshCatalog(); window.scrollTo({ top: 0 })
    } catch { setError('No se pudo conectar. Probá de nuevo en unos segundos.') } finally { setLoading(false) }
  }

  const header = <header className="border-b border-border bg-background"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"><Logo className="text-2xl" /><span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lock size={13} />Compra segura</span></div></header>

  // Paso 3: confirmación
  if (done) {
    const whatsapp = `https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(done.whatsappText)}`
    return <>{header}<section className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={30} /></div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-primary md:text-4xl">¡Gracias por tu compra!</h1>
      <p className="mt-2 text-muted-foreground">Tu pedido <b className="text-foreground">#{done.id}</b> quedó registrado. Te enviamos el detalle y nos vamos a contactar para coordinar.</p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
        <div className="flex justify-between text-sm"><span>Total</span><b>{money(done.total)}</b></div>
        {done.transferDetails && <div className="mt-5 rounded-xl bg-secondary p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Datos para transferir</p><p className="mt-2 text-sm whitespace-pre-line">{done.transferDetails}</p>
          <button onClick={() => { navigator.clipboard.writeText(done.transferDetails); setCopied(true) }} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copiado' : 'Copiar datos'}</button></div>}
      </div>
      <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 text-sm font-bold text-white hover:brightness-105"><WhatsAppIcon size={20} />{done.transferDetails ? 'Enviar comprobante por WhatsApp' : 'Coordinar por WhatsApp'}</a>
      <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">Volver a la tienda</Link>
    </section></>
  }

  if (!cartLines.length) return <>{header}<section className="mx-auto max-w-md px-4 py-24 text-center"><ShoppingBag size={40} className="mx-auto text-muted-foreground" /><h1 className="mt-4 text-2xl font-bold">Tu carrito está vacío</h1><Link href="/productos" className="mt-6 inline-block rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground">Ver productos</Link></section></>

  const summary = <div className="space-y-4">
    <ul className="space-y-4">{cartLines.map(line => <li key={lineKey(line)} className="flex items-center gap-3">
      <div className="relative"><img src={colorImage(line.product, line.color) || EMPTY_IMAGE} alt="" className="h-16 w-14 rounded-lg object-cover" /><span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">{line.quantity}</span></div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{line.product.name}</p><p className="text-xs text-muted-foreground">{line.color && `${line.color} · `}Talle {line.size || 'Único'}</p></div>
      <span className="text-sm font-semibold">{money(line.product.price * line.quantity)}</span>
    </li>)}</ul>
    <div className="border-t border-border pt-4">{coupon ? <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"><span className="flex items-center gap-2 font-semibold text-primary"><Tag size={14} />{coupon.code}</span><button onClick={() => { setCoupon(null); setCouponCode('') }} className="text-xs text-muted-foreground underline">Quitar</button></div>
      : <div className="flex gap-2"><input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Cupón de descuento" className={cn(input, 'h-11')} /><button onClick={applyCoupon} disabled={!couponCode} className="rounded-lg border border-primary px-4 text-sm font-semibold text-primary disabled:opacity-40">Aplicar</button></div>}
      {couponError && <p className="mt-1.5 text-xs text-primary">{couponError}</p>}</div>
    <dl className="space-y-2 border-t border-border pt-4 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
      {totals.couponDiscount > 0 && <div className="flex justify-between text-primary"><dt>Cupón {coupon?.code}</dt><dd>−{money(totals.couponDiscount)}</dd></div>}
      {totals.transferDiscount > 0 && <div className="flex justify-between text-primary"><dt>Descuento transferencia</dt><dd>−{money(totals.transferDiscount)}</dd></div>}
      <div className="flex justify-between"><dt className="text-muted-foreground">Envío</dt><dd>{totals.freeShipping && !pickup ? <span className="font-semibold text-primary">¡Gratis!</span> : totals.shippingCost ? money(totals.shippingCost) : pickup ? 'Sin cargo' : '—'}</dd></div>
      <div className="flex justify-between border-t border-border pt-3 text-lg font-bold"><dt>Total</dt><dd>{money(totals.total)}</dd></div>
    </dl>
  </div>

  const steps = ['Entrega', 'Pago', 'Confirmación']
  return <>{header}
    <div className="border-b border-border bg-secondary/50 lg:hidden"><button onClick={() => setSummaryOpen(o => !o)} className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-sm sm:px-6"><span className="flex items-center gap-2 font-semibold text-primary"><ShoppingBag size={16} />{summaryOpen ? 'Ocultar' : 'Ver'} resumen <ChevronDown size={15} className={cn('transition', summaryOpen && 'rotate-180')} /></span><b className="text-base">{money(totals.total)}</b></button>{summaryOpen && <div className="px-4 pb-5 sm:px-6">{summary}</div>}</div>
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
      <div>
        <ol className="mb-8 flex items-center gap-2 text-xs font-semibold">{steps.map((label, i) => <li key={label} className="flex items-center gap-2"><span className={cn('flex h-6 w-6 items-center justify-center rounded-full', i + 1 < step ? 'bg-primary text-primary-foreground' : i + 1 === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/15' : 'bg-accent text-muted-foreground')}>{i + 1 < step ? <Check size={13} /> : i + 1}</span><span className={i + 1 === step ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>{i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-12" />}</li>)}</ol>

        {step === 1 ? <div className="space-y-9">
          <section><h2 className="mb-4 text-lg font-bold">Datos de contacto</h2><F label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="tu@email.com" /><p className="mt-1.5 text-xs text-muted-foreground">Te enviamos el detalle de la compra.</p></section>
          <section><h2 className="mb-4 text-lg font-bold">Entrega</h2>
            <F label="Código postal" autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={set('zip')} placeholder="Ej.: 1414" className="mb-1 max-w-56" />
            <p className="mb-4 text-xs text-muted-foreground">{zone ? `Envíos para ${ZONE_NAMES[zone]}.` : 'Ingresalo para ver las opciones y el costo del envío.'}</p>
            <div className="space-y-3">{shippingList.map(option => <Option key={option.id} checked={shipping === option.id} onSelect={() => setShipping(option.id)} title={option.label} right={option.cost === null ? 'Ingresá tu CP' : option.cost === 0 || (totals.freeShipping && option.id !== 'pickup') ? 'Gratis' : money(option.cost)} />)}</div>
            {totals.freeFrom > 0 && !totals.freeShipping && <p className="mt-2 text-xs text-muted-foreground">Envío gratis comprando desde {money(totals.freeFrom)}.</p>}</section>
          <section><h2 className="mb-4 text-lg font-bold">{pickup ? 'Datos de quien retira' : 'Datos del destinatario'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Nombre" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} /><F label="Apellido" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
              <F label="Teléfono" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="11 2345 6789" /><F label="DNI (opcional)" inputMode="numeric" value={form.dni} onChange={set('dni')} />
              {!pickup && <><F label="Calle" autoComplete="address-line1" value={form.street} onChange={set('street')} className="sm:col-span-2" /><F label="Número" value={form.number} onChange={set('number')} /><F label="Piso / Depto (opcional)" value={form.floor} onChange={set('floor')} />
                <F label="Ciudad / Barrio" autoComplete="address-level2" value={form.city} onChange={set('city')} /><F label="Provincia" autoComplete="address-level1" value={form.province} onChange={set('province')} /></>}
            </div>
          </section>
          {error && <p className="rounded-lg bg-primary/8 px-4 py-3 text-sm font-medium text-primary">{error}</p>}
          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between"><Link href="/productos" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={15} />Seguir comprando</Link><button onClick={next} className="w-full rounded-full bg-primary px-10 py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 sm:w-auto">Continuar</button></div>
        </div>

        : <div className="space-y-9">
          <section className="rounded-xl border border-border bg-card p-4 text-sm"><div className="flex justify-between gap-4"><div><p className="text-xs text-muted-foreground">Contacto</p><p className="font-medium">{form.email} · {form.phone}</p></div><button onClick={() => setStep(1)} className="text-xs font-semibold text-primary underline">Cambiar</button></div>
            <div className="mt-3 border-t border-border pt-3"><p className="text-xs text-muted-foreground">Entrega</p><p className="font-medium">{shippingList.find(s => s.id === shipping)?.label}</p>{!pickup && <p className="text-muted-foreground">{form.street} {form.number}{form.floor && `, ${form.floor}`}, {form.city}, {form.province} ({form.zip})</p>}</div></section>
          <section><h2 className="mb-4 text-lg font-bold">Medio de pago</h2><div className="space-y-3">{paymentList.map(option => <Option key={option.id} checked={payment === option.id} onSelect={() => setPayment(option.id)} title={option.label} detail={option.id === 'transfer' ? 'Te pasamos los datos al finalizar.' : pickup ? 'Abonás al retirar.' : 'Coordinamos el pago por WhatsApp.'} right={option.note} />)}</div>
            <p className="mt-3 text-xs text-muted-foreground">{content.cart_note}</p></section>
          <section><h2 className="mb-3 text-lg font-bold">¿Querés aclarar algo?</h2><textarea value={form.notes} onChange={set('notes')} placeholder="Ej.: horario para recibir, es para regalo…" className={cn(input, 'h-24 py-3')} /></section>
          {error && <p className="rounded-lg bg-primary/8 px-4 py-3 text-sm font-medium text-primary">{error}</p>}
          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between"><button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft size={15} />Volver</button><button onClick={finish} disabled={loading} className="w-full rounded-full bg-primary px-10 py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-50 sm:w-auto">{loading ? 'Confirmando…' : 'Finalizar compra'}</button></div>
        </div>}
      </div>
      <aside className="hidden lg:block"><div className="sticky top-6 rounded-2xl border border-border bg-card p-6"><h2 className="mb-5 font-bold">Resumen de compra</h2>{summary}</div></aside>
    </div>
  </>
}
