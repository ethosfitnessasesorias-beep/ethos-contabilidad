-- =====================================================================
-- MEJORAS: etiquetas + archivado del tablero, declaración de impuestos,
-- fecha de cobro en facturas.
-- (Pendiente de aplicar vía Management API; queda como registro.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Etiquetas personalizables del tablero de Actividades (estilo Trello)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tablero_etiquetas (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  color  TEXT NOT NULL DEFAULT 'zinc',  -- clave de paleta del front
  orden  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE tablero_etiquetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON tablero_etiquetas;
CREATE POLICY acceso_autenticados ON tablero_etiquetas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON tablero_etiquetas FROM anon;
GRANT USAGE, SELECT ON SEQUENCE tablero_etiquetas_id_seq TO authenticated;

-- Cada tarjeta puede tener varias etiquetas (ids de tablero_etiquetas)
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS etiquetas INTEGER[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------
-- 2. Archivado de tarjetas (el front purga las de más de 6 meses)
-- ---------------------------------------------------------------------

ALTER TABLE actividades ADD COLUMN IF NOT EXISTS archivada_en TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- 3. Declaración trimestral para el gestor: cifras brutas a declarar.
-- El IVA resultado puede ser negativo (a compensar); el front encadena
-- la compensación entre trimestres.
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW v_impuestos_declaracion AS
WITH ing AS (
  SELECT EXTRACT(YEAR FROM fecha_emision)::INT    AS anyo,
         EXTRACT(QUARTER FROM fecha_emision)::INT AS trim,
         SUM(base)         AS ingresos_base,
         SUM(iva_importe)  AS iva_repercutido,
         SUM(irpf_importe) AS irpf_retenido_clientes
  FROM facturas
  GROUP BY 1, 2
),
gas AS (
  SELECT EXTRACT(YEAR FROM fecha)::INT    AS anyo,
         EXTRACT(QUARTER FROM fecha)::INT AS trim,
         SUM(base)          FILTER (WHERE deducible) AS gastos_base_deducible,
         SUM(iva_soportado) FILTER (WHERE deducible) AS iva_soportado,
         SUM(irpf_soportado)                         AS irpf_retenciones
  FROM gastos
  GROUP BY 1, 2
)
SELECT
  COALESCE(i.anyo, g.anyo) AS anyo,
  COALESCE(i.trim, g.trim) AS trim,
  COALESCE(i.ingresos_base, 0)          AS ingresos_base,
  COALESCE(i.iva_repercutido, 0)        AS iva_repercutido,
  COALESCE(i.irpf_retenido_clientes, 0) AS irpf_retenido_clientes,
  COALESCE(g.gastos_base_deducible, 0)  AS gastos_base_deducible,
  COALESCE(g.iva_soportado, 0)          AS iva_soportado,
  COALESCE(g.irpf_retenciones, 0)       AS irpf_retenciones,
  COALESCE(i.iva_repercutido, 0) - COALESCE(g.iva_soportado, 0) AS iva_resultado
FROM ing i
FULL OUTER JOIN gas g ON g.anyo = i.anyo AND g.trim = i.trim;

REVOKE ALL ON v_impuestos_declaracion FROM anon;

-- ---------------------------------------------------------------------
-- 4. Fecha del último cobro por factura (columna añadida AL FINAL para
-- que CREATE OR REPLACE sea válido; v_morosos no cambia).
-- ---------------------------------------------------------------------

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
  f.condonado,
  MAX(co.fecha)                                         AS fecha_ultimo_cobro
FROM facturas f
LEFT JOIN clientes c ON c.id = f.cliente_id
LEFT JOIN cobros   co ON co.factura_id = f.id
GROUP BY f.id, c.nombre;
