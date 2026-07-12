-- =====================================================================
-- CLIENTES CON CONTACTO + DEVOLUCIONES DE COMPRAS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- Datos de contacto del cliente (para el botón de WhatsApp y futuros avisos)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT;

-- Devoluciones de compras (te devuelven dinero de un gasto):
-- se apuntan como un gasto en negativo en la misma categoría.
-- Para ello se elimina la restricción que obligaba a importes positivos.
ALTER TABLE gastos DROP CONSTRAINT IF EXISTS gastos_base_check;
