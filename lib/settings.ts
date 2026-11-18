import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { CONTENT_FIELD_BY_KEY, DEFAULT_CONTENT, type SiteContent } from '@/lib/content'

// Textos y ajustes de la tienda (por defecto + lo que la dueña cambió). Solo servidor.
export async function getSiteContent(): Promise<SiteContent> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
  const result = await db.execute(sql`SELECT key, value FROM site_content`)
  const content: SiteContent = { ...DEFAULT_CONTENT }
  for (const row of result.rows) {
    const key = String(row.key)
    if (CONTENT_FIELD_BY_KEY[key]) content[key] = String(row.value)
  }
  return content
}
