// Stock por variante (color y/o talle). Sin dependencias de servidor: lo usan la tienda, el panel y la API.
// La clave de stock es "Color / Talle", o solo el color, o solo el talle, según lo que tenga la prenda.
export type ColorOption = { name: string; hex: string; image?: string }
type StockProduct = { sizes: string[]; colors?: ColorOption[]; sizeStock: Record<string, number>; stock: number; lowStockThreshold: number }

export const variantKey = (color: string, size: string) => (color && size ? `${color} / ${size}` : color || size)

export function variantKeys(product: Pick<StockProduct, 'sizes' | 'colors'>) {
  const colors = (product.colors ?? []).map(c => c.name)
  if (colors.length && product.sizes.length) return colors.flatMap(color => product.sizes.map(size => variantKey(color, size)))
  return colors.length ? colors : [...product.sizes]
}

export const hasVariants = (product: Pick<StockProduct, 'sizes' | 'colors'>) => variantKeys(product).length > 0

export function stockOf(product: StockProduct, color = '', size = '') {
  if (!hasVariants(product)) return product.stock
  return Number(product.sizeStock?.[variantKey(color, size)] ?? 0)
}

export function totalStock(product: StockProduct) {
  return hasVariants(product) ? variantKeys(product).reduce((sum, key) => sum + (Number(product.sizeStock?.[key]) || 0), 0) : product.stock
}

export function isLowStock(product: StockProduct) {
  return hasVariants(product) ? variantKeys(product).some(key => (product.sizeStock?.[key] ?? 0) <= product.lowStockThreshold) : product.stock <= product.lowStockThreshold
}

export function cleanColors(raw: unknown): ColorOption[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  return raw.flatMap(item => {
    const value = item as Record<string, unknown>
    const name = String(value?.name ?? '').trim().slice(0, 40)
    if (!name || seen.has(name.toLowerCase())) return []
    seen.add(name.toLowerCase())
    const hex = /^#[0-9a-f]{6}$/i.test(String(value.hex)) ? String(value.hex) : '#cccccc'
    const image = typeof value.image === 'string' && value.image ? value.image : undefined
    return [{ name, hex, ...(image ? { image } : {}) }]
  })
}
