-- =====================================================================
-- CRM CLIENTES: ciclo de vida + entrada automática desde el Google Form
-- (Pendiente de aplicar vía Management API; queda como registro.)
-- =====================================================================

-- ---------- 1. Campos del CRM sobre la tabla clientes existente ----------
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS apellidos        TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_registro   DATE;  -- fecha de la respuesta del formulario
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS primer_contacto  DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_compra     DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_inicio     DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_plan        TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS objetivo         TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS servicio_interes TEXT;
-- Checklist de seguimiento (lo que marcabais a mano en el Excel)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS seg_cambio_fisico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS seg_satisfaccion  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS seg_marcha        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS seg_google_maps   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS seg_trustpilot    BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes (lower(email));

-- ---------- 2. Token del webhook de entrada del formulario ----------
CREATE TABLE IF NOT EXISTS crm_config (
  id           INT PRIMARY KEY DEFAULT 1,
  intake_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')
);
INSERT INTO crm_config (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE crm_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON crm_config;
CREATE POLICY acceso_autenticados ON crm_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON crm_config FROM anon;

-- ---------- 3. Entrada del formulario (crea/actualiza cliente) ----------
-- Token-gated. La llama la ruta pública /api/intake con la clave anon.
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

  SELECT id INTO v_id FROM clientes WHERE lower(email) = v_email LIMIT 1;

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

  -- Segundo formulario (compra / entrada de datos): pasa a cliente
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
