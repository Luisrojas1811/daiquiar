'use client'

import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Copy, ImagePlus, Loader2, Star, Trash2, X } from 'lucide-react'
import { Badge, Button, Card, Field, Input, PageHeader, Select, SaveBar, Textarea, Toggle, fetcher, money, send } from '@/components/admin/ui'
import { uploadImages } from '@/components/admin/upload'
import type { Category, ColorOption, Product } from '@/lib/types'
import { variantKey, variantKeys } from '@/lib/stock'
import { cn } from '@/lib/utils'

const SIZE_PRESETS = [
  { label: 'S · M · L', sizes: ['S', 'M', 'L'] },
  { label: 'XS a XL', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { label: '85 a 100', sizes: ['85', '90', '95', '100'] },
  { label: 'Talle único', sizes: [] as string[] },
]

type Draft = { name: string; description: string; category: string; price: string; oldPrice: string; badge: string; color: string; sku: string; images: string[]; sizes: string[]; colors: ColorOption[]; sizeStock: Record<string, number>; stock: string; lowStockThreshold: string; active: boolean; featured: boolean }
const toDraft = (p?: Product): Draft => ({
  name: p?.name ?? '', description: p?.description ?? '', category: p?.category ?? '', price: p ? String(p.price) : '', oldPrice: p?.oldPrice ? String(p.oldPrice) : '',
  badge: p?.badge ?? '', color: p?.color ?? '', sku: p?.sku ?? '', images: p?.images?.length ? p.images : p?.image ? [p.image] : [], sizes: p?.sizes ?? ['S', 'M', 'L'], colors: p?.colors ?? [],
  sizeStock: p?.sizeStock ?? {}, stock: String(p?.stock ?? 0), lowStockThreshold: String(p?.lowStockThreshold ?? 3), active: p?.active ?? true, featured: p?.featured ?? false,
})

export function ProductEditor({ product }: { product?: Product }) {
  const router = useRouter()
  const [duplicating, setDuplicating] = useState(false)
  // Crea una copia (oculta) con las mismas fotos, talles y colores, para cargar rápido prendas parecidas.
  async function duplicate() {
    if (!product) return
    setDuplicating(true)
    try {
      const copy = await send<Product>('/api/catalog', 'POST', { name: `${product.name} (copia)`, description: product.description, category: product.category, price: product.price, oldPrice: product.oldPrice ?? null, badge: product.badge, sku: '', images: product.images, sizes: product.sizes, colors: product.colors, sizeStock: Object.fromEntries(Object.keys(product.sizeStock ?? {}).map(k => [k, 0])), stock: 0, lowStockThreshold: product.lowStockThreshold, active: false, featured: false })
      router.push(`/admin/productos/${copy.id}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo duplicar') } finally { setDuplicating(false) }
  }
  const { data: categories } = useSWR<Category[]>('/api/admin/categories', fetcher)
  const [draft, setDraft] = useState<Draft>(() => toDraft(product))
  const initial = useRef(toDraft(product))
  const [newSize, setNewSize] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => { setMessage(''); setDraft(current => ({ ...current, [key]: value })) }

  useEffect(() => { if (!draft.category && categories?.length) setDraft(d => ({ ...d, category: categories[0].name })) }, [categories]) // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial.current)
  const discount = Number(draft.oldPrice) > Number(draft.price) && Number(draft.price) > 0 ? Math.round((1 - Number(draft.price) / Number(draft.oldPrice)) * 100) : 0
  const keys = useMemo(() => variantKeys(draft), [draft.sizes, draft.colors]) // eslint-disable-line react-hooks/exhaustive-deps
  const totalStock = useMemo(() => keys.length ? keys.reduce((s, key) => s + (draft.sizeStock[key] ?? 0), 0) : Number(draft.stock) || 0, [draft, keys])
  const [newColor, setNewColor] = useState({ name: '', hex: '#80011F' })
  const addColor = (name: string, hex: string) => { const clean = name.trim(); if (!clean || draft.colors.some(c => c.name.toLowerCase() === clean.toLowerCase())) return; set('colors', [...draft.colors, { name: clean, hex }]); setNewColor({ name: '', hex: '#80011F' }) }
  const updateColor = (index: number, patch: Partial<ColorOption>) => {
    const old = draft.colors[index]; const next = draft.colors.map((c, i) => i === index ? { ...c, ...patch } : c)
    // Si cambia el nombre, el stock se mueve a la nueva clave.
    if (patch.name !== undefined && patch.name !== old.name) {
      const moved = Object.fromEntries(Object.entries(draft.sizeStock).map(([key, qty]) => [key === old.name ? patch.name! : key.startsWith(`${old.name} / `) ? `${patch.name} / ${key.slice(old.name.length + 3)}` : key, qty]))
      setDraft(d => ({ ...d, colors: next, sizeStock: moved }))
    } else set('colors', next)
  }
  const stockInput = (key: string) => { const qty = draft.sizeStock[key] ?? 0; return <div className={cn('flex items-center rounded-lg border bg-card', qty === 0 ? 'border-red-200 bg-red-50/60' : qty <= Number(draft.lowStockThreshold) ? 'border-amber-200 bg-amber-50/60' : 'border-input')}>
    <button type="button" onClick={() => set('sizeStock', { ...draft.sizeStock, [key]: Math.max(0, qty - 1) })} className="px-2 py-1.5 text-muted-foreground" aria-label="Restar">−</button>
    <input type="number" min="0" value={qty} aria-label={`Stock ${key}`} onChange={e => set('sizeStock', { ...draft.sizeStock, [key]: Math.max(0, Number(e.target.value) || 0) })} className="w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none" />
    <button type="button" onClick={() => set('sizeStock', { ...draft.sizeStock, [key]: qty + 1 })} className="px-2 py-1.5 text-muted-foreground" aria-label="Sumar">+</button>
  </div> }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return
    setUploading(true); setError('')
    try { const urls = await uploadImages(files); set('images', [...draft.images, ...urls]) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir') } finally { setUploading(false) }
  }
  const moveImage = (index: number, delta: number) => { const next = [...draft.images]; const [item] = next.splice(index, 1); next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, item); set('images', next) }
  const addSize = () => { const size = newSize.trim().toUpperCase(); if (size && !draft.sizes.includes(size)) set('sizes', [...draft.sizes, size]); setNewSize('') }

  async function save() {
    setError(''); setMessage('')
    if (!draft.name.trim()) return setError('Poné un nombre al producto.')
    if (!(Number(draft.price) > 0)) return setError('Poné un precio válido.')
    if (!draft.images.length) return setError('Subí al menos una foto.')
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name: draft.name.trim(), description: draft.description, category: draft.category, price: Number(draft.price), oldPrice: draft.oldPrice ? Number(draft.oldPrice) : null, badge: draft.badge, color: draft.color, sku: draft.sku, images: draft.images, lowStockThreshold: Number(draft.lowStockThreshold) || 1, active: draft.active, featured: draft.featured }
      // El stock solo se manda si se tocó: así una venta que entró mientras editabas no se pisa.
      const stockTouched = !product || JSON.stringify([draft.sizes, draft.colors, draft.sizeStock, draft.stock]) !== JSON.stringify([initial.current.sizes, initial.current.colors, initial.current.sizeStock, initial.current.stock])
      if (stockTouched) Object.assign(body, { sizes: draft.sizes, colors: draft.colors, sizeStock: Object.fromEntries(keys.map(k => [k, draft.sizeStock[k] ?? 0])), stock: keys.length ? 0 : Number(draft.stock) || 0 })
      const saved = await send<Product>(product ? `/api/catalog/${product.id}` : '/api/catalog', product ? 'PATCH' : 'POST', body)
      if (!product) { router.replace(`/admin/productos/${saved.id}?creado=1`); return }
      initial.current = toDraft(saved); setDraft(toDraft(saved)); setMessage('Producto guardado. Ya se ve en la tienda.')
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving(false) }
  }

  async function remove() {
    if (!product || !window.confirm(`¿Eliminar “${product.name}”? No se puede deshacer. Si solo querés sacarlo de la tienda, usá “Oculto”.`)) return
    await send(`/api/catalog/${product.id}`, 'DELETE'); router.replace('/admin/productos')
  }

  return <>
    <PageHeader back={{ href: '/admin/productos', label: 'Productos' }} title={product ? draft.name || 'Producto' : 'Nuevo producto'}
      actions={<>{product && <Button size="sm" icon={<Copy size={14} />} loading={duplicating} onClick={duplicate}>Duplicar</Button>}{product && <a href={`/producto/${product.id}`} target="_blank" rel="noreferrer"><Button size="sm">Ver en la tienda</Button></a>}{product && <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={remove}>Eliminar</Button>}</>} />

    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card title="Información">
          <div className="space-y-4">
            <Field label="Nombre"><Input value={draft.name} onChange={e => set('name', e.target.value)} placeholder="Ej.: Body Lirio encaje" /></Field>
            <Field label="Descripción" hint="Tela, calce, cuidados… Lo que le contarías a una clienta."><Textarea value={draft.description} onChange={e => set('description', e.target.value)} className="min-h-32" /></Field>
          </div>
        </Card>

        <Card title="Fotos" description="La primera es la principal. Usá las flechas para ordenarlas. Se achican solas al subir.">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {draft.images.map((url, index) => <div key={url} className={cn('group relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted', index === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border')}>
              <img src={url} alt="" className="h-full w-full object-cover" />
              {index === 0 && <span className="absolute top-1.5 left-1.5"><Badge tone="brand">Principal</Badge></span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="rounded-md bg-white/90 p-1 disabled:opacity-30" aria-label="Mover antes"><ArrowLeft size={13} /></button>
                  <button type="button" disabled={index === draft.images.length - 1} onClick={() => moveImage(index, 1)} className="rounded-md bg-white/90 p-1 disabled:opacity-30" aria-label="Mover después"><ArrowRight size={13} /></button>
                  {index > 0 && <button type="button" onClick={() => moveImage(index, -index)} className="rounded-md bg-white/90 p-1" aria-label="Hacer principal"><Star size={13} /></button>}
                </div>
                <button type="button" onClick={() => set('images', draft.images.filter(u => u !== url))} className="rounded-md bg-white/90 p-1 text-red-700" aria-label="Quitar foto"><X size={13} /></button>
              </div>
            </div>)}
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary">
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}{uploading ? 'Subiendo…' : 'Agregar fotos'}
              <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={e => { addPhotos(e.target.files); e.target.value = '' }} />
            </label>
          </div>
        </Card>

        <Card title="Precio">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio de venta"><div className="relative"><span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" min="0" value={draft.price} onChange={e => set('price', e.target.value)} className="pl-7" /></div></Field>
            <Field label="Precio anterior (tachado)" hint={discount ? `Se muestra como ${discount}% OFF` : 'Opcional, para mostrar una oferta.'}><div className="relative"><span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" min="0" value={draft.oldPrice} onChange={e => set('oldPrice', e.target.value)} className="pl-7" /></div></Field>
          </div>
        </Card>

        <Card title="Colores" description="Opcional. Cada color puede tener su propia foto y su stock por talle.">
          {draft.colors.length > 0 && <ul className="mb-4 space-y-2">{draft.colors.map((c, index) => <li key={index} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2">
            <input type="color" value={c.hex} onChange={e => updateColor(index, { hex: e.target.value })} aria-label={`Muestra de ${c.name}`} className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5" />
            <Input value={c.name} onChange={e => updateColor(index, { name: e.target.value })} className="h-9 w-36" aria-label="Nombre del color" />
            <div className="flex items-center gap-1.5"><span className="text-xs text-muted-foreground">Foto:</span>
              {draft.images.map((url, i) => <button type="button" key={url} onClick={() => updateColor(index, { image: c.image === url ? undefined : url })} className={cn('h-9 w-7 overflow-hidden rounded-md border-2', c.image === url ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100')} aria-label={`Usar foto ${i + 1} para ${c.name}`}><img src={url} alt="" className="h-full w-full object-cover" /></button>)}
            </div>
            <button type="button" onClick={() => set('colors', draft.colors.filter((_, i) => i !== index))} className="ml-auto rounded-md p-1.5 text-muted-foreground hover:text-destructive" aria-label={`Quitar ${c.name}`}><X size={15} /></button>
          </li>)}</ul>}
          <div className="flex flex-wrap gap-2">{[['Negro', '#151112'], ['Blanco', '#FFFFFF'], ['Bordó', '#80011F'], ['Nude', '#E3BFA5'], ['Rojo', '#C1121F'], ['Beige', '#E8D9C6'], ['Rosa', '#F2B8C6'], ['Chocolate', '#4A2420']].filter(([n]) => !draft.colors.some(c => c.name === n)).map(([name, hex]) => <button type="button" key={name} onClick={() => addColor(name, hex)} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"><span className="h-3 w-3 rounded-full border border-black/10" style={{ background: hex }} />+ {name}</button>)}</div>
          <div className="mt-3 flex max-w-sm gap-2"><input type="color" value={newColor.hex} onChange={e => setNewColor({ ...newColor, hex: e.target.value })} aria-label="Color nuevo" className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-border p-0.5" /><Input value={newColor.name} onChange={e => setNewColor({ ...newColor, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(newColor.name, newColor.hex) } }} placeholder="Otro color (ej.: Verde oliva)" /><Button type="button" onClick={() => addColor(newColor.name, newColor.hex)}>Agregar</Button></div>
        </Card>

        <Card title="Talles y stock" description={`${totalStock} unidades en total. El stock baja solo con cada compra.`}>
          <div className="mb-4 flex flex-wrap gap-2">{SIZE_PRESETS.map(preset => <button key={preset.label} type="button" onClick={() => set('sizes', preset.sizes)} className={cn('rounded-full border px-3 py-1 text-xs font-medium transition', JSON.stringify(preset.sizes) === JSON.stringify(draft.sizes) ? 'border-primary bg-primary/8 text-primary' : 'border-border hover:bg-muted')}>{preset.label}</button>)}</div>
          {draft.sizes.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-1.5">{draft.sizes.map(size => <span key={size} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{size}<button type="button" onClick={() => set('sizes', draft.sizes.filter(s => s !== size))} aria-label={`Quitar talle ${size}`} className="text-muted-foreground hover:text-destructive"><X size={12} /></button></span>)}
            <div className="flex gap-1.5"><Input value={newSize} onChange={e => setNewSize(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize() } }} placeholder="+ talle" className="h-7 w-20 text-xs" /></div></div>}
          {keys.length === 0 ? <Field label="Stock (talle único)" className="max-w-48"><Input type="number" min="0" value={draft.stock} onChange={e => set('stock', e.target.value)} /></Field>
            : <div className="overflow-x-auto"><table className="text-sm"><thead><tr><th className="pr-3 pb-2 text-left text-xs font-medium text-muted-foreground">{draft.colors.length ? 'Color' : ''}</th>{(draft.sizes.length ? draft.sizes : ['Stock']).map(size => <th key={size} className="px-1 pb-2 text-xs font-semibold">{size}</th>)}</tr></thead>
              <tbody>{(draft.colors.length ? draft.colors.map(c => c.name) : ['']).map(color => <tr key={color}>
                <td className="py-1 pr-3 whitespace-nowrap">{color && <span className="flex items-center gap-2 text-sm font-medium"><span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: draft.colors.find(c => c.name === color)?.hex }} />{color}</span>}</td>
                {(draft.sizes.length ? draft.sizes : ['']).map(size => <td key={size} className="w-24 px-1 py-1">{stockInput(variantKey(color, size))}</td>)}
              </tr>)}</tbody></table></div>}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Estado">
          <div className="space-y-4">
            <Toggle checked={draft.active} onChange={v => set('active', v)} label={draft.active ? 'Publicado' : 'Oculto'} description={draft.active ? 'Se ve en la tienda.' : 'No aparece en la tienda.'} />
            <Toggle checked={draft.featured} onChange={v => set('featured', v)} label="Destacado" description="Aparece en “Más elegidos” de la portada." />
          </div>
        </Card>
        <Card title="Organización">
          <div className="space-y-4">
            <Field label="Categoría"><Select value={draft.category} onChange={e => set('category', e.target.value)}>{categories?.map(c => <option key={c.id}>{c.name}</option>)}{draft.category && !categories?.some(c => c.name === draft.category) && <option>{draft.category}</option>}</Select></Field>
            <Field label="Etiqueta" hint="Ej.: NUEVO, 30% OFF, ÚLTIMOS"><Input value={draft.badge} onChange={e => set('badge', e.target.value)} /></Field>
            <Field label="Código interno (SKU)" hint="Opcional, solo lo ves vos."><Input value={draft.sku} onChange={e => set('sku', e.target.value)} /></Field>
          </div>
        </Card>
        <Card title="Alerta de stock bajo">
          <Field label="Avisarme cuando queden" hint="Con esta cantidad o menos se marca en el panel y la tienda muestra “Queda poco stock”."><Input type="number" min="1" value={draft.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} /></Field>
        </Card>
        <Card title="Vista previa" padded={false}>
          <div className="p-4"><div className="overflow-hidden rounded-xl border border-border">
            <div className="aspect-[3/4] bg-muted">{draft.images[0] && <img src={draft.images[0]} alt="" className="h-full w-full object-cover" />}</div>
            <div className="p-3"><p className="truncate text-sm font-medium">{draft.name || 'Nombre del producto'}</p><p className="text-sm">{money(Number(draft.price) || 0)} {discount ? <del className="text-xs text-muted-foreground">{money(Number(draft.oldPrice))}</del> : null}</p></div>
          </div></div>
        </Card>
      </div>
    </div>
    <SaveBar dirty={!product || dirty} saving={saving} onSave={save} onDiscard={product ? () => setDraft(initial.current) : undefined} message={message} error={error} />
  </>
}
