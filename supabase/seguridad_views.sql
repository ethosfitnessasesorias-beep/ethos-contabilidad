-- =====================================================================
-- SEGURIDAD: pasar todas las vistas a security_invoker = true.
-- Silencia los avisos "Security Definer View" del linter de Supabase.
-- Las vistas pasan a respetar el RLS del usuario que consulta; como todo
-- el acceso es de usuarios autenticados (RLS USING(true)), el resultado
-- es el mismo pero sin bypass de privilegios.
-- =====================================================================

ALTER VIEW v_cash_collected_mensual SET (security_invoker = true);
ALTER VIEW v_cuentas_ethos          SET (security_invoker = true);
ALTER VIEW v_dashboard_negocio      SET (security_invoker = true);
ALTER VIEW v_facturacion_mensual    SET (security_invoker = true);
ALTER VIEW v_facturas_saldo         SET (security_invoker = true);
ALTER VIEW v_flujo_mensual          SET (security_invoker = true);
ALTER VIEW v_gasto_fijo_mensual     SET (security_invoker = true);
ALTER VIEW v_gastos_detalle         SET (security_invoker = true);
ALTER VIEW v_hucha                  SET (security_invoker = true);
ALTER VIEW v_impuestos_declaracion  SET (security_invoker = true);
ALTER VIEW v_impuestos_pendientes   SET (security_invoker = true);
ALTER VIEW v_impuestos_trimestrales SET (security_invoker = true);
ALTER VIEW v_inversion_mensual      SET (security_invoker = true);
ALTER VIEW v_kpis                   SET (security_invoker = true);
ALTER VIEW v_morosos                SET (security_invoker = true);
ALTER VIEW v_pagos_colaboradores    SET (security_invoker = true);
ALTER VIEW v_pipeline_conteo        SET (security_invoker = true);
ALTER VIEW v_reparto_beneficios     SET (security_invoker = true);
ALTER VIEW v_reparto_mensual        SET (security_invoker = true);
ALTER VIEW v_saldo_cuentas          SET (security_invoker = true);
