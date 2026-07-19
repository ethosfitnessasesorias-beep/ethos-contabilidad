-- =====================================================================
-- REPARTO v2:
--  1) facturas.computa_reparto - las aportaciones de capital (p. ej.
--     GARANTIA JUVENIL, dinero que puso Luis para igualar aportaciones)
--     NO son ingreso del negocio y no deben inflar el beneficio.
--  2) v_reparto_beneficios filtra por computa_reparto.
--  3) reparto_pagos - tick de PAGADO por mes y persona (sin tocar el libro).
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS computa_reparto BOOLEAN NOT NULL DEFAULT TRUE;

-- GARANTIA JUVENIL: aportacion de capital, fuera del reparto
UPDATE facturas SET computa_reparto = FALSE WHERE concepto ILIKE '%garantia juvenil%';

CREATE OR REPLACE VIEW v_reparto_beneficios AS
WITH scob AS (
  SELECT date_trunc('month', co.fecha)::date AS mes, f.atribucion AS a, sum(co.importe) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id
  WHERE f.atribucion IN ('luis','david') AND f.computa_reparto
  GROUP BY 1, 2
), sivarep AS (
  SELECT date_trunc('month', fecha_emision)::date AS mes, atribucion AS a, sum(iva_importe) AS v
  FROM facturas WHERE computa_impuestos AND atribucion IN ('luis','david')
  GROUP BY 1, 2
), sivasop AS (
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, sum(iva_soportado) AS v
  FROM gastos WHERE deducible AND imputado_a IN ('luis','david')
  GROUP BY 1, 2
), sirpf AS (
  SELECT date_trunc('month', fecha)::date AS mes, imputado_a AS a, sum(irpf_soportado) AS v
  FROM gastos WHERE imputado_a IN ('luis','david')
  GROUP BY 1, 2
), sgasto AS (
  SELECT date_trunc('month', g.fecha)::date AS mes, g.imputado_a AS a, sum(g.total) AS v
  FROM gastos g JOIN categorias c ON c.id = g.categoria_id
  WHERE NOT c.es_inversion AND c.nombre NOT ILIKE '%mina%' AND g.imputado_a IN ('luis','david')
  GROUP BY 1, 2
), ecob AS (
  SELECT date_trunc('month', co.fecha)::date AS mes,
    sum(CASE WHEN f.atribucion = 'ethos' THEN co.importe
             ELSE 0.30 * co.importe * f.base / NULLIF(f.total, 0) END) AS v
  FROM cobros co JOIN facturas f ON f.id = co.factura_id
  WHERE f.atribucion IN ('ethos','alex_esteban','alex_guerrero') AND f.computa_reparto
  GROUP BY 1
), eivarep AS (
  SELECT date_trunc('month', fecha_emision)::date AS mes, sum(iva_importe) AS v
  FROM facturas WHERE computa_impuestos AND atribucion = 'ethos'
  GROUP BY 1
), eivasop AS (
  SELECT date_trunc('month', fecha)::date AS mes, sum(iva_soportado) AS v
  FROM gastos WHERE deducible AND imputado_a = 'ethos'
  GROUP BY 1
), eirpf AS (
  SELECT date_trunc('month', fecha)::date AS mes, sum(irpf_soportado) AS v
  FROM gastos WHERE imputado_a = 'ethos'
  GROUP BY 1
), egasto AS (
  SELECT date_trunc('month', g.fecha)::date AS mes, sum(g.total) AS v
  FROM gastos g JOIN categorias c ON c.id = g.categoria_id
  WHERE NOT c.es_inversion AND c.nombre NOT ILIKE '%mina%' AND g.imputado_a = 'ethos'
  GROUP BY 1
), meses AS (
  SELECT DISTINCT z.mes FROM (
    SELECT mes FROM scob UNION SELECT mes FROM ecob
    UNION SELECT mes FROM sgasto UNION SELECT mes FROM egasto) z
), base AS (
  SELECT m.mes, v.s AS socio FROM meses m CROSS JOIN (VALUES ('luis'), ('david')) v(s)
)
SELECT b.mes, b.socio,
  round(COALESCE(sc.v, 0), 2) AS cobrado_propio,
  round(COALESCE(ec.v, 0) / 2, 2) AS cobrado_ethos,
  round(GREATEST(0, COALESCE(sir.v, 0) - COALESCE(sis.v, 0)), 2) AS iva_propio,
  round(GREATEST(0, COALESCE(eir.v, 0) - COALESCE(eis.v, 0)) / 2, 2) AS iva_ethos,
  round(COALESCE(sr.v, 0), 2) AS irpf_propio,
  round(COALESCE(erp.v, 0) / 2, 2) AS irpf_ethos,
  round(COALESCE(sg.v, 0), 2) AS gasto_propio,
  round(COALESCE(eg.v, 0) / 2, 2) AS gasto_ethos,
  round(COALESCE(sc.v, 0) + COALESCE(ec.v, 0) / 2
    - (GREATEST(0, COALESCE(sir.v, 0) - COALESCE(sis.v, 0)) + COALESCE(sr.v, 0) + COALESCE(sg.v, 0))
    - (GREATEST(0, COALESCE(eir.v, 0) - COALESCE(eis.v, 0)) + COALESCE(erp.v, 0) + COALESCE(eg.v, 0)) / 2, 2) AS beneficio
FROM base b
  LEFT JOIN scob sc ON sc.mes = b.mes AND sc.a = b.socio
  LEFT JOIN ecob ec ON ec.mes = b.mes
  LEFT JOIN sivarep sir ON sir.mes = b.mes AND sir.a = b.socio
  LEFT JOIN sivasop sis ON sis.mes = b.mes AND sis.a = b.socio
  LEFT JOIN sirpf sr ON sr.mes = b.mes AND sr.a = b.socio
  LEFT JOIN sgasto sg ON sg.mes = b.mes AND sg.a = b.socio
  LEFT JOIN eivarep eir ON eir.mes = b.mes
  LEFT JOIN eivasop eis ON eis.mes = b.mes
  LEFT JOIN eirpf erp ON erp.mes = b.mes
  LEFT JOIN egasto eg ON eg.mes = b.mes
WHERE (COALESCE(sc.v, 0) + COALESCE(sg.v, 0) + COALESCE(ec.v, 0) + COALESCE(eg.v, 0)) <> 0;

ALTER VIEW v_reparto_beneficios SET (security_invoker = true);

-- Tick de PAGADO por mes y persona (no escribe en el libro)
CREATE TABLE IF NOT EXISTS reparto_pagos (
  mes        DATE NOT NULL,
  persona    TEXT NOT NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (mes, persona)
);
ALTER TABLE reparto_pagos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON reparto_pagos;
CREATE POLICY acceso_autenticados ON reparto_pagos FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON reparto_pagos TO authenticated;
REVOKE ALL ON reparto_pagos FROM anon;

-- Semilla: lo que ya estaba apuntado como nomina/pago en el libro cuenta como pagado
INSERT INTO reparto_pagos (mes, persona)
SELECT DISTINCT date_trunc('month', g.fecha)::date,
  CASE WHEN g.imputado_a IN ('alex_esteban','alex_guerrero') THEN g.imputado_a
       WHEN g.concepto ~* 'luis' THEN 'luis'
       WHEN g.concepto ~* 'david' THEN 'david' END
FROM gastos g JOIN categorias c ON c.id = g.categoria_id
WHERE c.nombre ILIKE '%mina%'
  AND (g.imputado_a IN ('alex_esteban','alex_guerrero') OR g.concepto ~* 'luis|david')
ON CONFLICT DO NOTHING;
