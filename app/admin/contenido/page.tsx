'use client'

import { ExternalLink } from 'lucide-react'
import { ContentEditor } from '@/components/admin/content-editor'
import { PageHeader } from '@/components/admin/ui'
import { CONTENT_GROUPS, SETTINGS_GROUPS } from '@/lib/content'

const GROUPS = CONTENT_GROUPS.filter(group => !SETTINGS_GROUPS.includes(group) && group !== 'Contacto y redes' && group !== 'Guía de talles')

export default function ContentPage() {
  return <>
    <PageHeader title="Diseño y textos" description="Fotos de portada y todos los textos que ven tus clientas. Cada campo tiene “Original” para volver atrás."
      actions={<a href="/" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"><ExternalLink size={15} /> Ver tienda</a>} />
    <ContentEditor groups={GROUPS} />
  </>
}
