'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EMPTY_IMAGE, availableUnits, getSizeStock, productImages, transferPercent, useStore, type Product } from '@/components/store'
import { money } from '@/lib/pricing'

// Tarjeta de producto: 2.ª foto al pasar el mouse, etiquetas, precio con transferencia y "agregar rápido" eligiendo talle.
export function ProductCard({ product }: { product: Product }) {
  const { add, content } = useStore()
  const [picking, setPicking] = useState(false)
  const images = productImages(product)
  const units = availableUnits(product)
  const off = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const transfer = transferPercent(content)
  const freeFrom = Number(content.shipping_free_from) || 0
  const sizesWithStock = product.sizes.filter(size => getSizeStock(product, size) > 0)

  return <article className="group relative">
    <Link href={`/producto/${product.id}`} className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
      <img src={images[0] || EMPTY_IMAGE} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy" />
      {images[1] && <img src={images[1]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" loading="lazy" />}
      <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
        {units === 0 ? <span className="rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background">{content.out_of_stock_label}</span> : <>
          {off > 0 && <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{off}% OFF</span>}
          {product.badge && <span className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{product.badge}</span>}
          {freeFrom > 0 && product.price >= freeFrom && <span className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Envío gratis</span>}
        </>}
      </div>
    </Link>
    <div className="pt-3">
      <Link href={`/producto/${product.id}`} className="block text-sm leading-snug font-medium hover:text-primary">{product.name}</Link>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm"><span className="font-bold">{money(product.price)}</span>{off > 0 && <del className="text-xs text-muted-foreground">{money(product.oldPrice!)}</del>}</p>
      {transfer > 0 && <p className="text-xs font-semibold text-primary">{money(product.price * (1 - transfer / 100))} con transferencia</p>}
      {units > 0 && (picking && product.sizes.length ? <div className="mt-2.5 flex flex-wrap gap-1.5">
        {product.sizes.map(size => { const ok = getSizeStock(product, size) > 0; return <button key={size} disabled={!ok} onClick={() => { add(product, size, 1); setPicking(false) }} className="min-w-9 rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground disabled:border-border disabled:text-muted-foreground disabled:line-through">{size}</button> })}
        <button onClick={() => setPicking(false)} className="px-1 text-xs text-muted-foreground">✕</button>
      </div> : <button onClick={() => product.sizes.length ? (sizesWithStock.length === 1 ? add(product, sizesWithStock[0], 1) : setPicking(true)) : add(product, '', 1)} className="mt-2.5 w-full rounded-full border border-primary py-2 text-xs font-bold uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground">{content.add_to_cart_label}</button>)}
    </div>
  </article>
}
