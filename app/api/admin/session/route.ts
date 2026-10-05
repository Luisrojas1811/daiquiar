import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: isAdminRequest(request) })
}
