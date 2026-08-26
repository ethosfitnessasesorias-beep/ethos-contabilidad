SELECT json_build_object(
  'remesas', (SELECT json_agg(json_build_object('mes', mes, 'estado', estado, 'lineas', (SELECT count(*) FROM remesa_lineas rl WHERE rl.remesa_id = r.id)) ORDER BY mes) FROM remesas r),
  'cuotas_ago_restantes', (SELECT json_agg(json_build_object('id', id, 'cliente', (SELECT nombre FROM clientes c WHERE c.id = f.cliente_id), 'total', total, 'cobrada', EXISTS(SELECT 1 FROM cobros co WHERE co.factura_id = f.id)))
    FROM facturas f WHERE f.es_recurrente AND f.fecha_emision = '2026-08-01' AND f.concepto LIKE 'Cuota %'),
  'facturas_agosto_total', (SELECT round(sum(total)::numeric,2) FROM facturas WHERE computa_reparto AND fecha_emision >= '2026-08-01')
) AS r;
