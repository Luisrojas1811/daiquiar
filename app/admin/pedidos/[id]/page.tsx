'use client'

import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Copy, Mail, MapPin, MessageCircle, Phone, Printer } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Skeleton, STATUS_TONE, Textarea, dateTime, fetcher, money, send } from '@/components/admin/ui'
import { ORDER_STATUSES } from '@/lib/order-status'
import type { AdminOrder } from '@/lib/orders'
import { PAYMENT_NAMES, SHIPPING_NAMES } from '@/lib/pricing'
import { cn } from '@/lib/utils'

// Recorrido normal de un pedido (cancelado va aparte).
const FLOW = ORDER_STATUSES.filter(status => status.id !== 'cancelled')

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: order, mutate, error } = useSWR<AdminOrder>(`/api/admin/orders/${id}`, fetcher)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (order) setNotes(order.adminNotes) }, [order?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function update(body: Record<string, unknown>, label: string) {
    setSaving(label); setMessage('')
    try { await mutate(await send<AdminOrder>(`/api/admin/orders/${id}`, 'PATCH', body), { revalidate: false }); setMessage('Guardado') }
    catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving('') }
  }
  async function cancel() {
    if (!window.confirm('¿Cancelar este pedido? Las prendas vuelven al stock de la tienda.')) return
    update({ status: 'cancelled' }, 'cancelled')
  }

  if (error) return <p className="text-sm text-destructive">{error.message}</p>
  if (!order) return <div className="space-y-4"><Skeleton className="h-10 w-60" /><Skeleton className="h-64" /></div>

  const phone = order.customerPhone.replace(/\D/g, '')
  const currentIndex = FLOW.findIndex(step => step.id === order.status)
  const next = order.status !== 'cancelled' ? FLOW[currentIndex + 1] : undefined
  const statusLabel = ORDER_STATUSES.find(status => status.id === order.status)?.label
  const summary = `Pedido #${order.id}\n${order.items.map(i => `${i.quantity}x ${i.name} (Talle ${i.size || 'Único'})`).join('\n')}\nTotal: ${money(order.total)}\n${order.customerName} · ${order.customerPhone}\n${order.customerAddress}`

  return <>
    <PageHeader back={{ href: '/admin/pedidos', label: 'Pedidos' }} title={`Pedido #${order.id}`} description={`${dateTime(order.createdAt)} · ${order.emailSent ? 'Aviso por email enviado' : 'Sin aviso por email'}`}
      actions={<>
        <Badge tone={STATUS_TONE[order.status]} dot>{statusLabel}</Badge>
        <Button size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={() => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>Copiar resumen</Button>
        <Button size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>Imprimir</Button>
      </>} />

    {order.status !== 'cancelled' && <Card className="mb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <ol className="flex flex-1 items-center">{FLOW.map((step, index) => <li key={step.id} className="flex flex-1 items-center last:flex-none">
          <button onClick={() => update({ status: step.id }, step.id)} className="flex flex-col items-center gap-1.5" title={`Marcar como ${step.label}`}>
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition', index <= currentIndex ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/50')}>{index < currentIndex ? <Check size={14} /> : index + 1}</span>
            <span className={cn('text-[11px] font-medium whitespace-nowrap', index <= currentIndex ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
          </button>
          {index < FLOW.length - 1 && <span className={cn('mx-1 mb-5 h-0.5 flex-1 rounded', index < currentIndex ? 'bg-primary' : 'bg-border')} />}
        </li>)}</ol>
        <div className="flex gap-2">
          {next && <Button variant="primary" loading={saving === next.id} onClick={() => update({ status: next.id }, next.id)}>Marcar «{next.label}»</Button>}
          <Button variant="danger" loading={saving === 'cancelled'} onClick={cancel}>Cancelar</Button>
        </div>
      </div>
      {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
    </Card>}

    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <Card title="Productos" padded={false}>
          <ul className="divide-y divide-border">{order.items.map((item, index) => <li key={index} className="flex items-center gap-4 px-5 py-3.5">
            {item.image ? <img src={item.image} alt="" className="h-14 w-12 rounded-lg object-cover" /> : <div className="h-14 w-12 rounded-lg bg-muted" />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">Talle {item.size || 'Único'} · {item.quantity} × {money(item.price)}</p></div>
            <span className="text-sm font-medium tabular-nums">{money(item.subtotal)}</span>
          </li>)}</ul>
          <dl className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Descuentos {order.couponCode && <Badge tone="brand">{order.couponCode}</Badge>}</dt><dd className="tabular-nums text-emerald-700">−{money(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Envío</dt><dd className="tabular-nums">{order.shippingCost ? money(order.shippingCost) : 'Sin cargo'}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
          </dl>
        </Card>
        <Card title="Notas internas" description="Solo las ves vos. Ej.: “Pagó seña el 12/11”, “Envío con código XXXX”.">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Escribí una nota…" />
          <div className="mt-3 flex justify-end"><Button size="sm" variant="primary" disabled={notes === order.adminNotes} loading={saving === 'notes'} onClick={() => update({ adminNotes: notes }, 'notes')}>Guardar nota</Button></div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Clienta">
          <p className="font-medium">{order.customerName}</p>
          {order.customerDni && <p className="text-xs text-muted-foreground">DNI {order.customerDni}</p>}
          <div className="mt-4 space-y-2.5 text-sm">
            {order.customerPhone && <p className="flex items-center gap-2.5"><Phone size={15} className="text-muted-foreground" />{order.customerPhone}</p>}
            {order.customerEmail && <p className="flex items-center gap-2.5"><Mail size={15} className="text-muted-foreground" /><a href={`mailto:${order.customerEmail}`} className="truncate hover:underline">{order.customerEmail}</a></p>}
          </div>
          {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`¡Hola ${order.customerName.split(' ')[0]}! Te escribimos de Daiquiar por tu pedido #${order.id} 💕`)}`} target="_blank" rel="noreferrer" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white hover:brightness-105"><MessageCircle size={16} /> Escribir por WhatsApp</a>}
        </Card>
        <Card title="Entrega y pago">
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Entrega</p><p className="font-medium">{SHIPPING_NAMES[order.shippingMethod] ?? 'A coordinar'}</p></div>
            {order.customerAddress && <p className="flex gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground" />{order.customerAddress}</p>}
            <div><p className="text-xs text-muted-foreground">Pago</p><p className="font-medium">{PAYMENT_NAMES[order.paymentMethod] ?? 'A coordinar'}</p></div>
            {order.notes && <div><p className="text-xs text-muted-foreground">Nota de la clienta</p><p className="mt-0.5 rounded-lg bg-muted p-3">{order.notes}</p></div>}
          </div>
        </Card>
      </div>
    </div>
  </>
}
