-- =====================================================================
-- MÓDULO DE CONTENIDO (redes sociales): tablero de producción + calendario
-- (Pendiente de aplicar vía Management API; queda como registro.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS contenido (
  id            SERIAL PRIMARY KEY,
  titulo        TEXT NOT NULL,
  fase          TEXT NOT NULL DEFAULT 'idea'
                  CHECK (fase IN ('idea','guion','grabar','editar','programado','publicado')),
  plataforma    TEXT NOT NULL DEFAULT 'instagram',
  formato       TEXT DEFAULT 'reel',        -- reel, carrusel, story, directo, colaboracion
  gancho        TEXT,                         -- hook / titular
  copy          TEXT,                         -- pie / descripción
  responsable   TEXT,                         -- codigo de personas
  cliente_id    INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  fecha_pub     TIMESTAMPTZ,                  -- fecha/hora de publicación
  url_archivo   TEXT,                         -- enlace al vídeo (Drive, etc.)
  orden         INTEGER NOT NULL DEFAULT 0,
  google_event_id TEXT,                       -- id del evento en Google Calendar (sync)
  archivado_en  TIMESTAMPTZ,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contenido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON contenido;
CREATE POLICY acceso_autenticados ON contenido FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON contenido FROM anon;
GRANT USAGE, SELECT ON SEQUENCE contenido_id_seq TO authenticated;

CREATE INDEX IF NOT EXISTS idx_contenido_fecha ON contenido (fecha_pub);

-- Tokens de Google Calendar por usuario (para la conexión OAuth)
CREATE TABLE IF NOT EXISTS integraciones_google (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  TEXT,
  refresh_token TEXT,
  expiry        TIMESTAMPTZ,
  calendar_id   TEXT DEFAULT 'primary',
  email         TEXT,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE integraciones_google ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_propio ON integraciones_google;
CREATE POLICY acceso_propio ON integraciones_google FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
REVOKE ALL ON integraciones_google FROM anon;
