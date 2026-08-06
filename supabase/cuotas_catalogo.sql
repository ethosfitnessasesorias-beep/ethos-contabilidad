-- Catalogo completo de cuotas GYM + ONLINE (lista de precios ago-2026, IVA incluido)
-- y bonos de pago unico (es_bono: NUNCA entran en la remesa mensual).
-- Promos GYM confirmadas: trimestral -5%, semestral -10%, anual -15%.

ALTER TABLE cuotas ADD COLUMN IF NOT EXISTS es_bono boolean NOT NULL DEFAULT false;
ALTER TABLE cuotas ADD COLUMN IF NOT EXISTS negocio text;

-- generar_remesa v3: excluye bonos y usa el canal del cliente en la factura
CREATE OR REPLACE FUNCTION public.generar_remesa(p_mes date DEFAULT (date_trunc('month'::text, now()))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    SELECT c.id AS cliente_id, q.nombre AS cuota_nombre, q.iva_pct,
           c.cuota_periodicidad AS modalidad,
           COALESCE(c.canal, 'presencial') AS canal,
           CASE c.cuota_periodicidad
             WHEN 'trimestral' THEN q.precio_trimestral
             WHEN 'semestral'  THEN q.precio_semestral
             WHEN 'anual'      THEN q.precio_anual
             ELSE q.precio_mensual
           END AS precio_periodo,
           c.descuento_pct, c.descuento_eur,
           date_trunc('month', COALESCE(c.cuota_desde, c.fecha_inicio, p_mes))::date AS desde
    FROM clientes c JOIN cuotas q ON q.id = c.cuota_id
    WHERE c.domiciliado AND c.fecha_baja IS NULL AND q.activa
      AND q.es_bono = false
      AND NOT EXISTS (SELECT 1 FROM remesa_lineas rl WHERE rl.remesa_id = v_remesa AND rl.cliente_id = c.id)
  LOOP
    IF r.precio_periodo IS NULL THEN CONTINUE; END IF;
    v_periodo := CASE r.modalidad WHEN 'trimestral' THEN 3 WHEN 'semestral' THEN 6 WHEN 'anual' THEN 12 ELSE 1 END;
    v_meses := (extract(year FROM p_mes)::int - extract(year FROM r.desde)::int) * 12
             + (extract(month FROM p_mes)::int - extract(month FROM r.desde)::int);
    IF v_meses < 0 OR v_meses % v_periodo <> 0 THEN CONTINUE; END IF;

    v_precio := GREATEST(0, round((r.precio_periodo * (1 - r.descuento_pct / 100) - r.descuento_eur) * 100) / 100);
    IF v_precio <= 0 THEN CONTINUE; END IF;
    v_base := round(v_precio / (1 + r.iva_pct), 2);
    v_etiqueta := CASE r.modalidad WHEN 'mensual' THEN '' ELSE ' (' || r.modalidad || ')' END;
    INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, es_recurrente)
    VALUES (r.cliente_id, v_cat, 'ethos', p_mes,
            'Cuota ' || r.cuota_nombre || v_etiqueta || ' ' || to_char(p_mes, 'MM/YYYY'),
            v_base, r.iva_pct, 0, r.canal, true)
    RETURNING id, total INTO v_fac, v_tot;
    INSERT INTO remesa_lineas (remesa_id, cliente_id, factura_id, importe) VALUES (v_remesa, r.cliente_id, v_fac, v_tot);
    v_n := v_n + 1; v_total := v_total + v_tot;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'remesa_id', v_remesa, 'nuevos', v_n, 'importe_nuevos', v_total);
END; $function$;

-- Catalogo (inserta solo los que no existan por nombre)
INSERT INTO cuotas (nombre, activa, iva_pct, precio_mensual, precio_trimestral, precio_semestral, precio_anual, es_bono, negocio)
SELECT v.nombre, true, 0.21, v.pm, v.pt, v.ps, v.pa, v.bono, v.neg
FROM (VALUES
  -- GYM planes (trim -5%, sem -10%, anual -15%)
  ('GYM Grupal Essential',              92.90,  264.77,  501.66,  947.58, false, 'gym'),
  ('GYM Personal Progress (8/mes)',    249.90,  712.22, 1349.46, 2548.98, false, 'gym'),
  ('GYM Personal Advanced (12/mes)',   329.90,  940.22, 1781.46, 3364.98, false, 'gym'),
  ('GYM Personal Perform (16/mes)',    399.90, 1139.72, 2159.46, 4078.98, false, 'gym'),
  ('GYM Pareja Progress (8/mes)',      384.90, 1096.97, 2078.46, 3925.98, false, 'gym'),
  ('GYM Pareja Advanced (12/mes)',     524.90, 1495.97, 2834.46, 5353.98, false, 'gym'),
  ('GYM Pareja Perform (16/mes)',      699.90, 1994.72, 3779.46, 7138.98, false, 'gym'),
  ('Suplemento Libre acceso',           29.90,    NULL,    NULL,    NULL, false, 'gym'),
  ('Suplemento Nutricion',              72.90,    NULL,    NULL,    NULL, false, 'gym'),
  -- ONLINE (sin mensual; matricula 39,90 en primer pago, gratis en anual)
  ('Online Entrenamiento y Nutricion',   NULL,  449.61,  779.40, 1299.90, false, 'online'),
  -- BONOS y pagos unicos (es_bono: no entran en remesa; precio en la columna mensual)
  ('Matricula',                          39.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 10 entrenos grupales',         119.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 20 entrenos grupales',         199.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 5 entrenos personales',        199.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 10 entrenos personales',       379.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 20 entrenos personales',       679.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 5 entrenos pareja',            299.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 10 entrenos pareja',           524.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Bono 20 entrenos pareja',           959.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Fisio Recovery Express (45 min)',    34.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Fisio Rehabilitacion 1a visita',     54.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Fisio Rehabilitacion sesion',        49.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Fisio Pack 3 sesiones',             140.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Fisio Pack 5 sesiones',             224.90,    NULL,    NULL,    NULL, true,  'gym'),
  ('Fisio Pack 10 sesiones',            419.90,    NULL,    NULL,    NULL, true,  'gym')
) AS v(nombre, pm, pt, ps, pa, bono, neg)
WHERE NOT EXISTS (SELECT 1 FROM cuotas q WHERE lower(q.nombre) = lower(v.nombre));

SELECT count(*) AS cuotas_totales, count(*) FILTER (WHERE es_bono) AS bonos FROM cuotas;
