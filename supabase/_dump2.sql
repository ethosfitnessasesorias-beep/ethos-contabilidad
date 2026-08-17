SELECT json_build_object(
 'facturas', (SELECT coalesce(json_agg(to_jsonb(f) || jsonb_build_object('cliente', c.nombre, 'cat', cat.nombre) ORDER BY f.fecha_emision, f.id), '[]'::json)
   FROM facturas f LEFT JOIN clientes c ON c.id = f.cliente_id LEFT JOIN categorias cat ON cat.id = f.categoria_id
   WHERE f.fecha_emision >= '2026-01-01'),
 'gastos', (SELECT coalesce(json_agg(to_jsonb(g) || jsonb_build_object('cat', cat.nombre) ORDER BY g.fecha, g.id), '[]'::json)
   FROM gastos g LEFT JOIN categorias cat ON cat.id = g.categoria_id
   WHERE g.fecha >= '2026-01-01'),
 'traspasos', (SELECT coalesce(json_agg(to_jsonb(t) ORDER BY t.fecha, t.id), '[]'::json) FROM traspasos t WHERE t.fecha >= '2026-07-01'),
 'cobros', (SELECT coalesce(json_agg(jsonb_build_object('id', co.id, 'fecha', co.fecha, 'importe', co.importe, 'cuenta', cu.codigo, 'factura_id', co.factura_id) ORDER BY co.fecha, co.id), '[]'::json)
   FROM cobros co LEFT JOIN cuentas cu ON cu.id = co.cuenta_id WHERE co.fecha >= '2026-01-01'),
 'saldos', (SELECT coalesce(json_agg(jsonb_build_object('codigo', v.codigo, 'saldo', v.saldo)), '[]'::json) FROM v_saldo_cuentas v),
 'remesa_ago', (SELECT json_build_object('estado', r.estado, 'cobrado', (SELECT coalesce(sum(co.importe), 0) FROM remesa_lineas rl JOIN cobros co ON co.factura_id = rl.factura_id WHERE rl.remesa_id = r.id)) FROM remesas r WHERE r.mes = '2026-08-01')
) AS r;
