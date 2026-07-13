-- =====================================================================
-- TABLERO PERSONALIZABLE + PERDONAR DEUDA
-- (Aplicado por Claude vía Management API el 2026-07-12; queda como registro.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Columnas del tablero de Actividades definidas por el usuario
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tablero_columnas (
  id        SERIAL PRIMARY KEY,
  titulo    TEXT NOT NULL,
  orden     INTEGER NOT NULL DEFAULT 0,
  es_final  BOOLEAN NOT NULL DEFAULT FALSE  -- las tarjetas aquí cuentan como hechas
);

ALTER TABLE tablero_columnas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON tablero_columnas;
CREATE POLICY acceso_autenticados ON tablero_columnas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON tablero_columnas FROM anon;

-- Columnas iniciales (solo si la tabla está vacía)
INSERT INTO tablero_columnas (titulo, orden, es_final)
SELECT v.t, v.o, v.f
FROM (VALUES ('Por hacer', 1, FALSE), ('En curso', 2, FALSE), ('Hecho', 3, TRUE)) v(t, o, f)
WHERE NOT EXISTS (SELECT 1 FROM tablero_columnas);

-- Migrar las tarjetas del campo fijo "estado" a su columna
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS columna_id INTEGER REFERENCES tablero_columnas(id);

UPDATE actividades a
SET columna_id = tc.id
FROM tablero_columnas tc
WHERE a.columna_id IS NULL
  AND tc.titulo = CASE a.estado
        WHEN 'por_hacer' THEN 'Por hacer'
        WHEN 'en_curso'  THEN 'En curso'
        ELSE 'Hecho' END;

ALTER TABLE actividades DROP COLUMN IF EXISTS estado;

-- ---------------------------------------------------------------------
-- 2. Perdonar deuda: importe condonado por factura.
-- La deuda sigue siendo DERIVADA: pendiente = total − cobros − condonado.
-- No toca caja ni facturación; solo apaga la deuda.
-- ---------------------------------------------------------------------

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS condonado NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE VIEW v_facturas_saldo AS
SELECT
  f.id,
  f.cliente_id,
  c.nombre           AS cliente,
  f.atribucion,
  f.fecha_emision,
  f.vencimiento,
  f.concepto,
  f.total,
  COALESCE(SUM(co.importe), 0)                          AS cobrado,
  f.total - COALESCE(SUM(co.importe), 0) - f.condonado  AS pendiente,
  f.condonado
FROM facturas f
LEFT JOIN clientes c ON c.id = f.cliente_id
LEFT JOIN cobros   co ON co.factura_id = f.id
GROUP BY f.id, c.nombre;
