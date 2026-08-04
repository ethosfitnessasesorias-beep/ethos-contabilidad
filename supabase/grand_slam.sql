-- Embudo "Grand Slam" (fidelizacion/upsell) con las etapas del Excel.
-- Cerrado (aceptado) = Ganado; Rechazado = Perdido (ya integrados en el tablero).
INSERT INTO embudos (nombre, orden)
SELECT 'Grand Slam', COALESCE(MAX(orden), 0) + 1 FROM embudos
WHERE NOT EXISTS (SELECT 1 FROM embudos WHERE nombre = 'Grand Slam');

WITH e AS (SELECT id FROM embudos WHERE nombre = 'Grand Slam')
INSERT INTO pipeline_columnas (titulo, orden, embudo_id, descripcion, probabilidad, estancado_dias)
SELECT v.titulo, v.orden, e.id, v.descripcion, v.probabilidad, v.estancado_dias
FROM e, (VALUES
  ('Aún no toca', 1, 'La ventana aún no se ha abierto. Con Sincronizar se mueven solas.', 10, NULL::int),
  ('En ventana · hazlo YA', 2, 'Cliente en su ventana ideal: ofrécele el Grand Slam ahora.', 50, 7),
  ('Vencido', 3, 'Pasó la fecha límite sin oferta. Prioridad máxima.', 25, 7),
  ('Ofrecido · esperando', 4, 'Oferta hecha, esperando respuesta. Pon fecha de seguimiento.', 60, 7),
  ('Aplazado', 5, 'El cliente pidió esperar. Pon fecha de seguimiento para retomar.', 30, 30)
) AS v(titulo, orden, descripcion, probabilidad, estancado_dias)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_columnas pc, e WHERE pc.embudo_id = e.id);

SELECT 'OK: embudo Grand Slam creado' AS resultado;
