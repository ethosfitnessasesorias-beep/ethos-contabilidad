-- Facturas rectificativas: referencia a la original y serie propia (R)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS rectifica_id bigint REFERENCES facturas(id);
ALTER TABLE facturacion_config ADD COLUMN IF NOT EXISTS serie_rect text NOT NULL DEFAULT 'R';
ALTER TABLE facturacion_config ADD COLUMN IF NOT EXISTS proximo_numero_rect int NOT NULL DEFAULT 1;

SELECT 'OK: rectificativas listas' AS resultado;
