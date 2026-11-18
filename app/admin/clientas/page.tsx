'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useState } from 'react'
import { Download, MessageCircle, Search, Users } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton, dateShort, fetcher, money } from '@/components/admin/ui'

type Customer = { key: string; name: string; phone: string; email: string; address: string; orders: number; spent: number; lastOrderAt: string; orderIds: number[] }

export default function CustomersPage() {
  const { data } = useSWR<Customer[]>('/api/admin/customers', fetcher)
  const [query, setQuery] = useState('')
  const list = (data ?? []).filter(c => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase()))
  function exportCsv() {
    const csv = [['Nombre', 'Teléfono', 'Email', 'Dirección', 'Pedidos', 'Total gastado', 'Última compra'], ...list.map(c => [c.name, c.phone, c.email, c.address, c.orders, Math.round(c.spent), dateShort(c.lastOrderAt)])].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'clientas-daiquiar.csv'; a.click()
  }
  return <>
    <PageHeader title="Clientas" description="Se arma sola con cada pedido. Ideal para recompras, difusiones y saber quiénes son tus mejores clientas." actions={<Button icon={<Download size={16} />} onClick={exportCsv} disabled={!list.length}>Exportar</Button>} />
    <div className="relative mb-4 md:w-72"><Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar clienta" className="pl-9" /></div>
    <Card padded={false}>
      {!data ? <div className="space-y-2 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div> : !list.length ? <EmptyState icon={<Users size={20} />} title="Todavía no hay clientas" description="Aparecen automáticamente cuando alguien hace un pedido." /> :
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Clienta</th><th className="hidden px-3 py-3 font-medium md:table-cell">Contacto</th><th className="px-3 py-3 font-medium">Pedidos</th><th className="px-3 py-3 font-medium">Gastó</th><th className="hidden px-3 py-3 font-medium sm:table-cell">Última compra</th><th className="px-5 py-3" /></tr></thead>
          <tbody className="divide-y divide-border">{list.map(c => <tr key={c.key} className="hover:bg-muted/50">
            <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span><div><p className="font-medium">{c.name}</p>{c.orders > 1 && <Badge tone="brand">Recompra</Badge>}</div></div></td>
            <td className="hidden px-3 py-3 text-muted-foreground md:table-cell"><p>{c.phone}</p><p className="text-xs">{c.email}</p></td>
            <td className="px-3 py-3"><Link href={`/admin/pedidos/${c.orderIds[0]}`} className="hover:text-primary">{c.orders}</Link></td>
            <td className="px-3 py-3 font-medium tabular-nums">{money(c.spent)}</td>
            <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">{dateShort(c.lastOrderAt)}</td>
            <td className="px-5 py-3 text-right">{c.phone && <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex rounded-md p-2 text-[#1a9e4b] hover:bg-muted" aria-label="WhatsApp"><MessageCircle size={16} /></a>}</td>
          </tr>)}</tbody>
        </table></div>}
    </Card>
  </>
}
