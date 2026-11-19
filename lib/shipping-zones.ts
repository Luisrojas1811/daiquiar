// Zona de envío a partir del código postal argentino (acepta "1414" o el CPA "C1414ABC").
// Rangos aproximados por región; los precios de cada zona se cambian desde el panel.
export type Zone = 'caba' | 'amba' | 'centro' | 'norte' | 'patagonia'
export const ZONE_NAMES: Record<Zone, string> = { caba: 'CABA', amba: 'GBA', centro: 'Centro', norte: 'Norte, Litoral y Cuyo', patagonia: 'Patagonia' }

export function zipDigits(zip: string) {
  const match = String(zip ?? '').toUpperCase().match(/\d{4}/)
  return match ? Number(match[0]) : null
}

export function zoneForZip(zip: string): Zone | null {
  const n = zipDigits(zip)
  if (n === null || n < 1000 || n > 9499) return null
  if (n < 1500) return 'caba'
  if (n < 2000) return 'amba'
  if (n < 3300 || (n >= 5000 && n < 5300) || (n >= 5800 && n < 8200)) return 'centro'
  if (n < 5800) return 'norte'
  return 'patagonia'
}
