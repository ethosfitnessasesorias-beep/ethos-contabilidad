-- Lineas de factura (editor estilo Holded) + fecha de vencimiento
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS fecha_vencimiento date;

CREATE TABLE IF NOT EXISTS factura_lineas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  factura_id bigint NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  orden int NOT NULL DEFAULT 0,
  concepto text NOT NULL DEFAULT '',
  descripcion text,
  cantidad numeric NOT NULL DEFAULT 1,
  precio numeric NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS factura_lineas_factura_idx ON factura_lineas(factura_id);

ALTER TABLE factura_lineas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON factura_lineas;
CREATE POLICY acceso_autenticados ON factura_lineas FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON factura_lineas FROM anon;
GRANT ALL ON factura_lineas TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'OK: factura_lineas lista' AS resultado;
