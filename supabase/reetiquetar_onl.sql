-- =====================================================================
-- REETIQUETADO ONL: gastos del negocio online (canal = 'online')
-- Generado por scripts/reetiquetar-onl.mjs el 2026-07-16
-- Ejecutar UNA VEZ en: Supabase Dashboard > SQL Editor
-- Cada UPDATE casa por fecha + concepto + importe con IVA (tolerancia 1 cent).
-- =====================================================================

BEGIN;

-- Fila 331: 2026-05-09 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-09'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 334: 2026-05-02 "Harbiz" (ONL - Software) 83.49 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-02'
  AND concepto = 'Harbiz'
  AND (ABS(total - 83.49) < 0.01 OR ABS(base - 69) < 0.01);

-- Fila 343: 2026-05-09 "Filmaker" (ONL - Marketing) 240 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-09'
  AND concepto = 'Filmaker'
  AND (ABS(total - 240) < 0.01 OR ABS(base - 240) < 0.01);

-- Fila 352: 2026-05-11 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-11'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 353: 2026-05-12 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-12'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 356: 2026-05-13 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-13'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 358: 2026-05-14 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-14'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 359: 2026-05-14 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-14'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 367: 2026-05-20 "Meta ads" (ONL - Marketing) 30.24 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-20'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30.24) < 0.01 OR ABS(base - 30.24) < 0.01);

-- Fila 369: 2026-05-21 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-21'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 370: 2026-05-22 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-22'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 372: 2026-05-23 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-23'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 373: 2026-05-25 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-25'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 374: 2026-05-26 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-26'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 377: 2026-05-28 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-28'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 381: 2026-05-30 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-05-30'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 383: 2026-06-01 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-01'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 385: 2026-06-02 "Harbiz" (ONL - Software) 83.49 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-02'
  AND concepto = 'Harbiz'
  AND (ABS(total - 83.49) < 0.01 OR ABS(base - 69) < 0.01);

-- Fila 396: 2026-06-02 "Filmaker" (ONL - Marketing) 200 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-02'
  AND concepto = 'Filmaker'
  AND (ABS(total - 200) < 0.01 OR ABS(base - 200) < 0.01);

-- Fila 399: 2026-06-03 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-03'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 405: 2026-06-05 "Meta ads" (ONL - Marketing) 13.19 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-05'
  AND concepto = 'Meta ads'
  AND (ABS(total - 13.19) < 0.01 OR ABS(base - 13.19) < 0.01);

-- Fila 411: 2026-06-07 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-07'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 414: 2026-06-09 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-09'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 423: 2026-06-12 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-12'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 428: 2026-06-14 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-14'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 429: 2026-06-16 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-16'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 430: 2026-06-18 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-18'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 431: 2026-06-19 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-19'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 432: 2026-06-20 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-20'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 436: 2026-06-22 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-22'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 437: 2026-06-23 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-23'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 439: 2026-06-25 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-25'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 440: 2026-06-26 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-26'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 441: 2026-06-27 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-27'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 442: 2026-06-28 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-28'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 445: 2026-06-29 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-06-29'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 465: 2026-07-01 "Meta ads" (ONL - Marketing) 30 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-01'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30) < 0.01 OR ABS(base - 30) < 0.01);

-- Fila 467: 2026-07-02 "Harbiz" (ONL - Software) 83.49 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-02'
  AND concepto = 'Harbiz'
  AND (ABS(total - 83.49) < 0.01 OR ABS(base - 69) < 0.01);

-- Fila 472: 2026-07-03 "Meta ads" (ONL - Marketing) 30.44 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-03'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30.44) < 0.01 OR ABS(base - 30.44) < 0.01);

-- Fila 474: 2026-07-03 "Fran Filmaker DEUDA" (ONL - Marketing) 80 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-03'
  AND concepto = 'Fran Filmaker DEUDA'
  AND (ABS(total - 80) < 0.01 OR ABS(base - 80) < 0.01);

-- Fila 476: 2026-07-05 "Meta ads" (ONL - Marketing) 12.99 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-05'
  AND concepto = 'Meta ads'
  AND (ABS(total - 12.99) < 0.01 OR ABS(base - 12.99) < 0.01);

-- Fila 478: 2026-07-07 "Meta ads" (ONL - Marketing) 30.85 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-07'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30.85) < 0.01 OR ABS(base - 30.85) < 0.01);

-- Fila 481: 2026-07-10 "Meta ads" (ONL - Marketing) 30.84 €
UPDATE gastos SET canal = 'online'
WHERE fecha = '2026-07-10'
  AND concepto = 'Meta ads'
  AND (ABS(total - 30.84) < 0.01 OR ABS(base - 30.84) < 0.01);

COMMIT;

-- Comprobación: gastos marcados online por mes
SELECT DATE_TRUNC('month', fecha)::DATE AS mes, COUNT(*) AS n, SUM(total) AS total
FROM gastos WHERE canal = 'online' GROUP BY 1 ORDER BY 1;
