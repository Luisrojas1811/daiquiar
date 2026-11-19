'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { Button, Card, Field, Input, PageHeader, SaveBar, fetcher, send } from '@/components/admin/ui'
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/content'
import { DEFAULT_SIZE_GUIDE, parseSizeGuide, type SizeGuide, type SizeTable } from '@/lib/size-guide'

const cell = 'h-9 w-full min-w-20 rounded-md border border-transparent bg-transparent px-2 text-sm outline-none hover:border-border focus:border-primary focus:bg-card'

// Editor tipo planilla: la dueña arma una o varias tablas (por ejemplo una por tipo de prenda).
export default function SizeGuidePage() {
  const { data, mutate } = useSWR<SiteContent>('/api/content', fetcher)
  const [guide, setGuide] = useState<SizeGuide>(DEFAULT_SIZE_GUIDE)
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { if (data) { const g = parseSizeGuide(data.size_guide_tables ?? DEFAULT_CONTENT.size_guide_tables); setGuide(g); setSaved(JSON.stringify(g)) } }, [data])
  const dirty = saved !== '' && JSON.stringify(guide) !== saved

  const update = (fn: (g: SizeGuide) => SizeGuide) => { setMessage(''); setGuide(g => fn(structuredClone(g))) }
  const updateTable = (t: number, fn: (table: SizeTable) => void) => update(g => { fn(g.tables[t]); return g })

  async function save() {
    setSaving(true); setError('')
    try {
      // Se descartan filas totalmente vacías antes de guardar.
      const clean: SizeGuide = { ...guide, tables: guide.tables.map(t => ({ ...t, rows: t.rows.filter(r => r.some(c => c.trim())) })) }
      await send('/api/content', 'PUT', { values: { size_guide_tables: JSON.stringify(clean) }, reset: [] })
      setGuide(clean); setSaved(JSON.stringify(clean)); mutate(); setMessage('Guía de talles guardada. Ya se ve en la tienda.')
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar') } finally { setSaving(false) }
  }

  return <>
    <PageHeader title="Guía de talles" description="Armá las tablas como en una planilla. Aparecen en cada producto (botón “Guía de talles”) y en la página de Ayuda. Si los talles de una prenda coinciden con una tabla, esa se abre primero."
      actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => update(g => { g.tables.push({ title: 'Nueva tabla', columns: ['Talle', 'Busto', 'Cintura', 'Cadera'], rows: [['', '', '', '']] }); return g })}>Agregar tabla</Button>} />

    <Card className="mb-6"><Field label="Aclaración que se muestra arriba de las tablas"><Input value={guide.note} onChange={e => update(g => { g.note = e.target.value; return g })} /></Field></Card>

    <div className="space-y-6">{guide.tables.map((table, t) => <Card key={t} padded={false}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <Input value={table.title} onChange={e => updateTable(t, tb => { tb.title = e.target.value })} className="h-9 max-w-xs font-semibold" aria-label="Nombre de la tabla" placeholder="Ej.: Bodies y catsuits" />
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" disabled={t === 0} onClick={() => update(g => { [g.tables[t - 1], g.tables[t]] = [g.tables[t], g.tables[t - 1]]; return g })} icon={<ArrowUp size={14} />}><span className="sr-only">Subir</span></Button>
          <Button size="sm" variant="ghost" disabled={t === guide.tables.length - 1} onClick={() => update(g => { [g.tables[t + 1], g.tables[t]] = [g.tables[t], g.tables[t + 1]]; return g })} icon={<ArrowDown size={14} />}><span className="sr-only">Bajar</span></Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => { if (window.confirm(`¿Eliminar la tabla “${table.title}”?`)) update(g => { g.tables.splice(t, 1); return g }) }}>Eliminar tabla</Button>
        </div>
      </div>
      <div className="overflow-x-auto p-3">
        <table className="text-sm">
          <thead><tr>{table.columns.map((col, c) => <th key={c} className="p-1 align-bottom">
            <div className="flex items-center gap-1"><input value={col} onChange={e => updateTable(t, tb => { tb.columns[c] = e.target.value })} className={`${cell} bg-muted font-semibold`} aria-label={`Columna ${c + 1}`} />
              {table.columns.length > 1 && <button onClick={() => updateTable(t, tb => { tb.columns.splice(c, 1); tb.rows.forEach(r => r.splice(c, 1)) })} className="rounded p-1 text-muted-foreground hover:text-destructive" aria-label={`Quitar columna ${col}`}><X size={13} /></button>}</div>
          </th>)}
            <th className="p-1"><Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => updateTable(t, tb => { tb.columns.push('Nueva medida'); tb.rows.forEach(r => r.push('')) })}>Columna</Button></th></tr></thead>
          <tbody>{table.rows.map((row, r) => <tr key={r}>
            {table.columns.map((_, c) => <td key={c} className="p-1"><input value={row[c] ?? ''} onChange={e => updateTable(t, tb => { tb.rows[r][c] = e.target.value })} className={`${cell} ${c === 0 ? 'font-semibold text-primary' : ''}`} placeholder={c === 0 ? 'Talle' : '—'} aria-label={`${table.columns[c]} fila ${r + 1}`} /></td>)}
            <td className="p-1"><button onClick={() => updateTable(t, tb => { tb.rows.splice(r, 1) })} className="rounded p-1.5 text-muted-foreground hover:text-destructive" aria-label="Quitar fila"><Trash2 size={14} /></button></td>
          </tr>)}</tbody>
        </table>
        <Button size="sm" className="mt-2" icon={<Plus size={14} />} onClick={() => updateTable(t, tb => { tb.rows.push(tb.columns.map(() => '')) })}>Agregar talle</Button>
      </div>
    </Card>)}</div>
    {!guide.tables.length && <Card><p className="text-sm text-muted-foreground">No hay tablas. Tocá “Agregar tabla” para crear la primera.</p></Card>}
    <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setGuide(JSON.parse(saved))} message={message} error={error} />
  </>
}
