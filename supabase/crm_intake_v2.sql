-- =====================================================================
-- CRM INTAKE v2: el formulario casaba SOLO por email, así que un cliente
-- existente con otro correo creaba ficha duplicada (Kinverly, Juan José).
-- Ahora, si el email no casa, intenta por nombre+apellidos normalizado
-- (minúsculas, sin tildes, espacios colapsados) y adopta el email nuevo.
-- (Aplicado por Claude vía Management API; queda como registro.)
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

  -- 1ª llave: email
  SELECT id INTO v_id FROM clientes WHERE lower(email) = v_email LIMIT 1;

  -- 2ª llave: nombre completo normalizado (evita duplicados si cambió de email)
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
  END IF;

  RETURN jsonb_build_object('ok', true, 'cliente_id', v_id);
END $$;

REVOKE ALL ON FUNCTION public.crm_intake(TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_intake(TEXT, JSONB) TO anon, authenticated;
