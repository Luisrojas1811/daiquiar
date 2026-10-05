'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { ArrowRight, Menu, Minus, Search, ShoppingBag, X } from 'lucide-react'
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/content'

export type Product = {
  id: number; name: string; category: string; price: number; oldPrice?: number; color: string; image: string; images: string[]; badge?: string
  description: string; sizes: string[]; sizeStock: Record<string, number>; stock: number; lowStockThreshold: number
}
export type CartLine = { id: number; size: string; quantity: number }

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(response => { if (!response.ok) throw new Error('No se pudo cargar'); return response.json() })
export const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const initialProducts: Product[] = []

type CustomerForm = { name: string; phone: string; address: string }
type Store = {
  products: Product[]; categories: string[]; cart: CartLine[]; cartProducts: (CartLine & { product: Product })[]; total: number
  content: SiteContent; search: string; setSearch: (value: string) => void
  add: (id: number, size: string, quantity: number) => void; remove: (id: number, size: string) => void; changeQuantity: (id: number, size: string, delta: number) => void
  cartOpen: boolean; setCartOpen: (value: boolean) => void; notice: string
  customer: CustomerForm; setCustomer: Dispatch<SetStateAction<CustomerForm>>
  createOrder: () => Promise<void>; orderLoading: boolean; orderError: string
}
const StoreContext = createContext<Store | null>(null)
export function useStore() { const value = useContext(StoreContext); if (!value) throw new Error('useStore debe usarse dentro de StoreProvider'); return value }

export function productImages(product: Product) { return product.images?.length ? product.images : [product.image].filter(Boolean) }
export function getSizeStock(product: Product, size: string) { return product.sizes.length ? Number(product.sizeStock?.[size] ?? 0) : product.stock }
export function hasConfiguredSizeStock(product: Product) { return product.sizes.length > 0 && Object.keys(product.sizeStock ?? {}).length > 0 }

// "Queda poco stock": hay unidades, pero la cantidad llegó (o está por debajo) del umbral del producto.
export function isLowQuantity(product: Product, quantity: number) { return quantity > 0 && quantity <= product.lowStockThreshold }
export function isLowStock(product: Product) {
  if (!product.sizes.length) return isLowQuantity(product, product.stock)
  return product.sizes.some(size => isLowQuantity(product, getSizeStock(product, size)))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Se vuelve a pedir el catálogo cada 20 s y al volver a la pestaña: así el stock siempre está al día.
  const { data: remoteProducts, mutate: refreshCatalog } = useSWR<Product[]>('/api/catalog', fetcher, { fallbackData: initialProducts, revalidateOnFocus: true, refreshInterval: 20000 })
  const { data: remoteContent } = useSWR<SiteContent>('/api/content', fetcher, { fallbackData: DEFAULT_CONTENT, revalidateOnFocus: true })
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [customer, setCustomer] = useState<CustomerForm>({ name: '', phone: '', address: '' })

  const products = useMemo(() => (Array.isArray(remoteProducts) ? remoteProducts : initialProducts), [remoteProducts])
  const content = useMemo<SiteContent>(() => ({ ...DEFAULT_CONTENT, ...(remoteContent ?? {}) }), [remoteContent])
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products])
  const cartProducts = cart.map(line => ({ ...line, product: products.find(p => p.id === line.id) })).filter(line => line.product) as (CartLine & { product: Product })[]
  const total = cartProducts.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  // Si el stock bajó mientras alguien tenía productos en el carrito, se ajustan las cantidades.
  useEffect(() => {
    if (!products.length) return
    setCart(current => {
      let changed = false
      const next = current.flatMap(line => {
        const product = products.find(p => p.id === line.id)
        if (!product) { changed = true; return [] }
        const available = getSizeStock(product, line.size)
        if (available <= 0) { changed = true; return [] }
        if (line.quantity > available) { changed = true; return [{ ...line, quantity: available }] }
        return [line]
      })
      return changed ? next : current
    })
  }, [products])

  const flash = (message: string, ms = 2500) => { setNotice(message); setTimeout(() => setNotice(''), ms) }

  const add = (id: number, size: string, quantity: number) => {
    const product = products.find(item => item.id === id); if (!product) return
    if (product.sizes.length && !hasConfiguredSizeStock(product)) { flash('Este producto todavía no tiene stock distribuido por talle'); return }
    const available = getSizeStock(product, size)
    if (available <= 0) return
    setCart(current => {
      const existing = current.find(line => line.id === id && line.size === size)
      if (existing) return current.map(line => line === existing ? { ...line, quantity: Math.min(available, existing.quantity + quantity) } : line)
      return [...current, { id, size, quantity: Math.min(available, quantity) }]
    })
    flash('Producto agregado al carrito', 2000)
  }
  const remove = (id: number, size: string) => setCart(current => current.filter(line => !(line.id === id && line.size === size)))
  const changeQuantity = (id: number, size: string, delta: number) => setCart(current => current.map(line => {
    if (line.id !== id || line.size !== size) return line
    const product = products.find(item => item.id === id)
    const available = product ? getSizeStock(product, size) : line.quantity
    return { ...line, quantity: Math.min(available, Math.max(1, line.quantity + delta)) }
  }))

  // Todos los pedidos van a WhatsApp. Al confirmar, el servidor descuenta el stock automáticamente.
  const createOrder = async () => {
    setOrderError(''); if (!cartProducts.length) return
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) { setOrderError('Completá nombre, teléfono y dirección para confirmar el pedido.'); return }
    setOrderLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customer.name, customerPhone: customer.phone, customerAddress: customer.address, items: cartProducts.map(line => ({ id: line.id, size: line.size, quantity: line.quantity })) }),
      })
      const data = await response.json()
      if (!response.ok) { setOrderError(data.error || 'No se pudo confirmar el pedido.'); refreshCatalog(); return }
      const lines = data.items.map((item: { name: string; size: string; quantity: number; subtotal: number }) => `• ${item.name} · Talle ${item.size || 'Único'} · ${item.quantity} unidad(es) — $${item.subtotal.toFixed(2)}`).join('\n')
      const text = `${content.whatsapp_intro} #${data.id}:\n\n${lines}\n\nTotal: $${Number(data.total).toFixed(2)}\n\nNombre: ${customer.name}\nDirección: ${customer.address}\nTeléfono: ${customer.phone}`
      const url = `https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
      setCart([]); setCustomer({ name: '', phone: '', address: '' }); setCartOpen(false)
      flash(`Pedido #${data.id} guardado correctamente`, 3000)
      refreshCatalog() // el stock ya se descontó: se actualiza lo que ve el cliente
      // Algunos navegadores móviles bloquean la ventana nueva tras una espera; en ese caso se abre en la misma pestaña.
      const popup = window.open(url, '_blank')
      if (!popup) window.location.assign(url)
    } catch { setOrderError('No se pudo conectar con el servidor. Volvé a intentar en unos segundos.') } finally { setOrderLoading(false) }
  }

  return <StoreContext.Provider value={{ products, categories, cart, cartProducts, total, content, search, setSearch, add, remove, changeQuantity, cartOpen, setCartOpen, notice, customer, setCustomer, createOrder, orderLoading, orderError }}>{children}</StoreContext.Provider>
}

export function InstagramIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
}
export function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
}

// Cartel rojo que se mueve en loop infinito. El texto sale del Admin.
function Marquee({ text }: { text: string }) {
  const clean = text.trim()
  if (!clean) return null
  const itemWidth = clean.length * 12 + 90 // ancho aproximado de un ítem (texto + separador)
  const repeats = Math.max(2, Math.ceil(2400 / itemWidth)) // cada mitad cubre aun pantallas anchas
  const items = Array.from({ length: repeats })
  const seconds = Math.max(12, Math.round((itemWidth * repeats) / 60))
  const half = (hidden: boolean) => <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">{items.map((_, index) => <div key={index} className="flex items-center gap-10 pr-10"><span>{clean}</span><span aria-hidden>•</span></div>)}</div>
  return <div className="overflow-hidden bg-[#7b1028] text-[#f5e6d8]" role="status" aria-label={clean}><div className="flex w-max animate-marquee items-center whitespace-nowrap py-2.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ animationDuration: `${seconds}s` }}>{half(false)}{half(true)}</div></div>
}

export function Shell({ children }: { children: ReactNode }) {
  const { cart, categories, search, setSearch, setCartOpen, cartOpen, notice, content } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const whatsappHref = `https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}`
  const infoButton = 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
  const faqs = [1, 2, 3].map(n => ({ q: content[`faq_${n}_question`], a: content[`faq_${n}_answer`] })).filter(item => item.q || item.a)
  return <main className="min-h-screen bg-background text-foreground">
    {notice && <div className="fixed top-5 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full bg-foreground px-5 py-3 text-center text-sm text-background shadow-xl">{notice}</div>}
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-5">
        <button className="md:hidden" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <Link href="/" className="mr-auto text-2xl font-black tracking-[0.14em] text-[#7b1028]">DAIQUIAR</Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex"><Link href="/#catalogo">{content.nav_new_label}</Link>{categories.map(name => <Link key={name} href={`/categoria/${slugify(name)}`}>{name}</Link>)}</nav>
        <div className="hidden items-center gap-3 md:flex"><div className="flex w-52 items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-2"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={content.search_placeholder} className="w-full bg-transparent text-xs outline-none" /></div></div>
        <button aria-label="Carrito" className="relative" onClick={() => setCartOpen(true)}><ShoppingBag size={21} />{cart.length > 0 && <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{cart.length}</span>}</button>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-border/50 px-5 py-3 md:hidden"><input value={search} onChange={e => setSearch(e.target.value)} placeholder={content.search_placeholder} className="min-w-0 flex-1 rounded-full border bg-muted/50 px-4 py-2 text-sm outline-none" /></div>
      {menuOpen && <nav className="flex flex-col border-t border-border/50 px-5 py-2 text-sm font-medium md:hidden">
        <Link href="/#catalogo" onClick={() => setMenuOpen(false)} className="py-3">{content.nav_new_label}</Link>
        {categories.map(name => <Link key={name} href={`/categoria/${slugify(name)}`} onClick={() => setMenuOpen(false)} className="border-t border-border/40 py-3">{name}</Link>)}
      </nav>}
    </header>
    <Marquee text={content.marquee_text} />
    {children}
    <section className="bg-[#0d0d0d] px-5 py-16 text-background"><div className="mx-auto max-w-6xl">
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-black tracking-[0.14em] text-[#7b1028]">DAIQUIAR</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-background/65">{content.footer_text}</p>
          <div className="mt-6 flex items-center gap-4">
            <a aria-label="Instagram de Daiquiar" href={content.instagram_url} target="_blank" rel="noreferrer" className="text-background/75 hover:text-primary"><InstagramIcon /></a>
            <a aria-label="WhatsApp de Daiquiar" href={whatsappHref} target="_blank" rel="noreferrer" className="text-background/75 hover:text-primary"><WhatsAppIcon /></a>
          </div>
        </div>
        <div><h3 className="text-lg font-bold">{content.footer_info_title}</h3><div className="mt-4 flex flex-wrap gap-2"><a href="#pagos" className={infoButton}>{content.footer_button_payments}</a><a href="#envios" className={infoButton}>{content.footer_button_shipping}</a><a href="#devoluciones" className={infoButton}>{content.footer_button_returns}</a></div></div>
        <div><h3 className="text-lg font-bold">{content.faq_title}</h3><div className="mt-4 space-y-3 text-sm text-background/70">{faqs.map((item, index) => <details key={index}><summary className="cursor-pointer font-semibold text-background">{item.q}</summary><p className="mt-2 leading-6">{item.a}</p></details>)}</div></div>
      </div>
      <div className="mt-12 grid gap-4 border-t border-background/10 pt-8 text-sm text-background/65 md:grid-cols-3">
        <div id="pagos"><p className="font-bold text-background">{content.payments_title}</p><p className="mt-1">{content.payments_text}</p></div>
        <div id="envios"><p className="font-bold text-background">{content.shipping_title}</p><p className="mt-1">{content.shipping_text}</p></div>
        <div id="devoluciones"><p className="font-bold text-background">{content.returns_title}</p><p className="mt-1">{content.returns_text}</p></div>
      </div>
      <p className="mt-8 border-t border-background/10 pt-6 text-xs text-background/40">{content.copyright}</p>
    </div></section>
    {cartOpen && <Cart />}
  </main>
}

export function CategoryCard({ name, product, onPrevious, onNext }: { name: string; product: Product; count: number; onSelect: () => void; onPrevious: () => void; onNext: () => void }) {
  const { content } = useStore()
  return <article className="group relative overflow-hidden rounded-3xl border border-border bg-foreground">
    <img src={product.image} alt={`${name}: ${product.name}`} className="h-80 w-full object-cover transition duration-500 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/15 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-5 text-background"><h3 className="text-2xl font-bold">{name}</h3><p className="mt-1 text-sm text-background/75">Ejemplo: {product.name}</p>
      <div className="mt-4 flex items-center gap-2"><button aria-label={`Foto anterior de ${name}`} onClick={onPrevious} className="rounded-full bg-background/20 px-3 py-2 backdrop-blur">‹</button><Link href={`/categoria/${slugify(name)}`} className="flex-1 rounded-full bg-[#ead7bd] px-4 py-2 text-center text-sm font-bold text-foreground">{content.category_card_cta}</Link><button aria-label={`Siguiente foto de ${name}`} onClick={onNext} className="rounded-full bg-background/20 px-3 py-2 backdrop-blur">›</button></div>
    </div>
  </article>
}

export function ProductCard({ product, add }: { product: Product; add: (id: number, size: string, quantity: number) => void }) {
  const { content } = useStore()
  const gallery = productImages(product)
  const [activeImage, setActiveImage] = useState(gallery[0] ?? '')
  const [chosenSize, setChosenSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const hasSizes = product.sizes.length > 0
  const configured = hasConfiguredSizeStock(product)
  const unavailableByDistribution = hasSizes && !configured
  // El talle elegido se mantiene mientras tenga stock; si se agota (por una compra), pasa al primero disponible.
  const firstAvailable = product.sizes.find(option => getSizeStock(product, option) > 0) ?? ''
  const size = hasSizes ? (chosenSize && getSizeStock(product, chosenSize) > 0 ? chosenSize : firstAvailable) : ''
  const sizeAvailable = hasSizes ? (size ? getSizeStock(product, size) : 0) : product.stock
  const qty = Math.min(quantity, Math.max(1, sizeAvailable))
  const low = !unavailableByDistribution && isLowStock(product)
  const soldOut = !unavailableByDistribution && sizeAvailable === 0
  return <article className="group overflow-hidden rounded-2xl border border-border bg-background">
    <div className="relative h-72 overflow-hidden bg-muted">
      <img src={activeImage || gallery[0] || EMPTY_IMAGE} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      {product.badge && <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{product.badge}</span>}
      {low && <span className="absolute bottom-3 left-3 rounded-full bg-[#7b1028] px-3 py-1 text-xs font-bold text-[#f5e6d8] shadow-lg">{content.low_stock_label}</span>}
    </div>
    {gallery.length > 1 && <div className="flex gap-2 overflow-x-auto border-b border-border p-2">{gallery.map(image => <button type="button" key={image} onClick={() => setActiveImage(image)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === image ? 'border-primary' : 'border-transparent'}`}><img src={image} alt="Vista alternativa" className="h-full w-full object-cover" /></button>)}</div>}
    <div className="p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.category}</p>
      <h3 className="mt-1 font-bold">{product.name}</h3>
      <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{product.description}</p>
      {hasSizes ? <>
        <div className="mt-4 flex flex-wrap gap-2">{product.sizes.map(option => {
          const available = configured && getSizeStock(product, option) > 0
          return <button type="button" key={option} disabled={!available} onClick={() => { setChosenSize(option); setQuantity(1) }} className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold ${size === option && available ? 'border-primary bg-primary text-primary-foreground' : ''} ${!available ? 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60' : ''}`}>{option}</button>
        })}</div>
        {unavailableByDistribution ? <p className="mt-3 text-xs text-muted-foreground">Stock por talle pendiente de configurar.</p>
          : size && isLowQuantity(product, sizeAvailable) ? <p className="mt-3 text-sm font-semibold text-primary">{content.low_stock_label} · {sizeAvailable} en talle {size}</p>
          : soldOut ? <p className="mt-3 text-sm font-semibold text-muted-foreground">{content.out_of_stock_label}</p> : null}
      </> : product.stock === 0 ? <p className="mt-3 text-sm font-semibold text-muted-foreground">{content.out_of_stock_label}</p>
        : isLowQuantity(product, product.stock) ? <p className="mt-3 text-sm font-semibold text-primary">{content.low_stock_label} · {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}</p> : null}
      <div className="mt-4 flex items-center gap-2"><div className="flex items-center rounded-lg border"><button aria-label="Disminuir unidades" onClick={() => setQuantity(Math.max(1, qty - 1))} className="px-3">−</button><span className="min-w-8 text-center text-sm">{qty}</span><button aria-label="Aumentar unidades" disabled={!sizeAvailable || qty >= sizeAvailable} onClick={() => setQuantity(Math.min(sizeAvailable, qty + 1))} className="px-3 disabled:opacity-40">+</button></div></div>
      <button disabled={!sizeAvailable || unavailableByDistribution} onClick={() => add(product.id, size, qty)} className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{unavailableByDistribution ? 'Stock pendiente' : !sizeAvailable ? content.out_of_stock_label : content.add_to_cart_label}</button>
      <div className="mt-4 flex items-center gap-2"><span className="text-lg font-bold">${product.price.toFixed(2)}</span>{product.oldPrice && <del className="text-sm text-muted-foreground">${product.oldPrice.toFixed(2)}</del>}</div>
    </div>
  </article>
}

function Overlay({ children, close }: { children: ReactNode; close: () => void }) { return <div className="fixed inset-0 z-40 bg-foreground/40 p-4" onClick={close}><div onClick={e => e.stopPropagation()} className="mx-auto mt-8 max-h-[90vh] max-w-lg overflow-auto rounded-2xl bg-background p-6 shadow-2xl">{children}</div></div> }

function Cart() {
  const { cartProducts: items, total, content, remove, changeQuantity, setCartOpen, createOrder, orderLoading, orderError, customer, setCustomer } = useStore()
  const field = 'rounded-xl border px-4 py-3'
  return <Overlay close={() => setCartOpen(false)}>
    <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{content.cart_title}</h2><button onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X /></button></div>
    {items.length === 0 ? <p className="py-12 text-center text-muted-foreground">{content.cart_empty_text}</p> : <>
      <div className="mt-6 space-y-4">{items.map(line => {
        const available = getSizeStock(line.product, line.size)
        return <div className="flex items-center gap-3" key={`${line.id}-${line.size}`}>
          <img src={productImages(line.product)[0] || EMPTY_IMAGE} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{line.product.name}</p><p className="text-sm text-muted-foreground">Talle {line.size || 'Único'} · ${line.product.price.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-3"><button onClick={() => changeQuantity(line.id, line.size, -1)} className="rounded border px-2">−</button><span>{line.quantity}</span><button onClick={() => changeQuantity(line.id, line.size, 1)} disabled={line.quantity >= available} className="rounded border px-2 disabled:opacity-40">+</button><button onClick={() => remove(line.id, line.size)} aria-label="Quitar del carrito" className="ml-auto text-muted-foreground"><Minus size={16} /></button></div></div>
        </div>
      })}</div>
      <div className="mt-7 flex justify-between border-t pt-5 text-lg font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
      <div className="mt-5 grid gap-3">
        <input value={customer.name} onChange={e => setCustomer(v => ({ ...v, name: e.target.value }))} placeholder="Nombre y apellido" className={field} />
        <input value={customer.phone} onChange={e => setCustomer(v => ({ ...v, phone: e.target.value }))} placeholder="Teléfono" className={field} />
        <textarea value={customer.address} onChange={e => setCustomer(v => ({ ...v, address: e.target.value }))} placeholder="Dirección de entrega" className={`min-h-20 ${field}`} />
      </div>
      {orderError && <p className="mt-3 text-sm font-medium text-destructive">{orderError}</p>}
      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4"><p className="text-sm font-semibold">{content.cart_how_title}</p><p className="mt-1 text-xs text-muted-foreground">{content.cart_how_text}</p>
        <button onClick={() => createOrder()} disabled={orderLoading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white disabled:opacity-50">{orderLoading ? 'Guardando…' : content.cart_whatsapp_label} <ArrowRight size={18} /></button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">{content.cart_note}</p>
    </>}
  </Overlay>
}
