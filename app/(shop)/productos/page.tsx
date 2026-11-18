'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Catalog } from '@/components/shop/catalog'
import { useStore } from '@/components/store'

function AllProducts() {
  const { products, content } = useStore()
  const q = useSearchParams().get('q') ?? ''
  return <Catalog key={q} products={products} title={q ? `Resultados para “${q}”` : content.nav_new_label} breadcrumb={[{ href: '/', label: 'Inicio' }]} initialQuery={q} />
}
export default function ProductsPage() { return <Suspense><AllProducts /></Suspense> }
