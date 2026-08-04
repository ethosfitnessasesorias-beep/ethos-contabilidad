-- Amortizacion de inversiones: vida util en meses por categoria.
-- Maquinaria y material: 5 anos · Obra y reformas / Mobiliario: 10 anos.
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS amortiza_meses int;
UPDATE categorias SET amortiza_meses = 60  WHERE nombre ILIKE 'maquinaria%' AND amortiza_meses IS NULL;
UPDATE categorias SET amortiza_meses = 120 WHERE (nombre ILIKE 'obra%' OR nombre ILIKE 'mobiliario%') AND amortiza_meses IS NULL;
UPDATE categorias SET amortiza_meses = 60  WHERE es_inversion = true AND amortiza_meses IS NULL;

SELECT nombre, amortiza_meses FROM categorias WHERE es_inversion = true ORDER BY nombre;
