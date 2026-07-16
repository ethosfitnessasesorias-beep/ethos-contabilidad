-- =====================================================================
-- MEJORAS v7: las nóminas NO son un gasto fijo (son reparto de beneficio).
-- (Pendiente de aplicar vía Management API; queda como registro.)
--
-- La nómina depende del beneficio de cada mes; no es un coste ineludible.
-- Por eso NO debe contar como gasto fijo (runway) ni sugerirse como
-- recurrente en Tesorería.
-- =====================================================================

-- La categoría de nóminas deja de ser "fija": así sale del runway y de las
-- sugerencias de tesorería (ambos miran categorias.es_fijo).
UPDATE categorias SET es_fijo = FALSE WHERE nombre ILIKE '%mina%';

-- Runway: gasto fijo mensual SIN nóminas (media de 3 meses).
CREATE OR REPLACE VIEW v_gasto_fijo_mensual AS
SELECT COALESCE(SUM(g.total) / 3.0, 0)::numeric AS gasto_fijo_mensual
FROM gastos g
JOIN categorias cat ON cat.id = g.categoria_id
WHERE COALESCE(g.es_fijo, cat.es_fijo)
  AND cat.nombre NOT ILIKE '%mina%'
  AND g.fecha >= (CURRENT_DATE - '3 mons'::interval);
