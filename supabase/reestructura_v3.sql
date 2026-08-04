-- =====================================================================
-- REESTRUCTURA v3 (estilo Holded):
--  1) pagos_cobros_filas: filas fijas de la matriz Pagos y cobros
--     (cliente vinculado o patron de concepto para agregados sin cliente).
--  2) embudos multiples + deals con embudo, seguimiento y notas de tarjeta.
--  3) compras_archivos + bucket de Storage para facturas escaneadas.
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS pagos_cobros_filas (
  id         SERIAL PRIMARY KEY,
  orden      INTEGER NOT NULL DEFAULT 0,
  etiqueta   TEXT NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  patron     TEXT,
  activa     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS embudos (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  orden  INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO embudos (nombre, orden)
SELECT 'Embudo de ventas', 1 WHERE NOT EXISTS (SELECT 1 FROM embudos);

ALTER TABLE deals ADD COLUMN IF NOT EXISTS embudo_id INTEGER REFERENCES embudos(id) ON DELETE CASCADE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seguimiento DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seguimiento_nota TEXT;
UPDATE deals SET embudo_id = (SELECT min(id) FROM embudos) WHERE embudo_id IS NULL;

CREATE TABLE IF NOT EXISTS compras_archivos (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  ruta      TEXT NOT NULL,
  fecha     DATE NOT NULL DEFAULT CURRENT_DATE,
  gasto_id  INTEGER REFERENCES gastos(id) ON DELETE SET NULL,
  notas     TEXT,
  subido_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['pagos_cobros_filas','embudos','compras_archivos'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS acceso_autenticados ON %I', t);
    EXECUTE format('CREATE POLICY acceso_autenticados ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE pagos_cobros_filas_id_seq, embudos_id_seq, compras_archivos_id_seq TO authenticated;

-- Bucket privado para las facturas de compras
INSERT INTO storage.buckets (id, name, public)
SELECT 'compras', 'compras', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'compras');
DROP POLICY IF EXISTS compras_auth ON storage.objects;
CREATE POLICY compras_auth ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'compras') WITH CHECK (bucket_id = 'compras');
