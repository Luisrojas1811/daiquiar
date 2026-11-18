'use client'

import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { ProductEditor } from '@/components/admin/product-editor'
import { Skeleton, fetcher } from '@/components/admin/ui'
import type { Product } from '@/lib/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  // Se pide el catálogo fresco al abrir, por si hubo ventas desde la última carga.
  const { data } = useSWR<Product[]>('/api/catalog?all=1', fetcher, { revalidateOnFocus: false })
  if (!data) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-96" /></div>
  const product = data.find(p => p.id === Number(id))
  if (!product) return <p className="text-sm text-muted-foreground">Producto no encontrado.</p>
  return <ProductEditor key={product.id} product={product} />
}
