'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ProductCard, slugify, useStore } from '@/components/store'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { products, categories, search, add, content } = useStore()
  const name = categories.find(category => slugify(category) === slug)
  const items = products.filter(product => slugify(product.category ?? '') === slug && product.name.toLowerCase().includes(search.toLowerCase()))

  return <section className="mx-auto max-w-6xl px-5 py-12">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16}/> {content.back_to_store}</Link>
    {!name ? <div className="py-20 text-center"><h1 className="text-3xl font-bold">Categoría no encontrada</h1><p className="mt-3 text-muted-foreground">Probá con alguna de estas:</p><div className="mt-6 flex flex-wrap justify-center gap-2">{categories.map(category => <Link key={category} href={`/categoria/${slugify(category)}`} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary">{category}</Link>)}</div></div> : <>
      <div className="mt-6 mb-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{content.category_page_eyebrow}</p><h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">{name}</h1><p className="mt-2 text-muted-foreground">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p></div>
      <div className="mb-8 flex flex-wrap gap-2">{categories.map(category => <Link key={category} href={`/categoria/${slugify(category)}`} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${slugify(category) === slug ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:border-primary hover:text-primary'}`}>{category}</Link>)}</div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(product => <ProductCard key={product.id} product={product} add={add}/>)}</div>
      {items.length === 0 && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{content.empty_category_text}</p>}
    </>}
  </section>
}
