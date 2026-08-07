SELECT json_build_object(
 'reparto_pagos_cols', (SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name = 'reparto_pagos'),
 'reparto_pagos_jul', (SELECT coalesce(json_agg(to_jsonb(rp)), '[]'::json) FROM reparto_pagos rp WHERE rp.mes >= '2026-07-01' AND rp.mes < '2026-09-01'),
 'v_reparto_jul', (SELECT coalesce(json_agg(to_jsonb(v)), '[]'::json) FROM v_reparto_mensual v WHERE v.mes = '2026-07-01'),
 'hucha_def', (SELECT (regexp_match(pg_get_viewdef('v_kpis'::regclass, true), 'GREATEST[^;]{0,200}hucha[^,]{0,100}'))[1]),
 'hucha_def2', (SELECT (regexp_match(pg_get_viewdef('v_kpis'::regclass, true), '.{0,250}hucha_actual'))[1]),
 'config_hucha', (SELECT coalesce(json_agg(json_build_object('clave', clave, 'valor', valor)), '[]'::json) FROM config WHERE clave ILIKE '%hucha%'),
 'gastos_ago', (SELECT coalesce(json_agg(json_build_object('id', g.id, 'fecha', g.fecha, 'total', g.total, 'concepto', g.concepto, 'cat', c.nombre, 'creado', to_char(g.creado_en, 'MM-DD HH24:MI'), 'notas', g.notas) ORDER BY g.id), '[]'::json)
   FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.fecha >= '2026-08-01'),
 'bajas_mes', (SELECT coalesce(json_agg(x), '[]'::json) FROM (SELECT to_char(fecha_baja, 'YYYY-MM') AS m, count(*) AS n FROM clientes WHERE fecha_baja IS NOT NULL GROUP BY 1 ORDER BY 1) x),
 'jul_facturas', (SELECT coalesce(json_agg(json_build_object('id', f.id, 'total', f.total, 'concepto', f.concepto, 'fcanal', f.canal, 'cliente', cl.nombre, 'ccanal', cl.canal) ORDER BY f.total DESC), '[]'::json)
   FROM facturas f LEFT JOIN clientes cl ON cl.id = f.cliente_id
   WHERE f.computa_reparto AND f.fecha_emision >= '2026-07-01' AND f.fecha_emision < '2026-08-01')
) AS r;
