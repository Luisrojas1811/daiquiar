'use client'

import { FormEvent, useState } from 'react'
import { ArrowLeft, LockKeyhole, Plus, Trash2 } from 'lucide-react'

type AdminProduct = { id: number; name: string; category: string; price: number; image: string }

const demoProducts: AdminProduct[] = [
  { id: 1, name: 'Body Negro Escote V', category: 'Bodies', price: 24990, image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=180&q=80' },
  { id: 2, name: 'Catsuit Negro Manga Larga', category: 'Conjuntos', price: 38990, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=180&q=80' },
]

export default function AdminPage() {
  const [logged, setLogged] = useState(false)
  const [products, setProducts] = useState(demoProducts)
  const [message, setMessage] = useState('')

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLogged(true)
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setProducts(current => [{
      id: Date.now(), name: String(data.get('name')), category: String(data.get('category')), price: Number(data.get('price')), image: String(data.get('image')) || demoProducts[0].image,
    }, ...current])
    event.currentTarget.reset()
    setMessage('Producto agregado al catálogo de esta demo')
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><a href="/" className="flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={17}/> Ver tienda pública</a><span className="font-serif text-2xl font-bold">DAIQUIAR</span><span className="text-xs uppercase tracking-widest text-muted-foreground">Panel privado</span></div></header>
    <div className="mx-auto max-w-5xl px-5 py-12">{!logged ? <section className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><LockKeyhole size={21}/></div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Daiquiar Indumentaria</p><h1 className="mt-2 font-serif text-4xl font-bold">Ingresar al panel</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Este enlace es privado y no aparece en la tienda de clientes.</p><form onSubmit={login} className="mt-7 space-y-4"><label className="block text-sm font-medium">Email<input required type="email" placeholder="tu@email.com" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none"/></label><label className="block text-sm font-medium">Contraseña<input required type="password" placeholder="••••••••" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none"/></label><button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Entrar</button></form><p className="mt-5 text-center text-xs text-muted-foreground">Demo: cualquier email y contraseña.</p></section> : <><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Administración</p><h1 className="mt-2 font-serif text-4xl font-bold">Catálogo de productos</h1><p className="mt-2 text-sm text-muted-foreground">Los cambios son de demostración y todavía no persisten.</p></div><a href="/" className="text-sm font-semibold text-primary">Abrir tienda pública</a></div><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={addProduct} className="h-fit rounded-2xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 font-bold"><Plus size={18}/> Nuevo producto</h2><div className="mt-5 space-y-3"><input required name="name" placeholder="Nombre" className="w-full rounded-xl border border-input bg-background px-4 py-3"/><select name="category" className="w-full rounded-xl border border-input bg-background px-4 py-3"><option>Bodies</option><option>Conjuntos</option><option>Básicos</option></select><input required name="price" type="number" placeholder="Precio" className="w-full rounded-xl border border-input bg-background px-4 py-3"/><input name="image" placeholder="URL de imagen" className="w-full rounded-xl border border-input bg-background px-4 py-3"/><button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Agregar producto</button></div>{message && <p className="mt-4 text-sm text-primary">{message}</p>}</form><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><h2 className="font-bold">Productos activos</h2><span className="rounded-full bg-muted px-3 py-1 text-xs">{products.length}</span></div><div className="mt-5 divide-y divide-border">{products.map(product => <div key={product.id} className="flex items-center gap-4 py-4"><img src={product.image} alt="" className="h-16 w-16 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="font-semibold">{product.name}</p><p className="text-sm text-muted-foreground">{product.category} · ${product.price.toLocaleString('es-AR')}</p></div><button aria-label={`Eliminar ${product.name}`} onClick={() => setProducts(current => current.filter(item => item.id !== product.id))} className="text-muted-foreground hover:text-destructive"><Trash2 size={18}/></button></div>)}</div></section></div></>}</div>
  </main>
}
