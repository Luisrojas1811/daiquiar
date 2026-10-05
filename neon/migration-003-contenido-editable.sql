-- Migración 003: contenido editable desde el Admin.
-- Es seguro ejecutarla más de una vez y no borra datos existentes.

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OPCIONAL: la tabla store_settings solo guardaba el monto mínimo del antiguo
-- flujo de envío y ya no se usa. Si querés limpiarla, descomentá la línea:
-- DROP TABLE IF EXISTS store_settings;
