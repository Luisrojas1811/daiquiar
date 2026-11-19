// Tipos compartidos entre la tienda y el panel.
import { totalStock, type ColorOption } from '@/lib/stock'
export type { ColorOption }
export type Product = {
  id: number; name: string; category: string; price: number; oldPrice?: number; color: string; image: string; images: string[]; badge?: string
  description: string; sizes: string[]; sizeStock: Record<string, number>; stock: number; lowStockThreshold: number
  colors: ColorOption[]; active?: boolean; featured?: boolean; sku?: string; createdAt?: string
}
export type Category = { id: number; name: string; slug: string; image: string; description: string; sortOrder: number; visible: boolean; products: number }

export const productTotalStock = (product: Product) => totalStock(product)
