-- Fusion de clientes en cualquier direccion: p_perdedor desaparece y TODO su
-- historial pasa a p_superviviente. Mueve las 6 tablas que referencian a
-- clientes y completa en el superviviente los datos de contacto que le falten.
CREATE OR REPLACE FUNCTION public.merge_cliente(p_perdedor int, p_superviviente int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_nombre text;
BEGIN
  IF p_perdedor = p_superviviente THEN
    RETURN jsonb_build_object('ok', false, 'error', 'mismo cliente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_perdedor)
     OR NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_superviviente) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cliente no encontrado');
  END IF;

  SELECT nombre INTO v_nombre FROM clientes WHERE id = p_perdedor;

  UPDATE facturas    SET cliente_id = p_superviviente WHERE cliente_id = p_perdedor;
  UPDATE deals       SET cliente_id = p_superviviente WHERE cliente_id = p_perdedor;
  UPDATE actividades SET cliente_id = p_superviviente WHERE cliente_id = p_perdedor;
  UPDATE contenido   SET cliente_id = p_superviviente WHERE cliente_id = p_perdedor;
  UPDATE remesa_lineas SET cliente_id = p_superviviente WHERE cliente_id = p_perdedor;
  -- La matriz de Pagos y cobros: si el superviviente ya tiene fila, la del perdedor sobra
  DELETE FROM pagos_cobros_filas
   WHERE cliente_id = p_perdedor
     AND EXISTS (SELECT 1 FROM pagos_cobros_filas WHERE cliente_id = p_superviviente);
  UPDATE pagos_cobros_filas SET cliente_id = p_superviviente WHERE cliente_id = p_perdedor;

  -- Completar datos que falten en el superviviente con los del perdedor
  UPDATE clientes s SET
    apellidos    = COALESCE(s.apellidos, p.apellidos),
    email        = COALESCE(s.email, p.email),
    telefono     = COALESCE(s.telefono, p.telefono),
    nif          = COALESCE(s.nif, p.nif),
    direccion    = COALESCE(s.direccion, p.direccion),
    objetivo     = COALESCE(s.objetivo, p.objetivo),
    tipo_plan    = COALESCE(s.tipo_plan, p.tipo_plan),
    origen       = COALESCE(s.origen, p.origen),
    fecha_inicio = LEAST(COALESCE(s.fecha_inicio, p.fecha_inicio), COALESCE(p.fecha_inicio, s.fecha_inicio)),
    primer_contacto = LEAST(COALESCE(s.primer_contacto, p.primer_contacto), COALESCE(p.primer_contacto, s.primer_contacto)),
    cuota_id     = COALESCE(s.cuota_id, p.cuota_id),
    notas        = CASE WHEN s.notas IS NULL THEN p.notas
                        WHEN p.notas IS NULL OR p.notas = s.notas THEN s.notas
                        ELSE s.notas || E'\n---\n' || p.notas END
  FROM clientes p
  WHERE s.id = p_superviviente AND p.id = p_perdedor;

  DELETE FROM clientes WHERE id = p_perdedor;

  RETURN jsonb_build_object('ok', true, 'absorbido', v_nombre);
END $$;

REVOKE ALL ON FUNCTION public.merge_cliente(int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.merge_cliente(int, int) TO authenticated;

SELECT 'OK: merge_cliente lista' AS resultado;
