import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { fetchCategories, slugify } from '@/lib/categories'
import { ensureSchema } from '@/lib/db/ensure'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await fetchCategories(false))
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await ensureSchema()
  const body = await request.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Poné un nombre' }, { status: 400 })
  try {
    const max = await db.execute(sql`SELECT COALESCE(max(sort_order), 0) + 1 AS next FROM categories`)
    await db.execute(sql`INSERT INTO categories (name, slug, image, description, sort_order, visible)
      VALUES (${name}, ${slugify(name)}, ${body.image || null}, ${body.description || null}, ${Number(max.rows[0].next)}, ${body.visible !== false})`)
    return NextResponse.json(await fetchCategories(false), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 })
  }
}
