'use client'

import { ContentEditor } from '@/components/admin/content-editor'
import { PageHeader } from '@/components/admin/ui'
import { SETTINGS_GROUPS } from '@/lib/content'

export default function ShippingPaymentsPage() {
  return <>
    <PageHeader title="Envíos y pagos" description="Qué formas de envío y pago ve la clienta en el checkout, sus costos y descuentos." />
    <ContentEditor groups={SETTINGS_GROUPS} />
  </>
}
