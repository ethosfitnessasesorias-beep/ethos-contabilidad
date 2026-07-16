-- =====================================================================
-- MEJORAS v6: reparto — IVA realista + pagos a colaboradores/empleados.
-- (Pendiente de aplicar vía Management API; queda como registro.)
--
-- Cambios sobre v_reparto_beneficios (v5):
--   - El IVA a reservar usa el IVA soportado de TODOS los gastos
--     (base*iva_pct), no solo los marcados deducibles. Muchos gastos
--     históricos se importaron sin el flag "con factura", lo que hacía
--     reservar IVA de más y salían nóminas bajas / meses en pérdidas.
--     Con esto, si el IVA a pagar sale 0 o negativo, NO resta (GREATEST 0).
-- Nueva vista v_pagos_colaboradores: lo que hay que pagar a los Alex
--   (y futuros empleados) = su % de la base cobrada; el resto va a Ethos.
-- =====================================================================

DROP VIEW IF EXISTS v_reparto_beneficios;
CREATE VIEW v_reparto_beneficios AS
WITH
scob AS (
  SELECT date_trunc('month', co.fecha)::date AS mes, f.atribucion AS a, SUM(co.importe) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id
  WHERE f.atribucion IN ('luis', 'david') GROUP BY 1, 2
),
sivarep AS (
  SELECT date_trunc('month', fecha_emision)::date AS mes, atribucion AS a, SUM(iva_importe) AS v
  FROM facturas WHERE computa_impuestos AND atribucion IN ('luis', 'david') GROUP BY 1, 2
),
-- IVA soportado de TODOS los gastos (se reclama el IVA con factura)
sivasop AS (
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, SUM(ROUND(base * iva_pct, 2)) AS v
  FROM gastos WHERE imputado_a IN ('luis', 'david') GROUP BY 1, 2
),
sirpf AS (
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, SUM(irpf_soportado) AS v
  FROM gastos WHERE imputado_a IN ('luis', 'david') GROUP BY 1, 2
),
sgasto AS (
  SELECT date_trunc('month', g.fecha)::date AS mes, g.imputado_a AS a, SUM(g.total) AS v
  FROM gastos g JOIN categorias c ON c.id = g.categoria_id
  WHERE NOT c.es_inversion AND c.nombre NOT ILIKE '%mina%' AND g.imputado_a IN ('luis', 'david')
  GROUP BY 1, 2
),
ecob AS (
  SELECT date_trunc('month', co.fecha)::date AS mes,
    SUM(CASE WHEN f.atribucion = 'ethos' THEN co.importe
             ELSE 0.30 * co.importe * f.base / NULLIF(f.total, 0) END) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id
  WHERE f.atribucion IN ('ethos', 'alex_esteban', 'alex_guerrero') GROUP BY 1
),
eivarep AS (
  SELECT date_trunc('month', fecha_emision)::date AS mes, SUM(iva_importe) AS v
  FROM facturas WHERE computa_impuestos AND atribucion = 'ethos' GROUP BY 1
),
eivasop AS (
  SELECT date_trunc('month', fecha)::date AS mes, SUM(ROUND(base * iva_pct, 2)) AS v
  FROM gastos WHERE imputado_a = 'ethos' GROUP BY 1
),
eirpf AS (
  SELECT date_trunc('month', fecha)::date AS mes, SUM(irpf_soportado) AS v
  FROM gastos WHERE imputado_a = 'ethos' GROUP BY 1
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

-- ---------- Pagos a colaboradores / empleados ----------
-- Los Alex son colaboradores: se llevan su % (0.70) de la BASE cobrada;
-- el resto (0.30) es para Ethos. Futuros empleados salen aquí al añadirlos
-- a "personas" con tipo colaborador/empleado.
DROP VIEW IF EXISTS v_pagos_colaboradores;
CREATE VIEW v_pagos_colaboradores AS
SELECT
  date_trunc('month', co.fecha)::date AS mes,
  f.atribucion AS colaborador,
  p.nombre,
  p.pct,
  ROUND(SUM(co.importe * f.base / NULLIF(f.total, 0)), 2)            AS base_cobrada,
  ROUND(SUM(co.importe * f.base / NULLIF(f.total, 0)) * p.pct, 2)    AS a_pagar,
  ROUND(SUM(co.importe * f.base / NULLIF(f.total, 0)) * (1 - p.pct), 2) AS a_ethos
FROM cobros co
JOIN facturas f ON f.id = co.factura_id
JOIN personas p ON p.codigo = f.atribucion
WHERE p.tipo IN ('colaborador', 'empleado')
GROUP BY 1, 2, p.nombre, p.pct;

REVOKE ALL ON v_pagos_colaboradores FROM anon;
