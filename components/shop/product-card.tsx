'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { EMPTY_IMAGE, availableUnits, colorImage, getStock, productImages, transferPercent, useStore, type Product } from '@/components/store'
import { money } from '@/lib/pricing'
import { cn } from '@/lib/utils'

// Tarjeta de producto: 2.ª foto al pasar el mouse, muestras de color, etiquetas,
// precio con transferencia y "agregar rápido" eligiendo el talle sobre la foto.
export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { add, content } = useStore()
  const colors = product.colors ?? []
  const [color, setColor] = useState(colors.find(c => product.sizes.some(s => getStock(product, c.name, s) > 0) || getStock(product, c.name, '') > 0)?.name ?? colors[0]?.name ?? '')
  const images = productImages(product)
  const main = color ? colorImage(product, color) : images[0]
  const hover = images.find(url => url !== main)
  const units = availableUnits(product)
  const off = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const transfer = transferPercent(content)
  const freeFrom = Number(content.shipping_free_from) || 0
  const quickSizes = product.sizes.length ? product.sizes : ['']

  return <article className={cn('group relative min-w-0', className)}>
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
      <Link href={`/producto/${product.id}${color ? `?color=${encodeURIComponent(color)}` : ''}`} className="absolute inset-0" aria-label={product.name}>
        <img src={main || EMPTY_IMAGE} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" loading="lazy" />
        {hover && <img src={hover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" loading="lazy" />}
      </Link>
      <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
        {units === 0 ? <span className="rounded-full bg-foreground/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-background">{content.out_of_stock_label}</span> : <>
          {off > 0 && <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">{off}% OFF</span>}
          {product.badge && <span className="rounded-full bg-background/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm">{product.badge}</span>}
          {freeFrom > 0 && product.price >= freeFrom && <span className="rounded-full bg-background/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-sm">Envío gratis</span>}
        </>}
      </div>
      {/* Agregar rápido: aparece al pasar el mouse (en el celular, siempre visible abajo) */}
      {units > 0 && <div className="absolute inset-x-2.5 bottom-2.5 translate-y-0 rounded-xl bg-background/95 p-2 shadow-lg backdrop-blur transition duration-300 md:translate-y-[120%] md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <p className="mb-1.5 hidden text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground md:block">Agregar rápido</p>
        <div className="flex flex-wrap justify-center gap-1">{quickSizes.map(size => {
          const ok = getStock(product, color, size) > 0
          return <button key={size || 'unico'} disabled={!ok} onClick={() => add(product, color, size, 1)} aria-label={`Agregar talle ${size || 'único'}`} className="min-w-9 rounded-full border border-primary/30 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:border-transparent disabled:text-muted-foreground/60 disabled:line-through">{size || <span className="flex items-center gap-1.5"><ShoppingBag size={13} />Agregar</span>}</button>
        })}</div>
      </div>}
    </div>
    <div className="pt-3.5">
      {colors.length > 0 && <div className="mb-2 flex items-center gap-1.5">{colors.slice(0, 6).map(c => <button key={c.name} onClick={() => setColor(c.name)} title={c.name} aria-label={`Color ${c.name}`} className={cn('h-4 w-4 rounded-full border transition', color === c.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-foreground/15')} style={{ background: c.hex }} />)}{colors.length > 1 && <span className="ml-1 text-[11px] text-muted-foreground">{colors.length} colores</span>}</div>}
      <Link href={`/producto/${product.id}`} className="block text-[13px] leading-snug font-bold uppercase tracking-[0.08em] hover:text-primary">{product.name}</Link>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2"><span className="text-base font-bold">{money(product.price)}</span>{off > 0 && <del className="text-xs text-muted-foreground">{money(product.oldPrice!)}</del>}</p>
      {transfer > 0 && <p className="text-xs font-bold text-primary">{money(product.price * (1 - transfer / 100))} <span className="font-normal">con transferencia</span></p>}
    </div>
  </article>
}
