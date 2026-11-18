'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Copy, Plus, Tag, Trash2 } from 'lucide-react'
import { ContentEditor } from '@/components/admin/content-editor'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Toggle, dateShort, fetcher, money, send } from '@/components/admin/ui'

type Coupon = { id: number; code: string; type: 'percent' | 'fixed'; value: number; minTotal: number; maxUses: number | null; uses: number; active: boolean; expiresAt: string | null }
const empty = { code: '', type: 'percent', value: '', minTotal: '', maxUses: '', expiresAt: '' }

export default function PromotionsPage() {
  const { data: coupons, mutate } = useSWR<Coupon[]>('/api/admin/coupons', fetcher)
  const [form, setForm] = useState(empty)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function create() {
    setSaving(true); setError('')
    try { await send('/api/admin/coupons', 'POST', { ...form, value: Number(form.value), minTotal: Number(form.minTotal) || 0, maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null }); setForm(empty); setOpen(false); mutate() }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo crear') } finally { setSaving(false) }
  }
  const update = async (c: Coupon, body: Record<string, unknown>) => { await send(`/api/admin/coupons/${c.id}`, 'PATCH', body); mutate() }
  const remove = async (c: Coupon) => { if (window.confirm(`¿Eliminar el cupón ${c.code}?`)) { await send(`/api/admin/coupons/${c.id}`, 'DELETE'); mutate() } }
  const expired = (c: Coupon) => c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()

  return <>
    <PageHeader title="Promociones" description="Cupones de descuento y el cartel de promo que se mueve arriba de la tienda." actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setOpen(true)}>Crear cupón</Button>} />
    {open && <Card title="Nuevo cupón" className="mb-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Código" hint="Lo que escribe la clienta. Ej.: BIENVENIDA10"><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} /></Field>
        <Field label="Tipo de descuento"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="percent">Porcentaje (%)</option><option value="fixed">Monto fijo ($)</option></Select></Field>
        <Field label={form.type === 'percent' ? 'Porcentaje' : 'Monto'}><Input type="number" min="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></Field>
        <Field label="Compra mínima ($)" hint="Opcional"><Input type="number" min="0" value={form.minTotal} onChange={e => setForm({ ...form, minTotal: e.target.value })} /></Field>
        <Field label="Cantidad de usos" hint="Vacío = ilimitado"><Input type="number" min="1" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} /></Field>
        <Field label="Vence el" hint="Opcional"><Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex gap-2"><Button variant="primary" loading={saving} onClick={create} disabled={!form.code || !form.value}>Crear cupón</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </Card>}

    <Card title="Cupones" padded={false} className="mb-6">
      {coupons && !coupons.length ? <EmptyState icon={<Tag size={20} />} title="Sin cupones" description="Creá un cupón para campañas, influencers o primera compra." /> :
        <ul className="divide-y divide-border">{coupons?.map(c => <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
          <button onClick={() => navigator.clipboard.writeText(c.code)} title="Copiar código" className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 font-mono text-sm font-semibold text-primary">{c.code}<Copy size={12} /></button>
          <div className="min-w-0 flex-1 text-sm"><p className="font-medium">{c.type === 'percent' ? `${c.value}% OFF` : `${money(c.value)} OFF`}{c.minTotal > 0 && <span className="font-normal text-muted-foreground"> · desde {money(c.minTotal)}</span>}</p>
            <p className="text-xs text-muted-foreground">{c.uses} uso(s){c.maxUses ? ` de ${c.maxUses}` : ''}{c.expiresAt ? ` · vence ${dateShort(c.expiresAt)}` : ''}</p></div>
          {expired(c) ? <Badge tone="red">Vencido</Badge> : <div className="w-36"><Toggle checked={c.active} onChange={v => update(c, { active: v })} label={c.active ? 'Activo' : 'Pausado'} /></div>}
          <button onClick={() => remove(c)} className="rounded-md p-2 text-muted-foreground hover:text-destructive" aria-label="Eliminar"><Trash2 size={15} /></button>
        </li>)}</ul>}
    </Card>
    <ContentEditor groups={['Cartel superior en movimiento']} nav={false} />
  </>
}
