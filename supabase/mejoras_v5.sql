-- =====================================================================
-- MEJORAS v5: corrección del reparto de beneficios.
-- (Pendiente de aplicar vía Management API; queda como registro.)
--
-- Dos correcciones sobre v_reparto_beneficios (mejoras_v4):
--   1. El GASTO del reparto NO incluye las nóminas (son el resultado del
--      reparto, no un gasto de la actividad). Se excluyen las categorías
--      de nóminas (y ya se excluía la inversión).
--   2. Los ALEX (colaboradores) aportan a ETHOS solo el 30% de su BASE
--      imponible (nos llevamos el 30% de cada uno); el 70% es suyo y no
--      entra en el reparto de los socios. Los ingresos 'ethos' (grupales)
--      entran al 100%.
-- =====================================================================

DROP VIEW IF EXISTS v_reparto_beneficios;
CREATE VIEW v_reparto_beneficios AS
WITH
-- ---- Socios (Luis / David): sus clientes individuales ----
scob AS (
  SELECT date_trunc('month', co.fecha)::date AS mes, f.atribucion AS a, SUM(co.importe) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id
  WHERE f.atribucion IN ('luis', 'david') GROUP BY 1, 2
),
sivarep AS (
  SELECT date_trunc('month', fecha_emision)::date AS mes, atribucion AS a, SUM(iva_importe) AS v
  FROM facturas WHERE computa_impuestos AND atribucion IN ('luis', 'david') GROUP BY 1, 2
),
sivasop AS (
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, SUM(iva_soportado) AS v
  FROM gastos WHERE deducible AND imputado_a IN ('luis', 'david') GROUP BY 1, 2
),
sirpf AS (
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, SUM(irpf_soportado) AS v
  FROM gastos WHERE deducible AND imputado_a IN ('luis', 'david') GROUP BY 1, 2
),
sgasto AS (
  SELECT date_trunc('month', g.fecha)::date AS mes, g.imputado_a AS a, SUM(g.total) AS v
  FROM gastos g JOIN categorias c ON c.id = g.categoria_id
  WHERE NOT c.es_inversion AND c.nombre NOT ILIKE '%mina%' AND g.imputado_a IN ('luis', 'david')
  GROUP BY 1, 2
),
-- ---- ETHOS (centro): grupales al 100% + 30% de la base de los Alex ----
ecob AS (
  SELECT date_trunc('month', co.fecha)::date AS mes,
    SUM(CASE
          WHEN f.atribucion = 'ethos' THEN co.importe
          ELSE 0.30 * co.importe * f.base / NULLIF(f.total, 0)  -- 30% de la base de los Alex
        END) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id
  WHERE f.atribucion IN ('ethos', 'alex_esteban', 'alex_guerrero') GROUP BY 1
),
eivarep AS (
  SELECT date_trunc('month', fecha_emision)::date AS mes, SUM(iva_importe) AS v
  FROM facturas WHERE computa_impuestos AND atribucion = 'ethos' GROUP BY 1
),
eivasop AS (
  SELECT date_trunc('month', fecha)::date AS mes, SUM(iva_soportado) AS v
  FROM gastos WHERE deducible AND imputado_a = 'ethos' GROUP BY 1
),
eirpf AS (
  SELECT date_trunc('month', fecha)::date AS mes, SUM(irpf_soportado) AS v
  FROM gastos WHERE deducible AND imputado_a = 'ethos' GROUP BY 1
),
egasto AS (
  SELECT date_trunc('month', g.fecha)::date AS mes, SUM(g.total) AS v
  FROM gastos g JOIN categorias c ON c.id = g.categoria_id
  WHERE NOT c.es_inversion AND c.nombre NOT ILIKE '%mina%' AND g.imputado_a = 'ethos'
  GROUP BY 1
),
meses AS (
  SELECT DISTINCT mes FROM (
    SELECT mes FROM scob UNION SELECT mes FROM ecob
    UNION SELECT mes FROM sgasto UNION SELECT mes FROM egasto
  ) z
),
base AS (
  SELECT m.mes, v.s AS socio FROM meses m CROSS JOIN (VALUES ('luis'), ('david')) v(s)
)
SELECT
  b.mes, b.socio,
  ROUND(COALESCE(sc.v, 0), 2)     AS cobrado_propio,
  ROUND(COALESCE(ec.v, 0) / 2, 2) AS cobrado_ethos,
  ROUND(GREATEST(0, COALESCE(sir.v, 0) - COALESCE(sis.v, 0)), 2)       AS iva_propio,
  ROUND(GREATEST(0, COALESCE(eir.v, 0) - COALESCE(eis.v, 0)) / 2, 2)   AS iva_ethos,
  ROUND(COALESCE(sr.v, 0), 2)     AS irpf_propio,
  ROUND(COALESCE(erp.v, 0) / 2, 2) AS irpf_ethos,
  ROUND(COALESCE(sg.v, 0), 2)     AS gasto_propio,
  ROUND(COALESCE(eg.v, 0) / 2, 2) AS gasto_ethos,
  ROUND(
    (COALESCE(sc.v, 0) + COALESCE(ec.v, 0) / 2)
    - (GREATEST(0, COALESCE(sir.v, 0) - COALESCE(sis.v, 0)) + COALESCE(sr.v, 0) + COALESCE(sg.v, 0))
    - (GREATEST(0, COALESCE(eir.v, 0) - COALESCE(eis.v, 0)) + COALESCE(erp.v, 0) + COALESCE(eg.v, 0)) / 2
  , 2) AS beneficio
FROM base b
LEFT JOIN scob    sc  ON sc.mes = b.mes AND sc.a = b.socio
LEFT JOIN ecob    ec  ON ec.mes = b.mes
LEFT JOIN sivarep sir ON sir.mes = b.mes AND sir.a = b.socio
LEFT JOIN sivasop sis ON sis.mes = b.mes AND sis.a = b.socio
LEFT JOIN sirpf   sr  ON sr.mes = b.mes AND sr.a = b.socio
LEFT JOIN sgasto  sg  ON sg.mes = b.mes AND sg.a = b.socio
LEFT JOIN eivarep eir ON eir.mes = b.mes
LEFT JOIN eivasop eis ON eis.mes = b.mes
LEFT JOIN eirpf   erp ON erp.mes = b.mes
LEFT JOIN egasto  eg  ON eg.mes = b.mes
WHERE COALESCE(sc.v, 0) + COALESCE(sg.v, 0) + COALESCE(ec.v, 0) + COALESCE(eg.v, 0) <> 0;

REVOKE ALL ON v_reparto_beneficios FROM anon;
