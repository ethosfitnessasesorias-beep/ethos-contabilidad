-- =====================================================================
-- AJUSTE DE SALDOS INICIALES tras la migración del Excel (2026-07-12)
-- Ejecutar UNA VEZ en: Supabase Dashboard > SQL Editor
--
-- ⚠ IMPORTANTE: ejecutar ANTES de apuntar movimientos nuevos.
-- Los importes se calcularon comparando el panel con la realidad:
--   banco: real 4.804,49 − panel (−949,50) = +5.753,99
--   caja:  real   519,35 − panel   757,52  =   −238,17
-- Origen del descuadre: cuentas personales fundidas, traspasos sin
-- pareja, devoluciones no importadas y gastos de 2025 ausentes del
-- Excel (ver supabase/informe_importacion.md).
-- =====================================================================

-- Saldo inicial por cuenta (0 por defecto; solo la migración lo usa)
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE cuentas SET saldo_inicial = 5753.99 WHERE codigo = 'banco';
UPDATE cuentas SET saldo_inicial = -238.17 WHERE codigo = 'caja';

-- El saldo por cuenta ahora parte del saldo inicial
CREATE OR REPLACE VIEW v_saldo_cuentas AS
SELECT
  cu.id,
  cu.codigo,
  cu.nombre,
  cu.es_transito,
  cu.saldo_inicial
  + COALESCE((SELECT SUM(importe) FROM cobros    WHERE cuenta_id = cu.id), 0)
  - COALESCE((SELECT SUM(total)   FROM gastos    WHERE cuenta_id = cu.id), 0)
  + COALESCE((SELECT SUM(importe) FROM traspasos WHERE cuenta_destino_id = cu.id), 0)
  - COALESCE((SELECT SUM(importe) FROM traspasos WHERE cuenta_origen_id  = cu.id), 0)
    AS saldo
FROM cuentas cu
WHERE cu.activa;

-- Comprobación: banco debe decir 4804.49 y caja 519.35
SELECT codigo, saldo FROM v_saldo_cuentas ORDER BY id;
