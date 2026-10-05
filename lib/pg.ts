// Drizzle convierte los arrays de JS en tuplas "($1, $2)" dentro de sql``, lo que Postgres
// no acepta para columnas TEXT[]. Este helper arma un literal de array válido ('{"a","b"}')
// para usarlo siempre con el cast ::text[]:  sql`${pgTextArray(items)}::text[]`
export function pgTextArray(values: string[]): string {
  const escaped = values.map(value => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  return `{${escaped.join(',')}}`
}
