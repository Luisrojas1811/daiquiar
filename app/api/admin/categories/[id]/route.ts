import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { fetchCategories, slugify } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const set = []
  if (body.name !== undefined && String(body.name).trim()) set.push(sql`name = ${String(body.name).trim()}`, sql`slug = ${slugify(String(body.name))}`)
  if (body.image !== undefined) set.push(sql`image = ${body.image || null}`)
  if (body.description !== undefined) set.push(sql`description = ${body.description || null}`)
  if (body.visible !== undefined) set.push(sql`visible = ${body.visible === true}`)
  if (body.sortOrder !== undefined) set.push(sql`sort_order = ${Math.floor(Number(body.sortOrder) || 0)}`)
  if (!set.length) return NextResponse.json({ error: 'No hay cambios' }, { status: 400 })
  try {
    await db.execute(sql`UPDATE categories SET ${sql.join(set, sql`, `)} WHERE id = ${Number(id)}`)
    return NextResponse.json(await fetchCategories(false))
  } catch {
    return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 })
  }
}

// Los productos de una categoría eliminada quedan "sin categoría" (no se borran).
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await db.execute(sql`DELETE FROM categories WHERE id = ${Number(id)}`)
  return NextResponse.json(await fetchCategories(false))
}
