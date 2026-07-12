-- =====================================================================
-- FACTURACIÓN A CLIENTES — numeración legal y datos del emisor
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- Número legal de la factura (solo se asigna al emitirla; único)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS numero TEXT UNIQUE;

-- Datos fiscales del cliente (necesarios si pide factura completa)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Configuración del emisor y de la serie (una sola fila)
CREATE TABLE IF NOT EXISTS facturacion_config (
  id               SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  emisor_nombre    TEXT NOT NULL,
  emisor_nif       TEXT NOT NULL,
  emisor_direccion TEXT NOT NULL,
  serie            TEXT NOT NULL DEFAULT 'S',
  proximo_numero   INTEGER NOT NULL
);

INSERT INTO facturacion_config (id, emisor_nombre, emisor_nif, emisor_direccion, serie, proximo_numero)
VALUES (
  1,
  'Luis Silva Marzal',
  '45128243N',
  'Carrer Catalunya 16, Local — Viladecans (Barcelona)',
  'O-',
  1  -- serie propia de esta app; la app del gym sigue con su serie S
)
ON CONFLICT (id) DO NOTHING;

-- Por si la configuración ya existía con la serie antigua
UPDATE facturacion_config SET serie = 'O-', proximo_numero = 1
WHERE id = 1 AND serie = 'S';

-- Misma seguridad que el resto: solo usuarios con login
ALTER TABLE facturacion_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON facturacion_config;
CREATE POLICY acceso_autenticados ON facturacion_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON facturacion_config FROM anon;
