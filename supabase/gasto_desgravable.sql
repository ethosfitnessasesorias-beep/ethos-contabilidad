-- "Desgravable" deja de depender de tener la factura AHORA: la factura se
-- puede pedir y subir después. Se elimina la restricción que obligaba a tener
-- factura para marcar un gasto como deducible.
ALTER TABLE gastos DROP CONSTRAINT IF EXISTS chk_deducible_requiere_factura;

SELECT 'OK: gasto_desgravable (constraint eliminada)' AS resultado;
