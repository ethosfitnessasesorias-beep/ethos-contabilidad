-- =====================================================================
-- CUOTAS Y REMESAS DE DOMICILIADOS
--  1) cuotas: catalogo de planes (precio final con IVA incluido).
--  2) clientes.cuota_id + descuentos + domiciliado.
--  3) remesas + remesa_lineas: el dia 1 se generan las facturas de los
--     domiciliados agrupadas en una remesa PENDIENTE; se revisa contra el
--     banco (lineas editables/excluibles) y al aprobar se crean los cobros.
--  4) generar_remesa(): idempotente (no duplica socios ya incluidos).
--     cron_remesa(token): la lanza el cron del dia 1.
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS cuotas (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  importe   NUMERIC(10,2) NOT NULL CHECK (importe >= 0),
  iva_pct   NUMERIC(5,4) NOT NULL DEFAULT 0.21,
  activa    BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cuota_id INTEGER REFERENCES cuotas(id) ON DELETE SET NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS descuento_pct NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS descuento_eur NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS domiciliado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS remesas (
  id          SERIAL PRIMARY KEY,
  mes         DATE NOT NULL UNIQUE,
  estado      TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada')),
  aprobada_en TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remesa_lineas (
  id         SERIAL PRIMARY KEY,
  remesa_id  INTEGER NOT NULL REFERENCES remesas(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  factura_id INTEGER REFERENCES facturas(id) ON DELETE SET NULL,
  importe    NUMERIC(10,2) NOT NULL,
  incluido   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (remesa_id, cliente_id)
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cuotas','remesas','remesa_lineas'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS acceso_autenticados ON %I', t);
    EXECUTE format('CREATE POLICY acceso_autenticados ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE cuotas_id_seq, remesas_id_seq, remesa_lineas_id_seq TO authenticated;

-- Genera (o completa) la remesa del mes: una factura por socio domiciliado
-- con cuota. Idempotente: los socios ya incluidos no se duplican.
CREATE OR REPLACE FUNCTION generar_remesa(p_mes DATE DEFAULT date_trunc('month', now())::date)
RETURNS jsonb AS $$
DECLARE
  v_remesa INT; v_cat INT; v_n INT := 0; v_total NUMERIC := 0;
  r RECORD; v_precio NUMERIC; v_base NUMERIC; v_fac INT; v_tot NUMERIC;
BEGIN
  SELECT id INTO v_cat FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1;
  IF v_cat IS NULL THEN SELECT id INTO v_cat FROM categorias WHERE tipo = 'ingreso' LIMIT 1; END IF;

  INSERT INTO remesas (mes) VALUES (p_mes) ON CONFLICT (mes) DO NOTHING;
  SELECT id INTO v_remesa FROM remesas WHERE mes = p_mes;
  IF (SELECT estado FROM remesas WHERE id = v_remesa) = 'aprobada' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'la remesa de ese mes ya esta aprobada');
  END IF;

  FOR r IN
    SELECT c.id AS cliente_id, q.nombre AS cuota_nombre, q.importe, q.iva_pct,
           c.descuento_pct, c.descuento_eur
    FROM clientes c JOIN cuotas q ON q.id = c.cuota_id
    WHERE c.domiciliado AND c.fecha_baja IS NULL AND q.activa
      AND NOT EXISTS (SELECT 1 FROM remesa_lineas rl WHERE rl.remesa_id = v_remesa AND rl.cliente_id = c.id)
  LOOP
    v_precio := GREATEST(0, round((r.importe * (1 - r.descuento_pct / 100) - r.descuento_eur) * 100) / 100);
    IF v_precio <= 0 THEN CONTINUE; END IF;
    v_base := round(v_precio / (1 + r.iva_pct), 2);
    INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, es_recurrente)
    VALUES (r.cliente_id, v_cat, 'ethos', p_mes,
            'Cuota ' || r.cuota_nombre || ' ' || to_char(p_mes, 'MM/YYYY'),
            v_base, r.iva_pct, 0, 'presencial', true)
    RETURNING id, total INTO v_fac, v_tot;
    INSERT INTO remesa_lineas (remesa_id, cliente_id, factura_id, importe) VALUES (v_remesa, r.cliente_id, v_fac, v_tot);
    v_n := v_n + 1; v_total := v_total + v_tot;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'remesa_id', v_remesa, 'nuevos', v_n, 'importe_nuevos', v_total);
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION generar_remesa(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generar_remesa(DATE) TO authenticated;

-- Envoltorio para el cron del dia 1 (token-gated, mismo token que el resumen)
CREATE OR REPLACE FUNCTION cron_remesa(p_token TEXT) RETURNS jsonb AS $$
DECLARE v_tok TEXT;
BEGIN
  SELECT valor INTO v_tok FROM config_texto WHERE clave = 'cron_token';
  IF v_tok IS NULL OR v_tok <> p_token THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token');
  END IF;
  RETURN generar_remesa();
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION cron_remesa(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cron_remesa(TEXT) TO anon, authenticated;
