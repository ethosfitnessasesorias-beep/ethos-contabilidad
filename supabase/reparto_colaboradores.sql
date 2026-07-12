-- =====================================================================
-- REPARTO DE COLABORADORES (Alex Esteban y Alex Guerrero)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Regla: los colaboradores no son socios. De su bruto cobrado SIN IVA:
--   70% para el colaborador, 30% para Ethos. Sin restar gastos.
-- Luis y David siguen con su 80/20 sobre balance (cobrado − gastos).
-- =====================================================================

INSERT INTO config (clave, valor, descripcion) VALUES
  ('reparto_colaborador',       0.70, 'Parte del bruto (sin IVA) cobrado que percibe el colaborador'),
  ('reparto_ethos_colaborador', 0.30, 'Parte del bruto (sin IVA) de colaboradores que se queda Ethos')
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE VIEW v_reparto_mensual AS
WITH params AS (
  SELECT
    (SELECT valor FROM config WHERE clave = 'reparto_entrenador')        AS pct_entrenador,
    (SELECT valor FROM config WHERE clave = 'reparto_hucha')             AS pct_hucha,
    (SELECT valor FROM config WHERE clave = 'reparto_colaborador')       AS pct_colaborador,
    (SELECT valor FROM config WHERE clave = 'reparto_ethos_colaborador') AS pct_ethos_colab
),
cash AS (
  SELECT mes, atribucion, cobrado FROM v_cash_collected_mensual
),
-- Bruto sin IVA: cada cobro se convierte a base imponible en proporción
-- a la factura a la que pertenece (sirve también para pagos parciales)
cash_sin_iva AS (
  SELECT
    DATE_TRUNC('month', co.fecha)::DATE AS mes,
    f.atribucion,
    SUM(CASE WHEN f.total > 0 THEN co.importe * f.base / f.total ELSE co.importe END) AS bruto
  FROM cobros co
  JOIN facturas f ON f.id = co.factura_id
  GROUP BY 1, 2
),
gasto_corriente AS (   -- gasto SIN inversión, imputado
  SELECT
    DATE_TRUNC('month', g.fecha)::DATE AS mes,
    g.imputado_a AS atribucion,
    SUM(g.total) AS gasto
  FROM gastos g
  JOIN categorias cat ON cat.id = g.categoria_id
  WHERE NOT cat.es_inversion
  GROUP BY 1, 2
)
SELECT
  c.mes,
  c.atribucion,
  c.cobrado,
  COALESCE(gc.gasto, 0) AS gasto,
  CASE WHEN c.atribucion IN ('alex_esteban', 'alex_guerrero')
       THEN ROUND(COALESCE(csi.bruto, 0), 2)
       ELSE c.cobrado - COALESCE(gc.gasto, 0)
  END AS balance,
  CASE WHEN c.atribucion IN ('alex_esteban', 'alex_guerrero')
       THEN ROUND(COALESCE(csi.bruto, 0) * p.pct_colaborador, 2)
       ELSE ROUND((c.cobrado - COALESCE(gc.gasto, 0)) * p.pct_entrenador, 2)
  END AS a_entrenador,
  CASE WHEN c.atribucion IN ('alex_esteban', 'alex_guerrero')
       THEN ROUND(COALESCE(csi.bruto, 0) * p.pct_ethos_colab, 2)
       ELSE ROUND((c.cobrado - COALESCE(gc.gasto, 0)) * p.pct_hucha, 2)
  END AS a_hucha
FROM cash c
CROSS JOIN params p
LEFT JOIN gasto_corriente gc ON gc.mes = c.mes AND gc.atribucion = c.atribucion
LEFT JOIN cash_sin_iva csi   ON csi.mes = c.mes AND csi.atribucion = c.atribucion;
