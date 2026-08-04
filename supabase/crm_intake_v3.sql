-- =====================================================================
-- CRM INTAKE v3: ademas de crear/casar el contacto (v2), ahora:
--  · Lead nuevo del formulario -> tarjeta automatica en la primera etapa
--    del embudo de ventas (el primero que no sea Grand Slam), sin duplicar
--    si ya tiene una tarjeta abierta y solo si su estado es 'lead'.
--  · Alta (tipo=entrada) -> sus tarjetas abiertas del embudo de ventas se
--    cierran solas como Ganado (el Grand Slam no se toca).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.crm_intake(p_token TEXT, p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     INT;
  v_email  TEXT;
  v_tipo   TEXT;
  v_fecha  DATE;
  v_prep   TEXT;
  v_nombre TEXT;
  v_embudo INT;
  v_col    INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_config WHERE id = 1 AND intake_token = p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token invalido');
  END IF;

  v_email := lower(trim(p_data->>'email'));
  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'falta email');
  END IF;
  v_tipo  := coalesce(p_data->>'tipo', 'valoracion');
  v_fecha := coalesce(NULLIF(p_data->>'fecha', '')::date, current_date);
  v_prep  := lower(NULLIF(trim(p_data->>'preparador'), ''));

  -- 1a llave: email
  SELECT id INTO v_id FROM clientes WHERE lower(email) = v_email LIMIT 1;

  -- 2a llave: nombre completo normalizado (evita duplicados si cambio de email)
  IF v_id IS NULL THEN
    v_nombre := translate(lower(trim(regexp_replace(
      coalesce(p_data->>'nombre', '') || ' ' || coalesce(p_data->>'apellidos', ''), '\s+', ' ', 'g'))),
      'áéíóúàèìòùäëïöüñç', 'aeiouaeiouaeiounc');
    IF length(v_nombre) >= 5 THEN
      SELECT id INTO v_id FROM clientes
      WHERE translate(lower(trim(regexp_replace(nombre || ' ' || coalesce(apellidos, ''), '\s+', ' ', 'g'))),
        'áéíóúàèìòùäëïöüñç', 'aeiouaeiouaeiounc') = v_nombre
      LIMIT 1;
      IF v_id IS NOT NULL THEN
        UPDATE clientes SET email = coalesce(email, v_email) WHERE id = v_id;
      END IF;
    END IF;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO clientes (nombre, apellidos, email, telefono, nif, entrenador, estado, origen,
                          fecha_registro, primer_contacto, objetivo, servicio_interes)
    VALUES (coalesce(NULLIF(p_data->>'nombre', ''), '(sin nombre)'), p_data->>'apellidos', v_email,
            p_data->>'telefono', p_data->>'nif',
            CASE WHEN v_prep IN ('luis','david','alex_esteban','alex_guerrero','ethos') THEN v_prep ELSE 'ethos' END,
            'lead', 'formulario',
            v_fecha, v_fecha, p_data->>'objetivo', p_data->>'servicio')
    RETURNING id INTO v_id;
  ELSE
    UPDATE clientes SET
      telefono        = coalesce(telefono, NULLIF(p_data->>'telefono', '')),
      nif             = coalesce(nif, NULLIF(p_data->>'nif', '')),
      apellidos       = coalesce(apellidos, NULLIF(p_data->>'apellidos', '')),
      objetivo        = coalesce(objetivo, NULLIF(p_data->>'objetivo', '')),
      fecha_registro  = coalesce(fecha_registro, v_fecha),
      primer_contacto = LEAST(coalesce(primer_contacto, v_fecha), v_fecha)
    WHERE id = v_id;
  END IF;

  IF v_tipo = 'entrada' THEN
    UPDATE clientes SET
      fecha_compra = coalesce(fecha_compra, v_fecha),
      fecha_inicio = coalesce(fecha_inicio, NULLIF(p_data->>'fecha_inicio', '')::date, v_fecha),
      fecha_alta   = coalesce(fecha_alta, v_fecha),
      tipo_plan    = coalesce(NULLIF(p_data->>'tipo_plan', ''), tipo_plan),
      entrenador   = CASE WHEN v_prep IN ('luis','david','alex_esteban','alex_guerrero','ethos') THEN v_prep ELSE entrenador END,
      estado       = 'cliente'
    WHERE id = v_id;

    -- El lead se convirtio: sus tarjetas abiertas del embudo de ventas se ganan solas
    UPDATE deals SET etapa = 'ganado', fecha_cierre = v_fecha
    WHERE cliente_id = v_id
      AND etapa NOT IN ('ganado','perdido')
      AND embudo_id IN (SELECT id FROM embudos WHERE lower(nombre) NOT LIKE '%grand slam%');
  ELSE
    -- Lead: tarjeta automatica en la primera etapa del embudo de ventas
    SELECT e.id INTO v_embudo FROM embudos e
    WHERE e.activo AND lower(e.nombre) NOT LIKE '%grand slam%'
    ORDER BY e.orden, e.id LIMIT 1;
    IF v_embudo IS NOT NULL THEN
      SELECT pc.id INTO v_col FROM pipeline_columnas pc
      WHERE pc.embudo_id = v_embudo ORDER BY pc.orden, pc.id LIMIT 1;
      IF v_col IS NOT NULL
         AND EXISTS (SELECT 1 FROM clientes c WHERE c.id = v_id AND c.estado = 'lead')
         AND NOT EXISTS (SELECT 1 FROM deals d WHERE d.cliente_id = v_id AND d.etapa NOT IN ('ganado','perdido')) THEN
        INSERT INTO deals (titulo, cliente_id, canal, importe_estimado, responsable, origen, etapa, embudo_id, columna_id, columna_desde)
        VALUES (
          coalesce(NULLIF(p_data->>'servicio',''), 'Lead del formulario'),
          v_id,
          CASE WHEN lower(coalesce(p_data->>'servicio','')) LIKE '%online%' THEN 'online' ELSE 'presencial' END,
          0,
          CASE WHEN v_prep IN ('luis','david') THEN v_prep ELSE 'ethos' END,
          'formulario', 'lead', v_embudo, v_col, now());
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'cliente_id', v_id);
END $$;

REVOKE ALL ON FUNCTION public.crm_intake(TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_intake(TEXT, JSONB) TO anon, authenticated;

SELECT 'OK: intake v3 con tarjeta automatica' AS resultado;
