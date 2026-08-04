-- Carpetas para organizar el archivo de facturas de compra
CREATE TABLE IF NOT EXISTS compras_carpetas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE compras_archivos ADD COLUMN IF NOT EXISTS carpeta_id bigint REFERENCES compras_carpetas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS compras_archivos_carpeta_idx ON compras_archivos(carpeta_id);

ALTER TABLE compras_carpetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON compras_carpetas;
CREATE POLICY acceso_autenticados ON compras_carpetas FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON compras_carpetas FROM anon;
GRANT ALL ON compras_carpetas TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'OK: carpetas de compras listas' AS resultado;
