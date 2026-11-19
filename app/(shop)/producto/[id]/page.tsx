'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Check, ChevronDown, CreditCard, Minus, Plus, RefreshCw, Ruler, X } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { ShippingCalculator } from '@/components/shop/shipping-calculator'
import { SizeGuideTables } from '@/components/shop/size-guide'
import { parseSizeGuide } from '@/lib/size-guide'
import { EMPTY_IMAGE, getStock, isLowQuantity, productImages, slugify, transferPercent, useStore } from '@/components/store'
import { money, paymentOptions } from '@/lib/pricing'
import { cn } from '@/lib/utils'

function SizeGuide({ raw, onClose, initial }: { raw: string; onClose: () => void; initial: number }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true"><div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
    <div className="animate-rise relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-semibold text-primary">Guía de talles</h2><button onClick={onClose} aria-label="Cerrar" className="pop"><X size={22} /></button></div>
      <SizeGuideTables raw={raw} initial={initial} />
    </div>
  </div>
}

function Accordion({ title, icon, children, open: initial = false }: { title: string; icon?: React.ReactNode; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial)
  return <div className="border-b border-border"><button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-3 py-4 text-left text-sm font-bold uppercase tracking-[0.12em]">{icon}{title}<ChevronDown size={17} className={cn('ml-auto transition', open && 'rotate-180')} /></button>{open && <div className="pb-5 text-sm leading-6 text-foreground/80">{children}</div>}</div>
}

function ProductView() {
  const { id } = useParams<{ id: string }>()
  const initialColor = useSearchParams().get('color') ?? ''
  const { products, content, add, loading } = useStore()
  const product = products.find(p => p.id === Number(id))
  const [active, setActive] = useState(0)
  const [color, setColor] = useState(initialColor)
  const [chosen, setChosen] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [guide, setGuide] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const colors = product?.colors ?? []

  // Si no vino un color en el link, se elige el primero que tenga stock.
  useEffect(() => {
    if (!product || !colors.length || colors.some(c => c.name === color)) return
    const firstWithStock = colors.find(c => (product.sizes.length ? product.sizes : ['']).some(s => getStock(product, c.name, s) > 0))
    setColor((firstWithStock ?? colors[0]).name)
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return <section className="mx-auto max-w-7xl px-4 py-24 text-center">{loading ? <div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-secondary" /> : <><h1 className="font-display text-3xl">Producto no disponible</h1><Link href="/productos" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Ver productos</Link></>}</section>

  // Galería: si el color elegido tiene foto propia, va primero.
  const baseImages = productImages(product)
  const colorPhoto = colors.find(c => c.name === color)?.image
  const images = colorPhoto ? [colorPhoto, ...baseImages.filter(url => url !== colorPhoto)] : baseImages
  const hasSizes = product.sizes.length > 0
  const size = hasSizes ? chosen : ''
  const needColor = colors.length > 0 && !color
  const available = needColor || (hasSizes && !size) ? 0 : getStock(product, color, size)
  const soldOut = (colors.length ? colors.map(c => c.name) : ['']).every(c => (hasSizes ? product.sizes : ['']).every(s => getStock(product, c, s) <= 0))
  const off = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const transfer = transferPercent(content)
  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
  const qty = Math.max(1, Math.min(quantity, available || 1))

  function addToCart() {
    setError('')
    if (needColor) { setError('Elegí un color'); return }
    if (hasSizes && !size) { setError('Elegí un talle'); return }
    add(product!, color, size, qty)
    setAdded(Date.now()); setTimeout(() => setAdded(0), 1800)
  }

  return <>
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-5 flex flex-wrap gap-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground"><Link href="/" className="hover:text-primary">Inicio</Link><span>/</span>{product.category && <><Link href={`/categoria/${slugify(product.category)}`} className="hover:text-primary">{product.category}</Link><span>/</span></>}<span className="text-foreground">{product.name}</span></nav>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {images.length > 1 && <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col">{images.map((url, i) => <button key={url} onClick={() => setActive(i)} className={cn('pop aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border-2 sm:w-full', i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
          <div className="relative aspect-[3/4] flex-1 cursor-zoom-in overflow-hidden rounded-3xl bg-secondary" onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }) }} onMouseLeave={() => setZoom(null)}><img key={images[Math.min(active, images.length - 1)]} src={images[Math.min(active, images.length - 1)] || EMPTY_IMAGE} alt={product.name} className="animate-rise h-full w-full object-cover transition-transform duration-300 ease-out" style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
            {off > 0 && <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1.5 text-xs font-bold tracking-[0.15em] text-primary-foreground">{off}% OFF</span>}</div>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          {product.badge && <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">{product.badge}</p>}
          <h1 className="font-display text-3xl leading-tight font-semibold md:text-[42px]">{product.name}</h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-bold">{money(product.price)}</span>{off > 0 && <del className="text-lg text-muted-foreground">{money(product.oldPrice!)}</del>}</div>
          {transfer > 0 && <p className="mt-1 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">{money(product.price * (1 - transfer / 100))} con transferencia · {transfer}% OFF</p>}

          {colors.length > 0 && <div className="mt-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em]">Color: <span className="font-normal normal-case tracking-normal">{color || 'elegí uno'}</span></p>
            <div className="flex flex-wrap gap-2.5">{colors.map(c => { const ok = (hasSizes ? product.sizes : ['']).some(s => getStock(product, c.name, s) > 0); return <button key={c.name} onClick={() => { setColor(c.name); setChosen(''); setActive(0); setError('') }} title={c.name} aria-label={`Color ${c.name}`} className={cn('pop relative h-9 w-9 rounded-full border', color === c.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-foreground/20 hover:scale-110', !ok && 'opacity-40 after:absolute after:inset-0 after:m-auto after:h-px after:w-full after:rotate-45 after:bg-foreground')} style={{ background: c.hex }} /> })}</div>
          </div>}

          {hasSizes && <div className="mt-7">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em]">Talle: <span className="font-normal normal-case tracking-normal">{size || 'elegí uno'}</span></p><button onClick={() => setGuide(true)} className="flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"><Ruler size={15} />Guía de talles</button></div>
            <div className="flex flex-wrap gap-2">{product.sizes.map(option => { const ok = getStock(product, color, option) > 0; return <button key={option} disabled={!ok} onClick={() => { setChosen(option); setQuantity(1); setError('') }} className={cn('pop min-w-12 rounded-full border px-4 py-2.5 text-sm font-bold', size === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary', !ok && 'cursor-not-allowed text-muted-foreground line-through opacity-50')}>{option}</button> })}</div>
          </div>}

          {!soldOut && available > 0 && <p className={cn('mt-4 text-sm font-bold', isLowQuantity(product, available) ? 'text-primary' : 'text-muted-foreground')}>{available === 1 ? '¡No te lo pierdas, es el último!' : isLowQuantity(product, available) ? `${content.low_stock_label} · quedan ${available}` : 'Stock disponible'}</p>}

          <div className="mt-6 flex gap-3">
            <div className="flex items-center rounded-full border border-border bg-card"><button onClick={() => setQuantity(Math.max(1, qty - 1))} className="pop p-3" aria-label="Restar"><Minus size={16} /></button><span className="min-w-6 text-center font-bold">{qty}</span><button onClick={() => setQuantity(Math.min(available || 1, qty + 1))} disabled={qty >= available} className="pop p-3 disabled:opacity-30" aria-label="Sumar"><Plus size={16} /></button></div>
            <button disabled={soldOut} onClick={addToCart} className="pop shine flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40">{soldOut ? content.out_of_stock_label : added ? <span key={added} className="animate-pop-in flex items-center gap-2"><Check size={18} />¡Agregado!</span> : content.add_to_cart_label}</button>
          </div>
          {error && <p className="mt-2 text-sm font-bold text-primary">{error}</p>}

          <div className="mt-6"><ShippingCalculator subtotal={product.price * qty} /></div>

          <div className="mt-4 border-t border-border">
            {product.description && <Accordion title="Descripción" open>{product.description}</Accordion>}
            <Accordion title="Medios de pago" icon={<CreditCard size={17} className="text-primary" />}>
              <ul className="space-y-2">{paymentOptions(content).map(p => <li key={p.id} className="flex justify-between"><span>{p.label}{p.note && <b className="ml-2 text-primary">{p.note}</b>}</span><span className="font-bold">{money(p.id === 'transfer' ? product.price * (1 - transfer / 100) : product.price)}</span></li>)}</ul>
            </Accordion>
            <Accordion title="Cambios" icon={<RefreshCw size={16} className="text-primary" />}>{content.returns_text}</Accordion>
          </div>
        </div>
      </div>
    </section>
    {related.length > 0 && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6"><h2 className="mb-8 text-center font-display text-3xl font-semibold">También te puede gustar</h2><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">{related.map(p => <ProductCard key={p.id} product={p} />)}</div></section>}
    {guide && <SizeGuide raw={content.size_guide_tables} initial={Math.max(0, parseSizeGuide(content.size_guide_tables).tables.findIndex(t => t.rows.some(r => product.sizes.includes(r[0]))))} onClose={() => setGuide(false)} />}
  </>
}

export default function ProductPage() { return <Suspense><ProductView /></Suspense> }
