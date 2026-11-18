'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, FolderTree, ImagePlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Textarea, fetcher, send } from '@/components/admin/ui'
import { uploadImages } from '@/components/admin/upload'
import type { Category } from '@/lib/types'

function CategoryForm({ category, onSaved, onCancel }: { category?: Category; onSaved: (list: Category[]) => void; onCancel: () => void }) {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [image, setImage] = useState(category?.image ?? '')
  const [busy, setBusy] = useState(''); const [error, setError] = useState('')
  async function upload(files: FileList | null) { if (!files?.length) return; setBusy('upload'); try { setImage((await uploadImages(files))[0]) } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy('') } }
  async function save() {
    setBusy('save'); setError('')
    try { onSaved(await send<Category[]>(category ? `/api/admin/categories/${category.id}` : '/api/admin/categories', category ? 'PATCH' : 'POST', { name, description, image })) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar') } finally { setBusy('') }
  }
  return <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
    <label className="relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted text-xs text-muted-foreground hover:border-primary/40">
      {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : busy === 'upload' ? <Loader2 className="animate-spin" /> : <span className="flex flex-col items-center gap-1"><ImagePlus size={20} />Foto de portada</span>}
      <input type="file" accept="image/*" className="sr-only" onChange={e => upload(e.target.files)} />
    </label>
    <div className="space-y-4">
      <Field label="Nombre"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej.: Bodies" /></Field>
      <Field label="Descripción" hint="Aparece arriba de los productos en la página de la categoría."><Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-20" /></Field>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><Button variant="primary" loading={busy === 'save'} onClick={save} disabled={!name.trim()}>Guardar</Button><Button variant="ghost" onClick={onCancel}>Cancelar</Button></div>
    </div>
  </div>
}

export default function CategoriesPage() {
  const { data, mutate } = useSWR<Category[]>('/api/admin/categories', fetcher)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const update = async (category: Category, body: Record<string, unknown>) => mutate(await send<Category[]>(`/api/admin/categories/${category.id}`, 'PATCH', body), { revalidate: false })
  async function move(index: number, delta: number) {
    if (!data) return
    const list = [...data]; const [item] = list.splice(index, 1); list.splice(index + delta, 0, item)
    mutate(list, { revalidate: false })
    for (const [order, category] of list.entries()) if (category.sortOrder !== order) await send(`/api/admin/categories/${category.id}`, 'PATCH', { sortOrder: order })
    mutate()
  }
  async function remove(category: Category) {
    if (!window.confirm(`¿Eliminar la categoría “${category.name}”? Sus ${category.products} producto(s) quedan sin categoría (no se borran).`)) return
    mutate(await send<Category[]>(`/api/admin/categories/${category.id}`, 'DELETE'), { revalidate: false })
  }

  return <>
    <PageHeader title="Categorías" description="Organizan el menú y la portada. Cambiá el orden con las flechas: así se ven en la tienda." actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>Nueva categoría</Button>} />
    {editing === 'new' && <Card title="Nueva categoría" className="mb-6"><CategoryForm onCancel={() => setEditing(null)} onSaved={list => { mutate(list, { revalidate: false }); setEditing(null) }} /></Card>}
    <Card padded={false}>
      {data && !data.length ? <EmptyState icon={<FolderTree size={20} />} title="Sin categorías" description="Creá la primera para organizar tus productos." /> :
        <ul className="divide-y divide-border">{data?.map((category, index) => <li key={category.id} className="px-5 py-4">
          {editing === category.id ? <CategoryForm category={category} onCancel={() => setEditing(null)} onSaved={list => { mutate(list, { revalidate: false }); setEditing(null) }} /> :
            <div className="flex items-center gap-4">
              <div className="flex flex-col"><button disabled={index === 0} onClick={() => move(index, -1)} className="p-0.5 text-muted-foreground disabled:opacity-25" aria-label="Subir"><ArrowUp size={14} /></button><button disabled={index === data.length - 1} onClick={() => move(index, 1)} className="p-0.5 text-muted-foreground disabled:opacity-25" aria-label="Bajar"><ArrowDown size={14} /></button></div>
              {category.image ? <img src={category.image} alt="" className="h-14 w-12 rounded-lg object-cover" /> : <div className="flex h-14 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground"><ImagePlus size={16} /></div>}
              <div className="min-w-0 flex-1"><p className="font-medium">{category.name} {!category.visible && <Badge>Oculta</Badge>}</p><p className="text-xs text-muted-foreground">{category.products} producto(s) · /categoria/{category.slug}</p></div>
              <Button size="sm" variant="ghost" onClick={() => update(category, { visible: !category.visible })} icon={category.visible ? <Eye size={14} /> : <EyeOff size={14} />}><span className="hidden sm:inline">{category.visible ? 'Visible' : 'Oculta'}</span></Button>
              <Button size="sm" icon={<Pencil size={14} />} onClick={() => setEditing(category.id)}>Editar</Button>
              <button onClick={() => remove(category)} className="rounded-md p-2 text-muted-foreground hover:text-destructive" aria-label="Eliminar"><Trash2 size={15} /></button>
            </div>}
        </li>)}</ul>}
    </Card>
  </>
}
