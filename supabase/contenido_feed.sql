-- =====================================================================
-- Feed .ics del contenido: función segura (token) para publicar el
-- calendario y suscribirlo desde Google Calendar (solo lectura).
-- =====================================================================

CREATE TABLE IF NOT EXISTS contenido_config (
  id         INT PRIMARY KEY DEFAULT 1,
  feed_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')
);
INSERT INTO contenido_config (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE contenido_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON contenido_config;
CREATE POLICY acceso_autenticados ON contenido_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON contenido_config FROM anon;

-- Devuelve los eventos SOLO si el token coincide (SECURITY DEFINER salta RLS
-- de forma controlada). Se llama desde la API pública del feed.
CREATE OR REPLACE FUNCTION public.eventos_contenido(p_token TEXT)
RETURNS TABLE (id INT, titulo TEXT, formato TEXT, gancho TEXT, copy TEXT, fecha_pub TIMESTAMPTZ, creado_en TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.titulo, c.formato, c.gancho, c.copy, c.fecha_pub, c.creado_en
  FROM contenido c
  WHERE c.archivado_en IS NULL
    AND c.fecha_pub IS NOT NULL
    AND EXISTS (SELECT 1 FROM contenido_config cfg WHERE cfg.id = 1 AND cfg.feed_token = p_token);
$$;

REVOKE ALL ON FUNCTION public.eventos_contenido(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.eventos_contenido(TEXT) TO anon, authenticated;
