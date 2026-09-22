-- Historial de ETAPAS de un cliente. La tabla clientes guarda siempre la etapa
-- ACTUAL (primer_contacto, fecha_compra, fecha_inicio, fecha_baja), así que
-- ninguna métrica ni vista cambia. Cuando un cliente vuelve, la etapa que se
-- cierra se archiva aquí y se empieza una nueva en clientes. Nada se pierde.
CREATE TABLE IF NOT EXISTS cliente_ciclos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  primer_contacto date,
  fecha_compra date,
  fecha_inicio date,
  fecha_baja date,
  motivo text,                          -- nota opcional (por qué se fue, etc.)
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cliente_ciclos_cliente_idx ON cliente_ciclos(cliente_id);

ALTER TABLE cliente_ciclos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON cliente_ciclos;
CREATE POLICY acceso_autenticados ON cliente_ciclos FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON cliente_ciclos FROM anon;
GRANT ALL ON cliente_ciclos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'OK: cliente_ciclos lista' AS resultado;
