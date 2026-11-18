# Daiquiar

Tienda Next.js + PostgreSQL/Neon. Recorrido de compra estilo Tiendanube (carrito lateral → checkout en pasos → confirmación), aviso por email a la dueña y panel de administración completo en `/admin`.

## Configuración

1. Variables de entorno (Vercel → Settings → Environment Variables, o `.env.local`):
   - `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
   - `RESEND_API_KEY` (opcional, para el email de cada pedido) y `EMAIL_FROM` (remitente con dominio verificado en Resend).
2. La base se actualiza sola al arrancar (todas las sentencias son `IF NOT EXISTS`, no borran datos). Si preferís hacerlo a mano: `neon/migration-004-ecommerce-completo.sql`.
3. `npm install` y `npm run build`.

## Tienda

| Ruta | Qué hace |
|---|---|
| `/` | Portada, categorías, “más elegidos” (destacados), nuevos ingresos, beneficios |
| `/productos`, `/categoria/[slug]` | Listado con filtros (talle, precio, con stock) y orden |
| `/producto/[id]` | Galería, talles, guía de talles, stock, precio con transferencia, medios de pago, envíos, relacionados |
| Carrito lateral | Se abre al agregar; barra de “envío gratis”, “Iniciar compra” |
| `/checkout` | Paso 1 contacto + entrega · Paso 2 pago + cupón · Paso 3 confirmación con datos de transferencia y WhatsApp |
| `/ayuda` | Cómo comprar, pagos, envíos, cambios, guía de talles, preguntas frecuentes |

El total lo calcula el servidor (`lib/pricing.ts`): cupón → descuento por transferencia → envío (gratis desde el monto configurado). El stock se descuenta al confirmar y vuelve si el pedido se cancela desde el panel.

## Panel (`/admin`)

Inicio (ventas, pedidos nuevos, stock bajo, más vendidos) · Pedidos (estados, notas, WhatsApp, exportar) · Clientas · Productos (fotos ordenables, talles y stock, publicado/oculto, destacado) · Inventario (planilla rápida) · Categorías (foto, orden, visibilidad) · Promociones (cupones y cartel) · Diseño y textos · Envíos y pagos · Configuración (email de pedidos, contacto, estado de conexiones).

Para sumar un texto editable nuevo, agregalo en `lib/content.ts`: el panel lo muestra solo.

## Paleta

Bordó `#80011F` · Crema `#FDF3E8` · Chocolate `#351719` · Beige `#E8D9C6` · Rosa `#F5E4DC` (tokens en `app/globals.css`).
