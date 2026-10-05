import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { CONTENT_FIELD_BY_KEY, DEFAULT_CONTENT, type SiteContent } from '@/lib/content'

export const dynamic = 'force-dynamic'
const noStore = { 'Cache-Control': 'no-store, max-age=0' }

// Crea la tabla si todavía no se corrió el SQL en Neon, así el panel nunca queda roto.
async function ensureTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
}

// Devuelve los textos por defecto + lo que la dueña haya cambiado desde el Admin.
export async function GET() {
  try {
    await ensureTable()
    const result = await db.execute(sql`SELECT key, value FROM site_content`)
    const content: SiteContent = { ...DEFAULT_CONTENT }
    for (const row of result.rows) {
      const key = String(row.key)
      if (CONTENT_FIELD_BY_KEY[key]) content[key] = String(row.value)
    }
    return NextResponse.json(content, { headers: noStore })
  } catch (error) {
    console.error('Error al leer el contenido', error)
    return NextResponse.json(DEFAULT_CONTENT, { headers: noStore })
  }
}

function clean(key: string, raw: unknown): string | null {
  const field = CONTENT_FIELD_BY_KEY[key]
  if (!field || typeof raw !== 'string') return null
  let value = raw.trim()
  if (value.length > 2000) return null
  if (field.type === 'phone') value = value.replace(/\D/g, '')
  const isOwnImage = field.type === 'image' && /^\/api\/images\/[0-9a-f-]{36}$/i.test(value)
  if ((field.type === 'url' || field.type === 'image') && value && !isOwnImage && !/^https?:\/\//i.test(value)) return null
  if (field.type === 'image' && !value) return null
  return value
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    const values = body.values && typeof body.values === 'object' ? body.values as Record<string, unknown> : {}
    const reset: string[] = Array.isArray(body.reset) ? body.reset.map(String).filter((key: string) => CONTENT_FIELD_BY_KEY[key]) : []

    const entries: [string, string][] = []
    for (const [key, raw] of Object.entries(values)) {
      if (!CONTENT_FIELD_BY_KEY[key]) continue
      const value = clean(key, raw)
      if (value === null) return NextResponse.json({ error: `Valor inválido en “${CONTENT_FIELD_BY_KEY[key].label}”` }, { status: 400 })
      entries.push([key, value])
    }

    await ensureTable()
    await db.transaction(async tx => {
      for (const [key, value] of entries) {
        await tx.execute(sql`
          INSERT INTO site_content (key, value, updated_at) VALUES (${key}, ${value}, now())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        `)
      }
      for (const key of reset) await tx.execute(sql`DELETE FROM site_content WHERE key = ${key}`)
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al guardar el contenido', error)
    return NextResponse.json({ error: 'No se pudo guardar el contenido' }, { status: 500 })
  }
}
