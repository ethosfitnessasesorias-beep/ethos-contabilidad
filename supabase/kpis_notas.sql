-- =====================================================================
-- KPIs + NOTAS + arreglo de tesoreria:
--  1) tesoreria_ignorados: conceptos borrados que no deben volver a
--     sugerirse automaticamente.
--  2) notas: notas rapidas (sustituye al Inbox).
--  3) kpi_valores: KPIs mensuales manuales por negocio (online/gym).
--  4) kpi_diario: funnel diario de ventas (se suma al mensual).
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS tesoreria_ignorados (
  concepto  TEXT PRIMARY KEY,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notas (
  id             SERIAL PRIMARY KEY,
  titulo         TEXT NOT NULL DEFAULT '',
  contenido      TEXT NOT NULL DEFAULT '',
  color          TEXT NOT NULL DEFAULT 'zinc',
  fijada         BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_valores (
  mes     DATE NOT NULL,
  negocio TEXT NOT NULL CHECK (negocio IN ('online','gym')),
  metrica TEXT NOT NULL,
  valor   NUMERIC(14,2) NOT NULL,
  PRIMARY KEY (mes, negocio, metrica)
);

CREATE TABLE IF NOT EXISTS kpi_diario (
  fecha               DATE NOT NULL,
  negocio             TEXT NOT NULL DEFAULT 'online' CHECK (negocio IN ('online','gym')),
  bienvenidas         INTEGER NOT NULL DEFAULT 0,
  inbounds            INTEGER NOT NULL DEFAULT 0,
  agendas_bienvenidas INTEGER NOT NULL DEFAULT 0,
  agendas_inbounds    INTEGER NOT NULL DEFAULT 0,
  cierres             INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (fecha, negocio)
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['tesoreria_ignorados','notas','kpi_valores','kpi_diario'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS acceso_autenticados ON %I', t);
    EXECUTE format('CREATE POLICY acceso_autenticados ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE notas_id_seq TO authenticated;
