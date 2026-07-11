-- =====================================================================
-- ETHOS CONTABILIDAD — Datos iniciales + seguridad (RLS)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > pegar > Run
-- Es idempotente: se puede ejecutar varias veces sin duplicar nada.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. DATOS INICIALES
-- ---------------------------------------------------------------------

INSERT INTO config (clave, valor, descripcion) VALUES
  ('reparto_entrenador', 0.80, 'Parte del balance individual que percibe el entrenador'),
  ('reparto_hucha',      0.20, 'Parte que va a la hucha de empresa'),
  ('reparto_hucha_luis', 0.50, 'Reparto trimestral de la hucha: parte de Luis'),
  ('reparto_hucha_david',0.50, 'Reparto trimestral de la hucha: parte de David'),
  ('fondo_fijo_caja',  300.00, 'Importe del fondo fijo de caja chica (€)'),
  ('iva_general',        0.21, 'Tipo general de IVA'),
  ('irpf_retencion',     0.07, 'Retención IRPF aplicable'),
  ('alarma_runway_meses',3.00, 'Umbral de alarma para el runway (meses)'),
  ('limite_efectivo', 1000.00, 'Límite legal de pago en efectivo B2B (Ley 11/2021)')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO cuentas (codigo, nombre, es_transito) VALUES
  ('banco',  'Banco Ethos',            FALSE),
  ('caja',   'Caja chica (efectivo)',  FALSE),
  ('tpv',    'TPV (en tránsito)',      TRUE),
  ('stripe', 'Stripe (en tránsito)',   TRUE)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO categorias (tipo, grupo, nombre, es_inversion, es_fijo) VALUES
  ('gasto','Personal','Nóminas',                 FALSE, TRUE),
  ('gasto','Personal','Seguridad Social',        FALSE, TRUE),
  ('gasto','Personal','Cuota autónomos',         FALSE, TRUE),
  ('gasto','Personal','Gestoría',                FALSE, TRUE),
  ('gasto','Operativo','Alquiler',               FALSE, TRUE),
  ('gasto','Operativo','Suministros',            FALSE, TRUE),
  ('gasto','Operativo','Internet y teléfono',    FALSE, TRUE),
  ('gasto','Operativo','Software',               FALSE, TRUE),
  ('gasto','Operativo','Seguros',                FALSE, TRUE),
  ('gasto','Operativo','Comisiones bancarias',   FALSE, TRUE),
  ('gasto','Operativo','Marketing',              FALSE, FALSE),
  ('gasto','Operativo','Mantenimiento',          FALSE, FALSE),
  ('gasto','Operativo','Consumibles',            FALSE, FALSE),
  ('gasto','Legal','Impuestos',                  FALSE, FALSE),
  ('gasto','Legal','Revisiones obligatorias',    FALSE, FALSE),
  ('gasto','Financiación','Préstamo',            FALSE, TRUE),
  ('gasto','Inversión','Maquinaria y material',  TRUE,  FALSE),
  ('gasto','Inversión','Obra y reformas',        TRUE,  FALSE),
  ('gasto','Inversión','Mobiliario',             TRUE,  FALSE),
  ('ingreso','Ingreso','Entreno presencial',     FALSE, FALSE),
  ('ingreso','Ingreso','Entreno online',         FALSE, FALSE),
  ('ingreso','Ingreso','Nutrición',              FALSE, FALSE),
  ('ingreso','Ingreso','Clases grupales',        FALSE, FALSE),
  ('ingreso','Ingreso','Acceso libre',           FALSE, FALSE),
  ('ingreso','Ingreso','Merchandising',          FALSE, FALSE),
  ('ingreso','Ingreso','Fisioterapia',           FALSE, FALSE),
  ('ingreso','Ingreso','Patrocinios',            FALSE, FALSE),
  ('ingreso','Ingreso','Otros',                  FALSE, FALSE)
ON CONFLICT (grupo, nombre) DO NOTHING;


-- ---------------------------------------------------------------------
-- 2. SEGURIDAD (RLS)
-- Modelo: app interna. Solo usuarios con login (Luis y David) pueden
-- leer y escribir. La clave pública sin login no puede hacer NADA.
-- ---------------------------------------------------------------------

-- Activar RLS en todas las tablas (idempotente; algunas ya lo tienen)
ALTER TABLE config            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE traspasos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hucha_movimientos ENABLE ROW LEVEL SECURITY;

-- Política: acceso total para usuarios autenticados
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'config','cuentas','categorias','servicios','clientes',
    'facturas','cobros','gastos','traspasos','hucha_movimientos'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS acceso_autenticados ON %I', t);
    EXECUTE format(
      'CREATE POLICY acceso_autenticados ON %I
         FOR ALL TO authenticated
         USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Cortar todo acceso a la clave pública SIN login (tablas y vistas),
-- también para las que se creen en el futuro
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;


-- ---------------------------------------------------------------------
-- 3. COMPROBACIÓN — debe devolver 9, 4 y 28 filas
-- ---------------------------------------------------------------------

SELECT
  (SELECT COUNT(*) FROM config)     AS config,
  (SELECT COUNT(*) FROM cuentas)    AS cuentas,
  (SELECT COUNT(*) FROM categorias) AS categorias;
