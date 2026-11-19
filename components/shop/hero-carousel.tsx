'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { EMPTY_IMAGE, productImages, transferPercent, useStore, type Product } from '@/components/store'
import { money } from '@/lib/pricing'
import { cn } from '@/lib/utils'

type Slide = { kind: 'brand' } | { kind: 'product'; product: Product }

// Carrusel de portada: primero la presentación de la marca y después los productos destacados
// (los que la dueña marca con ★ en el panel). Pasa solo cada 6 s, se pausa al pasar el mouse y se desliza con el dedo.
export function HeroCarousel({ products }: { products: Product[] }) {
  const { content } = useStore()
  const slides: Slide[] = [{ kind: 'brand' }, ...products.slice(0, 6).map(product => ({ kind: 'product' as const, product }))]
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touch = useRef<number | null>(null)
  const count = slides.length
  const go = useCallback((delta: number) => setIndex(i => (i + delta + count) % count), [count])
  const transfer = transferPercent(content)

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => go(1), 6000)
    return () => clearInterval(timer)
  }, [paused, count, go])

  return <section className="relative overflow-hidden bg-primary" aria-roledescription="carrusel" aria-label="Destacados"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onTouchStart={e => { touch.current = e.touches[0].clientX }} onTouchEnd={e => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null }}>
    <div className="flex transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
      {slides.map((slide, i) => {
        if (slide.kind === 'brand') return <div key="brand" className="relative w-full shrink-0" aria-hidden={i !== index}>
          <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
            <div className="order-2 text-primary-foreground md:order-1">
              {content.hero_eyebrow && <p className="mb-5 text-xs font-bold uppercase tracking-[0.4em] text-primary-foreground/70">{content.hero_eyebrow}</p>}
              <h1 className="font-display text-5xl leading-[1.02] font-semibold md:text-7xl">{content.hero_title}</h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-primary-foreground/80">{content.hero_description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/productos" tabIndex={i === index ? 0 : -1} className="pop shine inline-flex items-center gap-3 rounded-full bg-primary-foreground px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-primary hover:bg-secondary">{content.hero_cta_primary || 'Comprar ahora'} <ArrowRight size={16} /></Link>
                {content.hero_cta_secondary && <a href="#categorias" tabIndex={i === index ? 0 : -1} className="pop rounded-full border border-primary-foreground/50 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary-foreground/10">{content.hero_cta_secondary}</a>}
              </div>
            </div>
            <div className="relative order-1 md:order-2">
              <div className="absolute -inset-3 rounded-[2.5rem] border border-primary-foreground/25 md:-inset-5" />
              <img src={content.hero_image} alt="Nueva colección Daiquiar" className="relative h-[340px] w-full rounded-[2rem] object-cover shadow-2xl md:h-[480px]" />
            </div>
          </div>
        </div>
        const { product } = slide
        const off = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
        const images = productImages(product)
        return <div key={product.id} className={cn('relative w-full shrink-0', i % 2 === 0 ? 'bg-primary' : 'bg-secondary')} aria-hidden={i !== index}>
          <div className={cn('mx-auto grid min-h-[560px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-16', i % 2 === 0 ? 'text-primary-foreground' : 'text-foreground')}>
            <div className="order-2 md:order-1">
              <p className={cn('mb-5 text-xs font-bold uppercase tracking-[0.4em]', i % 2 === 0 ? 'text-primary-foreground/70' : 'text-primary')}>{content.carousel_badge} {product.category}</p>
              <h2 className="font-display text-4xl leading-[1.05] font-semibold md:text-6xl">{product.name}</h2>
              {product.description && <p className={cn('mt-5 line-clamp-2 max-w-md text-base leading-7', i % 2 === 0 ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{product.description}</p>}
              <div className="mt-6 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-bold">{money(product.price)}</span>{off > 0 && <del className="opacity-60">{money(product.oldPrice!)}</del>}{off > 0 && <span className={cn('rounded-full px-3 py-1 text-xs font-bold', i % 2 === 0 ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground')}>{off}% OFF</span>}</div>
              {transfer > 0 && <p className="mt-1 text-sm font-bold opacity-80">{money(product.price * (1 - transfer / 100))} con transferencia</p>}
              {product.colors?.length > 0 && <div className="mt-5 flex gap-2">{product.colors.map(c => <span key={c.name} title={c.name} className="h-5 w-5 rounded-full border border-current/30" style={{ background: c.hex }} />)}</div>}
              <Link href={`/producto/${product.id}`} tabIndex={i === index ? 0 : -1} className={cn('pop shine mt-8 inline-flex items-center gap-3 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-[0.2em]', i % 2 === 0 ? 'bg-primary-foreground text-primary hover:bg-secondary' : 'bg-primary text-primary-foreground hover:brightness-110')}>{content.carousel_cta || 'Ver producto'} <ArrowRight size={16} /></Link>
            </div>
            <Link href={`/producto/${product.id}`} tabIndex={-1} className="relative order-1 grid grid-cols-[1.4fr_1fr] gap-3 md:order-2">
              <img src={images[0] || EMPTY_IMAGE} alt={product.name} className="h-[340px] w-full rounded-[2rem] object-cover shadow-2xl md:h-[480px]" />
              <img src={images[1] || images[0] || EMPTY_IMAGE} alt="" className="mt-10 h-[280px] w-full rounded-[2rem] object-cover shadow-xl md:h-[400px]" />
            </Link>
          </div>
        </div>
      })}
    </div>
    {count > 1 && <>
      <button onClick={() => go(-1)} aria-label="Anterior" className="absolute top-1/2 left-3 hidden -translate-y-1/2 md:block"><span className="pop block rounded-full bg-background/90 p-3 text-primary shadow-lg"><ChevronLeft size={20} /></span></button>
      <button onClick={() => go(1)} aria-label="Siguiente" className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:block"><span className="pop block rounded-full bg-background/90 p-3 text-primary shadow-lg"><ChevronRight size={20} /></span></button>
      <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">{slides.map((_, i) => <button key={i} onClick={() => setIndex(i)} aria-label={`Ir a la diapositiva ${i + 1}`} className={cn('h-1.5 rounded-full transition-all', index % 2 === 0 ? (i === index ? 'w-8 bg-background' : 'w-3 bg-background/50') : (i === index ? 'w-8 bg-primary' : 'w-3 bg-primary/30'))} />)}</div>
    </>}
  </section>
}
