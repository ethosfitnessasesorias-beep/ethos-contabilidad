-- =====================================================================
-- MEJORAS v3: declaración fiscal real de 2 autónomos (David y Luis).
-- (Pendiente de aplicar vía Management API; queda como registro.)
--
-- Estructura acordada con el cliente:
--   - Son 2 autónomos: David y Luis (Ethos NO es un tercero fiscal).
--   - David declara SUS clientes; Luis declara LOS suyos.
--   - "ETHOS" = lo del centro (entrenos en grupo + los Alex, facturado a
--     nombre de Luis) y los gastos compartidos del local. TODO lo etiquetado
--     ethos/alex se reparte 50/50 entre David y Luis (ingresos y gastos).
--   Resultado: cada titular = lo propio (peso 1) + 50% de lo compartido.
-- =====================================================================

DROP VIEW IF EXISTS v_impuestos_declaracion;
CREATE VIEW v_impuestos_declaracion AS
WITH fmap AS (
  SELECT
    EXTRACT(YEAR FROM f.fecha_emision)::INT    AS anyo,
    EXTRACT(QUARTER FROM f.fecha_emision)::INT AS trim,
    m.titular, m.peso,
    f.base, f.iva_importe, f.irpf_importe
  FROM facturas f
  CROSS JOIN LATERAL (VALUES
    ('david', CASE WHEN f.atribucion = 'david' THEN 1.0
                   WHEN f.atribucion IN ('ethos','alex_esteban','alex_guerrero') THEN 0.5 ELSE 0 END),
    ('luis',  CASE WHEN f.atribucion = 'luis'  THEN 1.0
                   WHEN f.atribucion IN ('ethos','alex_esteban','alex_guerrero') THEN 0.5 ELSE 0 END)
  ) AS m(titular, peso)
  WHERE f.computa_impuestos AND m.peso > 0
),
ing AS (
  SELECT anyo, trim, titular,
    SUM(base * peso)         AS ingresos_base,
    SUM(iva_importe * peso)  AS iva_repercutido,
    SUM(irpf_importe * peso) AS irpf_retenido_clientes
  FROM fmap GROUP BY 1, 2, 3
),
gmap AS (
  SELECT
    EXTRACT(YEAR FROM g.fecha)::INT    AS anyo,
    EXTRACT(QUARTER FROM g.fecha)::INT AS trim,
    m.titular, m.peso,
    g.base, g.iva_soportado, g.irpf_soportado, c.es_inversion
  FROM gastos g
  JOIN categorias c ON c.id = g.categoria_id
  CROSS JOIN LATERAL (VALUES
    ('david', CASE WHEN g.imputado_a = 'david' THEN 1.0
                   WHEN g.imputado_a IN ('ethos','alex_esteban','alex_guerrero') THEN 0.5 ELSE 0 END),
    ('luis',  CASE WHEN g.imputado_a = 'luis'  THEN 1.0
                   WHEN g.imputado_a IN ('ethos','alex_esteban','alex_guerrero') THEN 0.5 ELSE 0 END)
  ) AS m(titular, peso)
  WHERE g.deducible AND m.peso > 0
),
gas AS (
  SELECT anyo, trim, titular,
    SUM(base * peso)          AS gastos_base_deducible,
    SUM(iva_soportado * peso) AS iva_soportado,
    SUM(irpf_soportado * peso) AS irpf_retenciones,
    SUM(base * peso) FILTER (WHERE NOT es_inversion) AS gastos_base_130
  FROM gmap GROUP BY 1, 2, 3
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
