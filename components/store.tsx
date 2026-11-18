'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, Menu, Minus, Plus, Search, ShoppingBag, Trash2, Truck, X } from 'lucide-react'
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/content'
import { computeTotals, money } from '@/lib/pricing'
import type { Category, Product } from '@/lib/types'

export type { Product }
export type CartLine = { id: number; size: string; quantity: number }

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(response => { if (!response.ok) throw new Error('No se pudo cargar'); return response.json() })
export const slugify = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const CART_KEY = 'daiquiar_cart_v1'

export function productImages(product: Product) { return product.images?.length ? product.images : [product.image].filter(Boolean) }
export function getSizeStock(product: Product, size: string) { return product.sizes.length ? Number(product.sizeStock?.[size] ?? 0) : product.stock }
export function hasConfiguredSizeStock(product: Product) { return product.sizes.length > 0 && Object.keys(product.sizeStock ?? {}).length > 0 }
export function isLowQuantity(product: Product, quantity: number) { return quantity > 0 && quantity <= product.lowStockThreshold }
export function availableUnits(product: Product) { return product.sizes.length ? product.sizes.reduce((s, size) => s + getSizeStock(product, size), 0) : product.stock }
export const transferPercent = (content: SiteContent) => content.payment_transfer_enabled === '1' ? Number(content.payment_transfer_discount) || 0 : 0

type Store = {
  products: Product[]; categories: Category[]; loading: boolean; content: SiteContent
  cart: CartLine[]; cartLines: (CartLine & { product: Product })[]; subtotal: number; count: number
  add: (product: Product, size: string, quantity: number) => void; remove: (id: number, size: string) => void; changeQuantity: (id: number, size: string, delta: number) => void; clearCart: () => void
  cartOpen: boolean; setCartOpen: (value: boolean) => void; refreshCatalog: () => void
  search: string; setSearch: (value: string) => void
}
const StoreContext = createContext<Store | null>(null)
export function useStore() { const value = useContext(StoreContext); if (!value) throw new Error('useStore debe usarse dentro de StoreProvider'); return value }

export function StoreProvider({ children }: { children: ReactNode }) {
  // El catálogo se vuelve a pedir cada 20 s y al volver a la pestaña: así el stock siempre está al día.
  const { data: remoteProducts, mutate: refreshCatalog, isLoading } = useSWR<Product[]>('/api/catalog', fetcher, { revalidateOnFocus: true, refreshInterval: 20000 })
  const { data: remoteCategories } = useSWR<Category[]>('/api/categories', fetcher)
  const { data: remoteContent } = useSWR<SiteContent>('/api/content', fetcher, { fallbackData: DEFAULT_CONTENT, revalidateOnFocus: true })
  const [cart, setCart] = useState<CartLine[]>([])
  const [loaded, setLoaded] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')

  // El carrito se guarda en el navegador: si la clienta cierra la pestaña, lo encuentra igual al volver.
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'); if (Array.isArray(saved)) setCart(saved) } catch {} setLoaded(true) }, [])
  useEffect(() => { if (loaded) try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch {} }, [cart, loaded])

  const products = useMemo(() => (Array.isArray(remoteProducts) ? remoteProducts : []), [remoteProducts])
  const content = useMemo<SiteContent>(() => ({ ...DEFAULT_CONTENT, ...(remoteContent ?? {}) }), [remoteContent])
  const categories = useMemo<Category[]>(() => {
    if (Array.isArray(remoteCategories) && remoteCategories.length) return remoteCategories.filter(c => c.products > 0)
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((name, i) => ({ id: i, name, slug: slugify(name), image: '', description: '', sortOrder: i, visible: true, products: products.filter(p => p.category === name).length }))
  }, [remoteCategories, products])
  const cartLines = cart.map(line => ({ ...line, product: products.find(p => p.id === line.id) })).filter(line => line.product) as (CartLine & { product: Product })[]
  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const count = cartLines.reduce((sum, line) => sum + line.quantity, 0)

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

  const add = (product: Product, size: string, quantity: number) => {
    const available = getSizeStock(product, size)
    if (available <= 0) return
    setCart(current => {
      const existing = current.find(line => line.id === product.id && line.size === size)
      if (existing) return current.map(line => line === existing ? { ...line, quantity: Math.min(available, existing.quantity + quantity) } : line)
      return [...current, { id: product.id, size, quantity: Math.min(available, quantity) }]
    })
    setCartOpen(true) // como en Tiendanube: al agregar se abre el carrito lateral
  }
  const remove = (id: number, size: string) => setCart(current => current.filter(line => !(line.id === id && line.size === size)))
  const changeQuantity = (id: number, size: string, delta: number) => setCart(current => current.map(line => {
    if (line.id !== id || line.size !== size) return line
    const product = products.find(item => item.id === id)
    const available = product ? getSizeStock(product, size) : line.quantity
    return { ...line, quantity: Math.min(available, Math.max(1, line.quantity + delta)) }
  }))

  return <StoreContext.Provider value={{ products, categories, loading: isLoading && !products.length, content, cart, cartLines, subtotal, count, add, remove, changeQuantity, clearCart: () => setCart([]), cartOpen, setCartOpen, refreshCatalog: () => refreshCatalog(), search, setSearch }}>{children}</StoreContext.Provider>
}

export function InstagramIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
}
export function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
}

// Cartel bordó que se mueve en loop infinito. El texto sale del Admin → Promociones.
function Marquee({ text }: { text: string }) {
  const clean = text.trim()
  if (!clean) return null
  const itemWidth = clean.length * 12 + 90
  const repeats = Math.max(2, Math.ceil(2400 / itemWidth))
  const seconds = Math.max(12, Math.round((itemWidth * repeats) / 60))
  const half = (hidden: boolean) => <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">{Array.from({ length: repeats }, (_, index) => <div key={index} className="flex items-center gap-10 pr-10"><span>{clean}</span><span aria-hidden>♡</span></div>)}</div>
  return <div className="overflow-hidden bg-primary text-primary-foreground" role="status" aria-label={clean}><div className="flex w-max animate-marquee items-center whitespace-nowrap py-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ animationDuration: `${seconds}s` }}>{half(false)}{half(true)}</div></div>
}

export function Logo({ className = '' }: { className?: string }) { return <Link href="/" className={`font-black tracking-[0.18em] text-primary ${className}`}>DAIQUIAR</Link> }

function Header() {
  const { categories, count, setCartOpen, content, search, setSearch } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [pathname])
  const submitSearch = () => { setSearchOpen(false); router.push(`/productos${search ? `?q=${encodeURIComponent(search)}` : ''}`) }
  return <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
    <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-1">
        <button className="-ml-2 rounded-full p-2 lg:hidden" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
        <nav className="hidden items-center gap-6 text-[13px] font-semibold uppercase tracking-wider lg:flex">
          <Link href="/productos" className="hover:text-primary">{content.nav_new_label}</Link>
          {categories.slice(0, 5).map(c => <Link key={c.id} href={`/categoria/${c.slug}`} className="hover:text-primary">{c.name}</Link>)}
        </nav>
      </div>
      <Logo className="text-2xl sm:text-[28px]" />
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => setSearchOpen(open => !open)} aria-label="Buscar" className="rounded-full p-2 hover:bg-secondary"><Search size={20} /></button>
        <a href={content.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="hidden rounded-full p-2 hover:bg-secondary sm:block"><InstagramIcon size={20} /></a>
        <button aria-label={`Carrito (${count})`} className="relative rounded-full p-2 hover:bg-secondary" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={20} />{count > 0 && <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>}
        </button>
      </div>
    </div>
    {searchOpen && <form onSubmit={e => { e.preventDefault(); submitSearch() }} className="border-t border-border bg-background px-4 py-3"><div className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-border bg-card px-4"><Search size={17} className="text-muted-foreground" /><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder={content.search_placeholder} className="h-11 w-full bg-transparent text-sm outline-none" /><button className="text-sm font-semibold text-primary">Buscar</button></div></form>}
    {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-foreground/40" onClick={() => setMenuOpen(false)} />
      <nav className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><Logo className="text-xl" /><button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X size={22} /></button></div>
        <div className="flex-1 overflow-y-auto px-5 py-2 text-[15px] font-medium">
          <Link href="/productos" className="flex items-center justify-between border-b border-border py-4">{content.nav_new_label}<ChevronRight size={17} className="text-muted-foreground" /></Link>
          {categories.map(c => <Link key={c.id} href={`/categoria/${c.slug}`} className="flex items-center justify-between border-b border-border py-4">{c.name}<ChevronRight size={17} className="text-muted-foreground" /></Link>)}
          <Link href="/ayuda" className="flex items-center justify-between border-b border-border py-4">Ayuda · envíos y cambios<ChevronRight size={17} className="text-muted-foreground" /></Link>
        </div>
      </nav>
    </div>}
  </header>
}

function Footer() {
  const { content, categories } = useStore()
  const whatsappHref = `https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}`
  return <footer className="mt-16 bg-primary text-primary-foreground">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
      <div className="md:col-span-1"><p className="text-2xl font-black tracking-[0.18em]">DAIQUIAR</p><p className="mt-4 text-sm leading-6 text-primary-foreground/75">{content.footer_text}</p>
        <div className="mt-5 flex gap-3"><a aria-label="Instagram" href={content.instagram_url} target="_blank" rel="noreferrer" className="rounded-full border border-primary-foreground/25 p-2.5 hover:bg-primary-foreground/10"><InstagramIcon size={18} /></a><a aria-label="WhatsApp" href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-full border border-primary-foreground/25 p-2.5 hover:bg-primary-foreground/10"><WhatsAppIcon size={18} /></a></div>
      </div>
      <div><p className="text-xs font-bold uppercase tracking-[0.2em]">Tienda</p><ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/75"><li><Link href="/productos" className="hover:text-primary-foreground">Ver todo</Link></li>{categories.map(c => <li key={c.id}><Link href={`/categoria/${c.slug}`} className="hover:text-primary-foreground">{c.name}</Link></li>)}</ul></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.2em]">{content.footer_info_title}</p><ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/75"><li><Link href="/ayuda#como-comprar" className="hover:text-primary-foreground">Cómo comprar</Link></li><li><Link href="/ayuda#pagos" className="hover:text-primary-foreground">{content.footer_button_payments}</Link></li><li><Link href="/ayuda#envios" className="hover:text-primary-foreground">{content.footer_button_shipping}</Link></li><li><Link href="/ayuda#cambios" className="hover:text-primary-foreground">{content.footer_button_returns}</Link></li><li><Link href="/ayuda#talles" className="hover:text-primary-foreground">Guía de talles</Link></li></ul></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.2em]">Contacto</p><ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/75"><li><a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-primary-foreground">WhatsApp</a></li><li><a href={content.instagram_url} target="_blank" rel="noreferrer" className="hover:text-primary-foreground">Instagram</a></li>{content.store_location && <li>{content.store_location}</li>}</ul></div>
    </div>
    <div className="border-t border-primary-foreground/15"><p className="mx-auto max-w-7xl px-4 py-5 text-xs text-primary-foreground/60 sm:px-6">{content.copyright}</p></div>
  </footer>
}

// Carrito lateral (como en Tiendanube): se abre al agregar un producto.
function CartDrawer() {
  const { cartLines, subtotal, content, remove, changeQuantity, cartOpen, setCartOpen } = useStore()
  const router = useRouter()
  const totals = computeTotals(content, subtotal, '', '')
  const missing = totals.freeFrom > 0 ? Math.max(0, totals.freeFrom - subtotal) : 0
  const transfer = transferPercent(content)
  useEffect(() => { document.body.style.overflow = cartOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [cartOpen])
  if (!cartOpen) return null
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={content.cart_title}>
    <div className="absolute inset-0 bg-foreground/40 animate-in fade-in" onClick={() => setCartOpen(false)} />
    <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-lg font-bold">{content.cart_title}</h2><button onClick={() => setCartOpen(false)} aria-label="Cerrar carrito" className="rounded-full p-1.5 hover:bg-secondary"><X size={22} /></button></div>
      {cartLines.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"><ShoppingBag size={36} className="text-muted-foreground" /><p className="text-muted-foreground">{content.cart_empty_text}</p><button onClick={() => { setCartOpen(false); router.push('/productos') }} className="rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary">Ver productos</button></div> : <>
        {totals.freeFrom > 0 && <div className="border-b border-border bg-secondary/60 px-5 py-3 text-xs">
          <p className="flex items-center gap-2 font-medium"><Truck size={15} className="text-primary" />{missing > 0 ? <>Te faltan <b>{money(missing)}</b> para tener envío gratis</> : <b className="text-primary">¡Tenés envío gratis!</b>}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (subtotal / totals.freeFrom) * 100)}%` }} /></div>
        </div>}
        <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">{cartLines.map(line => {
          const available = getSizeStock(line.product, line.size)
          return <li className="flex gap-4 py-4" key={`${line.id}-${line.size}`}>
            <Link href={`/producto/${line.id}`} onClick={() => setCartOpen(false)}><img src={productImages(line.product)[0] || EMPTY_IMAGE} alt="" className="h-24 w-20 rounded-lg object-cover" /></Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex justify-between gap-2"><p className="text-sm font-semibold leading-snug">{line.product.name}</p><button onClick={() => remove(line.id, line.size)} aria-label="Quitar del carrito" className="h-fit text-muted-foreground hover:text-primary"><Trash2 size={16} /></button></div>
              <p className="text-xs text-muted-foreground">Talle: {line.size || 'Único'}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-full border border-border"><button onClick={() => changeQuantity(line.id, line.size, -1)} className="p-1.5" aria-label="Restar"><Minus size={14} /></button><span className="min-w-6 text-center text-sm">{line.quantity}</span><button onClick={() => changeQuantity(line.id, line.size, 1)} disabled={line.quantity >= available} className="p-1.5 disabled:opacity-30" aria-label="Sumar"><Plus size={14} /></button></div>
                <span className="text-sm font-semibold">{money(line.product.price * line.quantity)}</span>
              </div>
            </div>
          </li>
        })}</ul>
        <div className="border-t border-border px-5 py-4">
          <div className="flex justify-between text-sm"><span>Subtotal (sin envío)</span><span className="font-semibold">{money(subtotal)}</span></div>
          {transfer > 0 && <p className="mt-1 text-right text-xs text-primary">{money(subtotal * (1 - transfer / 100))} con transferencia</p>}
          <p className="mt-1 text-xs text-muted-foreground">El envío y los descuentos se calculan en el siguiente paso.</p>
          <button onClick={() => { setCartOpen(false); router.push('/checkout') }} className="mt-4 w-full rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110">Iniciar compra</button>
          <button onClick={() => setCartOpen(false)} className="mt-2 w-full py-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">Ver más productos</button>
        </div>
      </>}
    </aside>
  </div>
}

export function Shell({ children }: { children: ReactNode }) {
  const { content } = useStore()
  const pathname = usePathname()
  const checkout = pathname.startsWith('/checkout')
  // En el checkout se ocultan menú y footer para que la clienta no se distraiga (igual que Tiendanube).
  if (checkout) return <main className="min-h-screen bg-background text-foreground">{children}</main>
  return <main className="min-h-screen bg-background text-foreground">
    <Marquee text={content.marquee_text} />
    <Header />
    {children}
    <Footer />
    <CartDrawer />
    <a href={`https://wa.me/${content.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp" className="fixed right-4 bottom-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] p-3 text-white shadow-lg transition hover:scale-105"><WhatsAppIcon size={26} /></a>
  </main>
}
