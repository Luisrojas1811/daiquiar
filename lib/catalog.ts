import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'

export function mapProduct(row: Record<string, unknown>) {
  const sizes = Array.isArray(row.sizes) ? row.sizes.map(String) : []
  const rawSizeStock = row.sizeStock ?? row.size_stock
  const sizeStock = rawSizeStock && typeof rawSizeStock === 'object' && !Array.isArray(rawSizeStock)
    ? Object.fromEntries(Object.entries(rawSizeStock as Record<string, unknown>).map(([key, value]) => [key, Number(value) || 0]))
    : {}
  const rawImages = Array.isArray(row.images) ? row.images.map(String).filter(Boolean) : []
  const image = row.image == null ? '' : String(row.image)
  return {
    ...row,
    id: Number(row.id),
    category: row.category == null ? '' : String(row.category),
    price: Number(row.price),
    oldPrice: row.oldPrice == null ? undefined : Number(row.oldPrice),
    stock: Number(row.stock),
    lowStockThreshold: Number(row.lowStockThreshold),
    sizes,
    sizeStock,
    images: rawImages.length ? rawImages : image ? [image] : [],
    image,
  }
}

export async function fetchProducts(where?: SQL) {
  const result = await db.execute(sql`
    SELECT p.id, p.name, c.name AS category, p.price, p.old_price AS "oldPrice", p.color,
      p.image, p.images, p.badge, p.description, p.stock,
      p.low_stock_threshold AS "lowStockThreshold", p.sizes, p.size_stock AS "sizeStock"
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    ${where ? sql`WHERE ${where}` : sql``}
    ORDER BY p.created_at DESC, p.id DESC
  `)
  return result.rows.map(row => mapProduct(row as Record<string, unknown>))
}
