BEGIN;

-- 7b) Fuera los 14 gastos fijos clonados a agosto por el boton "Apuntar fijos"
-- (solo prestamo y seguro estan pagados de verdad; esos se conservan)
DELETE FROM gastos WHERE id BETWEEN 925 AND 938;

-- 5/6) Facturacion online real de julio: Kinverly 110 + Julia Bascunana 180 +
-- Julia de Marco 80 pasan a online -> online jul = 2632,80 y gym el resto
UPDATE facturas SET canal = 'online' WHERE id IN (164, 237, 238);

-- 1) Reparto: importe REALMENTE cobrado (puede diferir del 80% teorico)
ALTER TABLE reparto_pagos ADD COLUMN IF NOT EXISTS importe numeric;
UPDATE reparto_pagos SET importe = 1466.78 WHERE mes = '2026-07-01' AND persona = 'luis';
UPDATE reparto_pagos SET importe = 1493.34 WHERE mes = '2026-07-01' AND persona = 'david';
INSERT INTO reparto_pagos (mes, persona, importe)
SELECT '2026-07-01', 'alex_esteban', 38.50
WHERE NOT EXISTS (SELECT 1 FROM reparto_pagos WHERE mes = '2026-07-01' AND persona = 'alex_esteban');
INSERT INTO reparto_pagos (mes, persona, importe)
SELECT '2026-07-01', 'alex_guerrero', 166.00
WHERE NOT EXISTS (SELECT 1 FROM reparto_pagos WHERE mes = '2026-07-01' AND persona = 'alex_guerrero');

COMMIT;

-- 3) Hucha real = -6,28: recalcular el ajuste sobre los datos ya corregidos
DO $$
DECLARE v_desde date; v_aporte numeric; v_inv numeric; v_ajuste numeric;
BEGIN
  SELECT COALESCE((SELECT valor::date FROM config_texto WHERE clave = 'hucha_desde'), '2026-03-01') INTO v_desde;
  SELECT COALESCE(sum(GREATEST(0, beneficio) * 0.2), 0) INTO v_aporte FROM v_reparto_beneficios WHERE mes >= v_desde;
  SELECT COALESCE(sum(inversion), 0) INTO v_inv FROM v_inversion_mensual WHERE mes >= v_desde;
  v_ajuste := -6.28 - (v_aporte - v_inv);
  UPDATE config SET valor = v_ajuste WHERE clave = 'hucha_ajuste';
END $$;

-- 4) Re-anclar saldos a los del Excel tras los borrados
DO $$
DECLARE v RECORD; objetivo NUMERIC; delta NUMERIC;
BEGIN
  FOR v IN SELECT * FROM v_saldo_cuentas WHERE codigo IN ('banco','caja','stripe','tpv') LOOP
    objetivo := CASE v.codigo WHEN 'banco' THEN 3879.12 WHEN 'caja' THEN 370.00 ELSE 0.00 END;
    delta := objetivo - v.saldo;
    IF abs(delta) > 0.001 THEN
      UPDATE cuentas SET saldo_inicial = saldo_inicial + delta WHERE id = v.id;
    END IF;
  END LOOP;
END $$;

SELECT json_build_object(
 'saldos', (SELECT json_agg(json_build_object('c', codigo, 's', saldo)) FROM v_saldo_cuentas),
 'hucha_ajuste', (SELECT valor FROM config WHERE clave = 'hucha_ajuste'),
 'kpis_hucha', (SELECT k.hucha_actual FROM v_kpis k),
 'kpis_usable', (SELECT k.caja_libre FROM v_kpis k),
 'online_jul', (SELECT round(sum(total)::numeric, 2) FROM facturas WHERE computa_reparto AND canal = 'online' AND fecha_emision >= '2026-07-01' AND fecha_emision < '2026-08-01'),
 'total_jul', (SELECT round(sum(total)::numeric, 2) FROM facturas WHERE computa_reparto AND fecha_emision >= '2026-07-01' AND fecha_emision < '2026-08-01'),
 'gastos_ago', (SELECT json_agg(json_build_object('c', g.concepto, 't', g.total) ORDER BY g.id) FROM gastos g WHERE g.fecha >= '2026-08-01' AND g.categoria_id <> 1),
 'bajas_jul', (SELECT json_agg(json_build_object('n', nombre || ' ' || coalesce(apellidos, ''), 'canal', canal) ORDER BY nombre) FROM clientes WHERE fecha_baja >= '2026-07-01' AND fecha_baja < '2026-08-01')
) AS r;
