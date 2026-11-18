// Estados de un pedido (sin dependencias de servidor: se usa también en el panel).
export const ORDER_STATUSES = [
  { id: 'pending', label: 'Nuevo' },
  { id: 'confirmed', label: 'Confirmado' },
  { id: 'paid', label: 'Pagado' },
  { id: 'shipped', label: 'Enviado' },
  { id: 'delivered', label: 'Entregado' },
  { id: 'cancelled', label: 'Cancelado' },
] as const
export type OrderStatus = typeof ORDER_STATUSES[number]['id']
export const ORDER_STATUS_IDS = ORDER_STATUSES.map(status => status.id) as string[]

