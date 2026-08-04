-- Avisos del lunes por email (Resend): clave de envio + datos para el correo
-- La clave real ya esta aplicada en la BD; aqui solo el placeholder.
INSERT INTO config_texto (clave, valor, descripcion)
VALUES ('resend_key', 'PON_AQUI_LA_API_KEY_DE_RESEND', 'API key de Resend (solo envio, dominio ethosfitnessasesorias.es)')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO config_texto (clave, valor, descripcion)
VALUES ('aviso_email', 'ethosfitness.asesorias@gmail.com', 'Destinatario de los avisos del lunes')
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE FUNCTION cron_avisos_lunes(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text; r json;
BEGIN
  SELECT valor INTO t FROM config_texto WHERE clave = 'cron_token';
  IF t IS NULL OR t <> p_token THEN RETURN json_build_object('ok', false); END IF;
  SELECT json_build_object(
    'ok', true,
    'resend_key', (SELECT valor FROM config_texto WHERE clave = 'resend_key'),
    'email', COALESCE((SELECT valor FROM config_texto WHERE clave = 'aviso_email'), 'ethosfitness.asesorias@gmail.com'),
    'seguimientos', COALESCE((
      SELECT json_agg(json_build_object(
        'titulo', d.titulo,
        'cliente', COALESCE(c.nombre, ''),
        'fecha', d.seguimiento,
        'nota', COALESCE(d.seguimiento_nota, '')
      ) ORDER BY d.seguimiento)
      FROM deals d LEFT JOIN clientes c ON c.id = d.cliente_id
      WHERE d.etapa NOT IN ('ganado','perdido')
        AND d.seguimiento IS NOT NULL
        AND d.seguimiento <= current_date + 7
    ), '[]'::json),
    'impagos', COALESCE((
      SELECT json_agg(json_build_object('cliente', v.nombre, 'pendiente', v.pendiente) ORDER BY v.pendiente DESC)
      FROM (
        SELECT c.nombre || ' ' || COALESCE(c.apellidos, '') AS nombre, round(sum(s.pendiente)::numeric, 2) AS pendiente
        FROM v_facturas_saldo s JOIN clientes c ON c.id = s.cliente_id
        WHERE s.pendiente > 0.01
        GROUP BY c.id, c.nombre, c.apellidos
      ) v
    ), '[]'::json)
  ) INTO r;
  RETURN r;
END $$;

REVOKE ALL ON FUNCTION cron_avisos_lunes(text) FROM public;
GRANT EXECUTE ON FUNCTION cron_avisos_lunes(text) TO anon, authenticated;

SELECT 'OK: avisos email listos' AS resultado;
