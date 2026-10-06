-- Grand Slam: columna Ganados + reactivación + temporalidad.
-- Ganar una oferta ya NO toca la contabilidad: se registra la oferta ganada,
-- su temporalidad y cuándo vuelve al embudo (fin del plan + 2 meses).
ALTER TABLE deals ADD COLUMN IF NOT EXISTS temporalidad text;   -- mensual/trimestral/semestral/anual
ALTER TABLE deals ADD COLUMN IF NOT EXISTS reactivar_en date;   -- cuándo vuelve al embudo tras ganar
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ventana_fin date;    -- límite para lanzar la oferta (orden por urgencia)

-- "Vencido" pasa a ser "Reactivación" (ahí caen los no lanzados a tiempo y los
-- ganados que vuelven tras su plan).
UPDATE pipeline_columnas SET titulo = 'Reactivación',
  descripcion = 'Venció la ventana o vuelve tras su plan: reactívalo'
  WHERE id = 11;

-- Columna de Ganados (facturado por Grand Slam), al final del embudo 3.
INSERT INTO pipeline_columnas (embudo_id, titulo, descripcion, orden, probabilidad)
SELECT 3, 'Ganados', 'Ofertas ganadas (facturado por Grand Slam)', 6, 100
WHERE NOT EXISTS (SELECT 1 FROM pipeline_columnas WHERE embudo_id = 3 AND titulo = 'Ganados');

-- Los ganados existentes del Grand Slam pasan a la columna Ganados.
UPDATE deals SET columna_id = (SELECT id FROM pipeline_columnas WHERE embudo_id = 3 AND titulo = 'Ganados' LIMIT 1)
  WHERE embudo_id = 3 AND etapa = 'ganado';

SELECT 'OK: grand_slam_ganados' AS resultado;
