import { createHmac, timingSafeEqual } from 'crypto'

export const ADMIN_COOKIE = 'daiquiar_admin_session'

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value) throw new Error('Falta la variable de entorno ADMIN_SESSION_SECRET')
  return value
}

// Token = "<expiración-en-ms>.<firma-hmac>"
// La firma evita que alguien invente o modifique el token sin conocer el secreto.
export function createSessionToken(days = 7) {
  const expires = Date.now() + days * 24 * 60 * 60 * 1000
  const signature = createHmac('sha256', secret()).update(String(expires)).digest('hex')
  return `${expires}.${signature}`
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature) return false
  if (Date.now() > Number(expires)) return false
  const expected = createHmac('sha256', secret()).update(expires).digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))
  return isValidSessionToken(match?.[1])
}
