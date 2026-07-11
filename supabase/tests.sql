-- =====================================================================
-- TESTS de los cálculos críticos (reparto, caja libre, deuda por cliente)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Crea datos de prueba en enero de 2099, comprueba que las vistas
-- calculan lo esperado y DESHACE TODO al final (ROLLBACK).
-- Si algo está mal, verás un error rojo "TEST ... FALLA".
-- Si todo está bien, verás: "TODOS LOS TESTS PASAN".
-- =====================================================================

BEGIN;

DO $$
DECLARE
  v_cliente      INT;
  v_factura      INT;
  v_banco        SMALLINT;
  v_cat_ingreso  SMALLINT;
  v_cat_gasto    SMALLINT;
  v_caja_antes   NUMERIC;
  v_caja_despues NUMERIC;
  v_pendiente    NUMERIC;
  v_balance      NUMERIC;
  v_entrenador   NUMERIC;
  v_hucha        NUMERIC;
BEGIN
  SELECT id INTO v_banco       FROM cuentas    WHERE codigo = 'banco';
  SELECT id INTO v_cat_ingreso FROM categorias WHERE grupo = 'Ingreso'   AND nombre = 'Otros';
  SELECT id INTO v_cat_gasto   FROM categorias WHERE grupo = 'Operativo' AND nombre = 'Consumibles';

  -- Foto de la caja libre ANTES de tocar nada
  SELECT caja_libre INTO v_caja_antes FROM v_kpis;

  -- ------------------------------------------------------------------
  -- Datos de prueba: factura de 100 € + 21% IVA = 121 €, cobrada solo
  -- en parte (21 €), y un gasto de 10 € imputado a David.
  -- ------------------------------------------------------------------
  INSERT INTO clientes (nombre, entrenador)
    VALUES ('_TEST cliente', 'david') RETURNING id INTO v_cliente;

  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct)
    VALUES (v_cliente, v_cat_ingreso, 'david', DATE '2099-01-15', '_TEST factura', 100, 0.21, 0)
    RETURNING id INTO v_factura;

  INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo)
    VALUES (v_factura, DATE '2099-01-20', 21, v_banco, 'transferencia');

  INSERT INTO gastos (fecha, concepto, categoria_id, cuenta_id, imputado_a, base, iva_pct, iva_soportado, deducible, tiene_factura)
    VALUES (DATE '2099-01-22', '_TEST gasto', v_cat_gasto, v_banco, 'david', 10, 0, 0, FALSE, FALSE);

  -- ------------------------------------------------------------------
  -- TEST 1: deuda por cliente (factura ≠ cobro; la deuda es derivada)
  -- Total 121 − cobrado 21 = 100 pendiente, y debe salir en morosos.
  -- ------------------------------------------------------------------
  SELECT pendiente INTO v_pendiente FROM v_facturas_saldo WHERE id = v_factura;
  IF v_pendiente IS DISTINCT FROM 100.00 THEN
    RAISE EXCEPTION 'TEST DEUDA FALLA: pendiente=% (esperado 100)', v_pendiente;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM v_morosos WHERE id = v_factura) THEN
    RAISE EXCEPTION 'TEST DEUDA FALLA: la factura pendiente no aparece en v_morosos';
  END IF;

  -- ------------------------------------------------------------------
  -- TEST 2: reparto 80/20 sobre el balance individual
  -- David en 2099-01: cobrado 21 − gasto 10 = balance 11
  --   → entrenador 8.80 (80%), hucha 2.20 (20%), leídos de config.
  -- ------------------------------------------------------------------
  SELECT balance, a_entrenador, a_hucha
    INTO v_balance, v_entrenador, v_hucha
    FROM v_reparto_mensual
   WHERE mes = DATE '2099-01-01' AND atribucion = 'david';

  IF v_balance IS DISTINCT FROM 11.00 THEN
    RAISE EXCEPTION 'TEST REPARTO FALLA: balance=% (esperado 11)', v_balance;
  END IF;
  IF v_entrenador IS DISTINCT FROM 8.80 THEN
    RAISE EXCEPTION 'TEST REPARTO FALLA: a_entrenador=% (esperado 8.80)', v_entrenador;
  END IF;
  IF v_hucha IS DISTINCT FROM 2.20 THEN
    RAISE EXCEPTION 'TEST REPARTO FALLA: a_hucha=% (esperado 2.20)', v_hucha;
  END IF;

  -- ------------------------------------------------------------------
  -- TEST 3: caja libre
  -- Entraron 21 € y salieron 10 € (en 2099: no toca el IVA del
  -- trimestre actual ni el gasto fijo). Caja libre debe subir 11 €.
  -- ------------------------------------------------------------------
  SELECT caja_libre INTO v_caja_despues FROM v_kpis;
  IF (v_caja_despues - v_caja_antes) IS DISTINCT FROM 11.00 THEN
    RAISE EXCEPTION 'TEST CAJA LIBRE FALLA: delta=% (esperado 11)', v_caja_despues - v_caja_antes;
  END IF;

END $$;

ROLLBACK;  -- deshace TODOS los datos de prueba

SELECT 'TODOS LOS TESTS PASAN ✓' AS resultado;
