'use client'

import { useState } from 'react'
import { MapPin, Truck } from 'lucide-react'
import { useStore } from '@/components/store'
import { money, shippingOptions } from '@/lib/pricing'
import { ZONE_NAMES, zoneForZip } from '@/lib/shipping-zones'
import { cn } from '@/lib/utils'

// "Entregas para el CP": la clienta escribe su código postal y ve las opciones con su precio.
// El CP queda guardado y se usa también en el carrito y el checkout.
export function ShippingCalculator({ subtotal = 0, compact = false }: { subtotal?: number; compact?: boolean }) {
  const { content, zip, setZip } = useStore()
  const [draft, setDraft] = useState(zip)
  const [error, setError] = useState('')
  const zone = zoneForZip(zip)
  const freeFrom = Number(content.shipping_free_from) || 0
  const free = freeFrom > 0 && subtotal >= freeFrom

  function calculate(event: React.FormEvent) {
    event.preventDefault()
    if (!zoneForZip(draft)) { setError('No encontramos ese código postal. Revisá que tenga 4 números.'); return }
    setError(''); setZip(draft.trim().toUpperCase())
  }

  return <div className={cn('rounded-xl border border-border bg-card', compact ? 'p-3' : 'p-4')}>
    <p className="flex items-center gap-2 text-sm font-semibold"><Truck size={16} className="text-primary" />Medios de envío</p>
    {zone ? <div className="mt-3">
      <p className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin size={13} />Entregas para el CP <b className="text-foreground">{zip}</b> ({ZONE_NAMES[zone]})</span><button onClick={() => { setDraft(zip); setZip('') }} className="font-semibold text-primary underline-offset-2 hover:underline">Cambiar CP</button></p>
      <ul className="mt-2 divide-y divide-border">{shippingOptions(content, zip).map(option => <li key={option.id} className="flex justify-between gap-4 py-2 text-sm"><span>{option.label}</span><b className="whitespace-nowrap">{option.cost === 0 ? 'Gratis' : free && option.id !== 'pickup' ? <span className="text-primary">¡Gratis!</span> : money(option.cost ?? 0)}</b></li>)}</ul>
    </div> : <form onSubmit={calculate} className="mt-3 flex gap-2">
      <input value={draft} onChange={e => setDraft(e.target.value)} inputMode="numeric" placeholder="Tu código postal" aria-label="Código postal" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
      <button className="pop rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">Calcular</button>
    </form>}
    {error && <p className="mt-2 text-xs text-primary">{error}</p>}
    {!zone && <a href="https://www.correoargentino.com.ar/formularios/cpa" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted-foreground underline underline-offset-2">No sé mi código postal</a>}
    {freeFrom > 0 && !compact && <p className="mt-2 text-xs font-semibold text-primary">{free ? '¡Tu compra tiene envío gratis!' : `Envío gratis comprando desde ${money(freeFrom)}`}</p>}
  </div>
}
