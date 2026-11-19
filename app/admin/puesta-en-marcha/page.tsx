'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ExternalLink, EyeOff, Rocket } from 'lucide-react'
import { FieldInput } from '@/components/admin/content-editor'
import { Badge, Button, ButtonLink, Card, PageHeader, fetcher, send } from '@/components/admin/ui'
import { SETUP_STEPS, demoProducts, doneSteps, setupStatus } from '@/components/admin/setup'
import { CONTENT_FIELD_BY_KEY, DEFAULT_CONTENT, type SiteContent } from '@/lib/content'
import type { Product } from '@/lib/types'
import { totalStock } from '@/lib/stock'
import { cn } from '@/lib/utils'

export default function SetupPage() {
  const { data: remote, mutate } = useSWR<SiteContent>('/api/content', fetcher)
  const { data: products, mutate: mutateProducts } = useSWR<Product[]>('/api/catalog?all=1', fetcher)
  const { data: status } = useSWR<{ email: boolean }>('/api/admin/status', fetcher)
  const [values, setValues] = useState<SiteContent>(DEFAULT_CONTENT)
  const [open, setOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState<Record<string, string>>({})
  useEffect(() => { if (remote) setValues({ ...DEFAULT_CONTENT, ...remote }) }, [remote])

  const content = { ...DEFAULT_CONTENT, ...(remote ?? {}) }
  const { steps, done, total } = setupStatus({ content, products: products ?? [], emailReady: Boolean(status?.email) })
  // Se abre solo el primer paso pendiente.
  useEffect(() => { if (remote && products && open === null) setOpen(steps.find(s => !s.done)?.id ?? '') }, [remote, products]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save(stepId: string, keys: string[], markDone: boolean) {
    setSaving(stepId); setMessage(m => ({ ...m, [stepId]: '' }))
    try {
      const marked = doneSteps(content.setup_done).filter(id => id !== stepId)
      const body: Record<string, string> = Object.fromEntries(keys.map(k => [k, values[k] ?? '']))
      body.setup_done = JSON.stringify(markDone ? [...marked, stepId] : marked)
      await send('/api/content', 'PUT', { values: body, reset: [] })
      await mutate()
      setMessage(m => ({ ...m, [stepId]: markDone ? '¡Listo! Ya se ve en la tienda.' : 'Guardado.' }))
      if (markDone) setOpen(steps.find(s => !s.done && s.id !== stepId)?.id ?? '')
    } catch (err) { setMessage(m => ({ ...m, [stepId]: err instanceof Error ? err.message : 'No se pudo guardar' })) } finally { setSaving('') }
  }

  async function hideDemo() {
    const demos = demoProducts(products ?? []).filter(p => p.active)
    if (!window.confirm(`¿Ocultar ${demos.length} producto(s) de ejemplo? Siguen guardados en Productos por si los querés recuperar.`)) return
    setSaving('productos')
    for (const p of demos) await send(`/api/catalog/${p.id}`, 'PATCH', { active: false })
    await mutateProducts(); setSaving('')
  }

  const percent = Math.round((done / total) * 100)
  const demos = demoProducts(products ?? [])
  const realReady = (products ?? []).filter(p => p.active && totalStock(p) > 0 && !demos.includes(p))

  return <>
    <PageHeader title="Puesta en marcha" description="Completá estos pasos para que la tienda quede lista para vender. Cada uno se guarda y se ve en la tienda al instante." />

    <Card className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', done === total ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary')}>{done === total ? <Check size={22} /> : <Rocket size={22} />}</span>
        <div className="flex-1">
          <p className="font-semibold">{done === total ? '¡Tu tienda está lista para vender!' : `${done} de ${total} pasos listos`}</p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} /></div>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"><ExternalLink size={15} />Ver tienda</a>
      </div>
    </Card>

    <ol className="space-y-3">{steps.map((step, index) => {
      const isOpen = open === step.id
      const fields = (step.keys ?? []).map(k => CONTENT_FIELD_BY_KEY[k]).filter(Boolean)
      return <li key={step.id}><section className={cn('overflow-hidden rounded-2xl border bg-card transition', isOpen ? 'border-primary/30 shadow-md' : 'border-border')}>
        <button onClick={() => setOpen(isOpen ? '' : step.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold', step.done ? 'bg-emerald-600 text-white' : 'border-2 border-border text-muted-foreground')}>{step.done ? <Check size={16} /> : index + 1}</span>
          <span className="min-w-0 flex-1"><span className="block font-semibold">{step.title}</span><span className="block text-xs text-muted-foreground">{step.why}</span></span>
          {step.done ? <Badge tone="green">Listo</Badge> : step.optional ? <Badge>Opcional</Badge> : <Badge tone="amber">Pendiente</Badge>}
          <ChevronDown size={18} className={cn('shrink-0 text-muted-foreground transition', isOpen && 'rotate-180')} />
        </button>

        {isOpen && <div className="border-t border-border px-5 py-5">
          {step.id === 'productos' && <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted p-4"><p className="text-2xl font-semibold">{realReady.length}</p><p className="text-xs text-muted-foreground">productos tuyos publicados con stock</p></div>
            <div className="rounded-xl bg-muted p-4"><p className="text-2xl font-semibold">{demos.filter(p => p.active).length}</p><p className="text-xs text-muted-foreground">productos de ejemplo visibles</p></div>
            <div className="flex flex-col justify-center gap-2">{demos.some(p => p.active) && <Button size="sm" loading={saving === 'productos'} icon={<EyeOff size={14} />} onClick={hideDemo}>Ocultar los de ejemplo</Button>}<ButtonLink size="sm" href="/admin/productos" variant="ghost">Ver todos</ButtonLink></div>
          </div>}

          {step.id === 'email' && <div className="mb-5 space-y-2 rounded-xl bg-muted p-4 text-sm">
            <p className="font-medium">{status?.email ? '✓ La conexión de email está activa.' : 'Falta activar la conexión de email (lo hace una sola vez quien maneja Vercel):'}</p>
            {!status?.email && <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Crear una cuenta gratis en <a href="https://resend.com" target="_blank" rel="noreferrer" className="font-medium text-primary underline">resend.com</a> con tu email.</li>
              <li>Entrar a “API Keys” → “Create API Key” y copiar la clave.</li>
              <li>En Vercel → proyecto daiquiar → Settings → Environment Variables, agregar <b>RESEND_API_KEY</b> con esa clave y hacer “Redeploy”.</li>
            </ol>}
            <p className="text-muted-foreground">Mientras tanto, los pedidos se ven igual en Pedidos y te escriben por WhatsApp.</p>
          </div>}

          {fields.length > 0 && <div className="grid gap-5 md:grid-cols-2">{fields.map(field => <div key={field.key} className={cn((field.type === 'image' || field.type === 'textarea' || field.type === 'toggle') && 'md:col-span-2')}>
            <FieldInput field={field} value={values[field.key] ?? ''} onChange={next => setValues(v => ({ ...v, [field.key]: next }))} />
          </div>)}</div>}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {step.link && <ButtonLink href={step.link.href} variant={fields.length ? 'secondary' : 'primary'} icon={<ArrowRight size={15} />}>{step.link.label}</ButtonLink>}
            {!step.auto && (step.done
              ? <>{fields.length > 0 && <Button variant="primary" loading={saving === step.id} onClick={() => save(step.id, step.keys ?? [], true)}>Guardar cambios</Button>}<Button variant="ghost" onClick={() => save(step.id, [], false)}>Marcar como pendiente</Button></>
              : <Button variant="primary" loading={saving === step.id} icon={<Check size={15} />} onClick={() => save(step.id, step.keys ?? [], true)}>{fields.length ? 'Guardar y marcar como listo' : 'Ya lo completé'}</Button>)}
            {step.auto && fields.length > 0 && <Button variant="primary" loading={saving === step.id} onClick={() => save(step.id, step.keys ?? [], false)}>Guardar</Button>}
            {message[step.id] && <p className="text-sm text-emerald-700">{message[step.id]}</p>}
          </div>
          {step.auto && <p className="mt-3 text-xs text-muted-foreground">Este paso se tilda solo cuando está completo.</p>}
        </div>}
      </section></li>
    })}</ol>
    {!products && <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>}
    <p className="mt-6 text-xs text-muted-foreground">¿Querés ver todo lo que se puede cambiar? Mirá <Link href="/admin/contenido" className="underline">Diseño y textos</Link> y <Link href="/admin/envios-pagos" className="underline">Envíos y pagos</Link>.</p>
  </>
}
