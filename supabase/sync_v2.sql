BEGIN;

-- Aguas julio: 6,00 -> 5,00 (el euro de Ana se movio a agosto en el Excel)
UPDATE facturas SET base = (5::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 178;
UPDATE cobros SET importe = 5 WHERE factura_id = 178;

-- Parche de caja del Excel: ingreso real sin identificar (283 en efectivo)
WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-08-08',
          'Cuadre de caja: ingreso sin identificar', (283::numeric / 1.21), 0.21, 0, 'presencial', true, true, false,
          'Sobrante real del arqueo de caja (283 + 10,80 ya apuntado en julio). Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-08-08', 283, 2, 'efectivo', true FROM f;

-- Aguas agosto: Ana 1,00 en efectivo
WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1), 'ethos', '2026-08-31',
          'AGUAS AGOSTO EFECTIVO', (1::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'ANA · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-08-31', 1, 2, 'efectivo', true FROM f;

-- Duplicados en la app (ya existian importados del Excel de julio):
--  G#952 Wifi 44,95 (= Orange julio) · G#953/954 Autonomos 88,56x2 (= Autonomos 177,12)
--  G#910 comisiones agosto 0,44 (obsoleta: vosotros la actualizasteis a 52,35 en la app)
DELETE FROM gastos WHERE id IN (952, 953, 954, 910);

-- Borradores vacios de pruebas del editor
DELETE FROM factura_lineas WHERE factura_id IN (213, 240, 241);
DELETE FROM cobros WHERE factura_id IN (213, 240, 241);
DELETE FROM facturas WHERE id IN (213, 240, 241);

COMMIT;

-- Re-anclar saldos a los del Excel v2: banco 6527,48 / caja 1528,10 / stripe 0 / tpv 0
DO $$
DECLARE v RECORD; objetivo NUMERIC; delta NUMERIC;
BEGIN
  FOR v IN SELECT * FROM v_saldo_cuentas WHERE codigo IN ('banco','caja','stripe','tpv') LOOP
    objetivo := CASE v.codigo WHEN 'banco' THEN 6527.48 WHEN 'caja' THEN 1528.10 ELSE 0.00 END;
    delta := objetivo - v.saldo;
    IF abs(delta) > 0.001 THEN
      UPDATE cuentas SET saldo_inicial = saldo_inicial + delta WHERE id = v.id;
    END IF;
  END LOOP;
END $$;

SELECT json_build_object(
 'saldos', (SELECT json_agg(json_build_object('c', codigo, 's', saldo)) FROM v_saldo_cuentas),
 'usable', (SELECT k.caja_libre FROM v_kpis k),
 'ago_ing', (SELECT round(sum(total)::numeric, 2) FROM facturas WHERE computa_reparto AND fecha_emision >= '2026-08-01'),
 'ago_gas', (SELECT round(sum(g.total)::numeric, 2) FROM gastos g WHERE g.categoria_id <> 1 AND g.fecha >= '2026-08-01')
) AS r;
