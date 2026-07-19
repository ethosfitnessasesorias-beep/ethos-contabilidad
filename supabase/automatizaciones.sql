-- =====================================================================
-- AUTOMATIZACIONES + OBJETIVOS DE KPIs
--  1) kpi_objetivos: objetivo anual por metrica y negocio (semaforo).
--  2) cron_impagos: cada lunes crea una nota con los morosos.
--  3) cron_resumen_mensual: el dia 1 crea una nota con el cierre del mes.
--  Ambas van token-gated (config_texto.cron_token) y se llaman desde
--  Vercel Cron -> /api/cron-impagos/[token] y /api/cron-resumen/[token].
-- (Aplicado por Claude via Management API; queda como registro.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS kpi_objetivos (
  anyo    INTEGER NOT NULL,
  negocio TEXT NOT NULL CHECK (negocio IN ('online','gym')),
  metrica TEXT NOT NULL,
  valor   NUMERIC(14,2) NOT NULL,
  PRIMARY KEY (anyo, negocio, metrica)
);
ALTER TABLE kpi_objetivos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acceso_autenticados ON kpi_objetivos;
CREATE POLICY acceso_autenticados ON kpi_objetivos FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON kpi_objetivos TO authenticated;
REVOKE ALL ON kpi_objetivos FROM anon;

INSERT INTO config_texto (clave, valor, descripcion) VALUES
  ('cron_token', 'a21f9c3a4183238fffd9e742aab51940', 'Token de los endpoints de cron (impagos y resumen mensual)')
ON CONFLICT (clave) DO NOTHING;

-- ---------- Nota semanal de impagos ----------
CREATE OR REPLACE FUNCTION cron_impagos(p_token TEXT) RETURNS jsonb AS $$
DECLARE v_tok TEXT; v_lista TEXT; v_total NUMERIC; v_n INT;
BEGIN
  SELECT valor INTO v_tok FROM config_texto WHERE clave = 'cron_token';
  IF v_tok IS NULL OR v_tok <> p_token THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token');
  END IF;
  SELECT count(*), coalesce(sum(pendiente), 0),
         string_agg(chr(8226) || ' ' || coalesce(cliente, concepto) || ' ' || chr(8212) || ' '
                    || to_char(pendiente, 'FM999G999G990D00') || ' ' || chr(8364)
                    || ' (' || to_char(fecha_emision, 'DD/MM') || ')', E'\n' ORDER BY pendiente DESC)
    INTO v_n, v_total, v_lista
  FROM v_morosos;
  IF v_n = 0 THEN RETURN jsonb_build_object('ok', true, 'morosos', 0, 'nota', false); END IF;
  INSERT INTO notas (titulo, contenido, color, fijada)
  VALUES (
    'Impagos pendientes (' || v_n || ')',
    'Total por cobrar: ' || to_char(v_total, 'FM999G999G990D00') || ' ' || chr(8364) || E'\n\n' || v_lista
      || E'\n\n' || 'Puedes reclamarlos con un clic desde Contabilidad ' || chr(8594) || ' Finanzas.'
      || E'\n' || '(Aviso automatico de los lunes)',
    'amber', false);
  RETURN jsonb_build_object('ok', true, 'morosos', v_n, 'nota', true);
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION cron_impagos(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cron_impagos(TEXT) TO anon, authenticated;

-- ---------- Resumen mensual (dia 1, sobre el mes anterior) ----------
CREATE OR REPLACE FUNCTION cron_resumen_mensual(p_token TEXT) RETURNS jsonb AS $$
DECLARE
  v_tok TEXT; v_ini DATE; v_fin DATE; v_titulo TEXT; v_cuerpo TEXT;
  v_fact NUMERIC; v_cobr NUMERIC; v_gasto NUMERIC; v_altas INT; v_bajas INT; v_pend NUMERIC;
  v_ben_luis NUMERIC; v_ben_david NUMERIC;
  v_meses TEXT[] := ARRAY['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
BEGIN
  SELECT valor INTO v_tok FROM config_texto WHERE clave = 'cron_token';
  IF v_tok IS NULL OR v_tok <> p_token THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token');
  END IF;
  v_ini := date_trunc('month', now())::date - INTERVAL '1 month';
  v_fin := date_trunc('month', now())::date;
  v_titulo := 'Cierre de ' || v_meses[extract(month FROM v_ini)::int] || ' ' || extract(year FROM v_ini)::int;
  IF EXISTS (SELECT 1 FROM notas WHERE titulo = v_titulo) THEN
    RETURN jsonb_build_object('ok', true, 'nota', false, 'motivo', 'ya existe');
  END IF;

  SELECT coalesce(sum(total), 0) INTO v_fact FROM facturas
    WHERE fecha_emision >= v_ini AND fecha_emision < v_fin AND computa_reparto;
  SELECT coalesce(sum(co.importe), 0) INTO v_cobr FROM cobros co
    JOIN facturas f ON f.id = co.factura_id
    WHERE co.fecha >= v_ini AND co.fecha < v_fin AND f.computa_reparto;
  SELECT coalesce(sum(g.total), 0) INTO v_gasto FROM gastos g
    JOIN categorias c ON c.id = g.categoria_id
    WHERE g.fecha >= v_ini AND g.fecha < v_fin AND c.nombre NOT ILIKE '%mina%';
  SELECT count(*) INTO v_altas FROM clientes WHERE fecha_inicio >= v_ini AND fecha_inicio < v_fin;
  SELECT count(*) INTO v_bajas FROM clientes WHERE fecha_baja >= v_ini AND fecha_baja < v_fin;
  SELECT coalesce(sum(pendiente), 0) INTO v_pend FROM v_facturas_saldo;
  SELECT coalesce(max(CASE WHEN socio = 'luis' THEN beneficio END), 0),
         coalesce(max(CASE WHEN socio = 'david' THEN beneficio END), 0)
    INTO v_ben_luis, v_ben_david
  FROM v_reparto_beneficios WHERE mes = v_ini;

  v_cuerpo :=
    'Facturado: ' || to_char(v_fact, 'FM999G999G990D00') || ' ' || chr(8364) || E'\n' ||
    'Cobrado (cash collected): ' || to_char(v_cobr, 'FM999G999G990D00') || ' ' || chr(8364) || E'\n' ||
    'Gastos (sin nominas): ' || to_char(v_gasto, 'FM999G999G990D00') || ' ' || chr(8364) || E'\n' ||
    'Resultado: ' || to_char(v_fact - v_gasto, 'FM999G999G990D00') || ' ' || chr(8364) || E'\n\n' ||
    'Reparto ' || chr(8594) || ' Luis: beneficio ' || to_char(v_ben_luis, 'FM999G990D00') || ' ' || chr(8364)
      || ' (nomina ' || to_char(GREATEST(0, v_ben_luis) * 0.8, 'FM999G990D00') || ' ' || chr(8364) || ')' || E'\n' ||
    'Reparto ' || chr(8594) || ' David: beneficio ' || to_char(v_ben_david, 'FM999G990D00') || ' ' || chr(8364)
      || ' (nomina ' || to_char(GREATEST(0, v_ben_david) * 0.8, 'FM999G990D00') || ' ' || chr(8364) || ')' || E'\n\n' ||
    'Clientes: +' || v_altas || ' altas / -' || v_bajas || ' bajas' || E'\n' ||
    'Pendiente de cobro total: ' || to_char(v_pend, 'FM999G999G990D00') || ' ' || chr(8364) || E'\n\n' ||
    'Revisa el cierre guiado en Contabilidad ' || chr(8594) || ' Cierre de mes.' || E'\n' ||
    '(Resumen automatico del dia 1)';

  INSERT INTO notas (titulo, contenido, color, fijada) VALUES (v_titulo, v_cuerpo, 'sky', true);
  RETURN jsonb_build_object('ok', true, 'nota', true, 'mes', v_titulo);
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION cron_resumen_mensual(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cron_resumen_mensual(TEXT) TO anon, authenticated;
