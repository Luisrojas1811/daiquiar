'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard, RefreshCw, Sparkles, Truck } from 'lucide-react'
import { HeroCarousel } from '@/components/shop/hero-carousel'
import { ProductCard } from '@/components/shop/product-card'
import { EMPTY_IMAGE, InstagramIcon, productImages, transferPercent, useStore, type Product } from '@/components/store'
import { money } from '@/lib/pricing'

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="mb-10 flex flex-col items-center gap-3 text-center">
    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">{eyebrow}</p>
    <h2 className="font-display text-3xl font-semibold md:text-5xl">{title}</h2>
    <span className="mt-1 flex items-center gap-3 text-primary/50" aria-hidden><span className="h-px w-12 bg-current" />♡<span className="h-px w-12 bg-current" /></span>
    {action}
  </div>
}

// Fila deslizable de productos (con flechas en la compu y con el dedo en el celular).
function ProductRail({ products }: { products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })
  return <div className="relative">
    <div ref={rail} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
      {products.map(p => <div key={p.id} className="w-[64%] shrink-0 snap-start sm:w-[38%] lg:w-[23.5%]"><ProductCard product={p} /></div>)}
    </div>
    <button onClick={() => scroll(-1)} aria-label="Ver anteriores" className="pop absolute top-[38%] -left-3 hidden rounded-full bg-background p-3 text-primary shadow-lg lg:block"><ChevronLeft size={20} /></button>
    <button onClick={() => scroll(1)} aria-label="Ver más" className="pop absolute top-[38%] -right-3 hidden rounded-full bg-background p-3 text-primary shadow-lg lg:block"><ChevronRight size={20} /></button>
  </div>
}

export default function HomePage() {
  const { products, categories, content, loading } = useStore()
  const featured = products.filter(p => p.featured)
  const carousel = featured.length ? featured : products.slice(0, 4)
  const latest = products.slice(0, 8)
  const freeFrom = Number(content.shipping_free_from) || 0
  const transfer = transferPercent(content)
  // Fotos de Instagram cargadas desde el panel; si no hay, se usan fotos de productos.
  const igManual = [1, 2, 3, 4, 5, 6].map(n => content[`instagram_photo_${n}`]).filter(Boolean)
  const igImages = (igManual.length ? igManual : products.flatMap(p => productImages(p).slice(0, 1))).slice(0, 6)
  const instagramHandle = content.instagram_url.replace(/\/$/, '').split('/').pop()

  // Barra de beneficios: textos desde el panel; {envio_gratis} y {descuento} se completan solos.
  const fill = (text: string) => text.replace(/\{envio_gratis\}/g, freeFrom ? money(freeFrom) : '').replace(/\{descuento\}/g, String(transfer))
  const perks = [1, 2, 3, 4].map((n, i) => ({ icon: [Truck, CreditCard, RefreshCw, Sparkles][i], title: fill(content[`benefit_${n}_title`] ?? ''), text: fill(content[`benefit_${n}_description`] ?? '') })).filter(p => p.title.trim())

  return <>
    {/* 1 · Carrusel de destacados */}
    {loading ? <div className="h-[560px] animate-pulse bg-primary/90" /> : <HeroCarousel products={carousel} />}

    {/* 2 · Beneficios */}
    <section className="border-b border-border bg-card"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
      {perks.map(({ icon: Icon, title, text }) => <div key={title} className="group flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition duration-500 ease-[var(--spring)] group-hover:scale-125 group-hover:rotate-[-8deg] group-hover:bg-primary group-hover:text-primary-foreground"><Icon size={19} /></span><div className="min-w-0"><p className="text-sm font-bold">{title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{text}</p></div></div>)}
    </div></section>

    {/* 3 · Categorías */}
    <section id="categorias" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionTitle eyebrow={content.categories_eyebrow} title={content.categories_title} />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">{categories.map(category => {
        const cover = category.image || productImages(products.find(p => p.category === category.name) ?? ({ images: [], image: '' } as unknown as Product))[0] || EMPTY_IMAGE
        return <Link key={category.id} href={`/categoria/${category.slug}`} className="lift group relative aspect-[3/4] w-[72%] shrink-0 snap-start overflow-hidden rounded-3xl bg-secondary hover:shadow-2xl sm:w-auto">
          <img src={cover} alt={category.name} className="absolute inset-0 h-full w-full object-cover object-[50%_15%] transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#351719]/85 via-[#351719]/10 to-transparent" />
          <div className="absolute inset-3 rounded-[1.25rem] border border-[#FDF3E8]/40 transition group-hover:inset-4" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-center text-[#FDF3E8]"><h3 className="font-display text-3xl font-semibold">{category.name}</h3><span className="mt-3 inline-flex items-center gap-2 border-b border-[#FDF3E8]/60 pb-1 text-[11px] font-bold uppercase tracking-[0.3em]">{content.category_card_cta} <ArrowRight size={13} /></span></div>
        </Link>
      })}</div>
    </section>

    {/* 4 · Los más elegidos */}
    {featured.length > 0 && <section className="bg-secondary/70 py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionTitle eyebrow={content.featured_eyebrow} title={content.featured_title} />
      <ProductRail products={featured} />
    </div></section>}

    {/* 5 · Banner editorial */}
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid overflow-hidden rounded-[2rem] bg-primary text-primary-foreground md:grid-cols-2">
        <img src={content.banner_image || content.hero_image} alt="" className="aspect-[4/5] w-full object-cover object-[50%_15%] sm:aspect-auto sm:h-96 md:h-full md:min-h-[520px]" />
        <div className="flex flex-col justify-center p-10 md:p-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary-foreground/70">{content.banner_eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight font-semibold md:text-5xl">{content.banner_title}</h2>
          <p className="mt-4 max-w-sm text-primary-foreground/80">{content.banner_text}</p>
          <Link href="/productos" className="pop shine mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-primary-foreground px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-primary hover:bg-secondary">{content.banner_cta || 'Ver más'} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>

    {/* 6 · Nuevos ingresos */}
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <SectionTitle eyebrow={content.new_eyebrow} title={content.new_title} action={<Link href="/productos" className="pop rounded-full border border-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-primary hover:bg-primary hover:text-primary-foreground">Ver todo</Link>} />
      {loading ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary" />)}</div>
        : <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4">{latest.map(p => <ProductCard key={p.id} product={p} />)}</div>}
    </section>

    {/* 7 · Instagram */}
    {igImages.length > 0 && content.instagram_title.trim() && <section className="border-t border-border bg-card py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-3 text-center"><InstagramIcon size={28} /><h2 className="font-display text-2xl font-semibold md:text-3xl">{content.instagram_title}</h2><a href={content.instagram_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary">@{instagramHandle}</a></div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">{igImages.map((src, i) => <a key={i} href={content.instagram_url} target="_blank" rel="noreferrer" className="pop group relative aspect-square overflow-hidden rounded-xl"><img src={src} onError={e => { const tile = e.currentTarget.closest('a'); if (tile) tile.style.display = 'none' }} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" /><span className="absolute inset-0 flex items-center justify-center bg-primary/0 text-primary-foreground opacity-0 transition group-hover:bg-primary/50 group-hover:opacity-100"><InstagramIcon size={24} /></span></a>)}</div>
      </div>
    </section>}
  </>
}
