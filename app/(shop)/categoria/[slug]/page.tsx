'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Catalog } from '@/components/shop/catalog'
import { slugify, useStore } from '@/components/store'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { products, categories, loading } = useStore()
  const category = categories.find(c => c.slug === slug)
  if (!category && !loading && categories.length) return <section className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="text-3xl font-bold">Categoría no encontrada</h1><div className="mt-6 flex flex-wrap justify-center gap-2">{categories.map(c => <Link key={c.id} href={`/categoria/${c.slug}`} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary">{c.name}</Link>)}</div></section>
  return <Catalog key={slug} products={products.filter(p => slugify(p.category) === slug)} title={category?.name ?? ''} description={category?.description} breadcrumb={[{ href: '/', label: 'Inicio' }]} />
}
