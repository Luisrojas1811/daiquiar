'use client'

import Link from 'next/link'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Piezas visuales del panel. Todo el Admin usa estas mismas piezas para verse prolijo y consistente.

export const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(async response => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar')
  return data
})

export async function send<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'No se pudo guardar')
  return data as T
}

export const money = (value: number) => `$${Math.round(value).toLocaleString('es-AR')}`
export const dateTime = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
export const dateShort = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {back && <Link href={back.href} className="mb-2 inline-flex text-xs font-medium text-muted-foreground hover:text-foreground">← {back.label}</Link>}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
}

export function Card({ title, description, actions, children, className, padded = true }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return <section className={cn('rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(28,25,23,0.04)]', className)}>
    {(title || actions) && <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div><h2 className="text-sm font-semibold">{title}</h2>{description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}</div>
      {actions}
    </header>}
    <div className={padded ? 'p-5' : ''}>{children}</div>
  </section>
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; loading?: boolean; icon?: ReactNode }
const buttonStyles = (variant: ButtonProps['variant'] = 'secondary', size: ButtonProps['size'] = 'md') => cn(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50',
  size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
  variant === 'primary' && 'bg-primary text-primary-foreground shadow-sm hover:brightness-110',
  variant === 'secondary' && 'border border-border bg-card hover:bg-muted',
  variant === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
  variant === 'danger' && 'border border-border bg-card text-destructive hover:border-destructive/40 hover:bg-destructive/5',
)
export function Button({ variant, size, loading, icon, children, className, ...props }: ButtonProps) {
  return <button {...props} disabled={props.disabled || loading} className={cn(buttonStyles(variant, size), className)}>{loading ? <Loader2 size={16} className="animate-spin" /> : icon}{children}</button>
}
export function ButtonLink({ href, variant, size, icon, children, className }: { href: string; variant?: ButtonProps['variant']; size?: ButtonProps['size']; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <Link href={href} className={cn(buttonStyles(variant, size), className)}>{icon}{children}</Link>
}

const fieldBase = 'w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-3 focus:ring-primary/10'
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={cn(fieldBase, 'h-10', className)} /> }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={cn(fieldBase, 'min-h-24 py-2.5', className)} /> }
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={cn(fieldBase, 'h-10 pr-8', className)}>{children}</select> }

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={cn('block', className)}><span className="mb-1.5 block text-xs font-medium text-foreground/80">{label}</span>{children}{hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}</label>
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label?: string; description?: string }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 text-left">
    {(label || description) && <span><span className="block text-sm font-medium">{label}</span>{description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}</span>}
    <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-primary' : 'bg-input')}><span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} /></span>
  </button>
}

const tones = {
  neutral: 'bg-muted text-foreground/70 ring-border',
  brand: 'bg-primary/8 text-primary ring-primary/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
}
export type Tone = keyof typeof tones
export function Badge({ tone = 'neutral', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>{dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{children}</span>
}

export const STATUS_TONE: Record<string, Tone> = { pending: 'amber', confirmed: 'blue', paid: 'violet', shipped: 'brand', delivered: 'green', cancelled: 'neutral' }

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
    <p className="font-medium">{title}</p>{description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn('animate-pulse rounded-lg bg-muted', className)} /> }

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">{items.map(item => <button key={item.id} onClick={() => onChange(item.id)} className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition', value === item.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{item.label}{item.count !== undefined && <span className={cn('rounded-full px-1.5 text-[11px]', value === item.id ? 'bg-muted' : 'bg-card/60')}>{item.count}</span>}</button>)}</div>
}

// Barra fija inferior para "Guardar cambios" (igual en todas las pantallas de edición).
export function SaveBar({ dirty, saving, onSave, onDiscard, message, error }: { dirty: number | boolean; saving: boolean; onSave: () => void; onDiscard?: () => void; message?: string; error?: string }) {
  if (!dirty && !message && !error) return null
  return <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 pl-5 shadow-lg backdrop-blur">
    <p className={cn('mr-auto text-sm', error ? 'text-destructive' : message && !dirty ? 'text-emerald-700' : 'text-muted-foreground')}>{error || (dirty ? (typeof dirty === 'number' ? `${dirty} cambio(s) sin guardar` : 'Hay cambios sin guardar') : message)}</p>
    {dirty ? <>{onDiscard && <Button variant="ghost" onClick={onDiscard}>Descartar</Button>}<Button variant="primary" loading={saving} onClick={onSave}>Guardar cambios</Button></> : null}
  </div>
}
