-- =====================================================================
-- MEJORAS v4: reparto de beneficios (nómina) e inversión separada.
-- (Pendiente de aplicar vía Management API; queda como registro.)
--
-- Reparto mensual por socio (Luis / David), replicando la hoja
-- "Reparto beneficios" del Excel (fila 16). Por socio y mes:
--   Beneficio = (Cobrado propio + Cobrado ETHOS/2)
--             − (IVA a reservar + IRPF a reservar + Gasto SIN inversión) propio
--             − (IVA + IRPF + Gasto SIN inversión) de ETHOS / 2
--   Nómina = 80% del beneficio · A hucha = 20%.
--   ETHOS = lo del centro (atribucion/imputado_a en ethos + los dos Alex).
--   La INVERSIÓN no resta aquí: sale de la hucha (20% acumulado).
-- =====================================================================

DROP VIEW IF EXISTS v_reparto_beneficios;
CREATE VIEW v_reparto_beneficios AS
WITH
cob AS (  -- cash collected por mes y atribución
  SELECT date_trunc('month', co.fecha)::date AS mes, f.atribucion AS a, SUM(co.importe) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id GROUP BY 1, 2
),
ivarep AS (  -- IVA repercutido (facturas que computan)
  SELECT date_trunc('month', fecha_emision)::date AS mes, atribucion AS a, SUM(iva_importe) AS v
  FROM facturas WHERE computa_impuestos GROUP BY 1, 2
),
ivasop AS (  -- IVA soportado (gastos deducibles)
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, SUM(iva_soportado) AS v
  FROM gastos WHERE deducible GROUP BY 1, 2
),
irpfsop AS ( -- IRPF soportado (retenciones practicadas)
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, SUM(irpf_soportado) AS v
  FROM gastos WHERE deducible GROUP BY 1, 2
),
gsininv AS ( -- gasto total SIN inversión
  SELECT date_trunc('month', g.fecha)::date AS mes, g.imputado_a AS a, SUM(g.total) AS v
  FROM gastos g JOIN categorias c ON c.id = g.categoria_id
  WHERE NOT c.es_inversion GROUP BY 1, 2
),
ejes AS (
  SELECT mes, a FROM cob
  UNION SELECT mes, a FROM ivarep
  UNION SELECT mes, a FROM ivasop
  UNION SELECT mes, a FROM irpfsop
  UNION SELECT mes, a FROM gsininv
),
metric AS (
  SELECT e.mes, e.a,
    COALESCE(cob.v, 0) AS cobrado,
    GREATEST(0, COALESCE(ivarep.v, 0) - COALESCE(ivasop.v, 0)) AS iva_reservar,
    COALESCE(irpfsop.v, 0) AS irpf_reservar,
    COALESCE(gsininv.v, 0) AS gasto_sininv
  FROM ejes e
  LEFT JOIN cob     ON cob.mes = e.mes AND cob.a = e.a
  LEFT JOIN ivarep  ON ivarep.mes = e.mes AND ivarep.a = e.a
  LEFT JOIN ivasop  ON ivasop.mes = e.mes AND ivasop.a = e.a
  LEFT JOIN irpfsop ON irpfsop.mes = e.mes AND irpfsop.a = e.a
  LEFT JOIN gsininv ON gsininv.mes = e.mes AND gsininv.a = e.a
),
socio AS (
  SELECT mes, a AS socio, cobrado, iva_reservar, irpf_reservar, gasto_sininv
  FROM metric WHERE a IN ('luis', 'david')
),
eth AS (
  SELECT mes, SUM(cobrado) AS cobrado, SUM(iva_reservar) AS iva_reservar,
    SUM(irpf_reservar) AS irpf_reservar, SUM(gasto_sininv) AS gasto_sininv
  FROM metric WHERE a IN ('ethos', 'alex_esteban', 'alex_guerrero') GROUP BY mes
),
base AS (
  SELECT DISTINCT mm.mes, v.s AS socio
  FROM (SELECT mes FROM metric) mm
  CROSS JOIN (VALUES ('luis'), ('david')) v(s)
)
SELECT
  b.mes, b.socio,
  ROUND(COALESCE(s.cobrado, 0), 2)          AS cobrado_propio,
  ROUND(COALESCE(e.cobrado, 0) / 2, 2)      AS cobrado_ethos,
  ROUND(COALESCE(s.iva_reservar, 0), 2)     AS iva_propio,
  ROUND(COALESCE(e.iva_reservar, 0) / 2, 2) AS iva_ethos,
  ROUND(COALESCE(s.irpf_reservar, 0), 2)    AS irpf_propio,
  ROUND(COALESCE(e.irpf_reservar, 0) / 2, 2) AS irpf_ethos,
  ROUND(COALESCE(s.gasto_sininv, 0), 2)     AS gasto_propio,
  ROUND(COALESCE(e.gasto_sininv, 0) / 2, 2) AS gasto_ethos,
  ROUND(
    (COALESCE(s.cobrado, 0) + COALESCE(e.cobrado, 0) / 2)
    - (COALESCE(s.iva_reservar, 0) + COALESCE(s.irpf_reservar, 0) + COALESCE(s.gasto_sininv, 0))
    - (COALESCE(e.iva_reservar, 0) + COALESCE(e.irpf_reservar, 0) + COALESCE(e.gasto_sininv, 0)) / 2
  , 2) AS beneficio
FROM base b
LEFT JOIN socio s ON s.mes = b.mes AND s.socio = b.socio
LEFT JOIN eth e ON e.mes = b.mes
WHERE COALESCE(s.cobrado, 0) + COALESCE(s.gasto_sininv, 0) + COALESCE(e.cobrado, 0) + COALESCE(e.gasto_sininv, 0) <> 0;

REVOKE ALL ON v_reparto_beneficios FROM anon;

-- Inversión por mes (para separarla del balance corriente y de la nómina)
DROP VIEW IF EXISTS v_inversion_mensual;
CREATE VIEW v_inversion_mensual AS
SELECT date_trunc('month', g.fecha)::date AS mes, ROUND(SUM(g.total), 2) AS inversion
FROM gastos g JOIN categorias c ON c.id = g.categoria_id
WHERE c.es_inversion GROUP BY 1;

REVOKE ALL ON v_inversion_mensual FROM anon;
