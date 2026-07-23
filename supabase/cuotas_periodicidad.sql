-- =====================================================================
-- PERIODICIDAD DE CUOTAS: mensual / trimestral / semestral / anual.
--  - cuotas.periodicidad: el importe pasa a ser "por periodo".
--  - clientes.cuota_desde: cuando empieza a contar el ciclo del socio.
--  - generar_remesa() solo incluye a cada socio en el mes que le toca:
--    meses transcurridos desde cuota_desde divisibles por el periodo.
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

ALTER TABLE cuotas ADD COLUMN IF NOT EXISTS periodicidad TEXT NOT NULL DEFAULT 'mensual'
  CHECK (periodicidad IN ('mensual','trimestral','semestral','anual'));
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cuota_desde DATE;

CREATE OR REPLACE FUNCTION generar_remesa(p_mes DATE DEFAULT date_trunc('month', now())::date)
RETURNS jsonb AS $$
DECLARE
  v_remesa INT; v_cat INT; v_n INT := 0; v_total NUMERIC := 0;
  r RECORD; v_precio NUMERIC; v_base NUMERIC; v_fac INT; v_tot NUMERIC;
  v_periodo INT; v_meses INT; v_etiqueta TEXT;
BEGIN
  SELECT id INTO v_cat FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1;
  IF v_cat IS NULL THEN SELECT id INTO v_cat FROM categorias WHERE tipo = 'ingreso' LIMIT 1; END IF;

  INSERT INTO remesas (mes) VALUES (p_mes) ON CONFLICT (mes) DO NOTHING;
  SELECT id INTO v_remesa FROM remesas WHERE mes = p_mes;
  IF (SELECT estado FROM remesas WHERE id = v_remesa) = 'aprobada' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'la remesa de ese mes ya esta aprobada');
  END IF;

  FOR r IN
    SELECT c.id AS cliente_id, q.nombre AS cuota_nombre, q.importe, q.iva_pct, q.periodicidad,
           c.descuento_pct, c.descuento_eur,
           date_trunc('month', COALESCE(c.cuota_desde, c.fecha_inicio, p_mes))::date AS desde
    FROM clientes c JOIN cuotas q ON q.id = c.cuota_id
    WHERE c.domiciliado AND c.fecha_baja IS NULL AND q.activa
      AND NOT EXISTS (SELECT 1 FROM remesa_lineas rl WHERE rl.remesa_id = v_remesa AND rl.cliente_id = c.id)
  LOOP
    v_periodo := CASE r.periodicidad WHEN 'trimestral' THEN 3 WHEN 'semestral' THEN 6 WHEN 'anual' THEN 12 ELSE 1 END;
    v_meses := (extract(year FROM p_mes)::int - extract(year FROM r.desde)::int) * 12
             + (extract(month FROM p_mes)::int - extract(month FROM r.desde)::int);
    IF v_meses < 0 OR v_meses % v_periodo <> 0 THEN CONTINUE; END IF;

    v_precio := GREATEST(0, round((r.importe * (1 - r.descuento_pct / 100) - r.descuento_eur) * 100) / 100);
    IF v_precio <= 0 THEN CONTINUE; END IF;
    v_base := round(v_precio / (1 + r.iva_pct), 2);
    v_etiqueta := CASE r.periodicidad WHEN 'mensual' THEN '' ELSE ' (' || r.periodicidad || ')' END;
    INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, es_recurrente)
    VALUES (r.cliente_id, v_cat, 'ethos', p_mes,
            'Cuota ' || r.cuota_nombre || v_etiqueta || ' ' || to_char(p_mes, 'MM/YYYY'),
            v_base, r.iva_pct, 0, 'presencial', true)
    RETURNING id, total INTO v_fac, v_tot;
    INSERT INTO remesa_lineas (remesa_id, cliente_id, factura_id, importe) VALUES (v_remesa, r.cliente_id, v_fac, v_tot);
    v_n := v_n + 1; v_total := v_total + v_tot;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'remesa_id', v_remesa, 'nuevos', v_n, 'importe_nuevos', v_total);
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
