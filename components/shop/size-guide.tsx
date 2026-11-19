'use client'

import { useState } from 'react'
import { parseSizeGuide } from '@/lib/size-guide'
import { cn } from '@/lib/utils'

// Tablas de talles armadas por la dueña en el panel. Si hay varias, se eligen con pestañas.
export function SizeGuideTables({ raw, initial = 0 }: { raw: string; initial?: number }) {
  const guide = parseSizeGuide(raw)
  const [tab, setTab] = useState(Math.min(initial, Math.max(0, guide.tables.length - 1)))
  if (!guide.tables.length) return <p className="text-sm text-muted-foreground">Pronto vas a encontrar acá la guía de talles.</p>
  const table = guide.tables[tab]
  return <div>
    {guide.note && <p className="mb-4 text-sm text-muted-foreground">{guide.note}</p>}
    {guide.tables.length > 1 && <div className="mb-4 flex flex-wrap gap-2">{guide.tables.map((t, i) => <button key={i} onClick={() => setTab(i)} className={cn('pop rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em]', i === tab ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>{t.title || `Tabla ${i + 1}`}</button>)}</div>}
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm tabular-nums">
        <thead><tr className="bg-secondary">{table.columns.map((c, i) => <th key={i} className={cn('px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em]', i === 0 && 'text-primary')}>{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{table.rows.map((row, r) => <tr key={r}>{table.columns.map((_, c) => <td key={c} className={cn('px-4 py-3', c === 0 && 'font-bold text-primary')}>{row[c] ?? ''}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </div>
}
