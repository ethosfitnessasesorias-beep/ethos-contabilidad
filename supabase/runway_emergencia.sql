-- El RUNWAY ahora cuenta todo el dinero disponible como fondo de emergencia,
-- INCLUIDA la hucha (el "no tocar" es para asegurar nóminas, pero en una
-- emergencia sirve de colchón). Solo se excluyen los impuestos pendientes,
-- que no son dinero vuestro (van a Hacienda). "caja_libre" (dinero usable del
-- día a día) sigue excluyendo la hucha; el cambio es solo en runway_meses.
-- Antes: runway = caja_libre / gasto_fijo  (restaba hucha y cobrado_mes).
-- Ahora: runway = (caja_total − IVA pend − IRPF pend) / gasto_fijo.
-- Reaplica el CREATE OR REPLACE VIEW v_kpis con esa única diferencia.
SELECT 'ver app: v_kpis.runway_meses = (caja_total - iva_pend - irpf_pend) / gasto_fijo_mensual' AS nota;
