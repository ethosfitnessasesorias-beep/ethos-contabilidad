-- Simplificacion: fuera el sistema de cuotas/remesas de la app.
-- La remesa de agosto nunca se aprobo y sus facturas (sin cobros) duplican
-- la facturacion que ya se apunto a mano como "domiciliados agosto".
BEGIN;

WITH rem AS (SELECT id FROM remesas WHERE mes = '2026-08-01' AND estado = 'pendiente'),
     facs AS (
       SELECT rl.factura_id FROM remesa_lineas rl JOIN rem ON rl.remesa_id = rem.id
       WHERE NOT EXISTS (SELECT 1 FROM cobros co WHERE co.factura_id = rl.factura_id)
     )
DELETE FROM remesa_lineas WHERE remesa_id IN (SELECT id FROM rem);

DELETE FROM factura_lineas WHERE factura_id IN (
  SELECT f.id FROM facturas f
  WHERE f.es_recurrente AND f.fecha_emision = '2026-08-01'
    AND f.concepto LIKE 'Cuota %08/2026'
    AND NOT EXISTS (SELECT 1 FROM cobros co WHERE co.factura_id = f.id)
);

DELETE FROM facturas f
WHERE f.es_recurrente AND f.fecha_emision = '2026-08-01'
  AND f.concepto LIKE 'Cuota %08/2026'
  AND NOT EXISTS (SELECT 1 FROM cobros co WHERE co.factura_id = f.id);

DELETE FROM remesas WHERE mes = '2026-08-01' AND estado = 'pendiente';

COMMIT;

SELECT json_build_object(
  'facturas_agosto', (SELECT round(sum(total)::numeric, 2) FROM facturas WHERE computa_reparto AND fecha_emision >= '2026-08-01'),
  'remesas_pendientes', (SELECT count(*) FROM remesas WHERE estado = 'pendiente'),
  'saldos', (SELECT json_agg(json_build_object('c', codigo, 's', saldo)) FROM v_saldo_cuentas)
) AS r;
