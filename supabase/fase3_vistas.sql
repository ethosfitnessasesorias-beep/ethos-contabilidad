-- =====================================================================
-- FASE 3 — Vista adicional para el flujo de caja mensual
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- Entradas (cobros) y salidas (gastos) por mes. Los traspasos no aparecen:
-- mueven dinero entre cuentas propias, no cambian la caja total.
CREATE OR REPLACE VIEW v_flujo_mensual AS
WITH entradas AS (
  SELECT DATE_TRUNC('month', fecha)::DATE AS mes, SUM(importe) AS entradas
  FROM cobros GROUP BY 1
),
salidas AS (
  SELECT DATE_TRUNC('month', fecha)::DATE AS mes, SUM(total) AS salidas
  FROM gastos GROUP BY 1
)
SELECT
  COALESCE(e.mes, s.mes)                                  AS mes,
  COALESCE(e.entradas, 0)                                 AS entradas,
  COALESCE(s.salidas, 0)                                  AS salidas,
  COALESCE(e.entradas, 0) - COALESCE(s.salidas, 0)        AS neto
FROM entradas e
FULL JOIN salidas s ON s.mes = e.mes
ORDER BY 1;

-- La clave pública sin login tampoco puede leer esta vista
REVOKE ALL ON v_flujo_mensual FROM anon;
