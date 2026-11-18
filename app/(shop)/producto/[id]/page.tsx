'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, CreditCard, Minus, Plus, Ruler, Truck, X } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { EMPTY_IMAGE, getSizeStock, isLowQuantity, productImages, slugify, transferPercent, useStore } from '@/components/store'
import { money, paymentOptions, shippingOptions } from '@/lib/pricing'
import { cn } from '@/lib/utils'

function SizeGuide({ text, onClose }: { text: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true"><div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
    <div className="relative w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-primary">Guía de talles</h2><button onClick={onClose} aria-label="Cerrar"><X size={22} /></button></div>
      <p className="mb-4 text-sm text-muted-foreground">Medidas en centímetros. Si estás entre dos talles, te recomendamos el más grande.</p>
      <div className="divide-y divide-border rounded-xl border border-border">{text.split('\n').filter(Boolean).map(line => { const [size, ...rest] = line.split('·').map(s => s.trim()); return <div key={line} className="flex gap-4 px-4 py-3 text-sm"><b className="w-10 text-primary">{size}</b><span className="text-foreground/80">{rest.join(' · ')}</span></div> })}</div>
    </div>
  </div>
}

function Accordion({ title, icon, children, open: initial = false }: { title: string; icon?: React.ReactNode; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial)
  return <div className="border-b border-border"><button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-3 py-4 text-left text-sm font-semibold">{icon}{title}<ChevronDown size={17} className={cn('ml-auto transition', open && 'rotate-180')} /></button>{open && <div className="pb-5 text-sm leading-6 text-foreground/80">{children}</div>}</div>
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { products, content, add, loading } = useStore()
  const product = products.find(p => p.id === Number(id))
  const [active, setActive] = useState(0)
  const [chosen, setChosen] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [guide, setGuide] = useState(false)
  const [error, setError] = useState('')

  if (!product) return <section className="mx-auto max-w-7xl px-4 py-24 text-center">{loading ? <div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-secondary" /> : <><h1 className="text-3xl font-bold">Producto no disponible</h1><Link href="/productos" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Ver productos</Link></>}</section>

  const images = productImages(product)
  const hasSizes = product.sizes.length > 0
  const size = hasSizes ? chosen : ''
  const available = hasSizes ? (size ? getSizeStock(product, size) : 0) : product.stock
  const soldOut = hasSizes ? product.sizes.every(s => getSizeStock(product, s) <= 0) : product.stock <= 0
  const off = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const transfer = transferPercent(content)
  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
  const qty = Math.max(1, Math.min(quantity, available || 1))

  function addToCart() {
    setError('')
    if (hasSizes && !size) { setError('Elegí un talle'); return }
    add(product!, size, qty)
  }

  return <>
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-5 flex flex-wrap gap-1.5 text-xs text-muted-foreground"><Link href="/" className="hover:text-primary">Inicio</Link><span>/</span>{product.category && <><Link href={`/categoria/${slugify(product.category)}`} className="hover:text-primary">{product.category}</Link><span>/</span></>}<span className="text-foreground">{product.name}</span></nav>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* Galería */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {images.length > 1 && <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col">{images.map((url, i) => <button key={url} onClick={() => setActive(i)} className={cn('aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border-2 sm:w-full', i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
          <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-2xl bg-secondary"><img src={images[active] || EMPTY_IMAGE} alt={product.name} className="h-full w-full object-cover" />
            {off > 0 && <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">{off}% OFF</span>}</div>
        </div>

        {/* Información y compra */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          {product.badge && <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">{product.badge}</p>}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-bold">{money(product.price)}</span>{off > 0 && <del className="text-lg text-muted-foreground">{money(product.oldPrice!)}</del>}</div>
          {transfer > 0 && <p className="mt-1 text-[15px] font-semibold text-primary">{money(product.price * (1 - transfer / 100))} con Transferencia <span className="font-normal text-muted-foreground">({transfer}% de descuento)</span></p>}

          {hasSizes && <div className="mt-7">
            <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Talle: <span className="font-normal">{size || 'elegí uno'}</span></p><button onClick={() => setGuide(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"><Ruler size={15} />Guía de talles</button></div>
            <div className="flex flex-wrap gap-2">{product.sizes.map(option => { const ok = getSizeStock(product, option) > 0; return <button key={option} disabled={!ok} onClick={() => { setChosen(option); setQuantity(1); setError('') }} className={cn('min-w-12 rounded-full border px-4 py-2.5 text-sm font-semibold transition', size === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary', !ok && 'cursor-not-allowed text-muted-foreground line-through opacity-50')}>{option}</button> })}</div>
          </div>}
          {product.color && <p className="mt-5 text-sm font-semibold">Color: <span className="font-normal">{product.color}</span></p>}

          {!soldOut && (size || !hasSizes) && available > 0 && <p className={cn('mt-4 text-sm font-semibold', isLowQuantity(product, available) ? 'text-primary' : 'text-muted-foreground')}>{available === 1 ? '¡No te lo pierdas, es el último!' : isLowQuantity(product, available) ? `${content.low_stock_label} · quedan ${available}` : 'Stock disponible'}</p>}

          <div className="mt-6 flex gap-3">
            <div className="flex items-center rounded-full border border-border bg-card"><button onClick={() => setQuantity(Math.max(1, qty - 1))} className="p-3" aria-label="Restar"><Minus size={16} /></button><span className="min-w-6 text-center font-semibold">{qty}</span><button onClick={() => setQuantity(Math.min(available || 1, qty + 1))} disabled={qty >= available} className="p-3 disabled:opacity-30" aria-label="Sumar"><Plus size={16} /></button></div>
            <button disabled={soldOut} onClick={addToCart} className="flex-1 rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{soldOut ? content.out_of_stock_label : content.add_to_cart_label}</button>
          </div>
          {error && <p className="mt-2 text-sm font-semibold text-primary">{error}</p>}

          <div className="mt-8 border-t border-border">
            {product.description && <Accordion title="Descripción" open>{product.description}</Accordion>}
            <Accordion title="Medios de pago" icon={<CreditCard size={17} className="text-primary" />}>
              <ul className="space-y-2">{paymentOptions(content).map(p => <li key={p.id} className="flex justify-between"><span>{p.label}{p.note && <b className="ml-2 text-primary">{p.note}</b>}</span><span className="font-semibold">{money(p.id === 'transfer' ? product.price * (1 - transfer / 100) : product.price)}</span></li>)}</ul>
              <p className="mt-3 text-xs text-muted-foreground">Para confirmar el pedido se abona un {content.payment_deposit_percent}% de anticipo.</p>
            </Accordion>
            <Accordion title="Envíos" icon={<Truck size={17} className="text-primary" />}>
              <ul className="space-y-2">{shippingOptions(content).map(s => <li key={s.id} className="flex justify-between gap-4"><span>{s.label}</span><span className="font-semibold whitespace-nowrap">{s.cost ? money(s.cost) : 'Gratis'}</span></li>)}</ul>
              {Number(content.shipping_free_from) > 0 && <p className="mt-3 text-xs font-semibold text-primary">Envío gratis comprando desde {money(Number(content.shipping_free_from))}</p>}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
    {related.length > 0 && <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><h2 className="mb-8 text-2xl font-bold tracking-tight">También te puede gustar</h2><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">{related.map(p => <ProductCard key={p.id} product={p} />)}</div></section>}
    {guide && <SizeGuide text={content.size_guide} onClose={() => setGuide(false)} />}
  </>
}
