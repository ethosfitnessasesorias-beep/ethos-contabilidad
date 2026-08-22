-- 1) Arqueos de caja: recuento fisico vs saldo de la app, con historial
CREATE TABLE IF NOT EXISTS arqueos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha date NOT NULL DEFAULT current_date,
  contado numeric NOT NULL,
  saldo_app numeric NOT NULL,
  descuadre numeric GENERATED ALWAYS AS (round(contado - saldo_app, 2)) STORED,
  accion text,
  notas text,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arqueos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON arqueos;
CREATE POLICY acceso_autenticados ON arqueos FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON arqueos FROM anon;
GRANT ALL ON arqueos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2) Backup completo de datos (para el cron mensual; secretos excluidos)
CREATE OR REPLACE FUNCTION public.backup_datos(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text; r jsonb := '{}'::jsonb;
BEGIN
  SELECT valor INTO t FROM config_texto WHERE clave = 'cron_token';
  IF t IS NULL OR t <> p_token THEN RETURN jsonb_build_object('ok', false); END IF;

  r := jsonb_build_object(
    'ok', true,
    'resend_key', (SELECT valor FROM config_texto WHERE clave = 'resend_key'),
    'email', COALESCE((SELECT valor FROM config_texto WHERE clave = 'aviso_email'), 'ethosfitness.asesorias@gmail.com'),
    'clientes', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM clientes x),
    'facturas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM facturas x),
    'factura_lineas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM factura_lineas x),
    'cobros', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM cobros x),
    'gastos', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM gastos x),
    'traspasos', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM traspasos x),
    'cuentas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM cuentas x),
    'categorias', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM categorias x),
    'cuotas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM cuotas x),
    'remesas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM remesas x),
    'remesa_lineas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM remesa_lineas x),
    'deals', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM deals x),
    'embudos', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM embudos x),
    'pipeline_columnas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM pipeline_columnas x),
    'reparto_pagos', (SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM reparto_pagos x),
    'pagos_cobros_filas', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM pagos_cobros_filas x),
    'personas', (SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM personas x),
    'arqueos', (SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id), '[]'::jsonb) FROM arqueos x),
    'config', (SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM config x),
    'config_texto', (SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM config_texto x WHERE x.clave NOT IN ('resend_key', 'cron_token'))
  );
  RETURN r;
END $$;

REVOKE ALL ON FUNCTION public.backup_datos(text) FROM public;
GRANT EXECUTE ON FUNCTION public.backup_datos(text) TO anon, authenticated;

SELECT 'OK: arqueos y backup listos' AS resultado;
