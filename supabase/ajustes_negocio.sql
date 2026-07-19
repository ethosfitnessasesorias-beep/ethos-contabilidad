-- =====================================================================
-- AJUSTES DEL NEGOCIO: datos fiscales por persona, config de texto y
-- claves numéricas nuevas (objetivos, inversión del local, ajuste hucha).
-- (Aplicado por Claude vía Management API; queda como registro.)
-- =====================================================================

-- Datos fiscales de los socios (para facturas y el gestor)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS nombre_fiscal TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Config de TEXTO (la tabla config solo admite números)
CREATE TABLE IF NOT EXISTS config_texto (
  clave       TEXT PRIMARY KEY,
  valor       TEXT NOT NULL,
  descripcion TEXT
);
ALTER TABLE config_texto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON config_texto;
CREATE POLICY acceso_autenticados ON config_texto FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON config_texto TO authenticated;
REVOKE ALL ON config_texto FROM anon;

INSERT INTO config_texto (clave, valor, descripcion) VALUES
  ('hucha_desde', '2026-03-01', 'Fecha desde la que cuenta la hucha (la obra anterior es inversión inicial del local)')
ON CONFLICT (clave) DO NOTHING;

-- Claves numéricas nuevas
INSERT INTO config (clave, valor, descripcion) VALUES
  ('objetivo_online',       0,        'Objetivo mensual de facturación online'),
  ('objetivo_presencial',   0,        'Objetivo mensual de facturación del gym'),
  ('inversion_local_total', 84333.09, 'Inversión total del local desde la apertura'),
  ('hucha_ajuste',          0,        'Ajuste manual del saldo de la hucha (cuadre con la realidad)')
ON CONFLICT (clave) DO NOTHING;
