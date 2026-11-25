// Fuente única de todos los textos e imágenes que la dueña puede editar desde /admin.
// Para agregar un texto nuevo editable: sumá una entrada acá y usalo con `content.<key>`.
// El panel Admin se arma solo a partir de esta lista.

import { DEFAULT_SIZE_GUIDE_JSON } from '@/lib/size-guide'

export type ContentFieldType = 'text' | 'textarea' | 'image' | 'url' | 'phone' | 'number' | 'toggle' | 'json'

export type ContentField = {
  key: string
  label: string
  group: string
  type: ContentFieldType
  default: string
  hint?: string
}

export const CONTENT_GROUPS = [
  'Cartel superior en movimiento',
  'Portada (inicio)',
  'Menú y buscador',
  'Categorías',
  'Nuevos ingresos y productos',
  'Beneficios',
  'Carrito y pedido',
  'Pie de página',
  'Preguntas frecuentes',
  'Contacto y redes',
  'Envíos',
  'Pagos',
  'Guía de talles',
] as const

// Grupos que se editan desde "Envíos y pagos" en el Admin (el resto, desde "Contenido").
export const SETTINGS_GROUPS: string[] = ['Envíos', 'Pagos']

const G = CONTENT_GROUPS

export const CONTENT_FIELDS: ContentField[] = [
  // Cartel superior
  { key: 'marquee_text', group: G[0], type: 'text', label: 'Texto del cartel', default: '10% DE DESCUENTO POR TRANSFERENCIA', hint: 'Se repite y se mueve solo, en loop. Si lo dejás vacío, el cartel se oculta.' },

  // Portada
  { key: 'hero_image', group: G[1], type: 'image', label: 'Foto principal de la portada', default: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1000&q=85' },
  { key: 'hero_eyebrow', group: G[1], type: 'text', label: 'Texto chico sobre el título', default: 'Colección tendencia' },
  { key: 'hero_title', group: G[1], type: 'text', label: 'Título principal', default: 'Moda que inspira tu estilo.' },
  { key: 'hero_description', group: G[1], type: 'textarea', label: 'Descripción', default: 'Indumentaria femenina seleccionada con amor. Diseños únicos, calidad y envíos a todo el país.' },
  { key: 'hero_cta_primary', group: G[1], type: 'text', label: 'Botón principal', default: 'Comprar ahora' },
  { key: 'hero_cta_secondary', group: G[1], type: 'text', label: 'Botón secundario', default: 'Ver lookbook' },
  { key: 'carousel_badge', group: G[1], type: 'text', label: 'Carrusel · texto chico sobre cada producto', default: 'Destacado ♡', hint: 'El carrusel muestra los productos marcados como Destacado (★) en Productos.' },
  { key: 'carousel_cta', group: G[1], type: 'text', label: 'Carrusel · botón de cada producto', default: 'Lo quiero' },
  { key: 'banner_image', group: G[1], type: 'image', label: 'Banner bordó · foto', default: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1000&q=85', hint: 'El bloque bordó grande que está en la mitad de la portada.' },
  { key: 'banner_eyebrow', group: G[1], type: 'text', label: 'Banner bordó · texto chico', default: 'Nueva colección' },
  { key: 'banner_title', group: G[1], type: 'text', label: 'Banner bordó · título', default: 'Hecha para brillar' },
  { key: 'banner_text', group: G[1], type: 'textarea', label: 'Banner bordó · texto', default: 'Prendas pensadas para que te sientas increíble, todos los días.' },
  { key: 'banner_cta', group: G[1], type: 'text', label: 'Banner bordó · botón', default: 'Descubrir' },
  { key: 'instagram_title', group: G[1], type: 'text', label: 'Título de la sección de Instagram', default: 'Seguinos en Instagram', hint: 'Si lo dejás vacío, la sección se oculta.' },
  { key: 'instagram_photo_1', group: G[1], type: 'image', label: 'Instagram · foto 1', default: '/instagram/1.jpg', hint: "Las 6 fotos de la sección “Seguinos en Instagram”. Cada una lleva al perfil." },
  { key: 'instagram_photo_2', group: G[1], type: 'image', label: 'Instagram · foto 2', default: '/instagram/2.jpg' },
  { key: 'instagram_photo_3', group: G[1], type: 'image', label: 'Instagram · foto 3', default: '/instagram/3.jpg' },
  { key: 'instagram_photo_4', group: G[1], type: 'image', label: 'Instagram · foto 4', default: '/instagram/4.jpg' },
  { key: 'instagram_photo_5', group: G[1], type: 'image', label: 'Instagram · foto 5', default: '/instagram/5.jpg' },
  { key: 'instagram_photo_6', group: G[1], type: 'image', label: 'Instagram · foto 6', default: '/instagram/6.jpg' },

  // Menú
  { key: 'nav_new_label', group: G[2], type: 'text', label: 'Link del menú hacia los productos nuevos', default: 'Nuevos ingresos' },
  { key: 'search_placeholder', group: G[2], type: 'text', label: 'Texto del buscador', default: 'Buscar productos...' },

  // Categorías
  { key: 'categories_eyebrow', group: G[3], type: 'text', label: 'Texto chico sobre el título', default: 'Elegí tu categoría' },
  { key: 'categories_title', group: G[3], type: 'text', label: 'Título de la sección', default: 'Encontrá tu próximo look' },
  { key: 'categories_description', group: G[3], type: 'textarea', label: 'Descripción de la sección', default: 'Mirá algunos ejemplos y entrá a cada categoría para descubrir toda la variedad disponible.' },
  { key: 'category_all_label', group: G[3], type: 'text', label: 'Nombre del filtro "todos"', default: 'Todos' },
  { key: 'category_card_cta', group: G[3], type: 'text', label: 'Botón de cada categoría', default: 'Ver todos' },
  { key: 'category_page_eyebrow', group: G[3], type: 'text', label: 'Texto chico en la página de una categoría', default: 'Categoría' },
  { key: 'back_to_store', group: G[3], type: 'text', label: 'Link para volver a la tienda', default: 'Volver a la tienda' },

  // Nuevos ingresos y productos
  { key: 'new_eyebrow', group: G[4], type: 'text', label: 'Texto chico sobre el título', default: 'Elegidos para vos' },
  { key: 'new_title', group: G[4], type: 'text', label: 'Título de la sección', default: 'Nuevos ingresos' },
  { key: 'empty_category_text', group: G[4], type: 'text', label: 'Mensaje cuando no hay productos', default: 'Todavía no hay productos en esta categoría.' },
  { key: 'low_stock_label', group: G[4], type: 'text', label: 'Cartel de poco stock', default: 'Queda poco stock', hint: 'Aparece en el producto cuando el stock llega al umbral que definiste para ese producto.' },
  { key: 'out_of_stock_label', group: G[4], type: 'text', label: 'Cartel sin stock', default: 'Sin stock' },
  { key: 'add_to_cart_label', group: G[4], type: 'text', label: 'Botón de agregar al carrito', default: 'Agregar al carrito' },
  { key: 'featured_eyebrow', group: G[4], type: 'text', label: 'Destacados · texto chico', default: 'Los más elegidos' },
  { key: 'featured_title', group: G[4], type: 'text', label: 'Destacados · título', default: 'Favoritos de la semana' },
  { key: 'related_title', group: G[4], type: 'text', label: 'Título de productos relacionados', default: 'También te puede gustar' },

  // Beneficios
  { key: 'benefit_1_title', group: G[5], type: 'text', label: 'Beneficio 1 · título', hint: 'Podés usar {envio_gratis} y {descuento}: se completan solos con los montos de Envíos y pagos.', default: 'Envío gratis desde {envio_gratis}' },
  { key: 'benefit_1_description', group: G[5], type: 'textarea', label: 'Beneficio 1 · descripción', default: 'Calculá el costo con tu código postal' },
  { key: 'benefit_2_title', group: G[5], type: 'text', label: 'Beneficio 2 · título', default: '{descuento}% OFF por transferencia' },
  { key: 'benefit_2_description', group: G[5], type: 'textarea', label: 'Beneficio 2 · descripción', default: 'Pagás fácil y seguro' },
  { key: 'benefit_3_title', group: G[5], type: 'text', label: 'Beneficio 3 · título', default: 'Cambios sin vueltas' },
  { key: 'benefit_3_description', group: G[5], type: 'textarea', label: 'Beneficio 3 · descripción', default: 'Consultanos dentro de los 7 días de recibido' },
  { key: 'benefit_4_title', group: G[5], type: 'text', label: 'Beneficio 4 · título', default: 'Diseños únicos' },
  { key: 'benefit_4_description', group: G[5], type: 'textarea', label: 'Beneficio 4 · descripción', default: 'Prendas seleccionadas con amor' },

  // Carrito
  { key: 'cart_title', group: G[6], type: 'text', label: 'Título del carrito', default: 'Tu carrito' },
  { key: 'cart_empty_text', group: G[6], type: 'text', label: 'Mensaje del carrito vacío', default: 'Todavía no agregaste productos.' },
  { key: 'cart_whatsapp_label', group: G[6], type: 'text', label: 'Botón de WhatsApp del carrito', default: 'Comprar/Pedir por WhatsApp' },
  { key: 'cart_how_title', group: G[6], type: 'text', label: 'Título del recuadro "cómo continúa"', default: 'Cómo continúa tu pedido' },
  { key: 'cart_how_text', group: G[6], type: 'textarea', label: 'Texto del recuadro "cómo continúa"', default: 'Confirmamos tu pedido y coordinamos el pago y el envío por WhatsApp.' },
  { key: 'cart_note', group: G[6], type: 'textarea', label: 'Aviso al pie del carrito', default: 'Podés pagar por transferencia o efectivo.' },
  { key: 'whatsapp_intro', group: G[6], type: 'text', label: 'Primera línea del mensaje de WhatsApp', default: 'Hola Daiquiar Indumentaria! Quiero confirmar el pedido', hint: 'Después de esta frase se agrega automáticamente el número de pedido y el detalle.' },
  { key: 'thanks_title', group: G[6], type: 'text', label: 'Compra confirmada · título', default: '¡Gracias por tu compra!' },
  { key: 'thanks_text', group: G[6], type: 'textarea', label: 'Compra confirmada · texto', default: 'Tu pedido quedó registrado. Te escribimos por WhatsApp para coordinar el pago y la entrega.' },

  // Footer
  { key: 'footer_text', group: G[7], type: 'textarea', label: 'Texto de presentación', default: 'HEY BBY! Somos Daiquiar. Diseño y calidad a precios únicos. CABA, Buenos Aires. Envíos a todo el país.' },
  { key: 'footer_info_title', group: G[7], type: 'text', label: 'Título "Información"', default: 'Información' },
  { key: 'footer_button_payments', group: G[7], type: 'text', label: 'Botón 1', default: 'Medios de pago' },
  { key: 'footer_button_shipping', group: G[7], type: 'text', label: 'Botón 2', default: 'Envíos' },
  { key: 'footer_button_returns', group: G[7], type: 'text', label: 'Botón 3', default: 'Devoluciones' },
  { key: 'payments_title', group: G[7], type: 'text', label: 'Medios de pago · título', default: 'Medios de pago' },
  { key: 'payments_text', group: G[7], type: 'textarea', label: 'Medios de pago · texto', default: 'Transferencia bancaria o efectivo.' },
  { key: 'shipping_title', group: G[7], type: 'text', label: 'Envíos · título', default: 'Envíos' },
  { key: 'shipping_text', group: G[7], type: 'textarea', label: 'Envíos · texto', default: 'CABA, Buenos Aires y todo el país.' },
  { key: 'returns_title', group: G[7], type: 'text', label: 'Devoluciones · título', default: 'Política de devoluciones' },
  { key: 'returns_text', group: G[7], type: 'textarea', label: 'Devoluciones · texto', default: 'Consultanos dentro de los 7 días de recibido el pedido.' },
  { key: 'copyright', group: G[7], type: 'text', label: 'Línea de derechos', default: '© 2026 Daiquiar Indumentaria. Todos los derechos reservados.' },

  // FAQ
  { key: 'faq_title', group: G[8], type: 'text', label: 'Título de la sección', default: 'Preguntas frecuentes' },
  { key: 'faq_1_question', group: G[8], type: 'text', label: 'Pregunta 1', default: '¿Cómo hago un pedido?' },
  { key: 'faq_1_answer', group: G[8], type: 'textarea', label: 'Respuesta 1', default: 'Agregá tus prendas al carrito y confirmá el pedido por WhatsApp.' },
  { key: 'faq_2_question', group: G[8], type: 'text', label: 'Pregunta 2', default: '¿Cómo se paga?' },
  { key: 'faq_2_answer', group: G[8], type: 'textarea', label: 'Respuesta 2', default: 'Trabajamos con transferencia bancaria y efectivo.' },
  { key: 'faq_3_question', group: G[8], type: 'text', label: 'Pregunta 3', default: '¿Hacen envíos?' },
  { key: 'faq_3_answer', group: G[8], type: 'textarea', label: 'Respuesta 3', default: 'Sí, realizamos envíos a todo el país y coordinamos los detalles.' },

  // Contacto
  { key: 'whatsapp_number', group: G[9], type: 'phone', label: 'WhatsApp de la tienda', default: '5491125256023', hint: 'Con 549 + código de área, sin espacios ni signos. Ej.: 5491125256023 (11 2525-6023). Acá llegan los pedidos.' },
  { key: 'instagram_url', group: G[9], type: 'url', label: 'Link de Instagram', default: 'https://instagram.com/daiquiar.indumentaria' },
  // Pasos de "Puesta en marcha" que la dueña marcó como listos (lo maneja el panel).
  { key: 'setup_done', group: G[9], type: 'json', label: 'Puesta en marcha', default: '[]' },
  { key: 'order_notify_email', group: G[9], type: 'text', label: 'Email donde llegan los pedidos', default: 'daiquiarr@gmail.com', hint: 'Cada compra nueva te llega a este email con todo el detalle. Podés poner varios separados por coma.' },
  { key: 'store_location', group: G[9], type: 'text', label: 'Ubicación / showroom', default: 'CABA, Buenos Aires' },

  // Envíos
  { key: 'shipping_free_from', group: G[10], type: 'number', label: 'Envío gratis desde ($)', default: '100000', hint: 'Si el subtotal llega a este monto, el envío es gratis. Poné 0 para desactivarlo.' },
  { key: 'shipping_caba_enabled', group: G[10], type: 'toggle', label: 'Ofrecer envío en moto (solo CABA y GBA)', default: '1', hint: 'Se ofrece solo si el código postal es de CABA o GBA.' },
  { key: 'shipping_caba_label', group: G[10], type: 'text', label: 'Moto · nombre', default: 'Moto · llega en 24/48 h' },
  { key: 'shipping_moto_caba_cost', group: G[10], type: 'number', label: 'Moto · costo en CABA ($)', default: '4500' },
  { key: 'shipping_moto_amba_cost', group: G[10], type: 'number', label: 'Moto · costo en GBA ($)', default: '6500' },
  { key: 'shipping_country_enabled', group: G[10], type: 'toggle', label: 'Ofrecer Correo Argentino', default: '1' },
  { key: 'shipping_country_label', group: G[10], type: 'text', label: 'Correo · nombre', default: 'Correo Argentino a domicilio' },
  { key: 'shipping_zone_caba', group: G[10], type: 'number', label: 'Correo · CABA ($)', default: '6000', hint: 'Códigos postales 1000 a 1499.' },
  { key: 'shipping_zone_amba', group: G[10], type: 'number', label: 'Correo · GBA ($)', default: '7000', hint: 'Códigos postales 1500 a 1999.' },
  { key: 'shipping_zone_centro', group: G[10], type: 'number', label: 'Correo · Centro ($)', default: '8500', hint: 'Interior de Buenos Aires, Córdoba, Santa Fe, Entre Ríos y La Pampa.' },
  { key: 'shipping_zone_norte', group: G[10], type: 'number', label: 'Correo · Norte, Litoral y Cuyo ($)', default: '10500', hint: 'NOA, NEA, Mendoza, San Juan, San Luis y La Rioja.' },
  { key: 'shipping_zone_patagonia', group: G[10], type: 'number', label: 'Correo · Patagonia ($)', default: '12500', hint: 'Neuquén, Río Negro, Chubut, Santa Cruz y Tierra del Fuego.' },
  { key: 'shipping_pickup_enabled', group: G[10], type: 'toggle', label: 'Ofrecer retiro en persona', default: '1' },
  { key: 'shipping_pickup_label', group: G[10], type: 'text', label: 'Retiro · nombre', default: 'Retiro en showroom (CABA) · sin cargo' },

  // Pagos
  { key: 'payment_transfer_enabled', group: G[11], type: 'toggle', label: 'Aceptar transferencia', default: '1' },
  { key: 'payment_transfer_discount', group: G[11], type: 'number', label: 'Descuento por transferencia (%)', default: '10' },
  { key: 'payment_transfer_details', group: G[11], type: 'textarea', label: 'Datos para transferir', default: 'Alias: daiana.bertoluzzo (Mercado Pago)', hint: 'Se muestran al confirmar el pedido. Podés sumar CBU/CVU y titular.' },
  { key: 'payment_cash_enabled', group: G[11], type: 'toggle', label: 'Aceptar efectivo', default: '1' },

  // Guía de talles
  // Se edita desde el panel → Guía de talles (editor de tablas). Se guarda como JSON.
  { key: 'size_guide_tables', group: G[12], type: 'json', label: 'Guía de talles', default: DEFAULT_SIZE_GUIDE_JSON },
]

export type SiteContent = Record<string, string>

export const DEFAULT_CONTENT: SiteContent = Object.fromEntries(CONTENT_FIELDS.map(field => [field.key, field.default]))
export const CONTENT_FIELD_BY_KEY: Record<string, ContentField> = Object.fromEntries(CONTENT_FIELDS.map(field => [field.key, field]))
