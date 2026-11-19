'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { availableUnits, getStock, useStore, type Product } from '@/components/store'
import { cn } from '@/lib/utils'

const SORTS = [
  { id: 'new', label: 'Más nuevo al más viejo' },
  { id: 'featured', label: 'Destacados' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
  { id: 'az', label: 'A - Z' },
]

// Listado con filtros (talle, precio, disponibilidad) y orden, como en una tienda Tiendanube.
export function Catalog({ products, title, description, breadcrumb, initialQuery = '' }: { products: Product[]; title: string; description?: string; breadcrumb?: { href: string; label: string }[]; initialQuery?: string }) {
  const { loading, content } = useStore()
  const [sort, setSort] = useState('new')
  const [sizes, setSizes] = useState<string[]>([])
  const [colorsSel, setColorsSel] = useState<string[]>([])
  const [min, setMin] = useState(''); const [max, setMax] = useState('')
  const [onlyStock, setOnlyStock] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = initialQuery.toLowerCase()

  const allSizes = useMemo(() => Array.from(new Set(products.flatMap(p => p.sizes))), [products])
  const allColors = useMemo(() => Array.from(new Map(products.flatMap(p => p.colors ?? []).map(c => [c.name.toLowerCase(), c])).values()), [products])
  const list = useMemo(() => {
    const filtered = products.filter(p => (!query || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query))
      && (!sizes.length || sizes.some(size => p.sizes.includes(size) && ((p.colors ?? []).length ? p.colors.some(c => getStock(p, c.name, size) > 0) : getStock(p, '', size) > 0)))
      && (!colorsSel.length || (p.colors ?? []).some(c => colorsSel.includes(c.name.toLowerCase())))
      && (!min || p.price >= Number(min)) && (!max || p.price <= Number(max)) && (!onlyStock || availableUnits(p) > 0))
    const sorted = [...filtered]
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'az') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'featured') sorted.sort((a, b) => Number(b.featured) - Number(a.featured))
    // Los agotados van al final.
    return sorted.sort((a, b) => Number(availableUnits(b) > 0) - Number(availableUnits(a) > 0))
  }, [products, query, sizes, colorsSel, min, max, onlyStock, sort])
  const activeFilters = sizes.length + colorsSel.length + (min ? 1 : 0) + (max ? 1 : 0) + (onlyStock ? 1 : 0)

  const filters = <div className="space-y-7">
    {allSizes.length > 0 && <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em]">Talle</p><div className="flex flex-wrap gap-2">{allSizes.map(size => <button key={size} onClick={() => setSizes(s => s.includes(size) ? s.filter(x => x !== size) : [...s, size])} className={cn('min-w-10 rounded-full border px-3 py-1.5 text-sm font-medium', sizes.includes(size) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>{size}</button>)}</div></div>}
    {allColors.length > 0 && <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em]">Color</p><div className="flex flex-wrap gap-2">{allColors.map(c => { const key = c.name.toLowerCase(); const on = colorsSel.includes(key); return <button key={key} onClick={() => setColorsSel(s => on ? s.filter(x => x !== key) : [...s, key])} className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm', on ? 'border-primary bg-secondary font-bold' : 'border-border hover:border-primary')}><span className="h-3.5 w-3.5 rounded-full border border-foreground/20" style={{ background: c.hex }} />{c.name}</button> })}</div></div>}
    <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em]">Precio</p><div className="flex items-center gap-2"><input type="number" value={min} onChange={e => setMin(e.target.value)} placeholder="Desde" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none" /><span>–</span><input type="number" value={max} onChange={e => setMax(e.target.value)} placeholder="Hasta" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none" /></div></div>
    <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={onlyStock} onChange={e => setOnlyStock(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />Solo con stock</label>
    {activeFilters > 0 && <button onClick={() => { setSizes([]); setColorsSel([]); setMin(''); setMax(''); setOnlyStock(false) }} className="text-sm font-semibold text-primary underline underline-offset-4">Borrar filtros</button>}
  </div>

  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    {breadcrumb && <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{breadcrumb.map((b, i) => <span key={b.href} className="flex items-center gap-1.5">{i > 0 && <span>/</span>}<Link href={b.href} className="hover:text-primary">{b.label}</Link></span>)}<span>/</span><span className="text-foreground">{title}</span></nav>}
    <div className="mb-8"><h1 className="font-display text-4xl font-semibold text-primary md:text-5xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}</div>
    <div className="mb-6 flex items-center justify-between gap-3 border-y border-border py-3">
      <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 text-sm font-semibold lg:hidden"><SlidersHorizontal size={16} />Filtrar{activeFilters > 0 && ` (${activeFilters})`}</button>
      <p className="hidden text-sm text-muted-foreground lg:block">{list.length} producto(s)</p>
      <select value={sort} onChange={e => setSort(e.target.value)} className="h-9 rounded-full border border-border bg-card px-3 text-sm outline-none" aria-label="Ordenar">{SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
    </div>
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">{filters}</aside>
      <div>
        {loading ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />)}</div>
          : list.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">{list.map(p => <ProductCard key={p.id} product={p} />)}</div>
          : <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">{content.empty_category_text}</p>}
      </div>
    </div>
    {filtersOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-foreground/40" onClick={() => setFiltersOpen(false)} />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-background p-5 shadow-2xl"><div className="mb-6 flex items-center justify-between"><p className="text-lg font-bold">Filtros</p><button onClick={() => setFiltersOpen(false)} aria-label="Cerrar"><X size={22} /></button></div><div className="flex-1 overflow-y-auto">{filters}</div><button onClick={() => setFiltersOpen(false)} className="mt-4 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground">Ver {list.length} producto(s)</button></div>
    </div>}
  </section>
}
