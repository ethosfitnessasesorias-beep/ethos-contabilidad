-- =====================================================================
-- MEJORAS v2: orden manual de tarjetas, ingresos que no computan
-- impuestos, y declaración fiscal por titular (David / Luis / Ethos).
-- (Pendiente de aplicar vía Management API; queda como registro.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Orden manual de tarjetas dentro de su columna (drag arriba/abajo)
-- ---------------------------------------------------------------------
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- 2. Ingresos que NO cuentan para impuestos (p. ej. ventas sin IVA que
-- no se declaran). Por defecto TODO computa; se desmarca a mano.
-- ---------------------------------------------------------------------
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS computa_impuestos BOOLEAN NOT NULL DEFAULT TRUE;

-- ---------------------------------------------------------------------
-- 3. Declaración fiscal por TITULAR y trimestre.
--    - Titular: cada socio autónomo declara lo suyo. Los Alex van
--      subsumidos en Ethos (la casa); Ethos declara ellos + lo propio.
--    - Solo cuentan gastos DEDUCIBLES (con factura) y facturas que
--      computan impuestos.
--    - beneficio (para el modelo 130) excluye inversiones (se amortizan).
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS v_impuestos_declaracion;
CREATE VIEW v_impuestos_declaracion AS
WITH ing AS (
  SELECT EXTRACT(YEAR FROM fecha_emision)::INT    AS anyo,
         EXTRACT(QUARTER FROM fecha_emision)::INT AS trim,
         CASE atribucion WHEN 'luis' THEN 'luis' WHEN 'david' THEN 'david' ELSE 'ethos' END AS titular,
         SUM(base)         AS ingresos_base,
         SUM(iva_importe)  AS iva_repercutido,
         SUM(irpf_importe) AS irpf_retenido_clientes
  FROM facturas
  WHERE computa_impuestos
  GROUP BY 1, 2, 3
),
gas AS (
  SELECT EXTRACT(YEAR FROM g.fecha)::INT    AS anyo,
         EXTRACT(QUARTER FROM g.fecha)::INT AS trim,
         CASE g.imputado_a WHEN 'luis' THEN 'luis' WHEN 'david' THEN 'david' ELSE 'ethos' END AS titular,
         SUM(g.base)                                     AS gastos_base_deducible,
         SUM(g.iva_soportado)                            AS iva_soportado,
         SUM(g.irpf_soportado)                           AS irpf_retenciones,
         SUM(g.base) FILTER (WHERE NOT c.es_inversion)   AS gastos_base_130
  FROM gastos g
  JOIN categorias c ON c.id = g.categoria_id
  WHERE g.deducible
  GROUP BY 1, 2, 3
)
SELECT
  COALESCE(i.anyo, g.anyo)       AS anyo,
  COALESCE(i.trim, g.trim)       AS trim,
  COALESCE(i.titular, g.titular) AS titular,
  COALESCE(i.ingresos_base, 0)          AS ingresos_base,
  COALESCE(i.iva_repercutido, 0)        AS iva_repercutido,
  COALESCE(i.irpf_retenido_clientes, 0) AS irpf_retenido_clientes,
  COALESCE(g.gastos_base_deducible, 0)  AS gastos_base_deducible,
  COALESCE(g.iva_soportado, 0)          AS iva_soportado,
  COALESCE(g.irpf_retenciones, 0)       AS irpf_retenciones,
  COALESCE(i.iva_repercutido, 0) - COALESCE(g.iva_soportado, 0)     AS iva_resultado,
  COALESCE(i.ingresos_base, 0)   - COALESCE(g.gastos_base_130, 0)   AS beneficio
FROM ing i
FULL OUTER JOIN gas g ON g.anyo = i.anyo AND g.trim = i.trim AND g.titular = i.titular;

REVOKE ALL ON v_impuestos_declaracion FROM anon;
