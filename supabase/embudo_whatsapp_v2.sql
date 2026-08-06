-- Leads WhatsApp v2: dos fases nuevas (Llamada hecha y A punto de cerrar)
WITH e AS (SELECT id FROM embudos WHERE nombre = 'Leads WhatsApp')
UPDATE pipeline_columnas pc SET orden = 5
FROM e WHERE pc.embudo_id = e.id AND pc.titulo LIKE '%Prueba%';

WITH e AS (SELECT id FROM embudos WHERE nombre = 'Leads WhatsApp')
INSERT INTO pipeline_columnas (titulo, orden, embudo_id, descripcion, probabilidad, estancado_dias)
SELECT v.titulo, v.orden, e.id, v.descripcion, v.probabilidad, NULL::int
FROM e, (VALUES
  ('✅ Llamada hecha', 4, 'Ya hablasteis, está decidiendo. Ponle seguimiento para el follow-up.', 60),
  ('💸 A punto de cerrar', 6, 'Precio o condiciones sobre la mesa: tu lista caliente del día.', 90)
) AS v(titulo, orden, descripcion, probabilidad)
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_columnas pc, e WHERE pc.embudo_id = e.id AND pc.titulo = v.titulo
);

SELECT pc.orden, pc.titulo, pc.probabilidad
FROM pipeline_columnas pc JOIN embudos em ON em.id = pc.embudo_id
WHERE em.nombre = 'Leads WhatsApp' ORDER BY pc.orden;
