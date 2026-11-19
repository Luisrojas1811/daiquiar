'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { ImagePlus, Loader2, RotateCcw } from 'lucide-react'
import { Card, Input, SaveBar, Textarea, Toggle, fetcher, send } from '@/components/admin/ui'
import { uploadImages } from '@/components/admin/upload'
import { CONTENT_FIELDS, DEFAULT_CONTENT, type ContentField, type SiteContent } from '@/lib/content'
import { cn } from '@/lib/utils'

export function FieldInput({ field, value, onChange }: { field: ContentField; value: string; onChange: (next: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const changed = value !== field.default
  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true); setError('')
    try { const [url] = await uploadImages(files); if (url) onChange(url) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir') } finally { setUploading(false) }
  }
  if (field.type === 'toggle') return <Toggle checked={value === '1'} onChange={v => onChange(v ? '1' : '0')} label={field.label} description={field.hint} />
  return <div>
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor={`f-${field.key}`} className="text-xs font-medium text-foreground/80">{field.label}</label>
      {changed && field.default !== '' && <button type="button" onClick={() => onChange(field.default)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"><RotateCcw size={11} /> Original</button>}
    </div>
    {field.type === 'image' ? <label className="group relative flex aspect-[16/9] max-w-md cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
      {value && <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <span className="relative flex items-center gap-2 rounded-lg bg-card/95 px-3 py-2 text-xs font-medium shadow transition group-hover:bg-card">{uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}{uploading ? 'Subiendo…' : 'Cambiar foto'}</span>
      <input id={`f-${field.key}`} type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { upload(e.target.files); e.target.value = '' }} />
    </label>
      : field.type === 'textarea' ? <Textarea id={`f-${field.key}`} value={value} onChange={e => onChange(e.target.value)} className="min-h-20" />
      : <Input id={`f-${field.key}`} value={value} onChange={e => onChange(e.target.value)} type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'} inputMode={field.type === 'phone' ? 'numeric' : undefined} />}
    {field.hint && <p className="mt-1.5 text-xs text-muted-foreground">{field.hint}</p>}
    {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
  </div>
}

// Editor de textos/ajustes agrupados. Se usa en "Diseño y textos", "Envíos y pagos", "Promociones" y "Configuración".
export function ContentEditor({ groups, nav = true }: { groups: readonly string[]; nav?: boolean }) {
  const { data, mutate } = useSWR<SiteContent>('/api/content', fetcher)
  const [values, setValues] = useState<SiteContent>(DEFAULT_CONTENT)
  const [saved, setSaved] = useState<SiteContent>(DEFAULT_CONTENT)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { if (data) { const merged = { ...DEFAULT_CONTENT, ...data }; setValues(merged); setSaved(merged) } }, [data])

  // Los campos JSON (ej. guía de talles) tienen su propio editor.
  const fields = CONTENT_FIELDS.filter(field => groups.includes(field.group) && field.type !== 'json')
  const dirtyKeys = fields.filter(field => values[field.key] !== saved[field.key]).map(field => field.key)

  async function save() {
    setSaving(true); setMessage(''); setError('')
    try {
      const upsert: Record<string, string> = {}; const reset: string[] = []
      for (const key of dirtyKeys) { if (values[key] === DEFAULT_CONTENT[key]) reset.push(key); else upsert[key] = values[key] }
      await send('/api/content', 'PUT', { values: upsert, reset })
      setSaved(values); mutate(); setMessage('Cambios guardados. Ya se ven en la tienda.')
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving(false) }
  }

  const id = (group: string) => `g-${group.replace(/\W+/g, '-')}`
  return <div className={cn(nav && groups.length > 2 && 'lg:grid lg:grid-cols-[200px_1fr] lg:gap-8')}>
    {nav && groups.length > 2 && <nav className="sticky top-6 hidden h-fit space-y-0.5 lg:block">{groups.map(group => <a key={group} href={`#${id(group)}`} className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">{group}</a>)}</nav>}
    <div className="space-y-6">
      {groups.map(group => <div key={group} id={id(group)} className="scroll-mt-6"><Card title={group}>
        <div className="grid gap-5 md:grid-cols-2">{fields.filter(f => f.group === group).map(field => <div key={field.key} className={cn((field.type === 'image' || field.type === 'textarea' || field.type === 'toggle') && 'md:col-span-2')}>
          <FieldInput field={field} value={values[field.key] ?? ''} onChange={next => { setMessage(''); setValues(current => ({ ...current, [field.key]: next })) }} />
        </div>)}</div>
      </Card></div>)}
      <SaveBar dirty={dirtyKeys.length} saving={saving} onSave={save} onDiscard={() => setValues(saved)} message={message} error={error} />
    </div>
  </div>
}
