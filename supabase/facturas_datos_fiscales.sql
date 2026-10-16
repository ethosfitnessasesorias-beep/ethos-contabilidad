-- =====================================================================
-- FACTURAS: datos fiscales "congelados" en la propia factura
-- Permite editar nombre fiscal / NIF / dirección de una factura SIN tocar
-- la ficha del cliente (puede ser un cambio puntual). Si están vacíos, la
-- factura usa como respaldo los datos del contacto vinculado.
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS facturar_nombre    TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS facturar_nif       TEXT;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS facturar_direccion TEXT;

SELECT 'OK: facturas con datos fiscales propios' AS resultado;
