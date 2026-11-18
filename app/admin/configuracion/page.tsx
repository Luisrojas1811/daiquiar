'use client'

import useSWR from 'swr'
import { CheckCircle2, CircleAlert, KeyRound } from 'lucide-react'
import { ContentEditor } from '@/components/admin/content-editor'
import { Card, PageHeader, fetcher } from '@/components/admin/ui'

function Status({ ok, title, text }: { ok: boolean; title: string; text: string }) {
  return <div className="flex gap-3">{ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />}<div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div></div>
}

export default function SettingsPage() {
  const { data } = useSWR<{ email: boolean; emailFrom: string; database: boolean }>('/api/admin/status', fetcher)
  return <>
    <PageHeader title="Configuración" description="Datos de contacto de la tienda, a dónde te llegan los pedidos y el estado de las conexiones." />
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ContentEditor groups={['Contacto y redes']} nav={false} />
      <div className="space-y-6">
        <Card title="Conexiones">
          <div className="space-y-4">
            <Status ok={Boolean(data?.database)} title="Base de datos" text={data?.database ? 'Conectada (Neon).' : 'Falta DATABASE_URL.'} />
            <Status ok={Boolean(data?.email)} title="Aviso de pedidos por email" text={data?.email ? `Activo. Se envía desde ${data.emailFrom}.` : 'Falta configurar RESEND_API_KEY en Vercel. Mientras tanto los pedidos se guardan igual.'} />
          </div>
        </Card>
        <Card title="Contraseña del panel">
          <div className="flex gap-3"><KeyRound size={18} className="mt-0.5 shrink-0 text-muted-foreground" /><p className="text-xs leading-5 text-muted-foreground">Se cambia en Vercel → Settings → Environment Variables → <b>ADMIN_PASSWORD</b>. Después, “Redeploy”. Las sesiones abiertas duran 7 días.</p></div>
        </Card>
      </div>
    </div>
  </>
}
