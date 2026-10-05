import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { isAdminRequest } from '@/lib/auth'

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: 'Cloudinary no está configurado' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = typeof body.folder === 'string' && body.folder.trim() ? body.folder.trim() : 'daiquiar/products'
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash('sha1').update(signatureBase).digest('hex')
  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature })
}
