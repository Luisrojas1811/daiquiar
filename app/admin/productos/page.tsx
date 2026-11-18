'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { Eye, EyeOff, LayoutGrid, List, Plus, Search, Shirt, Star } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Skeleton, Tabs, fetcher, money, send } from '@/components/admin/ui'
import { productTotalStock, type Product } from '@/lib/types'
import { cn } from '@/lib/utils'

function stockBadge(product: Product) {
  const total = productTotalStock(product)
  if (total === 0) return <Badge tone="red">Sin stock</Badge>
  const low = product.sizes.length ? product.sizes.some(size => (product.sizeStock[size] ?? 0) <= product.lowStockThreshold) : total <= product.lowStockThreshold
  return low ? <Badge tone="amber">{total} u. · stock bajo</Badge> : <Badge tone="green">{total} u.</Badge>
}

export default function ProductsPage() {
  const { data: products, mutate } = useSWR<Product[]>('/api/catalog?all=1', fetcher)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'active' | 'hidden'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const categories = useMemo(() => Array.from(new Set((products ?? []).map(p => p.category).filter(Boolean))), [products])
  const filtered = (products ?? []).filter(p => (!category || p.category === category) && (visibility === 'all' || (visibility === 'active' ? p.active : !p.active)) && `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()))

  async function toggle(product: Product, field: 'active' | 'featured') {
    const updated = await send<Product>(`/api/catalog/${product.id}`, 'PATCH', { [field]: !product[field] })
    mutate(current => current?.map(p => p.id === product.id ? updated : p), { revalidate: false })
  }

  return <>
    <PageHeader title="Productos" description="Cargá, editá, ocultá o destacá las prendas de tu tienda." actions={<ButtonLink href="/admin/productos/nuevo" variant="primary" icon={<Plus size={16} />}>Nuevo producto</ButtonLink>} />
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
      <Tabs value={visibility} onChange={setVisibility} items={[{ id: 'all', label: 'Todos', count: products?.length }, { id: 'active', label: 'Publicados', count: products?.filter(p => p.active).length }, { id: 'hidden', label: 'Ocultos', count: products?.filter(p => !p.active).length }]} />
      <div className="flex flex-1 gap-2 md:justify-end">
        <div className="relative flex-1 md:max-w-64"><Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar producto" className="pl-9" /></div>
        <Select value={category} onChange={e => setCategory(e.target.value)} className="w-40"><option value="">Todas las categorías</option>{categories.map(c => <option key={c}>{c}</option>)}</Select>
        <div className="hidden rounded-lg border border-border bg-card p-0.5 sm:flex">{([['grid', LayoutGrid], ['list', List]] as const).map(([id, Icon]) => <button key={id} onClick={() => setView(id)} aria-label={id === 'grid' ? 'Ver en grilla' : 'Ver en lista'} className={cn('rounded-md p-2', view === id ? 'bg-muted text-foreground' : 'text-muted-foreground')}><Icon size={16} /></button>)}</div>
      </div>
    </div>

    {!products ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}</div>
      : !filtered.length ? <Card><EmptyState icon={<Shirt size={20} />} title={products.length ? 'Ningún producto coincide' : 'Todavía no cargaste productos'} description={products.length ? 'Probá con otra búsqueda o filtro.' : 'Empezá cargando tu primera prenda con fotos, talles y stock.'} action={!products.length && <ButtonLink href="/admin/productos/nuevo" variant="primary" icon={<Plus size={16} />}>Cargar producto</ButtonLink>} /></Card>
      : view === 'grid' ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{filtered.map(product => <div key={product.id} className={cn('group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md', !product.active && 'opacity-60')}>
        <Link href={`/admin/productos/${product.id}`} className="relative block aspect-[3/4] overflow-hidden bg-muted">
          {product.image && <img src={product.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
          <div className="absolute top-2 left-2 flex flex-col gap-1">{!product.active && <Badge>Oculto</Badge>}{product.featured && <Badge tone="brand">★ Destacado</Badge>}</div>
        </Link>
        <div className="p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{product.category || 'Sin categoría'}</p>
          <Link href={`/admin/productos/${product.id}`} className="mt-0.5 block truncate text-sm font-medium hover:text-primary">{product.name}</Link>
          <p className="mt-1 text-sm tabular-nums">{money(product.price)} {product.oldPrice ? <del className="text-xs text-muted-foreground">{money(product.oldPrice)}</del> : null}</p>
          <div className="mt-2.5 flex items-center justify-between gap-2">{stockBadge(product)}
            <div className="flex">
              <button onClick={() => toggle(product, 'featured')} title={product.featured ? 'Quitar de destacados' : 'Destacar en la portada'} className={cn('rounded-md p-1.5 hover:bg-muted', product.featured ? 'text-primary' : 'text-muted-foreground')}><Star size={15} fill={product.featured ? 'currentColor' : 'none'} /></button>
              <button onClick={() => toggle(product, 'active')} title={product.active ? 'Ocultar de la tienda' : 'Publicar en la tienda'} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">{product.active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
            </div>
          </div>
        </div>
      </div>)}</div>
      : <Card padded={false}><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Producto</th><th className="px-3 py-3 font-medium">Categoría</th><th className="px-3 py-3 font-medium">Precio</th><th className="px-3 py-3 font-medium">Stock</th><th className="px-3 py-3 font-medium">Estado</th></tr></thead>
        <tbody className="divide-y divide-border">{filtered.map(product => <tr key={product.id} className="hover:bg-muted/50">
          <td className="px-5 py-3"><Link href={`/admin/productos/${product.id}`} className="flex items-center gap-3 font-medium hover:text-primary">{product.image ? <img src={product.image} alt="" className="h-11 w-9 rounded-md object-cover" /> : <div className="h-11 w-9 rounded-md bg-muted" />}{product.name}</Link></td>
          <td className="px-3 py-3 text-muted-foreground">{product.category}</td><td className="px-3 py-3 tabular-nums">{money(product.price)}</td><td className="px-3 py-3">{stockBadge(product)}</td>
          <td className="px-3 py-3">{product.active ? <Badge tone="green" dot>Publicado</Badge> : <Badge dot>Oculto</Badge>}</td>
        </tr>)}</tbody>
      </table></div></Card>}
  </>
}
