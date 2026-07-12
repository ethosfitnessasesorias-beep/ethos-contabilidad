-- =====================================================================
-- CRM + DESGLOSE ONLINE / PRESENCIAL
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CANAL (online / presencial) en las facturas
-- ---------------------------------------------------------------------

-- Marca en el catálogo qué categorías son de negocio online
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS es_online BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE categorias SET es_online = TRUE  WHERE grupo = 'Ingreso' AND nombre = 'Entreno online';
UPDATE categorias SET es_online = FALSE WHERE grupo = 'Ingreso' AND nombre <> 'Entreno online';

-- Canal de cada factura. Se rellena al apuntar; para el histórico se
-- deriva de la categoría (online solo lo claramente online).
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS canal TEXT
  CHECK (canal IN ('online', 'presencial'));

UPDATE facturas f
SET canal = CASE WHEN c.es_online THEN 'online' ELSE 'presencial' END
FROM categorias c
WHERE c.id = f.categoria_id AND f.canal IS NULL;

-- Canal también en clientes (para su ficha y filtros); no obligatorio
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS canal TEXT
  CHECK (canal IN ('online', 'presencial'));
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS origen TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'cliente';


-- ---------------------------------------------------------------------
-- 2. DEALS — el pipeline de ventas
-- Un deal es una oportunidad: una posible venta a un contacto/cliente.
-- Etapas abiertas: lead, contactado, agendado.
-- Etapas cerradas: ganado, perdido.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS deals (
  id                SERIAL PRIMARY KEY,
  cliente_id        INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  titulo            TEXT NOT NULL,
  canal             TEXT NOT NULL DEFAULT 'presencial' CHECK (canal IN ('online', 'presencial')),
  importe_estimado  NUMERIC(10,2) NOT NULL DEFAULT 0,
  etapa             TEXT NOT NULL DEFAULT 'lead'
                      CHECK (etapa IN ('lead', 'contactado', 'agendado', 'ganado', 'perdido')),
  responsable       atribucion NOT NULL DEFAULT 'ethos',
  origen            TEXT,
  notas             TEXT,
  fecha_alta        DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre      DATE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_etapa ON deals(etapa);
CREATE INDEX IF NOT EXISTS idx_deals_canal ON deals(canal);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON deals;
CREATE POLICY acceso_autenticados ON deals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON deals FROM anon;


-- ---------------------------------------------------------------------
-- 3. ACTIVIDADES — llamadas, visitas, tareas ligadas a un deal/cliente
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS actividades (
  id           SERIAL PRIMARY KEY,
  deal_id      INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  cliente_id   INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL DEFAULT 'tarea'
                 CHECK (tipo IN ('llamada', 'visita', 'email', 'whatsapp', 'tarea', 'nota')),
  titulo       TEXT NOT NULL,
  cuando       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hecha        BOOLEAN NOT NULL DEFAULT FALSE,
  responsable  atribucion NOT NULL DEFAULT 'ethos',
  notas        TEXT,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actividades_cuando ON actividades(cuando);

ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON actividades;
CREATE POLICY acceso_autenticados ON actividades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON actividades FROM anon;


-- =====================================================================
-- 4. VISTA DEL DASHBOARD por canal (mes en curso) — todo calculado
-- =====================================================================

CREATE OR REPLACE VIEW v_dashboard_negocio AS
WITH canales AS (
  SELECT unnest(ARRAY['online', 'presencial']) AS canal
),
facturacion AS (
  SELECT canal, SUM(total) AS facturado
  FROM facturas
  WHERE DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY canal
),
cash AS (
  SELECT f.canal, SUM(co.importe) AS cobrado
  FROM cobros co
  JOIN facturas f ON f.id = co.factura_id
  WHERE DATE_TRUNC('month', co.fecha) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY f.canal
),
leads AS (
  SELECT canal, COUNT(*) AS leads_mes
  FROM deals
  WHERE DATE_TRUNC('month', fecha_alta) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY canal
),
cierre AS (
  SELECT
    canal,
    COUNT(*) FILTER (WHERE etapa = 'ganado')                          AS ganados,
    COUNT(*) FILTER (WHERE etapa IN ('ganado', 'perdido'))            AS cerrados
  FROM deals
  WHERE DATE_TRUNC('month', COALESCE(fecha_cierre, fecha_alta)) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY canal
)
SELECT
  c.canal,
  COALESCE(fa.facturado, 0)  AS facturado,
  COALESCE(ca.cobrado, 0)    AS cobrado,
  COALESCE(le.leads_mes, 0)  AS leads_mes,
  CASE WHEN COALESCE(ci.cerrados, 0) > 0
       THEN ROUND(100.0 * ci.ganados / ci.cerrados, 0)
       ELSE NULL END         AS tasa_cierre
FROM canales c
LEFT JOIN facturacion fa ON fa.canal = c.canal
LEFT JOIN cash        ca ON ca.canal = c.canal
LEFT JOIN leads       le ON le.canal = c.canal
LEFT JOIN cierre      ci ON ci.canal = c.canal;

REVOKE ALL ON v_dashboard_negocio FROM anon;


-- Conteo del pipeline por etapa (para el dashboard y la pantalla Pipeline)
CREATE OR REPLACE VIEW v_pipeline_conteo AS
SELECT etapa, canal, COUNT(*) AS n, COALESCE(SUM(importe_estimado), 0) AS importe
FROM deals
WHERE etapa IN ('lead', 'contactado', 'agendado')
GROUP BY etapa, canal;

REVOKE ALL ON v_pipeline_conteo FROM anon;
