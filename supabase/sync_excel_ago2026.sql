BEGIN;

INSERT INTO cuentas (codigo, nombre, activa, es_transito, saldo_inicial)
SELECT 'personal', 'Personal (socios)', false, false, 0
WHERE NOT EXISTS (SELECT 1 FROM cuentas WHERE codigo = 'personal');

UPDATE facturas SET base = (494::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 58;

UPDATE facturas SET base = (967.8::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 67;

UPDATE facturas SET base = (1840.67::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 97;

UPDATE facturas SET base = (526.9::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 99;

UPDATE facturas SET base = (62.6::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 103;

UPDATE facturas SET base = (2540.86::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 123;

UPDATE facturas SET base = (658.96::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 131;

UPDATE facturas SET base = (82.6::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 176;

UPDATE facturas SET base = (114::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 169;

UPDATE facturas SET base = (213.72::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 119;

UPDATE facturas SET base = (39.99::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 120;

UPDATE facturas SET base = (92::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 124;

UPDATE facturas SET base = (75::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 155;

UPDATE cobros SET importe = 75 WHERE id = 315;

UPDATE facturas SET base = (6::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 178;

UPDATE cobros SET importe = 6 WHERE id = 337;

UPDATE facturas SET base = (65.24::numeric / (1 + iva_pct - irpf_pct)) WHERE id = 179;

UPDATE cobros SET importe = 65.24 WHERE id = 338;

UPDATE gastos SET base = (23.36::numeric / (1 + iva_pct)) WHERE id = 437;

UPDATE gastos SET base = (372.19::numeric / (1 + iva_pct)) WHERE id = 442;

UPDATE gastos SET base = (1.87::numeric / (1 + iva_pct)) WHERE id = 460;

UPDATE gastos SET base = (79.66::numeric / (1 + iva_pct)) WHERE id = 489;

UPDATE gastos SET base = (50.62::numeric / (1 + iva_pct)) WHERE id = 534;

UPDATE gastos SET base = (100.11::numeric / (1 + iva_pct)) WHERE id = 544;

UPDATE gastos SET base = (100::numeric / (1 + iva_pct)) WHERE id = 558;

UPDATE gastos SET base = (4.98::numeric / (1 + iva_pct)) WHERE id = 567;

UPDATE gastos SET base = (5.5::numeric / (1 + iva_pct)) WHERE id = 584;

UPDATE gastos SET base = (0.14::numeric / (1 + iva_pct)) WHERE id = 642;

UPDATE gastos SET base = (3.6::numeric / (1 + iva_pct)) WHERE id = 649;

UPDATE gastos SET base = (37.83::numeric / (1 + iva_pct)) WHERE id = 654;

UPDATE gastos SET base = (26.99::numeric / (1 + iva_pct)) WHERE id = 659;

UPDATE gastos SET base = (84.84::numeric / (1 + iva_pct)) WHERE id = 665;

UPDATE gastos SET base = (4.75::numeric / (1 + iva_pct)) WHERE id = 678;

UPDATE gastos SET base = (35::numeric / (1 + iva_pct)) WHERE id = 685;

UPDATE gastos SET base = (32.47::numeric / (1 + iva_pct)) WHERE id = 697;

UPDATE gastos SET base = (125::numeric / (1 + iva_pct)) WHERE id = 702;

UPDATE gastos SET base = (13.45::numeric / (1 + iva_pct)) WHERE id = 742;

UPDATE gastos SET base = (10.28::numeric / (1 + iva_pct)) WHERE id = 749;

UPDATE gastos SET base = (4.35::numeric / (1 + iva_pct)) WHERE id = 750;

UPDATE gastos SET base = (2.1::numeric / (1 + iva_pct)) WHERE id = 772;

UPDATE gastos SET base = (1.99::numeric / (1 + iva_pct)) WHERE id = 780;

UPDATE gastos SET base = (10::numeric / (1 + iva_pct)) WHERE id = 757;

UPDATE gastos SET base = (64.95::numeric / (1 + iva_pct)) WHERE id = 785;

UPDATE gastos SET base = (39.99::numeric / (1 + iva_pct)) WHERE id = 818;

DELETE FROM gastos WHERE id IN (819, 807);

DELETE FROM factura_lineas WHERE factura_id IN (173, 214, 215);

DELETE FROM cobros WHERE factura_id IN (173, 214, 215);

DELETE FROM facturas WHERE id IN (173, 214, 215);

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-01-05', 'ROBO', 'ROBO', (25::numeric / 1), 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, false, 'Cuenta original: Efectivo David · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-01', 'Parking evento', 'Port de mataró', (17.65::numeric / 1), 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', false, false, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-02', 'Rampa minus', 'Bizum', (35::numeric / 1), 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', false, false, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-03', '¿?', 'Leroy Merlin', (19.27::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Obra y reformas' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-08', 'PRUEBA EURO', 'Ethos gym', (1::numeric / 1), 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', false, false, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-08', 'Monster', 'Spar', (1.79::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-11', '¿?', 'Spar', (1::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-14', 'Spar', 'Spar', (2.99::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-16', 'Ropa', 'IDENTIK', (761.43::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', true, true, 'Cuenta original: Cuenta Luis · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-24', 'Spar', 'Spar', (3.09::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-02-24', 'Spar', 'Spar', (2.2::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-04-11', 'Aguas', 'Spar', (1.62::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 2, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-04-24', 'Aguas', 'Spar', (2.37::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-05-08', 'Bocatas pipa', 'La Pipa', (18::numeric / 1), 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 2, 'presencial', 'ethos', false, false, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-05-08', 'aguas', 'Spar', (3.55::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-05-07', 'ni idea', 'Spar', (4.2::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Otros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-20', 'IRPF', 'IRPF', (683.07::numeric / 1), 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Impuestos' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'RETENCIONES PRACTICADAS 2TRIMESTRE · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-21', 'Aigues de barcelona', 'Musa', (88.27::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Suministros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-20', 'Gestor', 'Xavi', (116.16::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Gestoría' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-25', 'COSAS', 'Spar', (1.98::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Maquinaria y material' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-26', 'COSAS', 'Spar', (4.97::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Maquinaria y material' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-28', 'Almacenamiento drive', 'Google Drive', (1.99::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Software' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-29', 'Electricidad', 'GanaEnergia', (135.96::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Suministros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-30', 'MARCO LEROY', 'LEROY MERLIN', (10.99::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Obra y reformas' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-30', 'IMPRESION MANDAMIENTOS', 'Firplan', (12.6::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Maquinaria y material' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-30', 'VASOS Y PAPEL', 'ALIEXPRESS', (33.22::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Maquinaria y material' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-30', 'copia llaves', 'Calbet', (5.8::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Maquinaria y material' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-31', 'Orange teléfono y WIFI JULIO', 'Orange', (44.95::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Internet y teléfono' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-07-31', 'Autónomos', 'Hacienda', (177.12::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Cuota autónomos' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-31', 'Comisiones CAIXA TPV AGOSTO', 'Caixabank', (0.44::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Comisiones bancarias' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'COMISIONES TPV / DOMICILIADOS / DEVOLUCIONES DOMICILIACIONES · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-01', 'Préstamo', 'Caixabank', (483.15::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Préstamo' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-01', 'Seguros', 'Caixabank', (120.02::numeric / 1.21), 0.21, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Seguros' LIMIT 1), 1, 'presencial', 'ethos', true, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-01-02', 'NOMINA LUIS', 11.76, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), 1, 'presencial', 'ethos', false, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-01-02', 'NOMINA DAVID', 602.09, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, true, 'Cuenta original: Efectivo David · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-06-02', 'NOMINA DAVID', 500, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, true, 'Cuenta original: Efectivo David · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-01', 'NOMINA LUIS (julio)', 70, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, true, 'Cuenta original: Efectivo Luis · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-02', 'NOMINA LUIS (julio)', 878.33, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), 1, 'presencial', 'ethos', false, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-03', 'NOMINA LUIS (julio)', 110, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, true, 'Cuenta original: Efectivo David · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-04', 'NOMINA LUIS (julio)', 408.45, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), 2, 'presencial', 'ethos', false, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-05', 'NOMINA DAVID (julio)', 595, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, true, 'Cuenta original: Efectivo David · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-06', 'NOMINA DAVID (julio)', 180, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), (SELECT id FROM cuentas WHERE codigo = 'personal'), 'presencial', 'ethos', false, true, 'Cuenta original: Cuenta David · Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-07', 'NOMINA DAVID (julio)', 718.34, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), 1, 'presencial', 'ethos', false, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-08', 'NOMINA ALEX ESTEBAN (julio)', 38.5, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), 2, 'presencial', 'ethos', false, true, 'Importado del Excel (ago 2026)');

INSERT INTO gastos (fecha, concepto, base, iva_pct, irpf_pct, categoria_id, cuenta_id, canal, imputado_a, deducible, tiene_factura, notas)
VALUES ('2026-08-09', 'NOMINA ALEX GUERRERO (julio)', 166, 0, 0, (SELECT id FROM categorias WHERE tipo = 'gasto' AND nombre = 'Nóminas' LIMIT 1), 2, 'presencial', 'ethos', false, true, 'Importado del Excel (ago 2026)');

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES ((SELECT id FROM clientes WHERE lower(translate(nombre || ' ' || coalesce(apellidos, ''), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) LIKE '%francesc%e%' LIMIT 1), (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-03-31', '20 pareja - Pago 3/3', (240::numeric / 1.21), 0.21, 0, 'presencial', false, false, false, 'Cuenta original: Efectivo Luis · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-03-28', 240, (SELECT id FROM cuentas WHERE codigo = 'personal'), 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES ((SELECT id FROM clientes WHERE lower(translate(nombre || ' ' || coalesce(apellidos, ''), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) LIKE '%iker%' LIMIT 1), (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-04-24', 'Revisión', (25::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-04-24', 25, 1, 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1), 'ethos', '2026-07-20', 'ENTRENOS GRUPALES · Ventas EFECTIVO del 20 al 26 de JULIO', (95::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'ANNA PERRONE · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-20', 95, 2, 'efectivo', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1), 'ethos', '2026-07-20', 'ENTRENOS GRUPALES · Ventas BIZUM del 20 al 26 de JULIO', (61.6::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'ANDRES / SILVIA PARRA EXTRA · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-20', 61.6, 1, 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1), 'ethos', '2026-07-20', 'ENTRENOS GRUPALES · Ventas TPV del 20 al 26 de JULIO', (66.83::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'LAURA NOVIA SERGIO · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-20', 66.83, 1, 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1), 'ethos', '2026-07-27', 'ENTRENOS GRUPALES · Ventas EFECTIVO del 27 al 31 de JULIO', (179.9::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'ITO AGOSTO / FATIMA AGOSTO / CLASE EXTRA POLETE · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-27', 179.9, 2, 'efectivo', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE '%grupal%' LIMIT 1), 'ethos', '2026-07-27', 'ENTRENOS GRUPALES · Ventas TPV del 27 al 31 de JULIO', (216.41::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'MIKI AGOSTO / MARI CARMEN AGOSTO · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-27', 216.41, 1, 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES (NULL, (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-07-17', 'NO SABEMOS DE QUE', (10.8::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-13', 10.8, 2, 'efectivo', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES ((SELECT id FROM clientes WHERE lower(translate(nombre || ' ' || coalesce(apellidos, ''), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) LIKE '%raul%vila%' LIMIT 1), (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-07-29', 'Raul Vila', (300::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-01', 300, 1, 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES ((SELECT id FROM clientes WHERE lower(translate(nombre || ' ' || coalesce(apellidos, ''), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) LIKE '%kinverly%' LIMIT 1), (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-07-31', 'KINVERLY', (110::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-01', 110, 1, 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES ((SELECT id FROM clientes WHERE lower(translate(nombre || ' ' || coalesce(apellidos, ''), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) LIKE '%julia%bascunana%' LIMIT 1), (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-07-31', 'JULIA BASCUÑANA', (180::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'Cuenta original: Cuenta David · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-07-31', 180, (SELECT id FROM cuentas WHERE codigo = 'personal'), 'transferencia', true FROM f;

WITH f AS (
  INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, computa_reparto, computa_impuestos, es_recurrente, notas)
  VALUES ((SELECT id FROM clientes WHERE lower(translate(nombre || ' ' || coalesce(apellidos, ''), 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) LIKE '%raul%vazquez%' LIMIT 1), (SELECT id FROM categorias WHERE tipo = 'ingreso' AND nombre ILIKE 'otros' LIMIT 1), 'ethos', '2026-08-05', 'Javi es su padre - Bono 20 EP 1/2', (339.95::numeric / 1.21), 0.21, 0, 'presencial', true, true, false, 'Pago fraccionado 1/2 el 19/08 paga el resto · Importado del Excel (ago 2026)')
  RETURNING id
) INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo, afecta_caja)
SELECT id, '2026-08-05', 339.95, 1, 'transferencia', true FROM f;

INSERT INTO traspasos (fecha, importe, cuenta_origen_id, cuenta_destino_id, motivo)
VALUES ('2026-07-17', 201.77, 4, 1, 'ELISA Y PREET (Stripe a banco)');

INSERT INTO traspasos (fecha, importe, cuenta_origen_id, cuenta_destino_id, motivo)
VALUES ('2026-07-01', 675.00, 2, (SELECT id FROM cuentas WHERE codigo = 'personal'), 'APORTACION DAVID KAIZEN (salida de caja)');

INSERT INTO traspasos (fecha, importe, cuenta_origen_id, cuenta_destino_id, motivo)
VALUES ('2026-08-01', 370.00, (SELECT id FROM cuentas WHERE codigo = 'personal'), 2, 'DE PORCEL A ETHOS (aportacion efectivo)');

COMMIT;


-- Ajuste fino: fija los saldos exactamente a los del Excel y guarda el detalle
DO $$
DECLARE v RECORD; objetivo NUMERIC; delta NUMERIC;
BEGIN
  FOR v IN SELECT * FROM v_saldo_cuentas WHERE codigo IN ('banco','caja','stripe') LOOP
    objetivo := CASE v.codigo WHEN 'banco' THEN 3879.12 WHEN 'caja' THEN 370.00 ELSE 0.00 END;
    delta := objetivo - v.saldo;
    IF abs(delta) > 0.001 THEN
      UPDATE cuentas SET saldo_inicial = saldo_inicial + delta WHERE id = v.id;
      RAISE NOTICE 'ajuste %: % (saldo % -> %)', v.codigo, delta, v.saldo, objetivo;
    END IF;
  END LOOP;
END $$;
SELECT codigo, saldo FROM v_saldo_cuentas ORDER BY id;