SELECT json_build_object(
 -- AGOSTO desglosado por naturaleza (lo que ve el Libro/Cierre)
 'agosto', json_build_object(
   'gasto_corriente', (SELECT round(coalesce(sum(g.total - g.irpf_soportado),0)::numeric,2) FROM gastos g JOIN categorias c ON c.id=g.categoria_id WHERE g.fecha>='2026-08-01' AND g.fecha<'2026-09-01' AND NOT c.es_inversion AND c.nombre !~* 'mina'),
   'nominas', (SELECT round(coalesce(sum(g.total),0)::numeric,2) FROM gastos g JOIN categorias c ON c.id=g.categoria_id WHERE g.fecha>='2026-08-01' AND g.fecha<'2026-09-01' AND c.nombre ~* 'mina'),
   'inversion', (SELECT round(coalesce(sum(g.total),0)::numeric,2) FROM gastos g JOIN categorias c ON c.id=g.categoria_id WHERE g.fecha>='2026-08-01' AND g.fecha<'2026-09-01' AND c.es_inversion),
   'gasto_total', (SELECT round(coalesce(sum(g.total),0)::numeric,2) FROM gastos g WHERE g.fecha>='2026-08-01' AND g.fecha<'2026-09-01')
 ),
 -- P&G del AÑO (lo que ve Pérdidas y ganancias, sumando 12 meses)
 'anyo_pyg', json_build_object(
   'ingresos', (SELECT round(coalesce(sum(total),0)::numeric,2) FROM facturas WHERE computa_reparto AND fecha_emision>='2026-01-01'),
   'gasto_corriente', (SELECT round(coalesce(sum(g.total),0)::numeric,2) FROM gastos g JOIN categorias c ON c.id=g.categoria_id WHERE g.fecha>='2026-01-01' AND NOT c.es_inversion AND c.nombre !~* 'mina'),
   'nominas', (SELECT round(coalesce(sum(g.total),0)::numeric,2) FROM gastos g JOIN categorias c ON c.id=g.categoria_id WHERE g.fecha>='2026-01-01' AND c.nombre ~* 'mina'),
   'inversion_total', (SELECT round(coalesce(sum(g.total),0)::numeric,2) FROM gastos g JOIN categorias c ON c.id=g.categoria_id WHERE g.fecha>='2026-01-01' AND c.es_inversion)
 ),
 -- Reparto: dos vistas distintas para agosto y acumulado
 'reparto_mensual_v_cuentas', (SELECT json_agg(json_build_object('a',atribucion,'cobrado',round(cobrado::numeric,2),'balance',round(balance::numeric,2),'a_entrenador',round(a_entrenador::numeric,2)) ORDER BY atribucion) FROM v_reparto_mensual WHERE mes='2026-08-01'),
 'reparto_beneficios_ago', (SELECT json_agg(json_build_object('socio',socio,'beneficio',round(beneficio::numeric,2)) ORDER BY socio) FROM v_reparto_beneficios WHERE mes='2026-08-01'),
 'reparto_beneficios_anyo', (SELECT json_agg(x) FROM (SELECT socio, round(sum(GREATEST(0,beneficio))::numeric,2) AS beneficio_acum, round(sum(GREATEST(0,beneficio)*0.8)::numeric,2) AS nomina_acum FROM v_reparto_beneficios WHERE mes>='2026-01-01' GROUP BY socio ORDER BY socio) x)
) AS r;
