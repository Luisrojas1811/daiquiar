// Achica la foto en el navegador (máx. 1600 px, JPEG) para que pese poco y se suba rápido.
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d'); if (!context) throw new Error('No se pudo procesar la imagen')
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error('No se pudo procesar la imagen')
  return blob
}

// Sube las fotos a la base de datos y devuelve sus direcciones (/api/images/<id>).
export async function uploadImages(files: FileList | File[]) {
  const urls: string[] = []
  for (const file of Array.from(files)) {
    const blob = await shrinkImage(file)
    const response = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.url) throw new Error(data.error || 'No se pudo subir una imagen')
    urls.push(data.url)
  }
  return urls
}
