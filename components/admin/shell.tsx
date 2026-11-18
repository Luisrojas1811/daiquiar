'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { Boxes, ExternalLink, FolderTree, Home, LockKeyhole, LogOut, Menu, Palette, Settings, ShoppingBag, Shirt, Tag, Truck, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, fetcher } from '@/components/admin/ui'

const NAV = [
  { section: 'General', items: [
    { href: '/admin', label: 'Inicio', icon: Home },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, badge: 'pending' },
    { href: '/admin/clientas', label: 'Clientas', icon: Users },
  ] },
  { section: 'Catálogo', items: [
    { href: '/admin/productos', label: 'Productos', icon: Shirt },
    { href: '/admin/inventario', label: 'Inventario', icon: Boxes, badge: 'low' },
    { href: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  ] },
  { section: 'Tienda', items: [
    { href: '/admin/promociones', label: 'Promociones', icon: Tag },
    { href: '/admin/contenido', label: 'Diseño y textos', icon: Palette },
    { href: '/admin/envios-pagos', label: 'Envíos y pagos', icon: Truck },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ] },
] as const

function Login({ onLogged }: { onLogged: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true)
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).catch(() => null)
    const data = await response?.json().catch(() => ({}))
    setLoading(false)
    if (!response?.ok) { setError(data?.error || 'No se pudo iniciar sesión'); return }
    onLogged()
  }
  return <div className="grid min-h-screen lg:grid-cols-2">
    <div className="relative hidden overflow-hidden bg-[#3a0410] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#80011F_0%,transparent_55%),radial-gradient(circle_at_80%_90%,#5a0016_0%,transparent_50%)]" />
      <div className="relative flex h-full flex-col justify-between p-12 text-[#FDF3E8]">
        <p className="text-xl font-black tracking-[0.2em]">DAIQUIAR</p>
        <div><p className="max-w-sm text-3xl font-semibold leading-tight">Todo tu negocio, en un solo lugar.</p><p className="mt-3 max-w-sm text-sm text-[#FDF3E8]/60">Pedidos, productos, stock, promociones y el diseño de tu tienda.</p></div>
      </div>
    </div>
    <div className="flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><LockKeyhole size={20} /></div>
        <h1 className="text-2xl font-semibold tracking-tight">Ingresar al panel</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Panel de administración de Daiquiar Indumentaria.</p>
        <Input autoFocus required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="mt-8" />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button variant="primary" loading={loading} className="mt-4 w-full">Entrar</Button>
      </form>
    </div>
  </div>
}

function NavLinks({ onNavigate, counts }: { onNavigate?: () => void; counts: { pending: number; low: number } }) {
  const pathname = usePathname()
  return <nav className="space-y-6">{NAV.map(group => <div key={group.section}>
    <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.section}</p>
    <div className="space-y-0.5">{group.items.map(item => {
      const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
      const count = 'badge' in item ? counts[item.badge] : 0
      const Icon = item.icon
      return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition', active ? 'bg-primary/8 text-primary' : 'text-foreground/70 hover:bg-muted hover:text-foreground')}>
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />{item.label}
        {count > 0 && <span className={cn('ml-auto rounded-full px-1.5 py-px text-[11px] font-semibold', 'badge' in item && item.badge === 'low' ? 'bg-amber-100 text-amber-800' : 'bg-primary text-primary-foreground')}>{count}</span>}
      </Link>
    })}</div>
  </div>)}</nav>
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<'loading' | 'in' | 'out'>('loading')
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => { fetch('/api/admin/session').then(r => r.json()).then(s => setSession(s.authenticated ? 'in' : 'out')).catch(() => setSession('out')) }, [])
  useEffect(() => setMobileOpen(false), [pathname])
  const { data: stats } = useSWR(session === 'in' ? '/api/admin/stats' : null, fetcher, { refreshInterval: 30000 })
  const counts = { pending: stats?.pendingOrders ?? 0, low: stats?.lowStockCount ?? 0 }

  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); setSession('out') }

  if (session === 'loading') return <div className="admin-theme flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Cargando panel…</div>
  if (session === 'out') return <div className="admin-theme min-h-screen bg-background text-foreground"><Login onLogged={() => setSession('in')} /></div>

  const sidebar = <div className="flex h-full flex-col">
    <div className="flex items-center justify-between px-5 py-5">
      <Link href="/admin" className="leading-none"><span className="block text-lg font-black tracking-[0.18em] text-primary">DAIQUIAR</span><span className="mt-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Panel de la tienda</span></Link>
      <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
    </div>
    <div className="flex-1 overflow-y-auto px-3 pb-4"><NavLinks counts={counts} onNavigate={() => setMobileOpen(false)} /></div>
    <div className="space-y-1 border-t border-border p-3">
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted"><ExternalLink size={17} strokeWidth={1.8} /> Ver tienda</a>
      <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted"><LogOut size={17} strokeWidth={1.8} /> Cerrar sesión</button>
    </div>
  </div>

  return <div className="admin-theme min-h-screen bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} /><aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl">{sidebar}</aside></div>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="rounded-lg p-1.5 hover:bg-muted"><Menu size={20} /></button>
        <span className="text-base font-black tracking-[0.18em] text-primary">DAIQUIAR</span>
        {counts.pending > 0 && <Link href="/admin/pedidos" className="ml-auto rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">{counts.pending} nuevo(s)</Link>}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  </div>
}
