'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, Search, ShoppingBag } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton, STATUS_TONE, Tabs, dateTime, fetcher, money } from '@/components/admin/ui'
import { ORDER_STATUSES } from '@/lib/order-status'
import type { AdminOrder } from '@/lib/orders'
import { PAYMENT_NAMES, SHIPPING_NAMES } from '@/lib/pricing'

const statusLabel = (id: string) => ORDER_STATUSES.find(status => status.id === id)?.label ?? id

function exportCsv(orders: AdminOrder[]) {
  const header = ['Pedido', 'Fecha', 'Estado', 'Clienta', 'Teléfono', 'Email', 'Dirección', 'Entrega', 'Pago', 'Productos', 'Subtotal', 'Descuento', 'Envío', 'Total']
  const rows = orders.map(o => [o.id, new Date(o.createdAt).toLocaleString('es-AR'), statusLabel(o.status), o.customerName, o.customerPhone, o.customerEmail, o.customerAddress, SHIPPING_NAMES[o.shippingMethod] ?? '', PAYMENT_NAMES[o.paymentMethod] ?? '', o.items.map(i => `${i.quantity}x ${i.name} (${i.size || 'Único'})`).join(' | '), o.subtotal, o.discount, o.shippingCost, o.total])
  const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `pedidos-daiquiar-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
}

export default function OrdersPage() { return <Suspense><OrdersList /></Suspense> }

function OrdersList() {
  const params = useSearchParams()
  const { data: orders, error } = useSWR<AdminOrder[]>('/api/admin/orders', fetcher, { refreshInterval: 30000 })
  const [status, setStatus] = useState<string>(params.get('estado') ?? 'all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => (orders ?? []).filter(order => {
    if (status !== 'all' && order.status !== status) return false
    const q = query.trim().toLowerCase()
    return !q || `#${order.id} ${order.customerName} ${order.customerPhone} ${order.customerEmail}`.toLowerCase().includes(q)
  }), [orders, status, query])

  const tabs = [{ id: 'all', label: 'Todos', count: orders?.length }, ...ORDER_STATUSES.map(s => ({ id: s.id as string, label: s.label, count: orders?.filter(o => o.status === s.id).length }))]

  return <>
    <PageHeader title="Pedidos" description="Todas las compras de la tienda. Cambiá el estado a medida que avanzás: seña, pago, envío y entrega."
      actions={<Button icon={<Download size={16} />} onClick={() => orders && exportCsv(filtered)} disabled={!filtered.length}>Exportar Excel</Button>} />
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <Tabs value={status} onChange={setStatus} items={tabs} />
      <div className="relative lg:ml-auto lg:w-72"><Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nº, nombre o teléfono" className="pl-9" /></div>
    </div>
    <Card padded={false}>
      {error ? <p className="p-5 text-sm text-destructive">{error.message}</p> : !orders ? <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        : !filtered.length ? <EmptyState icon={<ShoppingBag size={20} />} title="No hay pedidos acá" description={orders.length ? 'Probá con otro filtro o búsqueda.' : 'Cuando una clienta compre, el pedido aparece acá y te llega un email.'} />
        : <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Pedido</th><th className="px-3 py-3 font-medium">Clienta</th><th className="hidden px-3 py-3 font-medium md:table-cell">Entrega</th><th className="hidden px-3 py-3 font-medium md:table-cell">Pago</th><th className="px-3 py-3 font-medium">Estado</th><th className="px-5 py-3 text-right font-medium">Total</th></tr></thead>
          <tbody className="divide-y divide-border">{filtered.map(order => <tr key={order.id} className="group cursor-pointer transition hover:bg-muted/50">
            <td className="px-5 py-3.5"><Link href={`/admin/pedidos/${order.id}`} className="font-medium group-hover:text-primary">#{order.id}</Link><p className="text-xs text-muted-foreground">{dateTime(order.createdAt)}</p></td>
            <td className="px-3 py-3.5"><Link href={`/admin/pedidos/${order.id}`} className="block"><p className="font-medium">{order.customerName}</p><p className="text-xs text-muted-foreground">{order.units} prenda(s)</p></Link></td>
            <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell">{SHIPPING_NAMES[order.shippingMethod] ?? '—'}</td>
            <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell">{PAYMENT_NAMES[order.paymentMethod] ?? '—'}</td>
            <td className="px-3 py-3.5"><Badge tone={STATUS_TONE[order.status]} dot>{statusLabel(order.status)}</Badge></td>
            <td className="px-5 py-3.5 text-right font-medium tabular-nums">{money(order.total)}</td>
          </tr>)}</tbody>
        </table></div>}
    </Card>
  </>
}
