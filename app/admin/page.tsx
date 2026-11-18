'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { AlertTriangle, ArrowRight, ArrowUpRight, Plus, ShoppingBag, Tag, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Skeleton, STATUS_TONE, dateTime, fetcher, money } from '@/components/admin/ui'
import { ORDER_STATUSES } from '@/lib/order-status'

type Stats = {
  monthRevenue: number; prevMonthRevenue: number; monthOrders: number; prevMonthOrders: number; averageTicket: number
  pendingOrders: number; toShip: number; activeProducts: number; hiddenProducts: number; lowStockCount: number
  days: { date: string; total: number; orders: number }[]
  topProducts: { id: number; name: string; image: string | null; units: number; revenue: number }[]
  lowStock: { id: number; name: string; image: string; total: number; sizes: { size: string; stock: number }[]; stock: number; threshold: number }[]
  recentOrders: { id: number; customerName: string; total: number; status: string; createdAt: string; units: number }[]
}
const statusLabel = (id: string) => ORDER_STATUSES.find(status => status.id === id)?.label ?? id

function Stat({ label, value, previous, current, hint, href }: { label: string; value: string; previous?: number; current?: number; hint?: string; href?: string }) {
  const change = previous !== undefined && current !== undefined && previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
  const body = <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:border-foreground/15">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
      {change !== null && <span className={`inline-flex items-center gap-0.5 font-medium ${change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(change)}%</span>}
      {hint}
    </p>
  </div>
  return href ? <Link href={href}>{body}</Link> : body
}

function SalesChart({ days }: { days: Stats['days'] }) {
  const max = Math.max(1, ...days.map(day => day.total))
  const total = days.reduce((sum, day) => sum + day.total, 0)
  return <Card title="Ventas · últimos 14 días" description={`${money(total)} en ${days.reduce((s, d) => s + d.orders, 0)} pedidos`}>
    <div className="flex h-44 items-end gap-1.5 border-b border-border">
      {days.map(day => {
        const label = new Date(day.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
        return <div key={day.date} className="group relative flex h-full flex-1 items-end justify-center">
          <div className="w-full max-w-7 rounded-t-[4px] bg-primary/85 transition group-hover:bg-primary" style={{ height: `${Math.max(day.total ? 3 : 0, (day.total / max) * 100)}%` }} />
          <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg group-hover:block">
            <p className="text-muted-foreground">{label}</p><p className="font-semibold">{money(day.total)}</p><p className="text-muted-foreground">{day.orders} pedido(s)</p>
          </div>
        </div>
      })}
    </div>
    <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>{new Date(days[0].date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span><span>Hoy</span></div>
  </Card>
}

export default function AdminHome() {
  const { data, error } = useSWR<Stats>('/api/admin/stats', fetcher, { refreshInterval: 30000 })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return <>
    <PageHeader title={`${greeting} 👋`} description="Así viene tu tienda hoy."
      actions={<><ButtonLink href="/admin/promociones" icon={<Tag size={16} />}>Crear cupón</ButtonLink><ButtonLink href="/admin/productos/nuevo" variant="primary" icon={<Plus size={16} />}>Nuevo producto</ButtonLink></>} />
    {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</p>}

    {data && data.pendingOrders > 0 && <Link href="/admin/pedidos?estado=pending" className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm transition hover:bg-primary/8">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><ShoppingBag size={17} /></span>
      <span><b>{data.pendingOrders} pedido(s) nuevo(s)</b> esperando confirmación por WhatsApp.</span>
      <ArrowRight size={16} className="ml-auto text-primary" />
    </Link>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {data ? <>
        <Stat label="Ventas del mes" value={money(data.monthRevenue)} current={data.monthRevenue} previous={data.prevMonthRevenue} hint="vs. mes anterior" />
        <Stat label="Pedidos del mes" value={String(data.monthOrders)} current={data.monthOrders} previous={data.prevMonthOrders} hint="vs. mes anterior" href="/admin/pedidos" />
        <Stat label="Ticket promedio" value={money(data.averageTicket)} hint="por pedido este mes" />
        <Stat label="Para preparar / enviar" value={String(data.toShip)} hint="confirmados o pagados" href="/admin/pedidos?estado=confirmed" />
      </> : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      {data ? <SalesChart days={data.days} /> : <Skeleton className="h-64 rounded-2xl" />}
      <Card title="Más vendidos" description="Unidades vendidas (histórico)" padded={false}>
        {data?.topProducts.length ? <ul className="divide-y divide-border">{data.topProducts.map((product, index) => <li key={product.id} className="flex items-center gap-3 px-5 py-3">
          <span className="w-4 text-xs font-semibold text-muted-foreground">{index + 1}</span>
          {product.image ? <img src={product.image} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <div className="h-9 w-9 rounded-lg bg-muted" />}
          <Link href={`/admin/productos/${product.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">{product.name}</Link>
          <span className="text-sm tabular-nums text-muted-foreground">{product.units} u.</span>
        </li>)}</ul> : <EmptyState title="Todavía sin ventas" description="Cuando entren pedidos vas a ver acá tus productos estrella." />}
      </Card>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card title="Últimos pedidos" actions={<Link href="/admin/pedidos" className="flex items-center gap-1 text-xs font-medium text-primary">Ver todos <ArrowUpRight size={13} /></Link>} padded={false}>
        {data?.recentOrders.length ? <ul className="divide-y divide-border">{data.recentOrders.map(order => <li key={order.id}><Link href={`/admin/pedidos/${order.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/50">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">#{order.id} · {order.customerName || 'Sin nombre'}</p><p className="text-xs text-muted-foreground">{dateTime(order.createdAt)} · {order.units} prenda(s)</p></div>
          <Badge tone={STATUS_TONE[order.status]} dot>{statusLabel(order.status)}</Badge>
          <span className="w-24 text-right text-sm font-medium tabular-nums">{money(order.total)}</span>
        </Link></li>)}</ul> : <EmptyState icon={<ShoppingBag size={20} />} title="Sin pedidos todavía" description="Los pedidos que confirman tus clientas por WhatsApp aparecen acá." />}
      </Card>
      <Card title="Stock bajo" description={data ? `${data.lowStockCount} producto(s) llegaron al umbral` : undefined} actions={<Link href="/admin/inventario" className="flex items-center gap-1 text-xs font-medium text-primary">Inventario <ArrowUpRight size={13} /></Link>} padded={false}>
        {data?.lowStock.length ? <ul className="divide-y divide-border">{data.lowStock.map(product => <li key={product.id} className="flex items-center gap-3 px-5 py-3">
          {product.image ? <img src={product.image} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <div className="h-9 w-9 rounded-lg bg-muted" />}
          <div className="min-w-0 flex-1"><Link href={`/admin/productos/${product.id}`} className="block truncate text-sm font-medium hover:underline">{product.name}</Link>
            <p className="mt-0.5 flex flex-wrap gap-1">{product.sizes.length ? product.sizes.map(s => <span key={s.size} className={`rounded px-1.5 text-[11px] font-medium ${s.stock === 0 ? 'bg-red-50 text-red-700' : s.stock <= product.threshold ? 'bg-amber-50 text-amber-700' : 'bg-muted text-muted-foreground'}`}>{s.size}: {s.stock}</span>) : <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>}</p>
          </div>
          <AlertTriangle size={16} className={product.total === 0 ? 'text-red-600' : 'text-amber-600'} />
        </li>)}</ul> : <EmptyState title="Todo con buen stock" description="Te avisamos acá cuando algún talle llegue al mínimo." />}
      </Card>
    </div>
  </>
}
