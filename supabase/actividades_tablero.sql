-- =====================================================================
-- ACTIVIDADES COMO TABLERO (tipo Trello)
-- Columnas del tablero (estado) y etiquetas de prioridad.
-- (Aplicado directamente por Claude vía Management API el 2026-07-12;
--  este fichero queda como registro.)
-- =====================================================================

ALTER TABLE actividades ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'por_hacer'
  CHECK (estado IN ('por_hacer', 'en_curso', 'hecha'));

ALTER TABLE actividades ADD COLUMN IF NOT EXISTS prioridad TEXT NOT NULL DEFAULT 'media'
  CHECK (prioridad IN ('alta', 'media', 'baja'));

-- Coherencia con el campo hecha que usa el dashboard
UPDATE actividades SET estado = 'hecha' WHERE hecha;
