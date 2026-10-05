import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024 // Vercel limita el cuerpo a ~4,5 MB; el Admin ya achica las fotos antes de subir.

// Guarda la imagen en la propia base (Neon) y devuelve su dirección pública: /api/images/<id>
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const contentType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!ALLOWED.includes(contentType)) return NextResponse.json({ error: 'Formato no permitido. Usá JPG, PNG o WebP.' }, { status: 415 })
    const bytes = Buffer.from(await request.arrayBuffer())
    if (!bytes.length) return NextResponse.json({ error: 'Imagen vacía' }, { status: 400 })
    if (bytes.length > MAX_BYTES) return NextResponse.json({ error: 'La imagen pesa demasiado (máximo 4 MB).' }, { status: 413 })

    await db.execute(sql`CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, content_type TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
    const result = await db.execute(sql`INSERT INTO images (content_type, data) VALUES (${contentType}, decode(${bytes.toString('base64')}, 'base64')) RETURNING id`)
    return NextResponse.json({ url: `/api/images/${String(result.rows[0].id)}` }, { status: 201 })
  } catch (error) {
    console.error('Error al subir imagen', error)
    return NextResponse.json({ error: 'No se pudo guardar la imagen' }, { status: 500 })
  }
}
