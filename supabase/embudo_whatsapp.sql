-- Embudo "Leads WhatsApp": fases manuales (las mueve David), sin avisos de
-- estancamiento automatico (decision del usuario: el tablero puede ir por
-- detras del chat real). Los avisos salen del seguimiento con fecha.
-- Temperatura del lead: emoji en el titulo de la tarjeta (ej. "Grupal Maria").
INSERT INTO embudos (nombre, orden)
SELECT 'Leads WhatsApp', COALESCE(MAX(orden), 0) + 1 FROM embudos
WHERE NOT EXISTS (SELECT 1 FROM embudos WHERE nombre = 'Leads WhatsApp');

WITH e AS (SELECT id FROM embudos WHERE nombre = 'Leads WhatsApp')
INSERT INTO pipeline_columnas (titulo, orden, embudo_id, descripcion, probabilidad, estancado_dias)
SELECT v.titulo, v.orden, e.id, v.descripcion, v.probabilidad, NULL::int
FROM e, (VALUES
  ('⬜ Nuevo', 1, 'Chat entrante o primer contacto. Crea la tarjeta con nombre y qué pide.', 10),
  ('🎯 Cualificado', 2, 'Ya sabes qué quiere: pon servicio y temperatura en el título (🔥 caliente · 🟡 tibio).', 25),
  ('📅 Llamada agendada', 3, 'Fecha en el seguimiento + botón Google Calendar. El aviso llega solo.', 50),
  ('⭐ Prueba / Propuesta', 4, 'Vino a probar o tiene precio delante: toca cerrar. Ganado = alta · Perdido = no.', 75)
) AS v(titulo, orden, descripcion, probabilidad)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_columnas pc, e WHERE pc.embudo_id = e.id);

SELECT 'OK: embudo Leads WhatsApp creado' AS resultado;
