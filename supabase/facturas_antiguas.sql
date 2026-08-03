-- =====================================================================
-- FACTURAS ANTIGUAS (correccion del historico del CRM):
-- cobros.afecta_caja = false -> el cobro cuenta para el "pagado" del
-- cliente (CRM, LTV) pero NO mueve el saldo de ninguna cuenta.
-- Combinado con computa_reparto=false y computa_impuestos=false en la
-- factura, la correccion no toca saldos, reparto ni impuestos.
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

ALTER TABLE cobros ADD COLUMN IF NOT EXISTS afecta_caja BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE VIEW v_saldo_cuentas AS
SELECT id, codigo, nombre, es_transito, saldo_inicial,
  saldo_inicial
  + COALESCE((SELECT sum(importe) FROM cobros WHERE cuenta_id = cu.id AND afecta_caja), 0)
  - COALESCE((SELECT sum(total - irpf_soportado) FROM gastos WHERE cuenta_id = cu.id), 0)
  + COALESCE((SELECT sum(importe) FROM traspasos WHERE cuenta_destino_id = cu.id), 0)
  - COALESCE((SELECT sum(importe) FROM traspasos WHERE cuenta_origen_id = cu.id), 0) AS saldo
FROM cuentas cu
WHERE activa;

ALTER VIEW v_saldo_cuentas SET (security_invoker = true);
SELECT json_agg(json_build_object('c', codigo, 's', saldo)) AS saldos FROM v_saldo_cuentas;
