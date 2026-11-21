import { SITE_URL } from '@/lib/site'
import { PAYMENT_NAMES, SHIPPING_NAMES, money } from '@/lib/pricing'
import type { AdminOrder } from '@/lib/orders'

// Envía el aviso de pedido nuevo a la dueña. Usa la API de Resend (sin dependencias extra).
// Si falta la configuración, no rompe la compra: solo lo registra en el log.
export async function sendOrderEmail(order: AdminOrder, to: string, storeName = 'Daiquiar') {
  const apiKey = process.env.RESEND_API_KEY
  const recipients = to.split(',').map(email => email.trim()).filter(Boolean)
  if (!apiKey || !recipients.length) { console.warn('Aviso por email no configurado (RESEND_API_KEY o email de pedidos vacío)'); return false }

  const esc = (value: string) => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]!))
  const rows = order.items.map(item => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #E8D9C6">${esc(item.name)}<br><span style="color:#7A5A58;font-size:13px">${item.color ? `${esc(item.color)} · ` : ''}Talle ${esc(item.size || 'Único')} · ${item.quantity} u. × ${money(item.price)}</span></td>
      <td style="padding:10px 0;border-bottom:1px solid #E8D9C6;text-align:right;white-space:nowrap">${money(item.subtotal)}</td></tr>`).join('')
  const line = (label: string, value: string, bold = false) => `<tr><td style="padding:4px 0;color:#7A5A58">${label}</td><td style="padding:4px 0;text-align:right;${bold ? 'font-weight:700;font-size:18px;color:#80011F' : ''}">${value}</td></tr>`
  const info = (label: string, value: string) => value ? `<p style="margin:0 0 6px"><b>${label}:</b> ${esc(value)}</p>` : ''
  const whatsapp = order.customerPhone.replace(/\D/g, '')
  const base = SITE_URL

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#FDF3E8;padding:24px;color:#351719">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E8D9C6">
    <div style="background:#80011F;color:#FDF3E8;padding:20px 24px"><div style="font-weight:900;letter-spacing:4px">${esc(storeName.toUpperCase())}</div><div style="margin-top:6px;font-size:20px">Nuevo pedido #${order.id}</div></div>
    <div style="padding:24px">
      <h3 style="margin:0 0 10px">Clienta</h3>
      ${info('Nombre', order.customerName)}${info('Teléfono', order.customerPhone)}${info('Email', order.customerEmail)}${info('DNI', order.customerDni)}
      ${info('Entrega', SHIPPING_NAMES[order.shippingMethod] ?? order.shippingMethod)}${info('Dirección', order.customerAddress)}${info('Código postal', order.customerZip)}
      ${info('Pago', PAYMENT_NAMES[order.paymentMethod] ?? order.paymentMethod)}${info('Cupón', order.couponCode)}${info('Notas', order.notes)}
      <h3 style="margin:22px 0 4px">Productos</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
        ${line('Subtotal', money(order.subtotal))}${order.discount ? line('Descuentos', '−' + money(order.discount)) : ''}${line('Envío', order.shippingCost ? money(order.shippingCost) : 'Sin cargo')}${line('Total', money(order.total), true)}
      </table>
      <div style="margin-top:24px">
        ${whatsapp ? `<a href="https://wa.me/${whatsapp}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;margin-right:8px">Escribirle por WhatsApp</a>` : ''}
        ${base ? `<a href="${base}/admin/pedidos/${order.id}" style="display:inline-block;background:#80011F;color:#FDF3E8;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Ver en el panel</a>` : ''}
      </div>
    </div>
  </div></div>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${storeName} <onboarding@resend.dev>`,
        to: recipients,
        reply_to: order.customerEmail || undefined,
        subject: `🛍️ Nuevo pedido #${order.id} · ${order.customerName} · ${money(order.total)}`,
        html,
      }),
    })
    if (!response.ok) { console.error('Resend rechazó el email', response.status, await response.text()); return false }
    return true
  } catch (error) {
    console.error('No se pudo enviar el email del pedido', error)
    return false
  }
}
