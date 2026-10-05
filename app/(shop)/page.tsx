'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Heart, Package, Zap } from 'lucide-react'
import { CategoryCard, ProductCard, useStore } from '@/components/store'

export default function Page() {
  const { products, categories, search, content, add } = useStore()
  const [category, setCategory] = useState('')
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})
  const allLabel = content.category_all_label
  const filtered = useMemo(() => products.filter(p => (!category || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())), [products, category, search])
  const chooseCategory = (next: string) => { setCategory(next); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }
  const moveCarousel = (name: string, direction: number, total: number) => setCarouselIndex(current => ({ ...current, [name]: ((current[name] ?? 0) + direction + total) % total }))
  const chip = (active: boolean) => `whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${active ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:border-primary hover:text-primary'}`
  const benefits = [1, 2, 3].map(n => ({ title: content[`benefit_${n}_title`], description: content[`benefit_${n}_description`] })).filter(b => b.title || b.description)

  return <>
    <section id="inicio" className="bg-[linear-gradient(110deg,#f5e6d8_0%,#fff8f1_48%,#e9c8bd_100%)]"><div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
      <div>
        {content.hero_eyebrow && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">{content.hero_eyebrow}</p>}
        <h1 className="max-w-xl text-balance text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">{content.hero_title}</h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">{content.hero_description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {content.hero_cta_primary && <a href="#catalogo" className="inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">{content.hero_cta_primary} <ArrowRight size={18} /></a>}
          {content.hero_cta_secondary && <a href="#colecciones" className="rounded-xl border border-border bg-background px-6 py-3 font-semibold">{content.hero_cta_secondary}</a>}
        </div>
      </div>
      <div className="relative"><img src={content.hero_image} alt="Modelo usando la nueva colección" className="h-[390px] w-full rounded-[2rem] object-cover shadow-2xl md:h-[470px]" /></div>
    </div></section>

    <section id="colecciones" className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-8 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{content.categories_eyebrow}</p><h2 className="mt-2 text-4xl font-bold tracking-tight">{content.categories_title}</h2><p className="mt-3 text-muted-foreground">{content.categories_description}</p></div>
      <div className="mb-8 flex flex-wrap gap-2"><button onClick={() => chooseCategory('')} className={chip(!category)}>{allLabel}</button>{categories.map(name => <button key={name} onClick={() => chooseCategory(name)} className={chip(category === name)}>{name}</button>)}</div>
      <div className="grid gap-6 md:grid-cols-3">{categories.map(name => {
        const items = products.filter(product => product.category === name)
        const current = carouselIndex[name] ?? 0
        const preview = items.length ? items[current % items.length] : products[0]
        if (!preview) return null
        return <CategoryCard key={name} name={name} product={preview} count={items.length} onSelect={() => chooseCategory(name)} onPrevious={() => moveCarousel(name, -1, Math.max(items.length, 1))} onNext={() => moveCarousel(name, 1, Math.max(items.length, 1))} />
      })}</div>
    </section>

    <section id="catalogo" className="bg-muted/35 px-5 py-16"><div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{content.new_eyebrow}</p><h2 className="mt-2 text-4xl font-bold tracking-tight">{content.new_title}</h2></div>
        <div className="flex items-center gap-2 overflow-x-auto"><button onClick={() => chooseCategory('')} className={chip(!category)}>{allLabel}</button>{categories.map(name => <button key={name} onClick={() => chooseCategory(name)} className={chip(category === name)}>{name}</button>)}</div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p => <ProductCard key={p.id} product={p} add={add} />)}</div>
      {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{content.empty_category_text}</p>}
    </div></section>

    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:grid-cols-3">{benefits.map(({ title, description }, index) => {
      const Icon = [Package, Zap, Heart][index] ?? Package
      return <div key={index} className="text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={24} /></div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
    })}</section>
  </>
}
