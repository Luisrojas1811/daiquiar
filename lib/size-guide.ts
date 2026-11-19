// Guía de talles: una o varias tablas que la dueña arma desde el panel (Catálogo → Guía de talles).
// Ej.: una para bodies y catsuits (S-M-L) y otra para conjuntos con corpiño (85 a 100).
export type SizeTable = { title: string; columns: string[]; rows: string[][] }
export type SizeGuide = { tables: SizeTable[]; note: string }

export const DEFAULT_SIZE_GUIDE: SizeGuide = {
  note: 'Medidas en centímetros. Si estás entre dos talles, te recomendamos el más grande.',
  tables: [
    { title: 'Bodies y catsuits', columns: ['Talle', 'Busto', 'Cintura', 'Cadera'], rows: [['S', '82-86', '62-66', '88-92'], ['M', '86-90', '66-70', '92-96'], ['L', '90-96', '70-76', '96-102']] },
    { title: 'Conjuntos (corpiño)', columns: ['Talle', 'Contorno de busto', 'Cadera'], rows: [['85', '78-87', '86-92'], ['90', '88-94', '92-98'], ['95', '95-98', '98-102'], ['100', '99-101', '102-117']] },
  ],
}
export const DEFAULT_SIZE_GUIDE_JSON = JSON.stringify(DEFAULT_SIZE_GUIDE)

export function parseSizeGuide(raw: string | undefined): SizeGuide {
  try {
    const value = JSON.parse(raw ?? '') as Partial<SizeGuide>
    const tables = Array.isArray(value.tables) ? value.tables.map(t => ({
      title: String(t?.title ?? '').slice(0, 80),
      columns: Array.isArray(t?.columns) ? t.columns.map(c => String(c ?? '').slice(0, 40)) : [],
      rows: Array.isArray(t?.rows) ? t.rows.map(r => (Array.isArray(r) ? r : []).map(c => String(c ?? '').slice(0, 40))) : [],
    })).filter(t => t.columns.length) : []
    return { tables, note: String(value.note ?? '').slice(0, 300) }
  } catch {
    return DEFAULT_SIZE_GUIDE
  }
}
