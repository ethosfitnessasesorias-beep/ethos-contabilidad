-- =====================================================================
-- SISTEMA FISCAL + PERSONAS CONFIGURABLES + CANAL EN GASTOS
-- (Aplicado por Claude vía Management API; queda como registro.)
-- Orden: tirar vistas dependientes -> cambiar columnas -> recrear vistas.
-- =====================================================================

-- ---------- 0. Tirar las vistas que dependen de las columnas a cambiar ----------
DROP VIEW IF EXISTS v_morosos CASCADE;
DROP VIEW IF EXISTS v_kpis CASCADE;
DROP VIEW IF EXISTS v_reparto_mensual CASCADE;
DROP VIEW IF EXISTS v_facturas_saldo CASCADE;
DROP VIEW IF EXISTS v_facturacion_mensual CASCADE;
DROP VIEW IF EXISTS v_cash_collected_mensual CASCADE;

-- ---------- 1. PERSONAS configurables ----------
CREATE TABLE IF NOT EXISTS personas (
  codigo        TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'colaborador'
                  CHECK (tipo IN ('socio', 'colaborador', 'empleado', 'casa')),
  pct           NUMERIC(5,4) NOT NULL DEFAULT 0,
  reparto_base  TEXT NOT NULL DEFAULT 'ninguno'
                  CHECK (reparto_base IN ('balance', 'bruto_sin_iva', 'ninguno')),
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  orden         INTEGER NOT NULL DEFAULT 0
);
INSERT INTO personas (codigo, nombre, tipo, pct, reparto_base, orden) VALUES
  ('luis',          'Luis',    'socio',       0.80, 'balance',       1),
  ('david',         'David',   'socio',       0.80, 'balance',       2),
  ('alex_esteban',  'Alex E.', 'colaborador', 0.70, 'bruto_sin_iva', 3),
  ('alex_guerrero', 'Alex G.', 'colaborador', 0.70, 'bruto_sin_iva', 4),
  ('ethos',         'Ethos',   'casa',        0.00, 'ninguno',       5)
ON CONFLICT (codigo) DO NOTHING;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON personas;
CREATE POLICY acceso_autenticados ON personas FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON personas FROM anon;

-- ---------- 2. MÉTODOS DE PAGO configurables ----------
CREATE TABLE IF NOT EXISTS metodos_pago (
  codigo  TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  activo  BOOLEAN NOT NULL DEFAULT TRUE,
  orden   INTEGER NOT NULL DEFAULT 0
);
INSERT INTO metodos_pago (codigo, nombre, orden) VALUES
  ('efectivo', 'Efectivo', 1), ('transferencia', 'Transferencia', 2),
  ('bizum', 'Bizum', 3), ('tpv', 'TPV', 4),
  ('domiciliado', 'Domiciliado', 5), ('stripe', 'Stripe', 6)
ON CONFLICT (codigo) DO NOTHING;
ALTER TABLE metodos_pago ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON metodos_pago;
CREATE POLICY acceso_autenticados ON metodos_pago FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON metodos_pago FROM anon;

-- ---------- 3. Enum -> texto (quitar defaults, cambiar tipo, restaurar) ----------
ALTER TABLE gastos      ALTER COLUMN imputado_a  DROP DEFAULT;
ALTER TABLE deals       ALTER COLUMN responsable DROP DEFAULT;
ALTER TABLE actividades ALTER COLUMN responsable DROP DEFAULT;

ALTER TABLE facturas    ALTER COLUMN atribucion  TYPE TEXT USING atribucion::text;
ALTER TABLE gastos      ALTER COLUMN imputado_a  TYPE TEXT USING imputado_a::text;
ALTER TABLE deals       ALTER COLUMN responsable TYPE TEXT USING responsable::text;
ALTER TABLE actividades ALTER COLUMN responsable TYPE TEXT USING responsable::text;
ALTER TABLE clientes    ALTER COLUMN entrenador  TYPE TEXT USING entrenador::text;
ALTER TABLE cobros      ALTER COLUMN metodo      TYPE TEXT USING metodo::text;

ALTER TABLE gastos      ALTER COLUMN imputado_a  SET DEFAULT 'ethos';
ALTER TABLE deals       ALTER COLUMN responsable SET DEFAULT 'ethos';
ALTER TABLE actividades ALTER COLUMN responsable SET DEFAULT 'ethos';

-- ---------- 4. IRPF y canal en gastos ----------
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS irpf_pct NUMERIC(5,4) NOT NULL DEFAULT 0;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS irpf_soportado NUMERIC(10,2)
  GENERATED ALWAYS AS (ROUND(base * irpf_pct, 2)) STORED;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS canal TEXT
  CHECK (canal IN ('online', 'presencial')) DEFAULT 'presencial';
UPDATE gastos SET canal = 'presencial' WHERE canal IS NULL;

-- ---------- 5. Recrear vistas ----------
CREATE VIEW v_facturas_saldo AS
SELECT f.id, f.cliente_id, c.nombre AS cliente, f.atribucion, f.fecha_emision,
  f.vencimiento, f.concepto, f.total,
  COALESCE(SUM(co.importe), 0)                          AS cobrado,
  f.total - COALESCE(SUM(co.importe), 0) - f.condonado  AS pendiente,
  f.condonado
FROM facturas f
LEFT JOIN clientes c ON c.id = f.cliente_id
LEFT JOIN cobros   co ON co.factura_id = f.id
GROUP BY f.id, c.nombre;

CREATE VIEW v_morosos AS
SELECT * FROM v_facturas_saldo WHERE pendiente > 0.01
ORDER BY vencimiento NULLS LAST, pendiente DESC;

CREATE VIEW v_facturacion_mensual AS
SELECT DATE_TRUNC('month', fecha_emision)::DATE AS mes, atribucion,
  SUM(base) AS base, SUM(total) AS total
FROM facturas GROUP BY 1, 2;

CREATE VIEW v_cash_collected_mensual AS
SELECT DATE_TRUNC('month', co.fecha)::DATE AS mes, f.atribucion, SUM(co.importe) AS cobrado
FROM cobros co JOIN facturas f ON f.id = co.factura_id
GROUP BY 1, 2;

CREATE OR REPLACE VIEW v_saldo_cuentas AS
SELECT cu.id, cu.codigo, cu.nombre, cu.es_transito, cu.saldo_inicial,
  cu.saldo_inicial
  + COALESCE((SELECT SUM(importe) FROM cobros WHERE cuenta_id = cu.id), 0)
  - COALESCE((SELECT SUM(total - irpf_soportado) FROM gastos WHERE cuenta_id = cu.id), 0)
  + COALESCE((SELECT SUM(importe) FROM traspasos WHERE cuenta_destino_id = cu.id), 0)
  - COALESCE((SELECT SUM(importe) FROM traspasos WHERE cuenta_origen_id = cu.id), 0)
    AS saldo
FROM cuentas cu WHERE cu.activa;

CREATE OR REPLACE VIEW v_impuestos_pendientes AS
SELECT
    COALESCE((SELECT SUM(iva_importe) FROM facturas
              WHERE DATE_TRUNC('quarter', fecha_emision) = DATE_TRUNC('quarter', CURRENT_DATE)), 0)
  - COALESCE((SELECT SUM(iva_soportado) FROM gastos
              WHERE deducible AND DATE_TRUNC('quarter', fecha) = DATE_TRUNC('quarter', CURRENT_DATE)), 0)
    AS iva_pendiente,
    COALESCE((SELECT SUM(irpf_soportado) FROM gastos
              WHERE DATE_TRUNC('quarter', fecha) = DATE_TRUNC('quarter', CURRENT_DATE)), 0)
    AS irpf_pendiente;

CREATE VIEW v_reparto_mensual AS
WITH cash AS (SELECT mes, atribucion, cobrado FROM v_cash_collected_mensual),
cash_sin_iva AS (
  SELECT DATE_TRUNC('month', co.fecha)::DATE AS mes, f.atribucion,
    SUM(CASE WHEN f.total > 0 THEN co.importe * f.base / f.total ELSE co.importe END) AS bruto
  FROM cobros co JOIN facturas f ON f.id = co.factura_id GROUP BY 1, 2
),
gasto_corriente AS (
  SELECT DATE_TRUNC('month', g.fecha)::DATE AS mes, g.imputado_a AS atribucion, SUM(g.total) AS gasto
  FROM gastos g JOIN categorias cat ON cat.id = g.categoria_id
  WHERE NOT cat.es_inversion GROUP BY 1, 2
)
SELECT c.mes, c.atribucion, c.cobrado, COALESCE(gc.gasto, 0) AS gasto,
  CASE WHEN p.reparto_base = 'bruto_sin_iva' THEN ROUND(COALESCE(csi.bruto, 0), 2)
       ELSE c.cobrado - COALESCE(gc.gasto, 0) END AS balance,
  CASE WHEN p.reparto_base = 'bruto_sin_iva' THEN ROUND(COALESCE(csi.bruto, 0) * p.pct, 2)
       WHEN p.reparto_base = 'balance'       THEN ROUND((c.cobrado - COALESCE(gc.gasto, 0)) * p.pct, 2)
       ELSE 0 END AS a_entrenador,
  CASE WHEN p.reparto_base = 'bruto_sin_iva' THEN ROUND(COALESCE(csi.bruto, 0) * (1 - p.pct), 2)
       WHEN p.reparto_base = 'balance'       THEN ROUND((c.cobrado - COALESCE(gc.gasto, 0)) * (1 - p.pct), 2)
       ELSE c.cobrado - COALESCE(gc.gasto, 0) END AS a_hucha
FROM cash c
LEFT JOIN personas p         ON p.codigo = c.atribucion
LEFT JOIN gasto_corriente gc ON gc.mes = c.mes AND gc.atribucion = c.atribucion
LEFT JOIN cash_sin_iva csi    ON csi.mes = c.mes AND csi.atribucion = c.atribucion;

CREATE VIEW v_kpis AS
SELECT
  caja.total AS caja_total,
  imp.iva_pendiente, imp.irpf_pendiente, h.hucha_actual,
  caja.total - imp.iva_pendiente - imp.irpf_pendiente - h.hucha_actual AS caja_libre,
  gf.gasto_fijo_mensual,
  CASE WHEN gf.gasto_fijo_mensual > 0
       THEN ROUND((caja.total - imp.iva_pendiente - imp.irpf_pendiente - h.hucha_actual) / gf.gasto_fijo_mensual, 1) END AS runway_meses,
  CASE WHEN gf.gasto_fijo_mensual > 0 THEN ROUND(mrr.mrr / gf.gasto_fijo_mensual, 2) END AS cobertura_fijos,
  mrr.mrr, ef.pct_efectivo
FROM
  (SELECT SUM(saldo) AS total FROM v_saldo_cuentas) caja,
  v_impuestos_pendientes imp, v_hucha h, v_gasto_fijo_mensual gf,
  (SELECT COALESCE(SUM(co.importe), 0) AS mrr FROM cobros co JOIN facturas f ON f.id = co.factura_id
   WHERE f.es_recurrente AND DATE_TRUNC('month', co.fecha) = DATE_TRUNC('month', CURRENT_DATE)) mrr,
  (SELECT CASE WHEN SUM(importe) > 0
            THEN ROUND(100.0 * SUM(importe) FILTER (WHERE metodo = 'efectivo') / SUM(importe), 1) END AS pct_efectivo
   FROM cobros WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)) ef;

CREATE OR REPLACE VIEW v_gastos_detalle AS
SELECT DATE_TRUNC('month', g.fecha)::DATE AS mes, cat.grupo AS categoria, cat.nombre AS subcategoria,
  cat.es_inversion, COALESCE(g.canal, 'presencial') AS canal,
  SUM(g.total) AS total, SUM(g.base) AS base, COUNT(*) AS n
FROM gastos g JOIN categorias cat ON cat.id = g.categoria_id
GROUP BY 1, 2, 3, 4, 5;

REVOKE ALL ON v_morosos, v_facturacion_mensual, v_cash_collected_mensual,
  v_reparto_mensual, v_kpis, v_facturas_saldo, v_gastos_detalle FROM anon;
