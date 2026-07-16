-- =====================================================================
-- MEJORAS v3: declaración fiscal real de 2 autónomos (David y Luis).
-- (Pendiente de aplicar vía Management API; queda como registro.)
--
-- Estructura acordada con el cliente:
--   - Son 2 autónomos: David y Luis (Ethos NO es un tercero fiscal).
--   - FISCAL (lo que manda cada uno al gestor):
--       · David declara SOLO sus clientes individuales.
--       · Luis declara lo suyo + TODO lo de ETHOS (entrenos en grupo, los
--         Alex y los gastos del local), porque todo está a su nombre.
--         David no puede deducir un local que no es suyo.
--   - CUENTAS ENTRE SOCIOS (aparte de Hacienda): el neto de ETHOS se reparte
--     50/50 entre David y Luis. Eso lo da la vista v_cuentas_ethos.
-- =====================================================================

-- ---------- 1. Declaración fiscal por titular (david / luis) ----------
DROP VIEW IF EXISTS v_impuestos_declaracion;
CREATE VIEW v_impuestos_declaracion AS
WITH ing AS (
  SELECT EXTRACT(YEAR FROM fecha_emision)::INT    AS anyo,
         EXTRACT(QUARTER FROM fecha_emision)::INT AS trim,
         CASE WHEN atribucion = 'david' THEN 'david' ELSE 'luis' END AS titular,
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
         CASE WHEN g.imputado_a = 'david' THEN 'david' ELSE 'luis' END AS titular,
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
  ROUND(COALESCE(i.ingresos_base, 0), 2)          AS ingresos_base,
  ROUND(COALESCE(i.iva_repercutido, 0), 2)        AS iva_repercutido,
  ROUND(COALESCE(i.irpf_retenido_clientes, 0), 2) AS irpf_retenido_clientes,
  ROUND(COALESCE(g.gastos_base_deducible, 0), 2)  AS gastos_base_deducible,
  ROUND(COALESCE(g.iva_soportado, 0), 2)          AS iva_soportado,
  ROUND(COALESCE(g.irpf_retenciones, 0), 2)       AS irpf_retenciones,
  ROUND(COALESCE(i.iva_repercutido, 0) - COALESCE(g.iva_soportado, 0), 2)  AS iva_resultado,
  ROUND(COALESCE(i.ingresos_base, 0) - COALESCE(g.gastos_base_130, 0), 2)  AS beneficio
FROM ing i
FULL OUTER JOIN gas g ON g.anyo = i.anyo AND g.trim = i.trim AND g.titular = i.titular;

REVOKE ALL ON v_impuestos_declaracion FROM anon;

-- ---------- 2. Cuentas entre socios: neto de ETHOS (grupo + Alex + local) ----------
-- Base sin IVA (el IVA es un pase a Hacienda, no es margen a repartir).
DROP VIEW IF EXISTS v_cuentas_ethos;
CREATE VIEW v_cuentas_ethos AS
WITH ing AS (
  SELECT EXTRACT(YEAR FROM fecha_emision)::INT    AS anyo,
         EXTRACT(QUARTER FROM fecha_emision)::INT AS trim,
         SUM(base) AS ingresos
  FROM facturas
  WHERE atribucion IN ('ethos','alex_esteban','alex_guerrero')
  GROUP BY 1, 2
),
gas AS (
  SELECT EXTRACT(YEAR FROM fecha)::INT    AS anyo,
         EXTRACT(QUARTER FROM fecha)::INT AS trim,
         SUM(base) AS gastos
  FROM gastos
  WHERE imputado_a IN ('ethos','alex_esteban','alex_guerrero')
  GROUP BY 1, 2
)
SELECT
  COALESCE(i.anyo, g.anyo) AS anyo,
  COALESCE(i.trim, g.trim) AS trim,
  ROUND(COALESCE(i.ingresos, 0), 2) AS ingresos,
  ROUND(COALESCE(g.gastos, 0), 2)   AS gastos,
  ROUND(COALESCE(i.ingresos, 0) - COALESCE(g.gastos, 0), 2) AS neto
FROM ing i
FULL OUTER JOIN gas g ON g.anyo = i.anyo AND g.trim = i.trim;

REVOKE ALL ON v_cuentas_ethos FROM anon;
