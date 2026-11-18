'use client'

import Link from 'next/link'
import { ArrowRight, Heart, Package, Zap } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { EMPTY_IMAGE, productImages, useStore } from '@/components/store'

export default function HomePage() {
  const { products, categories, content, loading } = useStore()
  const featured = products.filter(p => p.featured).slice(0, 8)
  const latest = products.slice(0, 8)
  const benefits = [1, 2, 3].map(n => ({ title: content[`benefit_${n}_title`], description: content[`benefit_${n}_description`] })).filter(b => b.title || b.description)
  const grid = (list: typeof products) => loading ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />)}</div>
    : <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">{list.map(p => <ProductCard key={p.id} product={p} />)}</div>

  return <>
    {/* 1 · Portada */}
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
        <div className="order-2 md:order-1">
          {content.hero_eyebrow && <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary">{content.hero_eyebrow}</p>}
          <h1 className="max-w-xl text-balance text-5xl leading-[0.95] font-black tracking-tight text-primary md:text-7xl">{content.hero_title}</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-foreground/75">{content.hero_description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {content.hero_cta_primary && <Link href="/productos" className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110">{content.hero_cta_primary} <ArrowRight size={17} /></Link>}
            {content.hero_cta_secondary && <a href="#categorias" className="rounded-full border border-primary px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground">{content.hero_cta_secondary}</a>}
          </div>
        </div>
        <img src={content.hero_image} alt="Nueva colección Daiquiar" className="order-1 h-[380px] w-full rounded-[2rem] object-cover shadow-xl md:order-2 md:h-[540px]" />
      </div>
    </section>

    {/* 2 · Categorías */}
    <section id="categorias" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{content.categories_eyebrow}</p><h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{content.categories_title}</h2><p className="mx-auto mt-3 max-w-xl text-muted-foreground">{content.categories_description}</p></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{categories.map(category => {
        const cover = category.image || productImages(products.find(p => p.category === category.name) ?? { images: [], image: '' } as never)[0] || EMPTY_IMAGE
        return <Link key={category.id} href={`/categoria/${category.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
          <img src={cover} alt={category.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#351719]/75 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-[#FDF3E8]"><h3 className="text-2xl font-bold">{category.name}</h3><span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">{content.category_card_cta} <ArrowRight size={14} /></span></div>
        </Link>
      })}</div>
    </section>

    {/* 3 · Más elegidos (productos destacados desde el Admin) */}
    {featured.length > 0 && <section className="bg-secondary/60 py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-8 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Los más elegidos ♡</p><h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Favoritos de la semana</h2></div><Link href="/productos" className="hidden text-sm font-semibold text-primary underline-offset-4 hover:underline sm:block">Ver todo</Link></div>
      {grid(featured)}
    </div></section>}

    {/* 4 · Nuevos ingresos */}
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{content.new_eyebrow}</p><h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{content.new_title}</h2></div><Link href="/productos" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Ver todo</Link></div>
      {grid(latest)}
    </section>

    {/* 5 · Beneficios */}
    <section className="border-y border-border"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">{benefits.map(({ title, description }, index) => {
      const Icon = [Package, Zap, Heart][index] ?? Package
      return <div key={index} className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon size={20} /></div><div><h3 className="font-bold">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div></div>
    })}</div></section>
  </>
}
