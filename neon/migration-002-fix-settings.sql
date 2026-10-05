-- Corrige la configuración de envío de versiones anteriores.
-- No elimina datos existentes.

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS shipping_threshold NUMERIC(12, 2) NOT NULL DEFAULT 100000;

-- Si una versión anterior creó correo_argentino_minimum, conserva ese valor.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'store_settings'
      AND column_name = 'correo_argentino_minimum'
  ) THEN
    UPDATE store_settings
    SET shipping_threshold = correo_argentino_minimum
    WHERE id = 1 AND correo_argentino_minimum IS NOT NULL;
  END IF;
END $$;

INSERT INTO store_settings (id, shipping_threshold)
VALUES (1, 100000)
ON CONFLICT (id) DO NOTHING;
