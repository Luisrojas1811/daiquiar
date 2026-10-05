import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Sirve una imagen guardada en la base. El id es único e inmutable, por eso se puede cachear para siempre.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('No encontrada', { status: 404 })
  try {
    const result = await db.execute(sql`SELECT content_type, encode(data, 'base64') AS data FROM images WHERE id = ${id}`)
    const row = result.rows[0]
    if (!row) return new Response('No encontrada', { status: 404 })
    return new Response(Buffer.from(String(row.data), 'base64'), {
      headers: { 'Content-Type': String(row.content_type), 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch (error) {
    console.error('Error al leer imagen', error)
    return new Response('Error', { status: 500 })
  }
}
