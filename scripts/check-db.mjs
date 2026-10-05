// Diagnóstico de conexión a Neon. Uso:  node --env-file=.env.local scripts/check-db.mjs
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) { console.error('✗ DATABASE_URL no está definida en .env.local'); process.exit(1) }

const u = new URL(url)
console.log('Host:', u.host, '| base:', u.pathname.slice(1))

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 45000 })
const started = Date.now()
try {
  await client.connect()
  console.log(`✓ Conectado en ${Date.now() - started} ms`)
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`)
  console.log('Tablas:', tables.rows.map(r => r.table_name).join(', ') || '(ninguna: corré lib/db/schema.sql en Neon)')
  const count = await client.query('SELECT count(*)::int AS n FROM products').catch(e => ({ rows: [{ n: `error: ${e.message}` }] }))
  console.log('Productos cargados:', count.rows[0].n)
} catch (error) {
  console.error(`✗ No se pudo conectar (${Date.now() - started} ms):`, error.message)
  console.error('  → Revisá: proyecto de Neon activo, URL copiada de nuevo desde el panel, y que tu red/antivirus no bloquee el puerto 5432.')
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
