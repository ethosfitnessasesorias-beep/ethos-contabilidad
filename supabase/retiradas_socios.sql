-- Retiradas de socios vs Sueldos y salarios (13/11/2026)
-- Generado desde la sesión: cambios aplicados vía Management API.

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS es_retirada boolean NOT NULL DEFAULT false;

UPDATE categorias SET nombre='Retiradas de socios', es_retirada=true, es_fijo=false WHERE id=1;

INSERT INTO categorias (tipo,grupo,nombre,es_fijo,es_inversion,es_retirada,activa) SELECT 'gasto','Personal','Sueldos y salarios',true,false,false,true WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Sueldos y salarios') RETURNING id;

UPDATE gastos SET categoria_id=62, es_fijo=true WHERE categoria_id=1 AND concepto ~* 'alex|irene|fisio|fran' RETURNING id,fecha,concepto,total;

UPDATE gastos SET es_fijo=false WHERE categoria_id=1;

UPDATE categorias SET es_fijo=false WHERE nombre='Inversión financiera';

UPDATE gastos SET es_fijo=false WHERE categoria_id=(SELECT id FROM categorias WHERE nombre='Inversión financiera');

INSERT INTO config (clave,valor,descripcion) VALUES ('coste_gestion_presencial',3000,'Coste mensual estimado (coste empresa) de pagar a alguien por lo que hoy hacen los socios en el gym. Pro-forma de delegación en P&G.'),('coste_gestion_online',0,'Idem para online.') ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE VIEW v_reparto_beneficios AS  WITH scob AS (
         SELECT date_trunc('month'::text, co.fecha::timestamp with time zone)::date AS mes,
            f.atribucion AS a,
            sum(co.importe) AS v
           FROM cobros co
             JOIN facturas f ON f.id = co.factura_id
          WHERE (f.atribucion = ANY (ARRAY['luis'::text, 'david'::text])) AND f.computa_reparto
          GROUP BY (date_trunc('month'::text, co.fecha::timestamp with time zone)::date), f.atribucion
        ), sivarep AS (
         SELECT date_trunc('month'::text, facturas.fecha_emision::timestamp with time zone)::date AS mes,
            facturas.atribucion AS a,
            sum(facturas.iva_importe) AS v
           FROM facturas
          WHERE facturas.computa_impuestos AND (facturas.atribucion = ANY (ARRAY['luis'::text, 'david'::text]))
          GROUP BY (date_trunc('month'::text, facturas.fecha_emision::timestamp with time zone)::date), facturas.atribucion
        ), sivasop AS (
         SELECT date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date AS mes,
            gastos.imputado_a AS a,
            sum(gastos.iva_soportado) AS v
           FROM gastos
          WHERE gastos.deducible AND (gastos.imputado_a = ANY (ARRAY['luis'::text, 'david'::text]))
          GROUP BY (date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date), gastos.imputado_a
        ), sirpf AS (
         SELECT date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date AS mes,
            gastos.imputado_a AS a,
            sum(gastos.irpf_soportado) AS v
           FROM gastos
          WHERE gastos.imputado_a = ANY (ARRAY['luis'::text, 'david'::text])
          GROUP BY (date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date), gastos.imputado_a
        ), sgasto AS (
         SELECT date_trunc('month'::text, g.fecha::timestamp with time zone)::date AS mes,
            g.imputado_a AS a,
            sum(g.total) AS v
           FROM gastos g
             JOIN categorias c ON c.id = g.categoria_id
          WHERE NOT c.es_inversion AND NOT c.es_retirada AND (g.imputado_a = ANY (ARRAY['luis'::text, 'david'::text]))
          GROUP BY (date_trunc('month'::text, g.fecha::timestamp with time zone)::date), g.imputado_a
        ), ecob AS (
         SELECT date_trunc('month'::text, co.fecha::timestamp with time zone)::date AS mes,
            sum(
                CASE
                    WHEN f.atribucion = 'ethos'::text THEN co.importe
                    ELSE 0.30 * co.importe * f.base / NULLIF(f.total, 0::numeric)
                END) AS v
           FROM cobros co
             JOIN facturas f ON f.id = co.factura_id
          WHERE (f.atribucion = ANY (ARRAY['ethos'::text, 'alex_esteban'::text, 'alex_guerrero'::text])) AND f.computa_reparto
          GROUP BY (date_trunc('month'::text, co.fecha::timestamp with time zone)::date)
        ), eivarep AS (
         SELECT date_trunc('month'::text, facturas.fecha_emision::timestamp with time zone)::date AS mes,
            sum(facturas.iva_importe) AS v
           FROM facturas
          WHERE facturas.computa_impuestos AND facturas.atribucion = 'ethos'::text
          GROUP BY (date_trunc('month'::text, facturas.fecha_emision::timestamp with time zone)::date)
        ), eivasop AS (
         SELECT date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date AS mes,
            sum(gastos.iva_soportado) AS v
           FROM gastos
          WHERE gastos.deducible AND gastos.imputado_a = 'ethos'::text
          GROUP BY (date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date)
        ), eirpf AS (
         SELECT date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date AS mes,
            sum(gastos.irpf_soportado) AS v
           FROM gastos
          WHERE gastos.imputado_a = 'ethos'::text
          GROUP BY (date_trunc('month'::text, gastos.fecha::timestamp with time zone)::date)
        ), egasto AS (
         SELECT date_trunc('month'::text, g.fecha::timestamp with time zone)::date AS mes,
            sum(g.total) AS v
           FROM gastos g
             JOIN categorias c ON c.id = g.categoria_id
          WHERE NOT c.es_inversion AND NOT c.es_retirada AND g.imputado_a = 'ethos'::text
          GROUP BY (date_trunc('month'::text, g.fecha::timestamp with time zone)::date)
        ), meses AS (
         SELECT DISTINCT z.mes
           FROM ( SELECT scob.mes
                   FROM scob
                UNION
                 SELECT ecob.mes
                   FROM ecob
                UNION
                 SELECT sgasto.mes
                   FROM sgasto
                UNION
                 SELECT egasto.mes
                   FROM egasto) z
        ), base AS (
         SELECT m.mes,
            v.s AS socio
           FROM meses m
             CROSS JOIN ( VALUES ('luis'::text), ('david'::text)) v(s)
        )
 SELECT b.mes,
    b.socio,
    round(COALESCE(sc.v, 0::numeric), 2) AS cobrado_propio,
    round(COALESCE(ec.v, 0::numeric) / 2::numeric, 2) AS cobrado_ethos,
    round(GREATEST(0::numeric, COALESCE(sir.v, 0::numeric) - COALESCE(sis.v, 0::numeric)), 2) AS iva_propio,
    round(GREATEST(0::numeric, COALESCE(eir.v, 0::numeric) - COALESCE(eis.v, 0::numeric)) / 2::numeric, 2) AS iva_ethos,
    round(COALESCE(sr.v, 0::numeric), 2) AS irpf_propio,
    round(COALESCE(erp.v, 0::numeric) / 2::numeric, 2) AS irpf_ethos,
    round(COALESCE(sg.v, 0::numeric), 2) AS gasto_propio,
    round(COALESCE(eg.v, 0::numeric) / 2::numeric, 2) AS gasto_ethos,
    round(COALESCE(sc.v, 0::numeric) + COALESCE(ec.v, 0::numeric) / 2::numeric - (GREATEST(0::numeric, COALESCE(sir.v, 0::numeric) - COALESCE(sis.v, 0::numeric)) + COALESCE(sr.v, 0::numeric) + COALESCE(sg.v, 0::numeric)) - (GREATEST(0::numeric, COALESCE(eir.v, 0::numeric) - COALESCE(eis.v, 0::numeric)) + COALESCE(erp.v, 0::numeric) + COALESCE(eg.v, 0::numeric)) / 2::numeric, 2) AS beneficio
   FROM base b
     LEFT JOIN scob sc ON sc.mes = b.mes AND sc.a = b.socio
     LEFT JOIN ecob ec ON ec.mes = b.mes
     LEFT JOIN sivarep sir ON sir.mes = b.mes AND sir.a = b.socio
     LEFT JOIN sivasop sis ON sis.mes = b.mes AND sis.a = b.socio
     LEFT JOIN sirpf sr ON sr.mes = b.mes AND sr.a = b.socio
     LEFT JOIN sgasto sg ON sg.mes = b.mes AND sg.a = b.socio
     LEFT JOIN eivarep eir ON eir.mes = b.mes
     LEFT JOIN eivasop eis ON eis.mes = b.mes
     LEFT JOIN eirpf erp ON erp.mes = b.mes
     LEFT JOIN egasto eg ON eg.mes = b.mes
  WHERE (COALESCE(sc.v, 0::numeric) + COALESCE(sg.v, 0::numeric) + COALESCE(ec.v, 0::numeric) + COALESCE(eg.v, 0::numeric)) <> 0::numeric;

CREATE OR REPLACE VIEW v_gasto_fijo_mensual AS  SELECT COALESCE(sum(g.total) / 3.0, 0::numeric) AS gasto_fijo_mensual
   FROM gastos g
     JOIN categorias cat ON cat.id = g.categoria_id
  WHERE COALESCE(g.es_fijo, cat.es_fijo) AND NOT cat.es_retirada AND g.fecha >= (CURRENT_DATE - '3 mons'::interval);

CREATE OR REPLACE FUNCTION public.cron_resumen_mensual(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE g.fecha >= v_ini AND g.fecha < v_fin AND NOT c.es_retirada;
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
END; $function$;
