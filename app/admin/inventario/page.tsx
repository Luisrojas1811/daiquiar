'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge, Card, Input, PageHeader, SaveBar, Skeleton, Tabs, fetcher, send } from '@/components/admin/ui'
import { productTotalStock, type Product } from '@/lib/types'
import { cn } from '@/lib/utils'

// Planilla rápida de stock: se edita directo en la tabla y se guarda todo junto.
export default function InventoryPage() {
  const { data: products, mutate } = useSWR<Product[]>('/api/catalog?all=1', fetcher)
  const [edits, setEdits] = useState<Record<number, { sizeStock?: Record<string, number>; stock?: number }>>({})
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const value = (p: Product, size?: string) => size ? (edits[p.id]?.sizeStock?.[size] ?? p.sizeStock[size] ?? 0) : (edits[p.id]?.stock ?? p.stock)
  const isLow = (p: Product) => p.sizes.length ? p.sizes.some(s => p.sizeStock[s] <= p.lowStockThreshold) : p.stock <= p.lowStockThreshold
  const list = useMemo(() => (products ?? []).filter(p => (filter === 'all' || (filter === 'out' ? productTotalStock(p) === 0 || p.sizes.some(s => !p.sizeStock[s]) : isLow(p))) && p.name.toLowerCase().includes(query.toLowerCase())), [products, filter, query])

  function change(p: Product, qty: number, size?: string) {
    setMessage('')
    setEdits(current => size ? { ...current, [p.id]: { sizeStock: { ...p.sizeStock, ...current[p.id]?.sizeStock, [size]: Math.max(0, qty) } } } : { ...current, [p.id]: { stock: Math.max(0, qty) } })
  }
  async function save() {
    setSaving(true); setError('')
    try {
      for (const [id, body] of Object.entries(edits)) await send(`/api/catalog/${id}`, 'PATCH', body)
      setEdits({}); await mutate(); setMessage('Stock actualizado en la tienda.')
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving(false) }
  }

  const cell = (p: Product, size?: string) => {
    const qty = value(p, size); const changed = size ? edits[p.id]?.sizeStock?.[size] !== undefined && edits[p.id]?.sizeStock?.[size] !== p.sizeStock[size] : edits[p.id]?.stock !== undefined && edits[p.id]?.stock !== p.stock
    return <div className="w-16">
      {size && <span className="mb-0.5 block text-center text-[10px] font-medium text-muted-foreground">{size}</span>}
      <input type="number" min="0" value={qty} onChange={e => change(p, Number(e.target.value) || 0, size)} aria-label={`Stock ${p.name} ${size ?? ''}`}
        className={cn('h-9 w-full rounded-lg border text-center text-sm tabular-nums outline-none focus:border-primary', changed ? 'border-primary bg-primary/5 font-semibold' : qty === 0 ? 'border-red-200 bg-red-50 text-red-700' : qty <= p.lowStockThreshold ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-input bg-card')} />
    </div>
  }

  return <>
    <PageHeader title="Inventario" description="Todo tu stock en una planilla. Cambiá los números y guardá: se actualiza al instante en la tienda." />
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
      <Tabs value={filter} onChange={setFilter} items={[{ id: 'all', label: 'Todo' }, { id: 'low', label: 'Stock bajo', count: products?.filter(isLow).length }, { id: 'out', label: 'Agotados', count: products?.filter(p => productTotalStock(p) === 0 || p.sizes.some(s => !p.sizeStock[s])).length }]} />
      <div className="relative md:ml-auto md:w-64"><Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar producto" className="pl-9" /></div>
    </div>
    <Card padded={false}>
      {!products ? <div className="space-y-2 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div> :
        <ul className="divide-y divide-border">{list.map(p => <li key={p.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
          <Link href={`/admin/productos/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            {p.image ? <img src={p.image} alt="" className="h-12 w-10 rounded-md object-cover" /> : <div className="h-12 w-10 rounded-md bg-muted" />}
            <div className="min-w-0"><p className="truncate text-sm font-medium hover:text-primary">{p.name}</p><p className="text-xs text-muted-foreground">{p.category} · alerta en {p.lowStockThreshold} {!p.active && '· oculto'}</p></div>
          </Link>
          <div className="flex flex-wrap items-end gap-2">{p.sizes.length ? p.sizes.map(size => <div key={size}>{cell(p, size)}</div>) : cell(p)}</div>
          <div className="w-20 text-right"><Badge tone={productTotalStock(p) === 0 ? 'red' : isLow(p) ? 'amber' : 'neutral'}>{productTotalStock(p)} total</Badge></div>
        </li>)}</ul>}
    </Card>
    <SaveBar dirty={Object.keys(edits).length} saving={saving} onSave={save} onDiscard={() => setEdits({})} message={message} error={error} />
  </>
}
