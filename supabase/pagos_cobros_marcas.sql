-- Capa MANUAL de la matriz Pagos y cobros: marcas de color por casilla
-- (fila × mes) para prever ingresos y controlar clientes. NO afecta a las
-- cuentas ni a la contabilidad: es solo un esquema visual del equipo.
CREATE TABLE IF NOT EXISTS pagos_cobros_marcas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fila_id bigint NOT NULL REFERENCES pagos_cobros_filas(id) ON DELETE CASCADE,
  mes date NOT NULL,                    -- primer día del mes marcado
  estado text NOT NULL,                 -- 'pagado' | 'no_pagado'
  nota text,
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fila_id, mes)
);
CREATE INDEX IF NOT EXISTS pcm_fila_idx ON pagos_cobros_marcas(fila_id);

ALTER TABLE pagos_cobros_marcas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON pagos_cobros_marcas;
CREATE POLICY acceso_autenticados ON pagos_cobros_marcas FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON pagos_cobros_marcas FROM anon;
GRANT ALL ON pagos_cobros_marcas TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'OK: pagos_cobros_marcas lista' AS resultado;
