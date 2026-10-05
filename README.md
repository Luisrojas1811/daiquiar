# Daiquiar

Tienda Next.js + PostgreSQL/Neon + Drizzle ORM. Los pedidos se confirman por WhatsApp.

## Configuración

1. Copiá `.env.example` a `.env.local` y completá:
   `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
2. En Neon ejecutá `lib/db/schema.sql` (o solo `neon/migration-003-contenido-editable.sql` si ya tenés las tablas). Es seguro correrlo varias veces: no borra datos.
3. `npm install` (o `pnpm install`) y `npm run build` para verificar.

## Panel Admin (`/admin`)

**Productos y stock**
- Crear, editar y eliminar productos (fotos guardadas en la base, talles, stock por talle, umbral de bajo stock).
- El stock **se descuenta solo** cuando un cliente confirma un pedido. El panel y la tienda se refrescan solos.
- Si el stock de un talle (o del producto) llega al umbral, la tienda muestra el cartel **“Queda poco stock”**. En el Admin ese talle se marca en rojo.

**Contenido de la tienda**
- Foto principal de la portada, cartel rojo en movimiento, y todos los textos de la tienda (portada, menú, categorías, “Nuevos ingresos”, beneficios, carrito, footer, preguntas frecuentes, WhatsApp e Instagram).
- Cada campo tiene “Restaurar original”. Solo se guarda en la base lo que se cambia.
- Para sumar otro texto editable, agregalo en `lib/content.ts`; el Admin lo muestra solo.

## Stock por talle

Si un producto tiene talles, se controla el stock de cada talle. Un producto con talles pero sin stock cargado muestra los talles deshabilitados hasta que se asigne desde el Admin.

## Imágenes

El Admin achica cada foto en el navegador (máx. 1600 px) y la guarda en la tabla `images` de la base; la tienda las sirve desde `/api/images/<id>`. No hace falta ningún servicio externo.
