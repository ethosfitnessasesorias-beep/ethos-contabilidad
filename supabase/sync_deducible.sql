-- Resincroniza gastos.deducible desde el Excel (columna "Deducible").
-- Generado el 2026-07-16. Ejecutar UNA vez.
BEGIN;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-01' AND concepto = 'Seguro de mybox' AND ABS(total - 120.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-01' AND concepto = 'Rotulos' AND ABS(total - 54.58) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Cortina y señaletica 3D' AND ABS(total - 39.1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Mopa' AND ABS(total - 16.63) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Placa acrílica para horario timbre' AND ABS(total - 11.72) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Papel higiencio' AND ABS(total - 4.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Papeleras de malla' AND ABS(total - 9.27) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Luces, estanterias y otras cosas' AND ABS(total - 35.44) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Emplaste fino' AND ABS(total - 7.87) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Mesa de centro recepción' AND ABS(total - 15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Kittle' AND ABS(total - 15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Cubo de basura' AND ABS(total - 23.36) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-04' AND concepto = 'Libro de precios' AND ABS(total - 11.64) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Cosas baño, reloj temporizador' AND ABS(total - 58.52) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Raul pintar persianas' AND ABS(total - 40) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Kallax' AND ABS(total - 50) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'ROBO' AND ABS(total - 25) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-07' AND concepto = 'Sofá' AND ABS(total - 372.19) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-07' AND concepto = 'Kallax' AND ABS(total - 40) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-07' AND concepto = 'Escritorios' AND ABS(total - 60) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-02' AND concepto = 'Carteleria shein' AND ABS(total - 21.56) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-05' AND concepto = 'Cortina ducha' AND ABS(total - 11.88) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-08' AND concepto = 'Sillas clientes' AND ABS(total - 35) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-08' AND concepto = 'Kallax 3 huecos' AND ABS(total - 20) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-09' AND concepto = 'Pagar puertas pagandole a Juan' AND ABS(total - 350) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-09' AND concepto = 'Césped 2n pago' AND ABS(total - 133.85) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-09' AND concepto = 'Tapeta ventana' AND ABS(total - 8) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-10' AND concepto = 'Capcut' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-10' AND concepto = 'Spar - No se que se compra (David)' AND ABS(total - 4.94) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-10' AND concepto = 'Bolsa 300 bases, porcelánico y esponja' AND ABS(total - 51) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-10' AND concepto = 'Cosas de WC: Latiguillos, gomas...' AND ABS(total - 108.89) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Puertas' AND ABS(total - 379.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Malla metálica microperforada' AND ABS(total - 46.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Aspiradora' AND ABS(total - 68.9) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Base enchufe' AND ABS(total - 7.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Hidrotubo con descuento' AND ABS(total - 1.87) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Regleta' AND ABS(total - 7.05) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Brochas y taco del 6' AND ABS(total - 23.74) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Enchufes, alargo y hidrotubo' AND ABS(total - 26.17) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-11' AND concepto = 'Bizum a Willy' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-13' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-13' AND concepto = 'Copisteria listado de precios' AND ABS(total - 7.09) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-08' AND concepto = 'Alquiler' AND ABS(total - 1053.72) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-15' AND concepto = 'Vinilo PVC' AND ABS(total - 66.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'Tasa obras 1' AND ABS(total - 205.7) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-17' AND concepto = 'Muebles Ikea: Kallax x2 y Cajonera' AND ABS(total - 84.97) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'Aliexpres:' AND ABS(total - 2.43) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'Aliexpres:' AND ABS(total - 18.32) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'Gancho ferreteria Calbet' AND ABS(total - 2.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'Fotos para mural Ethos Team' AND ABS(total - 7.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'Merca Asia' AND ABS(total - 10.3) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-16' AND concepto = 'La plataforma' AND ABS(total - 76.76) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-17' AND concepto = 'Cubo fregona' AND ABS(total - 2.69) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-17' AND concepto = 'Merca Asia' AND ABS(total - 5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-17' AND concepto = 'Cuadro +300 clientes' AND ABS(total - 12.6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-17' AND concepto = 'La plataforma' AND ABS(total - 53.77) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-18' AND concepto = 'U PVC BLANCO, PERFIL DESN ALUMINIO PLATA' AND ABS(total - 9.76) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-20' AND concepto = 'IRPF' AND ABS(total - 98.14) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-20' AND concepto = 'Broca de piedra' AND ABS(total - 1.8) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-20' AND concepto = 'La plataforma' AND ABS(total - 8.09) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-21' AND concepto = 'Obramat' AND ABS(total - 6.18) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-21' AND concepto = 'La plataforma' AND ABS(total - 6.59) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-21' AND concepto = 'Obramat' AND ABS(total - 70.45) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-21' AND concepto = 'Obramat' AND ABS(total - 139.55) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-22' AND concepto = 'Aigues de barcelona' AND ABS(total - 79.66) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-22' AND concepto = 'Merca Asia' AND ABS(total - 4.6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-22' AND concepto = 'La plataforma' AND ABS(total - 17.63) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-22' AND concepto = 'Pica lavamanos' AND ABS(total - 29) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-23' AND concepto = 'La plataforma' AND ABS(total - 71.55) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-23' AND concepto = 'La plataforma' AND ABS(total - 89.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-23' AND concepto = 'BIZUM ENVIADO NO SE A QUIEN (DAVID)' AND ABS(total - 19.23) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-24' AND concepto = 'Merca Asia' AND ABS(total - 1.2) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-24' AND concepto = 'REFRESCO COCA COLA' AND ABS(total - 1.6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-24' AND concepto = 'B.BASURA HANDY BAG ANTIBACT.50L 8U
VILEDA RECOGEDOR MANGO' AND ABS(total - 8.3) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-24' AND concepto = 'Condenas malas Leroy' AND ABS(total - 39.94) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-24' AND concepto = 'Tapetas puerta' AND ABS(total - 383.13) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-25' AND concepto = 'Ganchos led' AND ABS(total - 5.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-25' AND concepto = 'Condenas buenas' AND ABS(total - 40.31) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-25' AND concepto = 'Cerraduras, madera para cajon' AND ABS(total - 55.46) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-26' AND concepto = 'Tornillos de fijación y monomando' AND ABS(total - 13.65) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-26' AND concepto = 'La plataforma' AND ABS(total - 24.41) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-14' AND concepto = 'Luz' AND ABS(total - 100.84) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-14' AND concepto = 'Gestor' AND ABS(total - 116.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-14' AND concepto = 'Spar' AND ABS(total - 2.25) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-14' AND concepto = 'AGUA SPAR MINERAL 1,5L 1/2 PAL
CHOCOLATINA KINDER BUENO WHITE T-2' AND ABS(total - 3.39) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-14' AND concepto = 'LIMPIA MUEBLES SPAR AEROSOL400ML
BAYETA MICROFIBRE COLORS 8UDS' AND ABS(total - 8.68) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-15' AND concepto = 'La plataforma' AND ABS(total - 29.84) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-15' AND concepto = 'PERFIL TRANS ALUMINIO PLATA' AND ABS(total - 37.66) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-27' AND concepto = 'Toallitas' AND ABS(total - 1.55) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-27' AND concepto = 'Pizarra blanca' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-28' AND concepto = '¿?' AND ABS(total - 2.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-28' AND concepto = 'Losetasa de caucho 108€- 100 Efectivo + 8 Bizum' AND ABS(total - 8) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-29' AND concepto = 'AGUA SPAR MINERAL 1,5L 1/2 PAL
LOLLIPOPS GOURMET VARIOS 31GR
CUBO 13L + ESCURRIDOR' AND ABS(total - 7.49) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-29' AND concepto = 'Rollo cinta césped y doble cara césped' AND ABS(total - 22.51) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-29' AND concepto = 'Fran Filmaker' AND ABS(total - 110) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-30' AND concepto = 'Cuota de autónomo' AND ABS(total - 177.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = 'Tarifa movil' AND ABS(total - 29) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = 'Barra de cortina' AND ABS(total - 16.66) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = 'Barra de cortina' AND ABS(total - 20.82) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = '¿?' AND ABS(total - 3.79) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = '¿?' AND ABS(total - 4.4) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = '¿?' AND ABS(total - 27.25) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-31' AND concepto = '¿?' AND ABS(total - 18.9) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-15' AND concepto = 'Sillas recepción' AND ABS(total - 15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-01-28' AND concepto = 'Losetas de caucho' AND ABS(total - 100) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-01' AND concepto = 'KAIZEN PROYECT' AND ABS(total - 3000) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-01' AND concepto = 'Pinturas' AND ABS(total - 61) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-01' AND concepto = '¿?' AND ABS(total - 15.05) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-01' AND concepto = 'Parking evento' AND ABS(total - 17.65) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-01' AND concepto = 'Seguro' AND ABS(total - 50.62) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-02' AND concepto = 'Rampa minus' AND ABS(total - 35) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = 'Packlink - Envío rampa' AND ABS(total - 24.47) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = '¿?' AND ABS(total - 108.11) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = '¿?' AND ABS(total - 11.18) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = '¿?' AND ABS(total - 12.09) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = '¿?' AND ABS(total - 13.44) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = '¿?' AND ABS(total - 19.27) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = '¿?' AND ABS(total - 19.67) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-03' AND concepto = 'Alfonsi' AND ABS(total - 600) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-04' AND concepto = 'COSAS GYM' AND ABS(total - 99.04) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-04' AND concepto = 'COSAS GYM' AND ABS(total - 100.11) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-05' AND concepto = 'Alquiler' AND ABS(total - 526.86) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-05' AND concepto = 'Antony' AND ABS(total - 360) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-05' AND concepto = '¿?' AND ABS(total - 5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-05' AND concepto = 'Rampa minus' AND ABS(total - 35) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-06' AND concepto = 'Perchas' AND ABS(total - 16.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-06' AND concepto = 'Repetidor' AND ABS(total - 37.97) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-06' AND concepto = 'Espejo minus' AND ABS(total - 60.4) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-06' AND concepto = '¿?' AND ABS(total - 12.64) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-06' AND concepto = 'Soporte de saco' AND ABS(total - 39.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-07' AND concepto = 'Tornillos' AND ABS(total - 4.69) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-08' AND concepto = 'Estanteria TERMO' AND ABS(total - 30.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-08' AND concepto = 'Césped 3/3' AND ABS(total - 133.85) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-08' AND concepto = 'PRUEBA EURO' AND ABS(total - 1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-08' AND concepto = 'Monster' AND ABS(total - 1.79) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-08' AND concepto = 'Comisiones' AND ABS(total - 0.01) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-09' AND concepto = 'Tartas kchopo' AND ABS(total - 100) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'Cap cut' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'Para agarrar cortinas' AND ABS(total - 6.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'ambientador y demas' AND ABS(total - 7.38) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'Pilas para Remo' AND ABS(total - 4.4) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'Comisiones' AND ABS(total - 0.76) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'FRAN FILMAKER' AND ABS(total - 110) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-10' AND concepto = 'Reseñas' AND ABS(total - 4.89) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-11' AND concepto = 'Electricidad' AND ABS(total - 115.07) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-11' AND concepto = '¿?' AND ABS(total - 1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-11' AND concepto = 'Cable para reloj' AND ABS(total - 4.98) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-11' AND concepto = 'Altavoz' AND ABS(total - 49.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-11' AND concepto = 'Redondeo solidario' AND ABS(total - 0.01) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-11' AND concepto = 'Comisiones' AND ABS(total - 1.06) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-12' AND concepto = 'Pago pared vinilo' AND ABS(total - 66) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-12' AND concepto = 'Meta Ads' AND ABS(total - 22) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-12' AND concepto = 'Comisiones TPV' AND ABS(total - 0.56) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-13' AND concepto = 'Comisiones TPV' AND ABS(total - 1.69) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-13' AND concepto = 'Gestor' AND ABS(total - 116.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-13' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-14' AND concepto = 'Bizum a Irene gastos que pagó ella' AND ABS(total - 18.33) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-14' AND concepto = '-' AND ABS(total - 5.78) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-14' AND concepto = 'Herramientas Manolo' AND ABS(total - 54.27) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-14' AND concepto = 'Spar' AND ABS(total - 2.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-14' AND concepto = 'Extintores' AND ABS(total - 304.92) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-16' AND concepto = 'Ropa' AND ABS(total - 761.43) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-17' AND concepto = 'CABLE' AND ABS(total - 3.79) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-17' AND concepto = 'Comisiones' AND ABS(total - 0.07) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-19' AND concepto = 'Tornillos' AND ABS(total - 4.19) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-19' AND concepto = 'Llave para radial manolo' AND ABS(total - 5.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-22' AND concepto = 'Comisiones' AND ABS(total - 0.18) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-23' AND concepto = 'Pago 1/2 Fran Filmaker' AND ABS(total - 100) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-24' AND concepto = 'Comisiones' AND ABS(total - 0.17) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-24' AND concepto = 'Spar' AND ABS(total - 3.09) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-24' AND concepto = 'Spar' AND ABS(total - 2.2) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-25' AND concepto = 'Meta Ads' AND ABS(total - 3.4) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-26' AND concepto = 'Meta Ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-27' AND concepto = 'Meta Ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-27' AND concepto = 'Autónomos' AND ABS(total - 177.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-27' AND concepto = 'Comisiones' AND ABS(total - 0.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-02-27' AND concepto = 'Kings Box - Material' AND ABS(total - 1092.52) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-01' AND concepto = 'Seguro' AND ABS(total - 120.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-01' AND concepto = 'Harbiz' AND ABS(total - 83.49) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-01' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-02' AND concepto = 'Meta ads' AND ABS(total - 12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-05' AND concepto = 'Alquiler marzo' AND ABS(total - 1053.72) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-03' AND concepto = 'Comisiones' AND ABS(total - 1.69) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-03' AND concepto = 'Orange teléfono' AND ABS(total - 29) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-03' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-03' AND concepto = 'Comisiones' AND ABS(total - 0.64) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-04' AND concepto = 'Comisiones' AND ABS(total - 15.25) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-04' AND concepto = 'Comisiones' AND ABS(total - 0.27) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-04' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-05' AND concepto = 'Bemad Box' AND ABS(total - 55.01) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-05' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-05' AND concepto = 'Meta ads' AND ABS(total - 4.03) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-05' AND concepto = 'Comisiones' AND ABS(total - 0.38) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-06' AND concepto = 'Fran Filmaker 2/3' AND ABS(total - 100) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-11' AND concepto = 'Fran Filmaker 3/3' AND ABS(total - 50) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-06' AND concepto = 'Comisiones cristian' AND ABS(total - 1.57) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-07' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-08' AND concepto = 'Vinilo pared' AND ABS(total - 66.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-10' AND concepto = 'Comisiones' AND ABS(total - 0.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-10' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-10' AND concepto = 'Cap cut' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-10' AND concepto = 'Papel higiénico' AND ABS(total - 2.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-11' AND concepto = 'Cartel de tirar' AND ABS(total - 2.6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-12' AND concepto = 'Comisiones' AND ABS(total - 0.08) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-12' AND concepto = 'Bizum David Ingeniero' AND ABS(total - 500) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-13' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-13' AND concepto = 'aguas' AND ABS(total - 1.62) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-14' AND concepto = 'Electricidad' AND ABS(total - 101.05) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-14' AND concepto = 'Gestor' AND ABS(total - 116.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-16' AND concepto = '500 eur efectivo a David para completar los 2000' AND ABS(total - 500) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-31' AND concepto = 'Comisiones Merchan MARZO' AND ABS(total - 2.94) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-20' AND concepto = 'Aigues de barcelona' AND ABS(total - 87.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-19' AND concepto = 'Meta ads' AND ABS(total - 19) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-20' AND concepto = 'Meta ads' AND ABS(total - 19) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-19' AND concepto = 'Cartel y tira de abjo de puerta' AND ABS(total - 4.69) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-19' AND concepto = 'Hoja actualización precios' AND ABS(total - 3.88) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-17' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-18' AND concepto = 'Meta ads' AND ABS(total - 6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-23' AND concepto = 'Filtro aspiradora' AND ABS(total - 20.9) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-28' AND concepto = 'Comisiones' AND ABS(total - 0.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-27' AND concepto = 'Meta ads' AND ABS(total - 49.27) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-27' AND concepto = 'Meta ads' AND ABS(total - 19) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-27' AND concepto = 'Cosas spar' AND ABS(total - 3.24) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-24' AND concepto = 'Comisiones' AND ABS(total - 0.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-22' AND concepto = 'Comisiones' AND ABS(total - 0.14) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-28' AND concepto = 'Meta ads' AND ABS(total - 11) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-30' AND concepto = 'Comisiones Merchan ABRIL' AND ABS(total - 3.62) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-01' AND concepto = 'Seguros' AND ABS(total - 120.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-01' AND concepto = 'Orange teléfono y WIFI' AND ABS(total - 29.78) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-01' AND concepto = 'Visor HEIC pc Luis para editar' AND ABS(total - 0.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-29' AND concepto = 'Cosas spar' AND ABS(total - 3.6) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-31' AND concepto = 'Electricidad' AND ABS(total - 86.74) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-31' AND concepto = 'Autónomos' AND ABS(total - 177.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-31' AND concepto = 'Meta ads' AND ABS(total - 10.25) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-03-31' AND concepto = 'Comisiones' AND ABS(total - 0.86) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-01' AND concepto = 'Comisiones CAIXA TPV ABRIL' AND ABS(total - 37.83) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-02' AND concepto = 'Harbiz' AND ABS(total - 83.49) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-03' AND concepto = 'Cosas spar' AND ABS(total - 0.75) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-03' AND concepto = 'Fran Filmaker' AND ABS(total - 55) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-06' AND concepto = 'Alquiler abril' AND ABS(total - 1222.32) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-11' AND concepto = 'Lampara mosquitos' AND ABS(total - 26.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-10' AND concepto = 'Capcut' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-09' AND concepto = 'Aragán y cosas' AND ABS(total - 16.21) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-05' AND concepto = 'BemadBox' AND ABS(total - 42.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-10' AND concepto = 'Caja cartón' AND ABS(total - 3.1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-11' AND concepto = 'KH7' AND ABS(total - 3.7) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-11' AND concepto = 'Aguas' AND ABS(total - 1.62) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-13' AND concepto = 'Devolución Bea' AND ABS(total - 84.84) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-14' AND concepto = 'Fotos EP9' AND ABS(total - 0.65) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-14' AND concepto = 'Cosas chino' AND ABS(total - 4.77) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-15' AND concepto = 'Armario' AND ABS(total - 65) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-17' AND concepto = 'Cosas chino' AND ABS(total - 5.98) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-16' AND concepto = 'Picas clase tecnica' AND ABS(total - 27.37) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-16' AND concepto = 'Gestor' AND ABS(total - 116.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-13' AND concepto = 'Vinilo pared' AND ABS(total - 66.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-13' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-20' AND concepto = 'IRPF' AND ABS(total - 490.7) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-20' AND concepto = 'Cesta esterillas' AND ABS(total - 15.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-22' AND concepto = 'Aspirador SABA' AND ABS(total - 179.1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-22' AND concepto = 'Fran todo lo que ha grabado y editado menos lo editado del miercoles 22' AND ABS(total - 115) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-22' AND concepto = 'Papel higienico' AND ABS(total - 4.75) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-23' AND concepto = 'Stand Feria' AND ABS(total - 60.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-24' AND concepto = 'Aguas' AND ABS(total - 2.37) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-29' AND concepto = 'Almacenamiento drive' AND ABS(total - 1.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-30' AND concepto = 'Electricidad' AND ABS(total - 81.54) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-04-30' AND concepto = 'Autónomos' AND ABS(total - 177.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-01' AND concepto = 'Seguros' AND ABS(total - 120.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-01' AND concepto = 'Orange teléfono y WIFI ABRIL' AND ABS(total - 35) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-31' AND concepto = 'Comisiones CAIXA TPV MAYO' AND ABS(total - 44) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-05' AND concepto = 'Alquiler MAYO' AND ABS(total - 1222.32) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-08' AND concepto = 'Bocatas pipa' AND ABS(total - 18) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-08' AND concepto = 'Material gym' AND ABS(total - 995) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-09' AND concepto = 'Material gym' AND ABS(total - 310) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-09' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-08' AND concepto = 'aguas' AND ABS(total - 3.55) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-07' AND concepto = 'Vinilo pared' AND ABS(total - 66.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-02' AND concepto = 'Harbiz' AND ABS(total - 83.49) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-03' AND concepto = 'Ventiladores' AND ABS(total - 132) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-05' AND concepto = 'Cafetera' AND ABS(total - 39.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-05' AND concepto = 'Tripticos' AND ABS(total - 53.08) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-05' AND concepto = 'BemadBox' AND ABS(total - 50.28) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-05' AND concepto = 'Alargos y cosas para ventiladores' AND ABS(total - 32.47) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-07' AND concepto = 'Alargos y cosas para ventiladores' AND ABS(total - 9.05) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-07' AND concepto = 'Recambio Mopas' AND ABS(total - 6.26) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-07' AND concepto = 'ni idea' AND ABS(total - 4.2) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-09' AND concepto = 'Filmaker' AND ABS(total - 240) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-15' AND concepto = 'Camilla, furgo, gasolina, escritorio, armario y gastos envio 521x0,3' AND ABS(total - 156) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-12' AND concepto = 'Caucho' AND ABS(total - 125) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-15' AND concepto = 'Firplan' AND ABS(total - 4.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-12' AND concepto = 'Firplan' AND ABS(total - 13.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-10' AND concepto = 'Capcut' AND ABS(total - 10) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-11' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-12' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-12' AND concepto = 'COSAS' AND ABS(total - 5.14) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-13' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-13' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-13' AND concepto = 'BIZUM IRENE' AND ABS(total - 12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-14' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-14' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-17' AND concepto = 'Magnesio' AND ABS(total - 8) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-19' AND concepto = 'Aigues de barcelona' AND ABS(total - 85.88) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-19' AND concepto = 'Devolución Raul Lerma y FAMILIA' AND ABS(total - 213.72) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-23' AND concepto = 'Cafetera' AND ABS(total - 41.65) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-20' AND concepto = 'Gestor' AND ABS(total - 116.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-20' AND concepto = 'Meta ads' AND ABS(total - 30.24) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-20' AND concepto = 'COSAS' AND ABS(total - 4.94) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-21' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-22' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-22' AND concepto = 'COSAS' AND ABS(total - 2.89) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-23' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-25' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-26' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-27' AND concepto = 'NO SE' AND ABS(total - 1.09) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-28' AND concepto = 'Almacenamiento drive' AND ABS(total - 1.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-28' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-29' AND concepto = 'Orange teléfono y WIFI MAYO' AND ABS(total - 43.35) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-29' AND concepto = 'Autónomos' AND ABS(total - 177.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-29' AND concepto = 'Electricidad' AND ABS(total - 82.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-05-30' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-01' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-01' AND concepto = 'Seguros' AND ABS(total - 120.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-02' AND concepto = 'Harbiz' AND ABS(total - 83.49) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-30' AND concepto = 'Comisiones CAIXA TPV JUNIO' AND ABS(total - 58.84) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-02' AND concepto = 'Filmaker' AND ABS(total - 200) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-03' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-03' AND concepto = 'Ganchos' AND ABS(total - 10.77) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-04' AND concepto = 'Kittl' AND ABS(total - 13.45) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-04' AND concepto = 'Tijeras y rotus' AND ABS(total - 3.69) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-04' AND concepto = 'COSAS' AND ABS(total - 11.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-04' AND concepto = 'Licencia obra' AND ABS(total - 357) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-05' AND concepto = 'Meta ads' AND ABS(total - 13.19) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-05' AND concepto = 'BemadBox' AND ABS(total - 49.68) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-05' AND concepto = 'Claude' AND ABS(total - 0) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-06' AND concepto = 'COSAS' AND ABS(total - 10.28) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-06' AND concepto = 'TRAPOS Y COSAS' AND ABS(total - 4.35) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-12' AND concepto = 'BANDERA' AND ABS(total - 212) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-07' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-08' AND concepto = 'Alquiler JUNIO' AND ABS(total - 1222.32) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-09' AND concepto = 'Devolución Raul Lerma y FAMILIA' AND ABS(total - 142.48) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-09' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-09' AND concepto = 'COSAS' AND ABS(total - 10.79) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-10' AND concepto = 'Capcut' AND ABS(total - 20) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-10' AND concepto = 'BANCO WALAPOP' AND ABS(total - 201.36) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-10' AND concepto = 'Vinilo pared' AND ABS(total - 66.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-11' AND concepto = 'NEVERA' AND ABS(total - 89.1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-11' AND concepto = 'COSAS PARA PINTAR Y ENMASILLAR' AND ABS(total - 21.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-12' AND concepto = 'Gestor' AND ABS(total - 116.16) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-12' AND concepto = 'COSAS' AND ABS(total - 6.87) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-12' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-13' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-14' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-16' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-18' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-19' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-20' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-16' AND concepto = 'Devolución Raul Lerma y FAMILIA' AND ABS(total - 71.24) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-18' AND concepto = 'COSAS' AND ABS(total - 2.1) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-22' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-23' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-24' AND concepto = 'COSAS' AND ABS(total - 4.2) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-25' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-26' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-27' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-28' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-28' AND concepto = 'Almacenamiento drive' AND ABS(total - 1.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-29' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-30' AND concepto = 'Orange teléfono y WIFI MAYO' AND ABS(total - 44.95) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-30' AND concepto = 'Autónomos' AND ABS(total - 177.12) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-06-30' AND concepto = 'aguas' AND ABS(total - 4.2) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-31' AND concepto = 'Comisiones CAIXA TPV JULIO' AND ABS(total - 64.58) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-31' AND concepto = 'Comisiones Merchan JULIO' AND ABS(total - 0) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-10' AND concepto = 'PAPEL' AND ABS(total - 4.5) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-10' AND concepto = 'MAQUINA SKII' AND ABS(total - 400) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-31' AND concepto = 'Comisiones STRIPE BEMADBOX JULIO' AND ABS(total - 2.72) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-01' AND concepto = 'Préstamo' AND ABS(total - 483.15) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-01' AND concepto = 'Meta ads' AND ABS(total - 30) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-01' AND concepto = 'Seguros' AND ABS(total - 120.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-02' AND concepto = 'Harbiz' AND ABS(total - 83.49) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-01' AND concepto = 'Electricidad' AND ABS(total - 108.83) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-01' AND concepto = 'Licencia ACTIVIDAD' AND ABS(total - 250) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-03' AND concepto = 'Seguro David bimestral' AND ABS(total - 71.17) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-03' AND concepto = 'Inversión FONDO INDEXADO' AND ABS(total - 200) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-03' AND concepto = 'Meta ads' AND ABS(total - 30.44) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-03' AND concepto = 'Vinilo pared' AND ABS(total - 66.02) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-03' AND concepto = 'Fran Filmaker DEUDA' AND ABS(total - 80) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-04' AND concepto = 'NI IDEA' AND ABS(total - 3.9) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-05' AND concepto = 'Meta ads' AND ABS(total - 12.99) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-07' AND concepto = 'Meta ads' AND ABS(total - 30.85) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-08' AND concepto = 'Alquiler JULIO' AND ABS(total - 1222.32) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-09' AND concepto = 'NI IDEA' AND ABS(total - 3.79) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-10' AND concepto = 'Meta ads' AND ABS(total - 30.84) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR false), deducible = false, iva_soportado = CASE WHEN false THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-11' AND concepto = 'Capcut' AND ABS(total - 20) < 0.02;
UPDATE gastos SET tiene_factura = (tiene_factura OR true), deducible = true, iva_soportado = CASE WHEN true THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = '2026-07-12' AND concepto = 'Canva' AND ABS(total - 11.99) < 0.02;
COMMIT;

-- Comprobación
SELECT deducible, COUNT(*) n, SUM(ROUND(base*iva_pct,2)) iva FROM gastos GROUP BY 1;
