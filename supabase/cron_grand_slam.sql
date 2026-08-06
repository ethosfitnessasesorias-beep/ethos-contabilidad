-- Orden de tarjetas en el tablero (drag & drop) y sincronizacion del Grand
-- Slam desde el cron del lunes (ademas del auto-sync al abrir el tablero).
ALTER TABLE deals ADD COLUMN IF NOT EXISTS orden int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.cron_grand_slam(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t text; v_embudo int; v_no_toca int; v_ventana int; v_vencido int;
  r RECORD; v_desde date; v_limite date; v_col int;
  v_creadas int := 0; v_movidas int := 0;
  v_m_ini int; v_m_fin int; v_oferta text; v_precio numeric; v_hoy date := current_date;
BEGIN
  SELECT valor INTO t FROM config_texto WHERE clave = 'cron_token';
  IF t IS NULL OR t <> p_token THEN RETURN jsonb_build_object('ok', false); END IF;

  SELECT id INTO v_embudo FROM embudos WHERE activo AND lower(nombre) LIKE '%grand slam%' ORDER BY orden LIMIT 1;
  IF v_embudo IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'sin embudo'); END IF;
  SELECT id INTO v_no_toca FROM pipeline_columnas WHERE embudo_id = v_embudo AND titulo ILIKE '%no toca%' ORDER BY orden LIMIT 1;
  SELECT id INTO v_ventana FROM pipeline_columnas WHERE embudo_id = v_embudo AND titulo ILIKE 'en ventana%' ORDER BY orden LIMIT 1;
  SELECT id INTO v_vencido FROM pipeline_columnas WHERE embudo_id = v_embudo AND titulo ILIKE 'vencido%' ORDER BY orden LIMIT 1;
  IF v_no_toca IS NULL OR v_ventana IS NULL OR v_vencido IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'faltan etapas');
  END IF;

  FOR r IN
    SELECT c.id, c.entrenador, c.canal, c.fecha_inicio, COALESCE(NULLIF(c.cuota_periodicidad,''),'mensual') AS per
    FROM clientes c
    WHERE c.estado = 'cliente' AND c.fecha_baja IS NULL AND c.fecha_inicio IS NOT NULL
  LOOP
    IF r.canal = 'online' THEN
      IF r.per = 'anual' THEN v_m_ini := 3; v_m_fin := 6; ELSE v_m_ini := 1; v_m_fin := 3; END IF;
    ELSE
      v_m_ini := 1; v_m_fin := 2;
    END IF;
    v_desde  := (r.fecha_inicio + make_interval(months => v_m_ini))::date;
    v_limite := (r.fecha_inicio + make_interval(months => v_m_fin))::date;
    v_col := CASE WHEN v_hoy < v_desde THEN v_no_toca WHEN v_hoy <= v_limite THEN v_ventana ELSE v_vencido END;

    IF EXISTS (SELECT 1 FROM deals d WHERE d.embudo_id = v_embudo AND d.cliente_id = r.id) THEN
      UPDATE deals d SET columna_id = v_col, columna_desde = now()
      WHERE d.embudo_id = v_embudo AND d.cliente_id = r.id
        AND d.etapa NOT IN ('ganado','perdido')
        AND ((d.columna_id = v_no_toca AND v_col IN (v_ventana, v_vencido))
          OR (d.columna_id = v_ventana AND v_col = v_vencido));
      IF FOUND THEN v_movidas := v_movidas + 1; END IF;
      CONTINUE;
    END IF;

    IF r.canal = 'online' AND r.per = 'anual' THEN v_oferta := 'Anual 12+3'; v_precio := 900;
    ELSE v_oferta := 'Semestral 6+1'; v_precio := 480; END IF;

    INSERT INTO deals (titulo, cliente_id, canal, importe_estimado, responsable, origen, etapa,
                       embudo_id, columna_id, columna_desde, seguimiento, seguimiento_nota, notas)
    VALUES ('Grand Slam · ' || v_oferta, r.id,
            CASE WHEN r.canal = 'online' THEN 'online' ELSE 'presencial' END,
            v_precio,
            CASE WHEN r.entrenador IN ('david','luis') THEN r.entrenador ELSE 'ethos' END,
            'grand-slam', 'lead', v_embudo, v_col, now(),
            GREATEST(v_desde, v_hoy),
            'Ofrecer ' || v_oferta || ' (ventana ' || to_char(v_desde,'DD/MM/YY') || ' - ' || to_char(v_limite,'DD/MM/YY') || ')',
            CASE WHEN r.canal = 'online' THEN 'Online ' || r.per ELSE 'Presencial grupal' END
              || ' · alta ' || to_char(r.fecha_inicio,'DD/MM/YY')
              || ' · ventana ' || to_char(v_desde,'DD/MM/YY') || ' - ' || to_char(v_limite,'DD/MM/YY'));
    v_creadas := v_creadas + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'creadas', v_creadas, 'movidas', v_movidas);
END $$;

REVOKE ALL ON FUNCTION public.cron_grand_slam(text) FROM public;
GRANT EXECUTE ON FUNCTION public.cron_grand_slam(text) TO anon, authenticated;

SELECT 'OK: cron grand slam listo' AS resultado;
