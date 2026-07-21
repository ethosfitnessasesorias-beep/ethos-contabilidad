-- =====================================================================
-- CAJA LIBRE v2: el dinero usable NO cuenta lo cobrado a clientes en el
-- mes en curso. De ese dinero salen las nominas y los gastos del mes al
-- cerrarlo, asi que hasta entonces esta comprometido.
-- Se anade la columna cobrado_mes para ensenarlo en la UI.
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

CREATE OR REPLACE VIEW v_kpis AS
SELECT
  caja.total AS caja_total,
  imp.iva_pendiente,
  imp.irpf_pendiente,
  h.hucha_actual,
  caja.total - imp.iva_pendiente - imp.irpf_pendiente - h.hucha_actual - cm.cobrado_mes AS caja_libre,
  gf.gasto_fijo_mensual,
  CASE
    WHEN gf.gasto_fijo_mensual > 0
    THEN round((caja.total - imp.iva_pendiente - imp.irpf_pendiente - h.hucha_actual - cm.cobrado_mes) / gf.gasto_fijo_mensual, 1)
    ELSE NULL
  END AS runway_meses,
  CASE
    WHEN gf.gasto_fijo_mensual > 0 THEN round(mrr.mrr / gf.gasto_fijo_mensual, 2)
    ELSE NULL
  END AS cobertura_fijos,
  mrr.mrr,
  ef.pct_efectivo,
  cm.cobrado_mes
FROM (SELECT sum(saldo) AS total FROM v_saldo_cuentas) caja,
  v_impuestos_pendientes imp,
  v_hucha h,
  v_gasto_fijo_mensual gf,
  (SELECT COALESCE(sum(co.importe), 0) AS mrr
     FROM cobros co JOIN facturas f ON f.id = co.factura_id
    WHERE f.es_recurrente
      AND date_trunc('month', co.fecha) = date_trunc('month', CURRENT_DATE)) mrr,
  (SELECT CASE
       WHEN sum(importe) > 0
       THEN round(100.0 * sum(importe) FILTER (WHERE metodo = 'efectivo') / sum(importe), 1)
       ELSE NULL END AS pct_efectivo
     FROM cobros
    WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)) ef,
  (SELECT COALESCE(sum(co.importe), 0) AS cobrado_mes
     FROM cobros co JOIN facturas f ON f.id = co.factura_id
    WHERE f.computa_reparto
      AND date_trunc('month', co.fecha) = date_trunc('month', CURRENT_DATE)) cm;

ALTER VIEW v_kpis SET (security_invoker = true);
