-- Columnas del pipeline por embudo (multi-embudo estilo Holded)
ALTER TABLE pipeline_columnas ADD COLUMN IF NOT EXISTS embudo_id bigint REFERENCES embudos(id) ON DELETE CASCADE;
UPDATE pipeline_columnas SET embudo_id = (SELECT id FROM embudos ORDER BY orden, id LIMIT 1) WHERE embudo_id IS NULL;
UPDATE deals SET embudo_id = (SELECT id FROM embudos ORDER BY orden, id LIMIT 1) WHERE embudo_id IS NULL;
SELECT 'OK: columnas y deals anclados al embudo por defecto' AS resultado;
