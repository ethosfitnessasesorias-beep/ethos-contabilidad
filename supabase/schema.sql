-- =====================================================================
-- ETHOS CONTABILIDAD — Esquema inicial (Postgres / Supabase)
-- =====================================================================
-- Principios:
--   1. Factura y Cobro son tablas SEPARADAS. La deuda es derivada.
--   2. Las categorías son un catálogo cerrado (FK, no texto libre).
--   3. Los porcentajes de reparto viven en `config`, no en el código.
--   4. No existen cuentas personales. Preparado para SL.
-- =====================================================================


-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------

-- A quién se le atribuye el ingreso (para el reparto de beneficios)
CREATE TYPE atribucion AS ENUM (
  'ethos',           -- grupales, merch, socios, patrocinios, aguas, multas
  'luis',
  'david',
  'alex_esteban',    -- fisioterapeuta colaborador
  'alex_guerrero'    -- entrenador colaborador
);

CREATE TYPE metodo_pago AS ENUM (
  'efectivo',
  'transferencia',
  'bizum',
  'tpv',
  'domiciliado',
  'stripe'
);

CREATE TYPE tipo_categoria AS ENUM ('gasto', 'ingreso');


-- ---------------------------------------------------------------------
-- CONFIG — constantes de negocio. NUNCA hardcodear estos valores.
-- ---------------------------------------------------------------------

CREATE TABLE config (
  clave        TEXT PRIMARY KEY,
  valor        NUMERIC(12,4) NOT NULL,
  descripcion  TEXT
);

INSERT INTO config (clave, valor, descripcion) VALUES
  ('reparto_entrenador', 0.80, 'Parte del balance individual que percibe el entrenador'),
  ('reparto_hucha',      0.20, 'Parte que va a la hucha de empresa'),
  ('reparto_hucha_luis', 0.50, 'Reparto trimestral de la hucha: parte de Luis'),
  ('reparto_hucha_david',0.50, 'Reparto trimestral de la hucha: parte de David'),
  ('fondo_fijo_caja',  300.00, 'Importe del fondo fijo de caja chica (€)'),
  ('iva_general',        0.21, 'Tipo general de IVA'),
  ('irpf_retencion',     0.07, 'Retención IRPF aplicable'),
  ('alarma_runway_meses',3.00, 'Umbral de alarma para el runway (meses)'),
  ('limite_efectivo', 1000.00, 'Límite legal de pago en efectivo B2B (Ley 11/2021)');


-- ---------------------------------------------------------------------
-- CUENTAS — solo 4. No hay cuentas personales.
-- ---------------------------------------------------------------------

CREATE TABLE cuentas (
  id           SMALLSERIAL PRIMARY KEY,
  codigo       TEXT UNIQUE NOT NULL,
  nombre       TEXT NOT NULL,
  es_transito  BOOLEAN NOT NULL DEFAULT FALSE,  -- TPV y Stripe: dinero aún no liquidado
  activa       BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cuentas (codigo, nombre, es_transito) VALUES
  ('banco',  'Banco Ethos',            FALSE),
  ('caja',   'Caja chica (efectivo)',  FALSE),
  ('tpv',    'TPV (en tránsito)',      TRUE),
  ('stripe', 'Stripe (en tránsito)',   TRUE);


-- ---------------------------------------------------------------------
-- CATEGORÍAS — catálogo cerrado.
-- `es_inversion`: TRUE solo si es un activo con vida útil > 1 año.
-- `es_fijo`: gasto recurrente e ineludible (para calcular runway).
-- ---------------------------------------------------------------------

CREATE TABLE categorias (
  id            SMALLSERIAL PRIMARY KEY,
  tipo          tipo_categoria NOT NULL,
  grupo         TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  es_inversion  BOOLEAN NOT NULL DEFAULT FALSE,
  es_fijo       BOOLEAN NOT NULL DEFAULT FALSE,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (grupo, nombre)
);

INSERT INTO categorias (tipo, grupo, nombre, es_inversion, es_fijo) VALUES
  -- Personal
  ('gasto','Personal','Nóminas',                 FALSE, TRUE),
  ('gasto','Personal','Seguridad Social',        FALSE, TRUE),
  ('gasto','Personal','Cuota autónomos',         FALSE, TRUE),
  ('gasto','Personal','Gestoría',                FALSE, TRUE),
  -- Operativos / corrientes
  ('gasto','Operativo','Alquiler',               FALSE, TRUE),
  ('gasto','Operativo','Suministros',            FALSE, TRUE),
  ('gasto','Operativo','Internet y teléfono',    FALSE, TRUE),
  ('gasto','Operativo','Software',               FALSE, TRUE),
  ('gasto','Operativo','Seguros',                FALSE, TRUE),
  ('gasto','Operativo','Comisiones bancarias',   FALSE, TRUE),
  ('gasto','Operativo','Marketing',              FALSE, FALSE),
  ('gasto','Operativo','Mantenimiento',          FALSE, FALSE),
  ('gasto','Operativo','Consumibles',            FALSE, FALSE), -- papel, agua, limpieza
  -- Legales
  ('gasto','Legal','Impuestos',                  FALSE, FALSE),
  ('gasto','Legal','Revisiones obligatorias',    FALSE, FALSE),
  -- Financiación
  ('gasto','Financiación','Préstamo',            FALSE, TRUE),
  -- Inversión (activos > 1 año)
  ('gasto','Inversión','Maquinaria y material',  TRUE,  FALSE),
  ('gasto','Inversión','Obra y reformas',        TRUE,  FALSE),
  ('gasto','Inversión','Mobiliario',             TRUE,  FALSE),
  -- Ingresos
  ('ingreso','Ingreso','Entreno presencial',     FALSE, FALSE),
  ('ingreso','Ingreso','Entreno online',         FALSE, FALSE),
  ('ingreso','Ingreso','Nutrición',              FALSE, FALSE),
  ('ingreso','Ingreso','Clases grupales',        FALSE, FALSE),
  ('ingreso','Ingreso','Acceso libre',           FALSE, FALSE),
  ('ingreso','Ingreso','Merchandising',          FALSE, FALSE),
  ('ingreso','Ingreso','Fisioterapia',           FALSE, FALSE),
  ('ingreso','Ingreso','Patrocinios',            FALSE, FALSE),
  ('ingreso','Ingreso','Otros',                  FALSE, FALSE);


-- ---------------------------------------------------------------------
-- SERVICIOS — catálogo de lo que vendéis. El IVA vive AQUÍ,
-- no se deduce del método de pago.
-- ---------------------------------------------------------------------

CREATE TABLE servicios (
  id             SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL,
  categoria_id   SMALLINT NOT NULL REFERENCES categorias(id),
  precio_base    NUMERIC(10,2),
  iva_pct        NUMERIC(5,4) NOT NULL DEFAULT 0.21,
  es_recurrente  BOOLEAN NOT NULL DEFAULT FALSE,  -- para el cálculo de MRR
  activo         BOOLEAN NOT NULL DEFAULT TRUE
);


-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------

CREATE TABLE clientes (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  entrenador   atribucion NOT NULL,
  origen       TEXT,               -- 'meta_ads', 'referido', 'organico', 'feria'...
  fecha_alta   DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_baja   DATE,               -- NULL = activo. Permite calcular churn.
  notas        TEXT,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_entrenador ON clientes(entrenador);
CREATE INDEX idx_clientes_activo ON clientes(fecha_baja) WHERE fecha_baja IS NULL;


-- ---------------------------------------------------------------------
-- FACTURAS — el devengo. Genera la deuda.
-- ---------------------------------------------------------------------

CREATE TABLE facturas (
  id             SERIAL PRIMARY KEY,
  cliente_id     INTEGER REFERENCES clientes(id),  -- NULL para ingresos sin cliente (merch, grupales agregados)
  servicio_id    INTEGER REFERENCES servicios(id),
  categoria_id   SMALLINT NOT NULL REFERENCES categorias(id),
  atribucion     atribucion NOT NULL,
  fecha_emision  DATE NOT NULL,
  concepto       TEXT NOT NULL,
  base           NUMERIC(10,2) NOT NULL CHECK (base >= 0),
  iva_pct        NUMERIC(5,4) NOT NULL DEFAULT 0.21,
  irpf_pct       NUMERIC(5,4) NOT NULL DEFAULT 0.00,
  es_recurrente  BOOLEAN NOT NULL DEFAULT FALSE,
  vencimiento    DATE,
  notas          TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Columnas calculadas: nunca se rellenan a mano
  iva_importe    NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base * iva_pct, 2)) STORED,
  irpf_importe   NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base * irpf_pct, 2)) STORED,
  total          NUMERIC(10,2) GENERATED ALWAYS AS
                   (ROUND(base + base * iva_pct - base * irpf_pct, 2)) STORED
);

CREATE INDEX idx_facturas_fecha ON facturas(fecha_emision);
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_atribucion ON facturas(atribucion);


-- ---------------------------------------------------------------------
-- COBROS — el cash collected. SIEMPRE ligado a una factura.
-- Un pago fraccionado = 1 factura + N cobros.
-- ---------------------------------------------------------------------

CREATE TABLE cobros (
  id           SERIAL PRIMARY KEY,
  factura_id   INTEGER NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  fecha        DATE NOT NULL,
  importe      NUMERIC(10,2) NOT NULL CHECK (importe <> 0),  -- negativo = devolución
  cuenta_id    SMALLINT NOT NULL REFERENCES cuentas(id),
  metodo       metodo_pago NOT NULL,
  notas        TEXT,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cobros_fecha ON cobros(fecha);
CREATE INDEX idx_cobros_factura ON cobros(factura_id);


-- ---------------------------------------------------------------------
-- GASTOS
-- ---------------------------------------------------------------------

CREATE TABLE gastos (
  id            SERIAL PRIMARY KEY,
  fecha         DATE NOT NULL,
  concepto      TEXT NOT NULL,
  proveedor     TEXT,
  categoria_id  SMALLINT NOT NULL REFERENCES categorias(id),
  cuenta_id     SMALLINT NOT NULL REFERENCES cuentas(id),
  imputado_a    atribucion NOT NULL DEFAULT 'ethos',  -- gasto compartido o individual
  base          NUMERIC(10,2) NOT NULL CHECK (base >= 0),
  iva_pct       NUMERIC(5,4) NOT NULL DEFAULT 0.21,
  iva_soportado NUMERIC(10,2) NOT NULL DEFAULT 0,     -- 0 si no deducible
  deducible     BOOLEAN NOT NULL DEFAULT TRUE,
  tiene_factura BOOLEAN NOT NULL DEFAULT FALSE,       -- sin factura => no deducible
  url_factura   TEXT,                                 -- Supabase Storage
  notas         TEXT,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  total         NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base + base * iva_pct, 2)) STORED,

  -- Un gasto sin factura no puede ser deducible
  CONSTRAINT chk_deducible_requiere_factura
    CHECK (NOT deducible OR tiene_factura)
);

CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_gastos_categoria ON gastos(categoria_id);


-- ---------------------------------------------------------------------
-- TRASPASOS — movimientos entre cuentas propias. NO son negocio.
-- ---------------------------------------------------------------------

CREATE TABLE traspasos (
  id                 SERIAL PRIMARY KEY,
  fecha              DATE NOT NULL,
  cuenta_origen_id   SMALLINT NOT NULL REFERENCES cuentas(id),
  cuenta_destino_id  SMALLINT NOT NULL REFERENCES cuentas(id),
  importe            NUMERIC(10,2) NOT NULL CHECK (importe > 0),
  motivo             TEXT,
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_cuentas_distintas CHECK (cuenta_origen_id <> cuenta_destino_id)
);


-- ---------------------------------------------------------------------
-- HUCHA — movimientos explícitos. Las inversiones RESTAN de la hucha.
-- ---------------------------------------------------------------------

CREATE TABLE hucha_movimientos (
  id          SERIAL PRIMARY KEY,
  fecha       DATE NOT NULL,
  concepto    TEXT NOT NULL,
  importe     NUMERIC(10,2) NOT NULL,  -- + aportación mensual del 20%, − inversión o reparto
  gasto_id    INTEGER REFERENCES gastos(id),  -- si viene de una inversión
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================================
-- VISTAS — todo lo derivado se calcula. Nadie rellena estos números.
-- =====================================================================

-- Deuda por factura (base de la lista de morosos)
CREATE VIEW v_facturas_saldo AS
SELECT
  f.id,
  f.cliente_id,
  c.nombre           AS cliente,
  f.atribucion,
  f.fecha_emision,
  f.vencimiento,
  f.concepto,
  f.total,
  COALESCE(SUM(co.importe), 0)            AS cobrado,
  f.total - COALESCE(SUM(co.importe), 0)  AS pendiente
FROM facturas f
LEFT JOIN clientes c ON c.id = f.cliente_id
LEFT JOIN cobros   co ON co.factura_id = f.id
GROUP BY f.id, c.nombre;


-- Morosos: solo lo que realmente está pendiente
CREATE VIEW v_morosos AS
SELECT *
FROM v_facturas_saldo
WHERE pendiente > 0.01
ORDER BY vencimiento NULLS LAST, pendiente DESC;


-- Facturación mensual por atribución (devengo)
CREATE VIEW v_facturacion_mensual AS
SELECT
  DATE_TRUNC('month', fecha_emision)::DATE AS mes,
  atribucion,
  SUM(base)  AS base,
  SUM(total) AS total
FROM facturas
GROUP BY 1, 2;


-- Cash collected mensual por atribución (caja)
CREATE VIEW v_cash_collected_mensual AS
SELECT
  DATE_TRUNC('month', co.fecha)::DATE AS mes,
  f.atribucion,
  SUM(co.importe) AS cobrado
FROM cobros co
JOIN facturas f ON f.id = co.factura_id
GROUP BY 1, 2;


-- Saldo real por cuenta (cobros + traspasos entrantes − gastos − traspasos salientes)
CREATE VIEW v_saldo_cuentas AS
SELECT
  cu.id,
  cu.codigo,
  cu.nombre,
  cu.es_transito,
    COALESCE((SELECT SUM(importe) FROM cobros    WHERE cuenta_id = cu.id), 0)
  - COALESCE((SELECT SUM(total)   FROM gastos    WHERE cuenta_id = cu.id), 0)
  + COALESCE((SELECT SUM(importe) FROM traspasos WHERE cuenta_destino_id = cu.id), 0)
  - COALESCE((SELECT SUM(importe) FROM traspasos WHERE cuenta_origen_id  = cu.id), 0)
    AS saldo
FROM cuentas cu
WHERE cu.activa;


-- Gasto fijo mensual medio (últimos 3 meses) — base del runway
CREATE VIEW v_gasto_fijo_mensual AS
SELECT COALESCE(SUM(g.total) / 3.0, 0) AS gasto_fijo_mensual
FROM gastos g
JOIN categorias cat ON cat.id = g.categoria_id
WHERE cat.es_fijo
  AND g.fecha >= (CURRENT_DATE - INTERVAL '3 months');


-- IVA e IRPF pendientes del trimestre en curso
CREATE VIEW v_impuestos_pendientes AS
SELECT
    COALESCE((SELECT SUM(iva_importe) FROM facturas
              WHERE DATE_TRUNC('quarter', fecha_emision) = DATE_TRUNC('quarter', CURRENT_DATE)), 0)
  - COALESCE((SELECT SUM(iva_soportado) FROM gastos
              WHERE deducible
                AND DATE_TRUNC('quarter', fecha) = DATE_TRUNC('quarter', CURRENT_DATE)), 0)
    AS iva_pendiente,
    COALESCE((SELECT SUM(irpf_importe) FROM facturas
              WHERE DATE_TRUNC('quarter', fecha_emision) = DATE_TRUNC('quarter', CURRENT_DATE)), 0)
    AS irpf_pendiente;


-- Hucha acumulada real
CREATE VIEW v_hucha AS
SELECT COALESCE(SUM(importe), 0) AS hucha_actual FROM hucha_movimientos;


-- KPIs — las 5 métricas del dashboard. Nada más.
CREATE VIEW v_kpis AS
SELECT
  caja.total                                        AS caja_total,
  imp.iva_pendiente,
  imp.irpf_pendiente,
  h.hucha_actual,
  caja.total - imp.iva_pendiente
             - imp.irpf_pendiente
             - h.hucha_actual                       AS caja_libre,
  gf.gasto_fijo_mensual,
  CASE WHEN gf.gasto_fijo_mensual > 0
       THEN ROUND((caja.total - imp.iva_pendiente - imp.irpf_pendiente - h.hucha_actual)
                  / gf.gasto_fijo_mensual, 1)
  END                                               AS runway_meses,
  CASE WHEN gf.gasto_fijo_mensual > 0
       THEN ROUND(mrr.mrr / gf.gasto_fijo_mensual, 2)
  END                                               AS cobertura_fijos,
  mrr.mrr,
  ef.pct_efectivo
FROM
  (SELECT SUM(saldo) AS total FROM v_saldo_cuentas) caja,
  v_impuestos_pendientes imp,
  v_hucha h,
  v_gasto_fijo_mensual gf,
  -- MRR: cobros recurrentes del mes en curso
  (SELECT COALESCE(SUM(co.importe), 0) AS mrr
   FROM cobros co JOIN facturas f ON f.id = co.factura_id
   WHERE f.es_recurrente
     AND DATE_TRUNC('month', co.fecha) = DATE_TRUNC('month', CURRENT_DATE)) mrr,
  -- % de ingresos en efectivo (mes en curso)
  (SELECT CASE WHEN SUM(importe) > 0
            THEN ROUND(100.0 * SUM(importe) FILTER (WHERE metodo = 'efectivo')
                       / SUM(importe), 1)
          END AS pct_efectivo
   FROM cobros
   WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)) ef;


-- Reparto mensual: balance individual y split 80/20 (parámetros desde `config`)
CREATE VIEW v_reparto_mensual AS
WITH params AS (
  SELECT
    (SELECT valor FROM config WHERE clave = 'reparto_entrenador') AS pct_entrenador,
    (SELECT valor FROM config WHERE clave = 'reparto_hucha')      AS pct_hucha
),
cash AS (
  SELECT mes, atribucion, cobrado FROM v_cash_collected_mensual
),
gasto_corriente AS (   -- gasto SIN inversión, imputado
  SELECT
    DATE_TRUNC('month', g.fecha)::DATE AS mes,
    g.imputado_a AS atribucion,
    SUM(g.total) AS gasto
  FROM gastos g
  JOIN categorias cat ON cat.id = g.categoria_id
  WHERE NOT cat.es_inversion
  GROUP BY 1, 2
)
SELECT
  c.mes,
  c.atribucion,
  c.cobrado,
  COALESCE(gc.gasto, 0)                                     AS gasto,
  c.cobrado - COALESCE(gc.gasto, 0)                         AS balance,
  ROUND((c.cobrado - COALESCE(gc.gasto, 0)) * p.pct_entrenador, 2) AS a_entrenador,
  ROUND((c.cobrado - COALESCE(gc.gasto, 0)) * p.pct_hucha, 2)      AS a_hucha
FROM cash c
CROSS JOIN params p
LEFT JOIN gasto_corriente gc
  ON gc.mes = c.mes AND gc.atribucion = c.atribucion;
