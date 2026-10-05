-- Esquema y migración manual para Neon. No requiere Drizzle Kit.

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC(10, 2) NOT NULL,
  old_price NUMERIC(10, 2),
  color TEXT,
  image TEXT,
  badge TEXT,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  total NUMERIC(10, 2) NOT NULL,
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migración compatible con la estructura existente.
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_stock JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Textos e imágenes editables desde /admin (cartel, portada, footer, etc.).
-- Solo guarda lo que la dueña cambió; el resto usa los textos por defecto del código.
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fotos subidas desde el Admin (se guardan en la base, sin servicios externos).
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (name) VALUES ('Bodies'), ('Catsuits'), ('Conjuntos')
ON CONFLICT (name) DO NOTHING;
