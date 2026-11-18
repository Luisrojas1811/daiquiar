import { NextResponse } from 'next/server'
import { fetchCategories } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await fetchCategories(true), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error al leer categorías', error)
    return NextResponse.json([], { status: 500 })
  }
}
