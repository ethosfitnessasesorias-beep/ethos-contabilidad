-- Conciliacion con el Excel "Contabilidad 2.0" (18-jul-2026):
-- descuadres residuales anteriores a la ultima semana, ajustados en el
-- saldo inicial para dejar los saldos exactos al Excel:
--   banco 6052.04 / efectivo 2104.50 / stripe 201.77
UPDATE cuentas SET saldo_inicial = saldo_inicial + 111.00 WHERE codigo = 'banco';
UPDATE cuentas SET saldo_inicial = saldo_inicial + 125.10 WHERE codigo = 'caja';

-- Hucha real segun los socios: 106.38 EUR -> se fija via hucha_ajuste
UPDATE config SET valor = round(106.38 - (
  (SELECT coalesce(sum(GREATEST(0, beneficio) * 0.2), 0) FROM v_reparto_beneficios
    WHERE mes >= (SELECT valor::date FROM config_texto WHERE clave = 'hucha_desde'))
  - (SELECT coalesce(sum(inversion), 0) FROM v_inversion_mensual
    WHERE mes >= (SELECT valor::date FROM config_texto WHERE clave = 'hucha_desde'))
), 2) WHERE clave = 'hucha_ajuste';

SELECT (SELECT json_agg(json_build_object('cuenta', codigo, 'saldo', saldo) ORDER BY id) FROM v_saldo_cuentas) AS saldos,
       (SELECT valor FROM config WHERE clave = 'hucha_ajuste') AS hucha_ajuste;
