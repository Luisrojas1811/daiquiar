import type { MetadataRoute } from 'next'
import { sql } from 'drizzle-orm'
import { fetchProducts } from '@/lib/catalog'
import { fetchCategories } from '@/lib/categories'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/productos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/ayuda`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]
  try {
    const [categories, products] = await Promise.all([fetchCategories(true), fetchProducts(sql`p.active = true`)])
    for (const c of categories) pages.push({ url: `${SITE_URL}/categoria/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 })
    for (const p of products) {
      const created = (p as { createdAt?: unknown }).createdAt
      pages.push({ url: `${SITE_URL}/producto/${p.id}`, lastModified: created ? new Date(String(created)) : now, changeFrequency: 'weekly', priority: 0.7 })
    }
  } catch (error) {
    console.error('sitemap: no se pudo leer el catálogo', error)
  }
  return pages
}
