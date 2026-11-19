import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

// Aplica la migración 004 una sola vez por proceso. Así la dueña no tiene que correr SQL a mano:
// todas las sentencias son "IF NOT EXISTS" y no borran datos.
const STATEMENTS = [
  sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT`,
  sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT`,
  sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT`,
  sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`,
  sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS size_stock JSONB NOT NULL DEFAULT '{}'::jsonb`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '[]'::jsonb`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_zip TEXT`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dni TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT false`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2)`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) NOT NULL DEFAULT 0`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT`,
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  sql`CREATE TABLE IF NOT EXISTS coupons (id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, type TEXT NOT NULL DEFAULT 'percent', value NUMERIC(12, 2) NOT NULL, min_total NUMERIC(12, 2) NOT NULL DEFAULT 0, max_uses INTEGER, uses INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT true, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  sql`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  sql`CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, content_type TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
]

const globalForSchema = globalThis as unknown as { schemaReady?: Promise<void> }

export function ensureSchema() {
  if (!globalForSchema.schemaReady) {
    globalForSchema.schemaReady = (async () => {
      for (const statement of STATEMENTS) await db.execute(statement)
    })().catch(error => {
      globalForSchema.schemaReady = undefined // se reintenta en el próximo pedido
      throw error
    })
  }
  return globalForSchema.schemaReady
}
