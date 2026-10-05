'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ImagePlus, LockKeyhole, LogOut, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react'
import { CONTENT_FIELDS, CONTENT_GROUPS, DEFAULT_CONTENT, type ContentField, type SiteContent } from '@/lib/content'

type Product = { id: number; name: string; category: string; price: number; image: string; images: string[]; stock: number; sizes: string[]; sizeStock: Record<string, number>; lowStockThreshold: number; description: string; color: string; badge?: string }
const categoriesFallback = ['Bodies', 'Catsuits', 'Conjuntos']
const inputClass = 'w-full rounded-xl border border-input bg-background px-4 py-3'

// Achica la foto en el navegador (máx. 1600 px, JPEG) para que pese poco y se suba rápido.
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d'); if (!context) throw new Error('No se pudo procesar la imagen')
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error('No se pudo procesar la imagen')
  return blob
}

// Sube las fotos a nuestra propia base de datos y devuelve sus direcciones (/api/images/<id>).
async function uploadImages(files: FileList | File[]) {
  const urls: string[] = []
  for (const file of Array.from(files)) {
    const blob = await shrinkImage(file)
    const response = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.url) throw new Error(data.error || 'No se pudo subir una imagen')
    urls.push(data.url)
  }
  return urls
}

function SizeStockFields({ sizes, value, onChange }: { sizes: string[]; value: Record<string, number>; onChange: (next: Record<string, number>) => void }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{sizes.map(size => <label key={size} className="text-sm font-medium">{size}<input type="number" min="0" name={`size-${size}`} value={value[size] ?? 0} onChange={e => onChange({ ...value, [size]: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2" /></label>)}</div>
}

/* ───────────── Formulario de producto ───────────── */

function ProductForm({ product, categories, onDone, onCancel }: { product?: Product; categories: string[]; onDone: (product: Product) => void; onCancel?: () => void }) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? categories[0] ?? 'Bodies')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [description, setDescription] = useState(product?.description ?? '')
  const [sizes, setSizes] = useState(product?.sizes.join(', ') ?? '')
  const [sizeStock, setSizeStock] = useState<Record<string, number>>(product?.sizeStock ?? {})
  const [stock, setStock] = useState(String(product?.stock ?? 0))
  const [threshold, setThreshold] = useState(String(product?.lowStockThreshold ?? 3))
  const [mainFile, setMainFile] = useState<FileList | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<FileList | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sizeList = useMemo(() => sizes.split(',').map(s => s.trim()).filter(Boolean), [sizes])
  // Foto del stock al abrir el formulario: sirve para no pisar ventas hechas mientras se editaba.
  const initial = useRef({ sizes: product?.sizes.join(',') ?? '', sizeStock: JSON.stringify(product?.sizeStock ?? {}), stock: String(product?.stock ?? 0) })
  useEffect(() => setSizeStock(current => Object.fromEntries(sizeList.map(size => [size, current[size] ?? product?.sizeStock?.[size] ?? 0]))), [sizes]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      let mainUrl = product?.image || ''; let extraUrls: string[] = []
      if (mainFile?.length) mainUrl = (await uploadImages(mainFile))[0] || mainUrl
      if (additionalFiles?.length) extraUrls = await uploadImages(additionalFiles)
      if (!mainUrl) throw new Error('Subí una imagen principal.')

      const stockPayload = { sizes: sizeList, stock: sizeList.length ? 0 : Math.max(0, Number(stock) || 0), sizeStock: sizeList.length ? sizeStock : {} }
      const body: Record<string, unknown> = { name, category, price: Number(price), description, lowStockThreshold: Number(threshold) }
      if (!product) {
        Object.assign(body, stockPayload, { images: [mainUrl, ...extraUrls] })
      } else {
        // Solo se envía el stock si realmente se tocó; así una venta que ocurrió mientras se editaba no se pisa.
        const stockTouched = sizeList.join(',') !== initial.current.sizes || JSON.stringify(sizeList.length ? sizeStock : {}) !== (sizeList.length ? initial.current.sizeStock : '{}') || (!sizeList.length && stock !== initial.current.stock)
        if (stockTouched) Object.assign(body, stockPayload)
        if (mainFile?.length) body.images = [mainUrl, ...(product.images ?? []).filter(url => url !== product.image), ...extraUrls]
        else if (extraUrls.length) body.appendImages = extraUrls
      }
      const response = await fetch(product ? `/api/catalog/${product.id}` : '/api/catalog', { method: product ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo guardar')
      onDone(data as Product)
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving(false) }
  }

  return <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
    <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{product ? 'Editar producto' : 'Nuevo producto'}</h2><p className="mt-1 text-sm text-muted-foreground">Elegí las fotos desde tu equipo; se achican y se guardan automáticamente.</p></div>{onCancel && <button type="button" onClick={onCancel} aria-label="Cancelar"><X size={20} /></button>}</div>
    <div className="mt-5 grid gap-3">
      <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className={inputClass} />
      <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>{categories.map(c => <option key={c}>{c}</option>)}</select>
      <input required min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="Precio" className={inputClass} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" className={`min-h-24 ${inputClass}`} />
      <div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">Imagen principal</p>{product?.image && <img src={product.image} alt="" className="mt-3 h-24 w-24 rounded-lg object-cover" />}<label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm"><Upload size={17} /> Subir imagen<input required={!product} type="file" accept="image/*" onChange={e => setMainFile(e.target.files)} className="sr-only" /></label>{mainFile?.[0] && <p className="mt-2 text-xs text-muted-foreground">{mainFile[0].name}</p>}</div>
      <div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">Imágenes adicionales</p><p className="mt-1 text-xs text-muted-foreground">Las existentes se conservan al editar.</p>{(product?.images?.length ?? 0) > 1 && <div className="mt-3 flex flex-wrap gap-2">{(product?.images ?? []).slice(1).map(url => <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />)}</div>}<label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm"><ImagePlus size={17} /> Subir imágenes<input type="file" multiple accept="image/*" onChange={e => setAdditionalFiles(e.target.files)} className="sr-only" /></label>{(additionalFiles?.length ?? 0) > 0 && <p className="mt-2 text-xs text-muted-foreground">{additionalFiles?.length} imagen(es) seleccionada(s)</p>}</div>
      <label className="text-sm font-medium">Talles<input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="Ej.: XS, S, M, L, XL" className={`mt-1 ${inputClass}`} /></label>
      {sizeList.length > 0 ? <div className="rounded-xl border border-border p-4"><p className="mb-3 text-sm font-semibold">Stock por talle</p><SizeStockFields sizes={sizeList} value={sizeStock} onChange={setSizeStock} /><p className="mt-3 text-xs text-muted-foreground">El stock baja solo cuando alguien hace un pedido.</p></div>
        : <label className="text-sm font-medium">Stock general<input value={stock} onChange={e => setStock(e.target.value)} type="number" min="0" className={`mt-1 ${inputClass}`} /></label>}
      <label className="text-sm font-medium">Umbral de bajo stock<input value={threshold} onChange={e => setThreshold(e.target.value)} type="number" min="1" className={`mt-1 ${inputClass}`} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Cuando queden esta cantidad o menos, en la tienda aparece el cartel “Queda poco stock”.</span></label>
      <button disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"><Save size={17} />{saving ? 'Guardando…' : 'Guardar producto'}</button>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  </form>
}

/* ───────────── Contenido de la tienda ───────────── */

function ContentField({ field, value, onChange }: { field: ContentField; value: string; onChange: (next: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const changed = value !== field.default
  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true); setUploadError('')
    try { const [url] = await uploadImages(files); if (url) onChange(url) } catch (err) { setUploadError(err instanceof Error ? err.message : 'No se pudo subir la imagen') } finally { setUploading(false) }
  }
  return <div className="rounded-xl border border-border p-4">
    <div className="flex items-start justify-between gap-3"><label className="text-sm font-semibold" htmlFor={`field-${field.key}`}>{field.label}</label>{changed && <button type="button" onClick={() => onChange(field.default)} className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-primary"><RotateCcw size={12} /> Restaurar original</button>}</div>
    {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
    {field.type === 'image' ? <div className="mt-3">
      {value && <img src={value} alt="" className="h-48 w-full max-w-xs rounded-xl object-cover" />}
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm"><Upload size={17} /> {uploading ? 'Subiendo…' : 'Cambiar foto'}<input id={`field-${field.key}`} type="file" accept="image/*" disabled={uploading} onChange={e => { upload(e.target.files); e.target.value = '' }} className="sr-only" /></label>
      {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
    </div>
      : field.type === 'textarea' ? <textarea id={`field-${field.key}`} value={value} onChange={e => onChange(e.target.value)} className={`mt-2 min-h-20 ${inputClass}`} />
      : <input id={`field-${field.key}`} value={value} onChange={e => onChange(e.target.value)} inputMode={field.type === 'phone' ? 'numeric' : undefined} type={field.type === 'url' ? 'url' : 'text'} className={`mt-2 ${inputClass}`} />}
  </div>
}

function ContentEditor() {
  const [values, setValues] = useState<SiteContent>(DEFAULT_CONTENT)
  const [saved, setSaved] = useState<SiteContent>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetch('/api/content', { cache: 'no-store' }).then(r => r.json()).then((data: SiteContent) => { const merged = { ...DEFAULT_CONTENT, ...data }; setValues(merged); setSaved(merged) }).catch(() => setError('No se pudo cargar el contenido')).finally(() => setLoading(false)) }, [])

  const dirtyKeys = CONTENT_FIELDS.filter(field => values[field.key] !== saved[field.key]).map(field => field.key)

  async function save() {
    setSaving(true); setMessage(''); setError('')
    try {
      const upsert: Record<string, string> = {}; const reset: string[] = []
      for (const key of dirtyKeys) { if (values[key] === DEFAULT_CONTENT[key]) reset.push(key); else upsert[key] = values[key] }
      const response = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: upsert, reset }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo guardar')
      setSaved(values); setMessage('Cambios guardados. Ya se ven en la tienda.')
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving(false) }
  }

  if (loading) return <p className="py-10 text-center text-muted-foreground">Cargando contenido…</p>
  return <div className="space-y-8">
    <div className="rounded-2xl border border-border bg-card p-6"><h2 className="font-bold">Textos e imágenes de la tienda</h2><p className="mt-1 text-sm text-muted-foreground">Cambiá cualquier texto que ven tus clientas, el cartel en movimiento y la foto principal de la portada. Después tocá “Guardar cambios”.</p></div>
    {CONTENT_GROUPS.map(group => <section key={group} className="rounded-2xl border border-border bg-card p-6"><h3 className="font-bold">{group}</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{CONTENT_FIELDS.filter(field => field.group === group).map(field => <div key={field.key} className={field.type === 'image' || field.type === 'textarea' ? 'md:col-span-2' : ''}><ContentField field={field} value={values[field.key] ?? ''} onChange={next => { setMessage(''); setValues(current => ({ ...current, [field.key]: next })) }} /></div>)}</div></section>)}
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-lg">
      <button onClick={save} disabled={saving || !dirtyKeys.length} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-40"><Save size={17} />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
      <p className="text-sm text-muted-foreground">{dirtyKeys.length ? `${dirtyKeys.length} cambio(s) sin guardar` : 'Todo guardado'}</p>
      {message && <p className="text-sm font-medium text-primary">{message}</p>}{error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  </div>
}

/* ───────────── Productos ───────────── */

function ProductsTab({ products, categories, refresh, setProducts }: { products: Product[]; categories: string[]; refresh: () => Promise<void>; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const [editing, setEditing] = useState<Product | null>(null)
  const [message, setMessage] = useState('')
  const [formKey, setFormKey] = useState(0)

  async function startEditing(product: Product) {
    // Se abre con el stock más reciente, por si hubo ventas desde la última carga.
    const response = await fetch('/api/catalog', { cache: 'no-store' }).catch(() => null)
    const fresh = response?.ok ? ((await response.json()) as Product[]).find(p => p.id === product.id) : null
    setEditing(fresh ?? product); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function remove(id: number) {
    if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    const response = await fetch(`/api/catalog/${id}`, { method: 'DELETE' })
    if (!response.ok) { setMessage('No se pudo eliminar el producto'); return }
    setProducts(current => current.filter(p => p.id !== id)); if (editing?.id === id) setEditing(null); setMessage('Producto eliminado')
  }

  return <>
    {editing ? <div className="mb-8"><ProductForm key={`edit-${editing.id}`} product={editing} categories={categories} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); setMessage('Producto actualizado'); refresh() }} /></div>
      : <div className="mb-8"><ProductForm key={`new-${formKey}`} categories={categories} onDone={product => { setProducts(current => [product, ...current.filter(p => p.id !== product.id)]); setFormKey(k => k + 1); setMessage('Producto creado y publicado en la tienda'); refresh() }} /></div>}
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between"><div><h2 className="font-bold">Productos activos</h2><p className="mt-1 text-sm text-muted-foreground">El stock se descuenta solo con cada pedido. Para cambiarlo a mano, entrá a editar el producto.</p></div><div className="flex items-center gap-2"><button onClick={() => refresh()} className="rounded-lg border border-border px-3 py-1 text-xs font-semibold">Actualizar</button><span className="rounded-full bg-muted px-3 py-1 text-xs">{products.length}</span></div></div>
      <div className="mt-5 divide-y divide-border">{products.map(product => {
        const sizeLow = (size: string) => { const q = product.sizeStock?.[size] ?? 0; return q > 0 && q <= product.lowStockThreshold }
        const generalLow = !product.sizes.length && product.stock > 0 && product.stock <= product.lowStockThreshold
        return <div key={product.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
          <img src={product.image || '/placeholder.svg'} alt="" className="h-16 w-16 rounded-xl object-cover" />
          <div className="min-w-0 flex-1"><p className="font-semibold">{product.name}</p><p className="text-sm text-muted-foreground">{product.category} · ${product.price.toLocaleString('es-AR')}</p>
            {product.sizes.length ? <p className="mt-1 text-xs text-muted-foreground">{product.sizes.map((size, i) => <span key={size} className={sizeLow(size) ? 'font-bold text-destructive' : (product.sizeStock?.[size] ?? 0) === 0 ? 'opacity-50' : ''}>{i > 0 && ' · '}{size}: {product.sizeStock?.[size] ?? 0}</span>)}</p>
              : <p className={`mt-1 text-xs ${generalLow ? 'font-bold text-destructive' : 'text-muted-foreground'}`}>Stock: {product.stock}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Umbral de bajo stock: {product.lowStockThreshold}</p></div>
          <div className="flex gap-2"><button onClick={() => startEditing(product)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">Editar</button><button onClick={() => remove(product.id)} aria-label={`Eliminar ${product.name}`} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"><Trash2 size={18} /></button></div>
        </div>
      })}{products.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay productos. Creá el primero con el formulario de arriba.</p>}</div>
    </section>
    {message && <p className="mt-5 text-sm font-medium text-primary">{message}</p>}
  </>
}

/* ───────────── Página ───────────── */

export default function AdminPage() {
  const [logged, setLogged] = useState(false)
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loginError, setLoginError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'productos' | 'contenido'>('productos')

  const categories = useMemo(() => Array.from(new Set([...categoriesFallback, ...products.map(p => p.category).filter(Boolean)])), [products])
  const refresh = useCallback(async () => {
    const response = await fetch('/api/catalog', { cache: 'no-store' }).catch(() => null)
    if (!response?.ok) { setMessage('No se pudo cargar el catálogo'); return }
    const catalog = await response.json(); if (Array.isArray(catalog)) setProducts(catalog)
  }, [])

  useEffect(() => { fetch('/api/admin/session').then(r => r.json()).then(session => { setLogged(Boolean(session.authenticated)); if (session.authenticated) return refresh() }).catch(() => setMessage('No se pudo cargar el panel')).finally(() => setLoading(false)) }, [refresh])
  // Mientras el panel está abierto, el stock se refresca solo para reflejar las ventas.
  useEffect(() => { if (!logged) return; const timer = setInterval(refresh, 30000); return () => clearInterval(timer) }, [logged, refresh])

  async function doLogin(event: FormEvent) { event.preventDefault(); setLoginError(''); const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); const data = await response.json(); if (!response.ok) { setLoginError(data.error || 'No se pudo iniciar sesión'); return } setLogged(true); setPassword(''); refresh() }
  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); setLogged(false) }

  if (loading) return <main className="min-h-screen bg-background p-10 text-center">Cargando panel…</main>
  const tabClass = (active: boolean) => `rounded-full px-5 py-2.5 text-sm font-semibold ${active ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><a href="/" className="flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={17} /> Ver tienda pública</a><span className="font-serif text-2xl font-bold">DAIQUIAR</span>{logged ? <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground"><LogOut size={16} /> Salir</button> : <span className="text-xs uppercase tracking-widest text-muted-foreground">Panel privado</span>}</div></header>
    <div className="mx-auto max-w-6xl px-5 py-12">{!logged ? <section className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><LockKeyhole size={21} /></div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Daiquiar Indumentaria</p><h1 className="mt-2 font-serif text-4xl font-bold">Ingresar al panel</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Usá la contraseña configurada en <code>ADMIN_PASSWORD</code>. El email es solo informativo.</p>
      <form onSubmit={doLogin} className="mt-7 space-y-4"><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@email.com" className={`${inputClass} outline-none`} /><input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Contraseña" className={`${inputClass} outline-none`} /><button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Entrar</button></form>
      {loginError && <p className="mt-4 text-sm text-destructive">{loginError}</p>}
    </section> : <>
      <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Administración</p><h1 className="mt-2 font-serif text-4xl font-bold">{tab === 'productos' ? 'Catálogo de productos' : 'Contenido de la tienda'}</h1><p className="mt-2 text-sm text-muted-foreground">Gestioná productos, stock, textos e imágenes sin tocar el código.</p></div>
      <div className="mb-8 flex gap-2"><button onClick={() => setTab('productos')} className={tabClass(tab === 'productos')}>Productos y stock</button><button onClick={() => setTab('contenido')} className={tabClass(tab === 'contenido')}>Contenido de la tienda</button></div>
      {tab === 'productos' ? <ProductsTab products={products} categories={categories} refresh={refresh} setProducts={setProducts} /> : <ContentEditor />}
      {message && tab === 'productos' && <p className="mt-5 text-sm font-medium text-destructive">{message}</p>}
    </>}</div>
  </main>
}
