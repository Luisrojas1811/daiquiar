// Fuente única de todos los textos e imágenes que la dueña puede editar desde /admin.
// Para agregar un texto nuevo editable: sumá una entrada acá y usalo con `content.<key>`.
// El panel Admin se arma solo a partir de esta lista.

export type ContentFieldType = 'text' | 'textarea' | 'image' | 'url' | 'phone'

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
] as const

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

  // Beneficios
  { key: 'benefit_1_title', group: G[5], type: 'text', label: 'Beneficio 1 · título', default: 'Envíos a todo el país' },
  { key: 'benefit_1_description', group: G[5], type: 'textarea', label: 'Beneficio 1 · descripción', default: 'Coordinamos el envío con vos por WhatsApp' },
  { key: 'benefit_2_title', group: G[5], type: 'text', label: 'Beneficio 2 · título', default: 'Compra simple' },
  { key: 'benefit_2_description', group: G[5], type: 'textarea', label: 'Beneficio 2 · descripción', default: 'Coordinamos tu pedido por WhatsApp' },
  { key: 'benefit_3_title', group: G[5], type: 'text', label: 'Beneficio 3 · título', default: 'Atención cercana' },
  { key: 'benefit_3_description', group: G[5], type: 'textarea', label: 'Beneficio 3 · descripción', default: 'Te ayudamos a elegir tu look' },

  // Carrito
  { key: 'cart_title', group: G[6], type: 'text', label: 'Título del carrito', default: 'Tu carrito' },
  { key: 'cart_empty_text', group: G[6], type: 'text', label: 'Mensaje del carrito vacío', default: 'Todavía no agregaste productos.' },
  { key: 'cart_whatsapp_label', group: G[6], type: 'text', label: 'Botón de WhatsApp del carrito', default: 'Comprar/Pedir por WhatsApp' },
  { key: 'cart_how_title', group: G[6], type: 'text', label: 'Título del recuadro "cómo continúa"', default: 'Cómo continúa tu pedido' },
  { key: 'cart_how_text', group: G[6], type: 'textarea', label: 'Texto del recuadro "cómo continúa"', default: 'Confirmamos tu pedido y coordinamos el pago y el envío por WhatsApp.' },
  { key: 'cart_note', group: G[6], type: 'textarea', label: 'Aviso al pie del carrito', default: 'Los pedidos se confirman con 50% de anticipo. Podés pagar por transferencia o efectivo.' },
  { key: 'whatsapp_intro', group: G[6], type: 'text', label: 'Primera línea del mensaje de WhatsApp', default: 'Hola Daiquiar Indumentaria! Quiero confirmar el pedido', hint: 'Después de esta frase se agrega automáticamente el número de pedido y el detalle.' },

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
  { key: 'whatsapp_number', group: G[9], type: 'phone', label: 'WhatsApp de la tienda', default: '5491100000000', hint: 'Con código de país y sin signos. Ej.: 5491122334455. Acá llegan los pedidos.' },
  { key: 'instagram_url', group: G[9], type: 'url', label: 'Link de Instagram', default: 'https://instagram.com/daiquiar.indumentaria' },
]

export type SiteContent = Record<string, string>

export const DEFAULT_CONTENT: SiteContent = Object.fromEntries(CONTENT_FIELDS.map(field => [field.key, field.default]))
export const CONTENT_FIELD_BY_KEY: Record<string, ContentField> = Object.fromEntries(CONTENT_FIELDS.map(field => [field.key, field]))
