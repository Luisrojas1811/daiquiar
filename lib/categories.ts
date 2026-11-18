import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureSchema } from '@/lib/db/ensure'

export const slugify = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function fetchCategories(onlyVisible = false) {
  await ensureSchema()
  const result = await db.execute(sql`
    SELECT c.id, c.name, c.slug, c.image, c.description, c.sort_order, c.visible,
      count(p.id) FILTER (WHERE p.active)::int AS products
    FROM categories c LEFT JOIN products p ON p.category_id = c.id
    ${onlyVisible ? sql`WHERE c.visible = true` : sql``}
    GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC`)
  return result.rows.map(row => ({
    id: Number(row.id), name: String(row.name), slug: row.slug ? String(row.slug) : slugify(String(row.name)),
    image: row.image ? String(row.image) : '', description: row.description ? String(row.description) : '',
    sortOrder: Number(row.sort_order ?? 0), visible: row.visible !== false, products: Number(row.products ?? 0),
  }))
}
