-- Pago a colaboradores (70 %): gasto real en P&G, pero FUERA del reparto (el 70/30 ya lo neta) — 23/11/2026

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS excluir_reparto boolean NOT NULL DEFAULT false;

INSERT INTO categorias (tipo,grupo,nombre,es_fijo,es_inversion,es_retirada,excluir_reparto,activa) SELECT 'gasto','Personal','Pago a colaboradores (70 %)',false,false,false,true,true WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre='Pago a colaboradores (70 %)') RETURNING id;

UPDATE gastos SET categoria_id=63, es_fijo=false WHERE id IN (423,424,924,923,984,985,1047) RETURNING id,fecha,concepto,total;

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
          WHERE NOT c.es_inversion AND NOT c.es_retirada AND NOT c.excluir_reparto AND (g.imputado_a = ANY (ARRAY['luis'::text, 'david'::text]))
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
          WHERE NOT c.es_inversion AND NOT c.es_retirada AND NOT c.excluir_reparto AND g.imputado_a = 'ethos'::text
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
