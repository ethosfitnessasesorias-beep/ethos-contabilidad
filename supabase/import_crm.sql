-- Importación CRM Clientes desde el Excel. Upsert por email/nombre.
BEGIN;
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Salazar'), email = COALESCE(email, 'kartagena25@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '643 83 97 58'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-06-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'kartagena25@gmail.com' OR (lower(nombre) = 'ervin' AND coalesce(lower(apellidos),'') = 'salazar') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ervin', 'Salazar', 'kartagena25@gmail.com', NULL, '643 83 97 58', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-04-08', NULL, NULL, NULL, '2024-06-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, '-'), email = COALESCE(email, 'alberto22rg@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '678 28 61 61'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-06-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'alberto22rg@gmail.com' OR (lower(nombre) = 'alberto' AND coalesce(lower(apellidos),'') = '-') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alberto', '-', 'alberto22rg@gmail.com', NULL, '678 28 61 61', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-04-08', NULL, NULL, NULL, '2024-06-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Salazar Berrones'), email = COALESCE(email, 'bryanaasalazar03@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '617 75 30 05'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-06-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'bryanaasalazar03@gmail.com' OR (lower(nombre) = 'bryan alexis' AND coalesce(lower(apellidos),'') = 'salazar berrones') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Bryan Alexis', 'Salazar Berrones', 'bryanaasalazar03@gmail.com', NULL, '617 75 30 05', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-04-08', NULL, NULL, NULL, '2024-06-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mendoza Gil'), email = COALESCE(email, 'jessica_mendoza_gil@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '661 73 08 18'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-08-05'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-02-05'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'jessica_mendoza_gil@hotmail.com' OR (lower(nombre) = 'jessica' AND coalesce(lower(apellidos),'') = 'mendoza gil') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jessica', 'Mendoza Gil', 'jessica_mendoza_gil@hotmail.com', NULL, '661 73 08 18', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-08-05', NULL, NULL, NULL, '2025-02-05', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Diaz'), email = COALESCE(email, 'aifos.serrano@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '696 34 17 73'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-05-06'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-06'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'aifos.serrano@gmail.com' OR (lower(nombre) = 'sofía' AND coalesce(lower(apellidos),'') = 'diaz') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sofía', 'Diaz', 'aifos.serrano@gmail.com', NULL, '696 34 17 73', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-05-06', NULL, NULL, NULL, '2025-04-06', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Corbalan Porto'), email = COALESCE(email, 'andycorbalan56@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '678 94 10 47'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-03-21'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-21'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'andycorbalan56@gmail.com' OR (lower(nombre) = 'andy' AND coalesce(lower(apellidos),'') = 'corbalan porto') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Andy', 'Corbalan Porto', 'andycorbalan56@gmail.com', NULL, '678 94 10 47', 'david', 'cliente', NULL, 'Entreno: Mensual', '2024-03-21', NULL, NULL, NULL, '2025-03-21', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, 'adribr2001@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '644 61 39 88'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2023-12-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-07-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'adribr2001@gmail.com' OR (lower(nombre) = 'adrian' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adrian', NULL, 'adribr2001@gmail.com', NULL, '644 61 39 88', 'david', 'cliente', NULL, 'Entreno + Nutri: Mensual', '2023-12-01', NULL, NULL, NULL, '2024-07-01', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Tabares Calero'), email = COALESCE(email, 'tabareskinverly@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '632 46 45 77'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-06-10'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-05-10'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'tabareskinverly@gmail.com' OR (lower(nombre) = 'kinverly' AND coalesce(lower(apellidos),'') = 'tabares calero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Kinverly', 'Tabares Calero', 'tabareskinverly@gmail.com', NULL, '632 46 45 77', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-06-10', NULL, NULL, NULL, '2025-05-10', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martín Ferrer'), email = COALESCE(email, 'sergiomf1994@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '622 11 94 17'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-06-09'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-10-13'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sergiomf1994@gmail.com' OR (lower(nombre) = 'sergi' AND coalesce(lower(apellidos),'') = 'martín ferrer') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sergi', 'Martín Ferrer', 'sergiomf1994@gmail.com', NULL, '622 11 94 17', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2025-06-09', NULL, NULL, NULL, '2025-10-13', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Kirby Bustamante'), email = COALESCE(email, 'juanjosekirby00@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '611 77 48 41'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-08-05'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-05-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'juanjosekirby00@gmail.com' OR (lower(nombre) = 'juan josé' AND coalesce(lower(apellidos),'') = 'kirby bustamante') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Juan José', 'Kirby Bustamante', 'juanjosekirby00@gmail.com', NULL, '611 77 48 41', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-08-05', NULL, NULL, NULL, '2025-05-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Porcel Sanchez'), email = COALESCE(email, 'lporcelsanchez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '622 70 05 37'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-09-02'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-10-02'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'lporcelsanchez@gmail.com' OR (lower(nombre) = 'laura' AND coalesce(lower(apellidos),'') = 'porcel sanchez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Laura', 'Porcel Sanchez', 'lporcelsanchez@gmail.com', NULL, '622 70 05 37', 'david', 'cliente', NULL, 'Entreno + Nutri: Mensual', '2024-09-02', NULL, NULL, NULL, '2024-10-02', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Díaz Granero'), email = COALESCE(email, 'ruben.diaz.granero@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '622 47 10 55'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-10-14'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'ruben.diaz.granero@gmail.com' OR (lower(nombre) = 'rubén' AND coalesce(lower(apellidos),'') = 'díaz granero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Rubén', 'Díaz Granero', 'ruben.diaz.granero@gmail.com', NULL, '622 47 10 55', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-10-14', NULL, NULL, NULL, NULL, true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Valera'), email = COALESCE(email, 'erasmovalera717@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '698 45 64 50'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-09-02'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-02-02'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'erasmovalera717@gmail.com' OR (lower(nombre) = 'guzman' AND coalesce(lower(apellidos),'') = 'valera') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Guzman', 'Valera', 'erasmovalera717@gmail.com', NULL, '698 45 64 50', 'david', 'cliente', NULL, 'Entreno + Nutri: Mensual', '2024-09-02', NULL, NULL, NULL, '2025-02-02', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Navarrete Llamas'), email = COALESCE(email, 'carlosnavarretebcn@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '674 308 599'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-11-11'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-11-11'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'carlosnavarretebcn@gmail.com' OR (lower(nombre) = 'carlos' AND coalesce(lower(apellidos),'') = 'navarrete llamas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Carlos', 'Navarrete Llamas', 'carlosnavarretebcn@gmail.com', NULL, '674 308 599', 'david', 'cliente', NULL, 'Entreno: Trim', '2024-11-11', NULL, NULL, NULL, '2024-11-11', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Corredera'), email = COALESCE(email, 'acorredera07@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '722 64 46 33'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-05-27'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-08-27'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'acorredera07@gmail.com' OR (lower(nombre) = 'alex' AND coalesce(lower(apellidos),'') = 'corredera') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alex', 'Corredera', 'acorredera07@gmail.com', NULL, '722 64 46 33', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-05-27', NULL, NULL, NULL, '2024-08-27', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, NULL),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2023-12-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-06-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE false OR (lower(nombre) = 'héctor' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Héctor', NULL, NULL, NULL, NULL, 'david', 'cliente', NULL, 'Entreno + Nutri: Mensual', '2023-12-01', NULL, NULL, NULL, '2024-06-01', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Durán Díaz'), email = COALESCE(email, 'irenedd88@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '667 91 48 79'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-11-18'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-18'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'irenedd88@gmail.com' OR (lower(nombre) = 'irene' AND coalesce(lower(apellidos),'') = 'durán díaz') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Irene', 'Durán Díaz', 'irenedd88@gmail.com', NULL, '667 91 48 79', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-11-18', NULL, NULL, NULL, '2025-04-18', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martin Guerrero'), email = COALESCE(email, 'manuelqmg93@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '603 43 93 87'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-11-18'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-12-18'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'manuelqmg93@gmail.com' OR (lower(nombre) = 'manuel' AND coalesce(lower(apellidos),'') = 'martin guerrero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Manuel', 'Martin Guerrero', 'manuelqmg93@gmail.com', NULL, '603 43 93 87', 'david', 'cliente', NULL, 'Entreno + Nutri: Mensual', '2024-11-18', NULL, NULL, NULL, '2024-12-18', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Zarcero Colon'), email = COALESCE(email, 'marczarcero87@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '676 25 77 17'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-11-18'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-18'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'marczarcero87@gmail.com' OR (lower(nombre) = 'marc' AND coalesce(lower(apellidos),'') = 'zarcero colon') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Marc', 'Zarcero Colon', 'marczarcero87@gmail.com', NULL, '676 25 77 17', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-11-18', NULL, NULL, NULL, '2025-04-18', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Hernandez'), email = COALESCE(email, 'edubcn-81@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '685 58 24 12'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-11-25'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-01-25'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'edubcn-81@hotmail.com' OR (lower(nombre) = 'edu' AND coalesce(lower(apellidos),'') = 'hernandez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Edu', 'Hernandez', 'edubcn-81@hotmail.com', NULL, '685 58 24 12', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-11-25', NULL, NULL, NULL, '2025-01-25', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Muñoz'), email = COALESCE(email, 'sir.magicc@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '656 19 13 44'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-09'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-09'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'sir.magicc@gmail.com' OR (lower(nombre) = 'joel' AND coalesce(lower(apellidos),'') = 'muñoz') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joel', 'Muñoz', 'sir.magicc@gmail.com', NULL, '656 19 13 44', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2024-12-09', NULL, NULL, NULL, '2025-06-09', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Muriano Huertas'), email = COALESCE(email, 'cesarnickolas@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '699 40 68 20'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-09'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-09'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'cesarnickolas@gmail.com' OR (lower(nombre) = 'césar nikolas' AND coalesce(lower(apellidos),'') = 'muriano huertas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'César Nikolas', 'Muriano Huertas', 'cesarnickolas@gmail.com', NULL, '699 40 68 20', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-12-09', NULL, NULL, NULL, '2025-03-09', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Arenas'), email = COALESCE(email, 'jmarenasc@yahoo.es'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '654 49 42 83'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-16'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-05-16'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'jmarenasc@yahoo.es' OR (lower(nombre) = 'jose' AND coalesce(lower(apellidos),'') = 'arenas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jose', 'Arenas', 'jmarenasc@yahoo.es', NULL, '654 49 42 83', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-12-16', NULL, NULL, NULL, '2025-05-16', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Morales'), email = COALESCE(email, 'ariadna.9222@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '634 83 24 95'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-09'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-02-09'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'ariadna.9222@gmail.com' OR (lower(nombre) = 'ariadna' AND coalesce(lower(apellidos),'') = 'morales') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ariadna', 'Morales', 'ariadna.9222@gmail.com', NULL, '634 83 24 95', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-12-09', NULL, NULL, NULL, '2025-02-09', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Medina correa'), email = COALESCE(email, 'briianmedina24@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '633 93 47 74'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-23'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-01-23'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'briianmedina24@gmail.com' OR (lower(nombre) = 'brian' AND coalesce(lower(apellidos),'') = 'medina correa') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Brian', 'Medina correa', 'briianmedina24@gmail.com', NULL, '633 93 47 74', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-12-23', NULL, NULL, NULL, '2025-01-23', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, 'valeria.g.sosamartinez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '605 44 79 23'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-13'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-13'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'valeria.g.sosamartinez@gmail.com' OR (lower(nombre) = 'valeria' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Valeria', NULL, 'valeria.g.sosamartinez@gmail.com', NULL, '605 44 79 23', 'david', 'cliente', NULL, 'Nutri: Mensual', '2025-01-13', NULL, NULL, NULL, '2025-06-13', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Gómez Serrano'), email = COALESCE(email, 'sergiogomezs1993@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '666 81 05 66'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sergiogomezs1993@gmail.com' OR (lower(nombre) = 'sergio' AND coalesce(lower(apellidos),'') = 'gómez serrano') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sergio', 'Gómez Serrano', 'sergiogomezs1993@gmail.com', NULL, '666 81 05 66', 'david', 'cliente', NULL, 'Nutri: Mensual', '2025-01-08', NULL, NULL, NULL, '2025-06-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Osma'), email = COALESCE(email, 'samara_panda28@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '682 80 26 56'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-09'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-09'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'samara_panda28@hotmail.com' OR (lower(nombre) = 'samara' AND coalesce(lower(apellidos),'') = 'osma') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Samara', 'Osma', 'samara_panda28@hotmail.com', NULL, '682 80 26 56', 'david', 'cliente', NULL, 'Nutri: Mensual', '2025-01-09', NULL, NULL, NULL, '2025-06-09', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Duran'), email = COALESCE(email, 'durancrece@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '639 94 87 14'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-13'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-13'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'durancrece@gmail.com' OR (lower(nombre) = 'cresencio' AND coalesce(lower(apellidos),'') = 'duran') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Cresencio', 'Duran', 'durancrece@gmail.com', NULL, '639 94 87 14', 'david', 'cliente', NULL, 'Nutri: Mensual', '2025-01-13', NULL, NULL, NULL, '2025-06-13', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Suarez'), email = COALESCE(email, 'suarezreyesalba@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '692 94 22 64'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'suarezreyesalba@gmail.com' OR (lower(nombre) = 'alba' AND coalesce(lower(apellidos),'') = 'suarez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alba', 'Suarez', 'suarezreyesalba@gmail.com', NULL, '692 94 22 64', 'david', 'cliente', NULL, 'Nutri: Mensual', '2025-01-08', NULL, NULL, NULL, '2025-03-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Rodriguez Gallego'), email = COALESCE(email, 'sarar158@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '644 44 44 60'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-07-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sarar158@gmail.com' OR (lower(nombre) = 'sara' AND coalesce(lower(apellidos),'') = 'rodriguez gallego') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sara', 'Rodriguez Gallego', 'sarar158@gmail.com', NULL, '644 44 44 60', 'david', 'cliente', NULL, 'Entreno + Nutri: Trim', '2025-01-01', NULL, NULL, NULL, '2025-07-01', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Lopez Villaplana'), email = COALESCE(email, 'm13lv98@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '654 80 55 15'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-10'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-10'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'm13lv98@gmail.com' OR (lower(nombre) = 'maria' AND coalesce(lower(apellidos),'') = 'lopez villaplana') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Maria', 'Lopez Villaplana', 'm13lv98@gmail.com', NULL, '654 80 55 15', 'david', 'cliente', NULL, 'Entreno + Nutri: Mensual', '2025-02-10', NULL, NULL, NULL, '2025-03-10', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Llaneras'), email = COALESCE(email, NULL),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno Personal'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-10'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-30'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE false OR (lower(nombre) = 'laura' AND coalesce(lower(apellidos),'') = 'llaneras') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Laura', 'Llaneras', NULL, NULL, NULL, 'david', 'cliente', NULL, 'Entreno Personal', '2025-02-10', NULL, NULL, NULL, '2025-06-30', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Jordán Domene'), email = COALESCE(email, 'asun.jd@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '626 07 49 47'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'asun.jd@gmail.com' OR (lower(nombre) = 'maría asunción' AND coalesce(lower(apellidos),'') = 'jordán domene') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'María Asunción', 'Jordán Domene', 'asun.jd@gmail.com', NULL, '626 07 49 47', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-12-01', NULL, NULL, NULL, '2025-06-01', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Luna González'), email = COALESCE(email, 'luna212@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '646 66 02 42'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'luna212@gmail.com' OR (lower(nombre) = 'miguel ángel' AND coalesce(lower(apellidos),'') = 'luna gonzález') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Miguel Ángel', 'Luna González', 'luna212@gmail.com', NULL, '646 66 02 42', 'david', 'cliente', NULL, 'Nutri: Mensual', '2024-12-01', NULL, NULL, NULL, '2025-06-01', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martínez Moreno'), email = COALESCE(email, 'sandramartinezmoreno073@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '616 87 13 89'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Nutri: Mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-05-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sandramartinezmoreno073@gmail.com' OR (lower(nombre) = 'sandra' AND coalesce(lower(apellidos),'') = 'martínez moreno') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sandra', 'Martínez Moreno', 'sandramartinezmoreno073@gmail.com', NULL, '616 87 13 89', 'david', 'cliente', NULL, 'Nutri: Mensual', '2025-02-01', NULL, NULL, NULL, '2025-05-01', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Bascuña'), email = COALESCE(email, 'juliiabn18@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno: Trim'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-03-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'juliiabn18@gmail.com' OR (lower(nombre) = 'julia' AND coalesce(lower(apellidos),'') = 'bascuña') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Julia', 'Bascuña', 'juliiabn18@gmail.com', NULL, NULL, 'david', 'cliente', NULL, 'Entreno: Trim', '2025-03-01', NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Otero Barreiro'), email = COALESCE(email, 'ramonbeta@outlook.es'),
    nif = COALESCE(nif, '45953151W'), telefono = COALESCE(telefono, '623031861'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento: Pago único'),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, '2025-07-08'),
    primer_contacto = COALESCE(primer_contacto, '2025-07-08'), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-07-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'ramonbeta@outlook.es' OR (lower(nombre) = 'ramón bentayga' AND coalesce(lower(apellidos),'') = 'otero barreiro') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ramón Bentayga', 'Otero Barreiro', 'ramonbeta@outlook.es', '45953151W', '623031861', 'david', 'cliente', NULL, 'Plan entrenamiento: Pago único', NULL, '2025-07-08', '2025-07-08', NULL, '2025-07-08', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Merlo Escamilla'), email = COALESCE(email, 'paolamerlo1007@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '643 67 76 99'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno + Nutri: Premium + 2 EP'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-07'), fecha_registro = COALESCE(fecha_registro, '2025-07-09'),
    primer_contacto = COALESCE(primer_contacto, '2025-06-27'), fecha_compra = COALESCE(fecha_compra, '2025-06-28'),
    fecha_baja = COALESCE(fecha_baja, '2025-07-28'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'paolamerlo1007@gmail.com' OR (lower(nombre) = 'paola' AND coalesce(lower(apellidos),'') = 'merlo escamilla') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Paola', 'Merlo Escamilla', 'paolamerlo1007@gmail.com', NULL, '643 67 76 99', 'david', 'cliente', NULL, 'Entreno + Nutri: Premium + 2 EP', '2025-07-07', '2025-07-09', '2025-06-27', '2025-06-28', '2025-07-28', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, NULL),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '697 22 20 50'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno +Nutri: Basico+ 2 EP'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-06-16'), fecha_registro = COALESCE(fecha_registro, '2025-09-16'),
    primer_contacto = COALESCE(primer_contacto, '2025-06-10'), fecha_compra = COALESCE(fecha_compra, '2025-06-16'),
    fecha_baja = COALESCE(fecha_baja, '2025-09-16'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE false OR (lower(nombre) = 'paola' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Paola', NULL, NULL, NULL, '697 22 20 50', 'david', 'cliente', NULL, 'Entreno +Nutri: Basico+ 2 EP', '2025-06-16', '2025-09-16', '2025-06-10', '2025-06-16', '2025-09-16', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Viladecas Checa'), email = COALESCE(email, 'rviladecas11@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '691 05 87 98'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Enteno básico trimestral'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-06-30'), fecha_registro = COALESCE(fecha_registro, '2025-07-12'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'rviladecas11@gmail.com' OR (lower(nombre) = 'raúl' AND coalesce(lower(apellidos),'') = 'viladecas checa') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Raúl', 'Viladecas Checa', 'rviladecas11@gmail.com', NULL, '691 05 87 98', 'david', 'cliente', NULL, 'Enteno básico trimestral', '2025-06-30', '2025-07-12', NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Portero'), email = COALESCE(email, 'aliporterop@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '613 52 90 65'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Enteno básico mensual'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-04-28'), fecha_registro = COALESCE(fecha_registro, '2025-07-15'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-28'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'aliporterop@gmail.com' OR (lower(nombre) = 'alicia' AND coalesce(lower(apellidos),'') = 'portero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alicia', 'Portero', 'aliporterop@gmail.com', NULL, '613 52 90 65', 'david', 'cliente', NULL, 'Enteno básico mensual', '2025-04-28', '2025-07-15', NULL, NULL, '2025-04-28', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, NULL),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '642 71 25 36'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno grupal'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-06-30'), fecha_registro = COALESCE(fecha_registro, '2025-07-15'),
    primer_contacto = COALESCE(primer_contacto, '2025-07-15'), fecha_compra = COALESCE(fecha_compra, '2025-07-15'),
    fecha_baja = COALESCE(fecha_baja, '2025-09-05'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE false OR (lower(nombre) = 'sol' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sol', NULL, NULL, NULL, '642 71 25 36', 'david', 'cliente', NULL, 'Entreno grupal', '2025-06-30', '2025-07-15', '2025-07-15', '2025-07-15', '2025-09-05', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Rodriguez'), email = COALESCE(email, NULL),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '612 47 45 91'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Entreno grupal'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-05-28'), fecha_registro = COALESCE(fecha_registro, '2025-07-15'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-05-28'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE false OR (lower(nombre) = 'jorge' AND coalesce(lower(apellidos),'') = 'rodriguez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jorge', 'Rodriguez', NULL, NULL, '612 47 45 91', 'david', 'cliente', NULL, 'Entreno grupal', '2025-05-28', '2025-07-15', NULL, NULL, '2025-05-28', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Motta'), email = COALESCE(email, 'motta.veronica25@gmail.com'),
    nif = COALESCE(nif, 'Z3353270-J'), telefono = COALESCE(telefono, '695956024'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-29'), fecha_registro = COALESCE(fecha_registro, '2025-07-29'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'motta.veronica25@gmail.com' OR (lower(nombre) = 'verónica' AND coalesce(lower(apellidos),'') = 'motta') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Verónica', 'Motta', 'motta.veronica25@gmail.com', 'Z3353270-J', '695956024', 'david', 'cliente', NULL, 'Otro', '2025-07-29', '2025-07-29', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Cavanillas Roca'), email = COALESCE(email, 'aleejandro.cr5@gmail.com'),
    nif = COALESCE(nif, '47864159D'), telefono = COALESCE(telefono, '656925625'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-29'), fecha_registro = COALESCE(fecha_registro, '2025-07-29'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-07-29'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'aleejandro.cr5@gmail.com' OR (lower(nombre) = 'alejandro' AND coalesce(lower(apellidos),'') = 'cavanillas roca') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alejandro', 'Cavanillas Roca', 'aleejandro.cr5@gmail.com', '47864159D', '656925625', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-07-29', '2025-07-29', NULL, NULL, '2025-07-29', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Quiroga'), email = COALESCE(email, 'josefinaquiroga@gmail.com'),
    nif = COALESCE(nif, 'Y9959083M'), telefono = COALESCE(telefono, '611634555'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-08-07'), fecha_registro = COALESCE(fecha_registro, '2025-08-07'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'josefinaquiroga@gmail.com' OR (lower(nombre) = 'josefina' AND coalesce(lower(apellidos),'') = 'quiroga') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Josefina', 'Quiroga', 'josefinaquiroga@gmail.com', 'Y9959083M', '611634555', 'david', 'cliente', NULL, 'Otro', '2025-08-07', '2025-08-07', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Borràs Roda'), email = COALESCE(email, 'polborrasroda@gmail.com'),
    nif = COALESCE(nif, '50513064G'), telefono = COALESCE(telefono, '71702431'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-08-14'), fecha_registro = COALESCE(fecha_registro, '2025-08-14'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'polborrasroda@gmail.com' OR (lower(nombre) = 'pol' AND coalesce(lower(apellidos),'') = 'borràs roda') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pol', 'Borràs Roda', 'polborrasroda@gmail.com', '50513064G', '71702431', 'david', 'cliente', NULL, 'Plan entrenamiento básico', '2025-08-14', '2025-08-14', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Hernández Perez'), email = COALESCE(email, 'ruben2005hp@gmail.com'),
    nif = COALESCE(nif, '25369115T'), telefono = COALESCE(telefono, '671238494'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-04'), fecha_registro = COALESCE(fecha_registro, '2025-09-04'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-03-15'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'ruben2005hp@gmail.com' OR (lower(nombre) = 'ruben' AND coalesce(lower(apellidos),'') = 'hernández perez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ruben', 'Hernández Perez', 'ruben2005hp@gmail.com', '25369115T', '671238494', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición premium', '2025-09-04', '2025-09-04', NULL, NULL, '2026-03-15', false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Cidrera Gonzalez'), email = COALESCE(email, 'isa.cidrera@gmail.com'),
    nif = COALESCE(nif, '53323969X'), telefono = COALESCE(telefono, '603613588'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-07'), fecha_registro = COALESCE(fecha_registro, '2025-09-07'),
    primer_contacto = COALESCE(primer_contacto, '2025-09-22'), fecha_compra = COALESCE(fecha_compra, '2025-09-22'),
    fecha_baja = COALESCE(fecha_baja, '2025-11-14'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'isa.cidrera@gmail.com' OR (lower(nombre) = 'isabel' AND coalesce(lower(apellidos),'') = 'cidrera gonzalez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Isabel', 'Cidrera Gonzalez', 'isa.cidrera@gmail.com', '53323969X', '603613588', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-09-07', '2025-09-07', '2025-09-22', '2025-09-22', '2025-11-14', false, true, true, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Bernardino González'), email = COALESCE(email, 'lbernardino5@gmail.com'),
    nif = COALESCE(nif, '49738694k'), telefono = COALESCE(telefono, '639345457'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-13'), fecha_registro = COALESCE(fecha_registro, '2025-09-13'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'lbernardino5@gmail.com' OR (lower(nombre) = 'laura' AND coalesce(lower(apellidos),'') = 'bernardino gonzález') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Laura', 'Bernardino González', 'lbernardino5@gmail.com', '49738694k', '639345457', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-09-13', '2025-09-13', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'fernandez arnau'), email = COALESCE(email, 'afa071102@gmail.com'),
    nif = COALESCE(nif, '47197712X'), telefono = COALESCE(telefono, '608768905'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento: Pago único'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-13'), fecha_registro = COALESCE(fecha_registro, '2025-09-13'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'afa071102@gmail.com' OR (lower(nombre) = 'arnau' AND coalesce(lower(apellidos),'') = 'fernandez arnau') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'arnau', 'fernandez arnau', 'afa071102@gmail.com', '47197712X', '608768905', 'david', 'cliente', NULL, 'Plan entrenamiento: Pago único', '2025-09-13', '2025-09-13', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Silva'), email = COALESCE(email, 'irenesilvamarzal@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2022-12-05'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-08-17'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'irenesilvamarzal@gmail.com' OR (lower(nombre) = 'irene' AND coalesce(lower(apellidos),'') = 'silva') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Irene', 'Silva', 'irenesilvamarzal@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2022-12-05', NULL, NULL, NULL, '2024-08-17', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Sánchez'), email = COALESCE(email, '99alexito99@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-01-02'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = '99alexito99@gmail.com' OR (lower(nombre) = 'alex' AND coalesce(lower(apellidos),'') = 'sánchez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alex', 'Sánchez', '99alexito99@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-01-02', NULL, NULL, NULL, NULL, true, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Sanchez'), email = COALESCE(email, '-'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = '-' OR (lower(nombre) = 'marta' AND coalesce(lower(apellidos),'') = 'sanchez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Marta', 'Sanchez', '-', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Pablo Martos'), email = COALESCE(email, 'juanpablomartosramirez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'juanpablomartosramirez@gmail.com' OR (lower(nombre) = 'juan' AND coalesce(lower(apellidos),'') = 'pablo martos') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Juan', 'Pablo Martos', 'juanpablomartosramirez@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Melgarejo'), email = COALESCE(email, 'genismsanchez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-01-23'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-03-12'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'genismsanchez@gmail.com' OR (lower(nombre) = 'genís' AND coalesce(lower(apellidos),'') = 'melgarejo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Genís', 'Melgarejo', 'genismsanchez@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-01-23', NULL, NULL, NULL, '2024-03-12', true, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mancilla'), email = COALESCE(email, 'franmansa2911@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-01-17'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-01-13'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'franmansa2911@gmail.com' OR (lower(nombre) = 'fran' AND coalesce(lower(apellidos),'') = 'mancilla') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Fran', 'Mancilla', 'franmansa2911@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-01-17', NULL, NULL, NULL, '2024-01-13', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Valero'), email = COALESCE(email, '02valerosergio@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-09-05'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-07-10'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = '02valerosergio@gmail.com' OR (lower(nombre) = 'sergio' AND coalesce(lower(apellidos),'') = 'valero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sergio', 'Valero', '02valerosergio@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-09-05', NULL, NULL, NULL, '2024-07-10', true, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, 'la.valenflorez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'la.valenflorez@gmail.com' OR (lower(nombre) = 'valentina' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Valentina', NULL, 'la.valenflorez@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Montoya'), email = COALESCE(email, 'nicolasmontoya@insbruguers.cat'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'nicolasmontoya@insbruguers.cat' OR (lower(nombre) = 'nicolás' AND coalesce(lower(apellidos),'') = 'montoya') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Nicolás', 'Montoya', 'nicolasmontoya@insbruguers.cat', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Arriagada'), email = COALESCE(email, 'sebuna26@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-04-03'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2023-10-10'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sebuna26@gmail.com' OR (lower(nombre) = 'sebastián' AND coalesce(lower(apellidos),'') = 'arriagada') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sebastián', 'Arriagada', 'sebuna26@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-04-03', NULL, NULL, NULL, '2023-10-10', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Díaz'), email = COALESCE(email, 'ruben.diaz.granero@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-04-10'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-05-23'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'ruben.diaz.granero@gmail.com' OR (lower(nombre) = 'rubén' AND coalesce(lower(apellidos),'') = 'díaz') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Rubén', 'Díaz', 'ruben.diaz.granero@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-04-10', NULL, NULL, NULL, '2024-05-23', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Lidón'), email = COALESCE(email, 'carloslidonsa@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'carloslidonsa@gmail.com' OR (lower(nombre) = 'carlos' AND coalesce(lower(apellidos),'') = 'lidón') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Carlos', 'Lidón', 'carloslidonsa@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'García'), email = COALESCE(email, 'antoniogarcur@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-06-02'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-09-09'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'antoniogarcur@gmail.com' OR (lower(nombre) = 'antonio' AND coalesce(lower(apellidos),'') = 'garcía') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Antonio', 'García', 'antoniogarcur@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-06-02', NULL, NULL, NULL, '2024-09-09', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Vinent'), email = COALESCE(email, 'polvinentlopez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'polvinentlopez@gmail.com' OR (lower(nombre) = 'pol' AND coalesce(lower(apellidos),'') = 'vinent') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pol', 'Vinent', 'polvinentlopez@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Vinent'), email = COALESCE(email, 'tywalkerprods@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-06-14'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-25'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'tywalkerprods@gmail.com' OR (lower(nombre) = 'jan' AND coalesce(lower(apellidos),'') = 'vinent') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jan', 'Vinent', 'tywalkerprods@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-06-14', NULL, NULL, NULL, '2025-03-25', true, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Jiménez Pino'), email = COALESCE(email, 'joanjimenez361@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-06-18'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-05-24'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'joanjimenez361@gmail.com' OR (lower(nombre) = 'joan' AND coalesce(lower(apellidos),'') = 'jiménez pino') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joan', 'Jiménez Pino', 'joanjimenez361@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-06-18', NULL, NULL, NULL, '2024-05-24', true, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Vivancos'), email = COALESCE(email, 'vivancoslozano13@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-06-30'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-05-28'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'vivancoslozano13@gmail.com' OR (lower(nombre) = 'anna' AND coalesce(lower(apellidos),'') = 'vivancos') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Anna', 'Vivancos', 'vivancoslozano13@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-06-30', NULL, NULL, NULL, '2024-05-28', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martínez'), email = COALESCE(email, 'evamartineeez15@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'evamartineeez15@gmail.com' OR (lower(nombre) = 'eva' AND coalesce(lower(apellidos),'') = 'martínez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Eva', 'Martínez', 'evamartineeez15@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Sereno'), email = COALESCE(email, 'joelserenofernandez2001@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-07-31'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-10-20'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'joelserenofernandez2001@gmail.com' OR (lower(nombre) = 'joel' AND coalesce(lower(apellidos),'') = 'sereno') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'joel', 'Sereno', 'joelserenofernandez2001@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-07-31', NULL, NULL, NULL, '2024-10-20', false, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Gonzalez Gallardo'), email = COALESCE(email, 'victorgonzalezgall@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-08-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'victorgonzalezgall@gmail.com' OR (lower(nombre) = 'victor' AND coalesce(lower(apellidos),'') = 'gonzalez gallardo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Victor', 'Gonzalez Gallardo', 'victorgonzalezgall@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-08-01', NULL, NULL, NULL, NULL, true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Salvador'), email = COALESCE(email, 'martasalvadorescrigas@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-08-02'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-07'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'martasalvadorescrigas@gmail.com' OR (lower(nombre) = 'marta' AND coalesce(lower(apellidos),'') = 'salvador') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'marta', 'Salvador', 'martasalvadorescrigas@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-08-02', NULL, NULL, NULL, '2025-03-07', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Pérez'), email = COALESCE(email, 'gabrielperezbarroso1@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-08-28'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-04-28'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'gabrielperezbarroso1@gmail.com' OR (lower(nombre) = 'gabriel' AND coalesce(lower(apellidos),'') = 'pérez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Gabriel', 'Pérez', 'gabrielperezbarroso1@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-08-28', NULL, NULL, NULL, '2024-04-28', true, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Jordan'), email = COALESCE(email, 'nani21jg@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-09-24'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-01-24'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'nani21jg@gmail.com' OR (lower(nombre) = 'nani' AND coalesce(lower(apellidos),'') = 'jordan') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Nani', 'Jordan', 'nani21jg@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-09-24', NULL, NULL, NULL, '2024-01-24', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Villalta'), email = COALESCE(email, 'guillemvillaltac@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-09-27'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-10-02'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'guillemvillaltac@gmail.com' OR (lower(nombre) = 'guille' AND coalesce(lower(apellidos),'') = 'villalta') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Guille', 'Villalta', 'guillemvillaltac@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-09-27', NULL, NULL, NULL, '2025-10-02', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Perez'), email = COALESCE(email, 'sergio22spa@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-11-28'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-04-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'sergio22spa@gmail.com' OR (lower(nombre) = 'sergio' AND coalesce(lower(apellidos),'') = 'perez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sergio', 'Perez', 'sergio22spa@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-11-28', NULL, NULL, NULL, '2024-04-01', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Haro Capitán'), email = COALESCE(email, 'elio61185@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2023-12-28'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2023-12-28'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'elio61185@gmail.com' OR (lower(nombre) = 'elio' AND coalesce(lower(apellidos),'') = 'haro capitán') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Elio', 'Haro Capitán', 'elio61185@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2023-12-28', NULL, NULL, NULL, '2023-12-28', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Salvador'), email = COALESCE(email, 'marc.vilabona@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-02-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-02-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'marc.vilabona@gmail.com' OR (lower(nombre) = 'marc' AND coalesce(lower(apellidos),'') = 'salvador') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Marc', 'Salvador', 'marc.vilabona@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-02-01', NULL, NULL, NULL, '2025-02-01', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mateu'), email = COALESCE(email, 'jmateumartinez17@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-02-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-08-19'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'jmateumartinez17@gmail.com' OR (lower(nombre) = 'jairo' AND coalesce(lower(apellidos),'') = 'mateu') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jairo', 'Mateu', 'jmateumartinez17@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-02-08', NULL, NULL, NULL, '2024-08-19', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Olivera'), email = COALESCE(email, 'michelolivera0202@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-02-07'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-11-18'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'michelolivera0202@gmail.com' OR (lower(nombre) = 'michel' AND coalesce(lower(apellidos),'') = 'olivera') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Michel', 'Olivera', 'michelolivera0202@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-02-07', NULL, NULL, NULL, '2024-11-18', false, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Gironés'), email = COALESCE(email, '-'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = '-' OR (lower(nombre) = 'aida' AND coalesce(lower(apellidos),'') = 'gironés') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Aida', 'Gironés', '-', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, NULL), email = COALESCE(email, '-'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = '-' OR (lower(nombre) = 'carla (adri monge) x1' AND coalesce(lower(apellidos),'') = NULL) RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Carla (adri monge) x1', NULL, '-', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'González'), email = COALESCE(email, 'francesc-gonzalez@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'francesc-gonzalez@hotmail.com' OR (lower(nombre) = 'francesc' AND coalesce(lower(apellidos),'') = 'gonzález') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Francesc', 'González', 'francesc-gonzalez@hotmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Alcalá'), email = COALESCE(email, 'christian.almi19@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-03-29'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-12-10'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'christian.almi19@gmail.com' OR (lower(nombre) = 'christian x1' AND coalesce(lower(apellidos),'') = 'alcalá') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Christian x1', 'Alcalá', 'christian.almi19@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-03-29', NULL, NULL, NULL, '2024-12-10', true, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Ponce'), email = COALESCE(email, 'danielponcefernandez@hotmail.es'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-03-29'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-09'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'danielponcefernandez@hotmail.es' OR (lower(nombre) = 'dani' AND coalesce(lower(apellidos),'') = 'ponce') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Dani', 'Ponce', 'danielponcefernandez@hotmail.es', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-03-29', NULL, NULL, NULL, '2025-04-09', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Cubo'), email = COALESCE(email, 'joelcubo@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-01'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-07-06'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'joelcubo@gmail.com' OR (lower(nombre) = 'joel' AND coalesce(lower(apellidos),'') = 'cubo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joel', 'Cubo', 'joelcubo@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-04-01', NULL, NULL, NULL, '2024-07-06', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Navarro'), email = COALESCE(email, 'gerardnavarrobartra@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-24'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-08-31'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'gerardnavarrobartra@gmail.com' OR (lower(nombre) = 'gerard' AND coalesce(lower(apellidos),'') = 'navarro') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Gerard', 'Navarro', 'gerardnavarrobartra@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-04-24', NULL, NULL, NULL, '2024-08-31', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Perles'), email = COALESCE(email, '-'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-24'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-11-16'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = '-' OR (lower(nombre) = 'pol' AND coalesce(lower(apellidos),'') = 'perles') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pol', 'Perles', '-', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-04-24', NULL, NULL, NULL, '2024-11-16', false, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Salazar'), email = COALESCE(email, 'salazarl@moval.edu'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-04-26'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-02-04'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'salazarl@moval.edu' OR (lower(nombre) = 'lucas' AND coalesce(lower(apellidos),'') = 'salazar') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Lucas', 'Salazar', 'salazarl@moval.edu', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-04-26', NULL, NULL, NULL, '2026-02-04', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Monge'), email = COALESCE(email, 'adribmw18@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'adribmw18@gmail.com' OR (lower(nombre) = 'adri x1' AND coalesce(lower(apellidos),'') = 'monge') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adri x1', 'Monge', 'adribmw18@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Gutiérrez'), email = COALESCE(email, 'melissagutierrez0301@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-05-16'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-08-26'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'melissagutierrez0301@gmail.com' OR (lower(nombre) = 'melissa' AND coalesce(lower(apellidos),'') = 'gutiérrez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Melissa', 'Gutiérrez', 'melissagutierrez0301@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-05-16', NULL, NULL, NULL, '2024-08-26', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Moreno'), email = COALESCE(email, '00.moreno.o@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-05-21'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-08-31'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = '00.moreno.o@gmail.com' OR (lower(nombre) = 'oscar' AND coalesce(lower(apellidos),'') = 'moreno') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Oscar', 'Moreno', '00.moreno.o@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-05-21', NULL, NULL, NULL, '2024-08-31', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Fernández'), email = COALESCE(email, 'safafernandezvictor@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-06-05'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-02-20'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'safafernandezvictor@gmail.com' OR (lower(nombre) = 'victor' AND coalesce(lower(apellidos),'') = 'fernández') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Victor', 'Fernández', 'safafernandezvictor@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-06-05', NULL, NULL, NULL, '2025-02-20', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Escobar'), email = COALESCE(email, 'joseescobarpanadero@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-06-06'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-07-25'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'joseescobarpanadero@gmail.com' OR (lower(nombre) = 'jose' AND coalesce(lower(apellidos),'') = 'escobar') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jose', 'Escobar', 'joseescobarpanadero@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-06-06', NULL, NULL, NULL, '2025-07-25', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Robles'), email = COALESCE(email, 'adrirobles1991@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-06-15'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-03-10'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'adrirobles1991@gmail.com' OR (lower(nombre) = 'adrián' AND coalesce(lower(apellidos),'') = 'robles') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adrián', 'Robles', 'adrirobles1991@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-06-15', NULL, NULL, NULL, '2026-03-10', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Onofre'), email = COALESCE(email, 'onofrerocio33@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-07-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-10-10'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'onofrerocio33@gmail.com' OR (lower(nombre) = 'rocío x1' AND coalesce(lower(apellidos),'') = 'onofre') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Rocío x1', 'Onofre', 'onofrerocio33@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-07-08', NULL, NULL, NULL, '2024-10-10', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Gallardo'), email = COALESCE(email, 'gallardodaniel57@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-07-22'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-10-22'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'gallardodaniel57@gmail.com' OR (lower(nombre) = 'dani' AND coalesce(lower(apellidos),'') = 'gallardo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Dani', 'Gallardo', 'gallardodaniel57@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-07-22', NULL, NULL, NULL, '2024-10-22', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Valero'), email = COALESCE(email, 'victorvalerofreixas28@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-07-06'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-06-06'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'victorvalerofreixas28@gmail.com' OR (lower(nombre) = 'victor' AND coalesce(lower(apellidos),'') = 'valero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Victor', 'Valero', 'victorvalerofreixas28@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-07-06', NULL, NULL, NULL, '2026-06-06', true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Monge'), email = COALESCE(email, 'adribmw18@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-08-27'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'adribmw18@gmail.com' OR (lower(nombre) = 'adri x2' AND coalesce(lower(apellidos),'') = 'monge') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adri x2', 'Monge', 'adribmw18@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-08-27', NULL, NULL, NULL, NULL, true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Jiménez Pino'), email = COALESCE(email, 'joanjimenez361@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'joanjimenez361@gmail.com' OR (lower(nombre) = 'joan x2' AND coalesce(lower(apellidos),'') = 'jiménez pino') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joan x2', 'Jiménez Pino', 'joanjimenez361@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Junquero'), email = COALESCE(email, 'junqueromartin@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-07-10'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-01-11'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'junqueromartin@gmail.com' OR (lower(nombre) = 'martín' AND coalesce(lower(apellidos),'') = 'junquero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Martín', 'Junquero', 'junqueromartin@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-07-10', NULL, NULL, NULL, '2025-01-11', false, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martín'), email = COALESCE(email, 'lautymartine@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-08-29'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-02'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'lautymartine@gmail.com' OR (lower(nombre) = 'lautaro' AND coalesce(lower(apellidos),'') = 'martín') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Lautaro', 'Martín', 'lautymartine@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-08-29', NULL, NULL, NULL, '2025-04-02', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Gallardo'), email = COALESCE(email, 'victor.gallardo.of2000@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-09-21'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-03-10'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'victor.gallardo.of2000@gmail.com' OR (lower(nombre) = 'victor' AND coalesce(lower(apellidos),'') = 'gallardo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Victor', 'Gallardo', 'victor.gallardo.of2000@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-09-21', NULL, NULL, NULL, '2026-03-10', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Ortega'), email = COALESCE(email, 'joorca10@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-09-16'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2024-12-26'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'joorca10@gmail.com' OR (lower(nombre) = 'joel' AND coalesce(lower(apellidos),'') = 'ortega') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joel', 'Ortega', 'joorca10@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-09-16', NULL, NULL, NULL, '2024-12-26', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Forero'), email = COALESCE(email, 'juanforero138@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-09-17'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-25'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'juanforero138@gmail.com' OR (lower(nombre) = 'juan' AND coalesce(lower(apellidos),'') = 'forero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Juan', 'Forero', 'juanforero138@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-09-17', NULL, NULL, NULL, '2025-06-25', false, true, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mancilla'), email = COALESCE(email, 'franmansa2911@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-09-22'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-09-03'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'franmansa2911@gmail.com' OR (lower(nombre) = 'fran x2' AND coalesce(lower(apellidos),'') = 'mancilla') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Fran x2', 'Mancilla', 'franmansa2911@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-09-22', NULL, NULL, NULL, '2025-09-03', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Pérez'), email = COALESCE(email, 'davidperezcontact@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-10-25'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-02-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'davidperezcontact@gmail.com' OR (lower(nombre) = 'david' AND coalesce(lower(apellidos),'') = 'pérez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'David', 'Pérez', 'davidperezcontact@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-10-25', NULL, NULL, NULL, '2025-02-01', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'García'), email = COALESCE(email, 'pausenpau2002@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'pausenpau2002@gmail.com' OR (lower(nombre) = 'pau' AND coalesce(lower(apellidos),'') = 'garcía') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pau', 'García', 'pausenpau2002@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Parejo'), email = COALESCE(email, 'pauparejo25@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-10-30'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-02-01'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'pauparejo25@gmail.com' OR (lower(nombre) = 'pau' AND coalesce(lower(apellidos),'') = 'parejo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pau', 'Parejo', 'pauparejo25@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-10-30', NULL, NULL, NULL, '2026-02-01', true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Chungata'), email = COALESCE(email, 'jenny.chungata.pillajo@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-05-13'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-25'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'jenny.chungata.pillajo@gmail.com' OR (lower(nombre) = 'jenny' AND coalesce(lower(apellidos),'') = 'chungata') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jenny', 'Chungata', 'jenny.chungata.pillajo@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-05-13', NULL, NULL, NULL, '2025-06-25', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Font'), email = COALESCE(email, 'xblauman@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'xblauman@hotmail.com' OR (lower(nombre) = 'xavi' AND coalesce(lower(apellidos),'') = 'font') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Xavi', 'Font', 'xblauman@hotmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Petcu'), email = COALESCE(email, 'petcucarina@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-11-27'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-01-27'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'petcucarina@gmail.com' OR (lower(nombre) = 'carina' AND coalesce(lower(apellidos),'') = 'petcu') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Carina', 'Petcu', 'petcucarina@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-11-27', NULL, NULL, NULL, '2026-01-27', true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Emil'), email = COALESCE(email, 'victoremilactor@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-08'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-26'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'victoremilactor@gmail.com' OR (lower(nombre) = 'victor' AND coalesce(lower(apellidos),'') = 'emil') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Victor', 'Emil', 'victoremilactor@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-01-08', NULL, NULL, NULL, '2025-04-26', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Ávalos'), email = COALESCE(email, 'avalosgallardomaria@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-16'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-12-31'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'avalosgallardomaria@gmail.com' OR (lower(nombre) = 'maria' AND coalesce(lower(apellidos),'') = 'ávalos') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Maria', 'Ávalos', 'avalosgallardomaria@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-02-16', NULL, NULL, NULL, '2025-12-31', true, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Edo'), email = COALESCE(email, 'edovictor338@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'edovictor338@gmail.com' OR (lower(nombre) = 'victor' AND coalesce(lower(apellidos),'') = 'edo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Victor', 'Edo', 'edovictor338@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'El Msellek'), email = COALESCE(email, 'osamichi2001@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2024-12-27'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-04-21'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR true, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'osamichi2001@gmail.com' OR (lower(nombre) = 'osama' AND coalesce(lower(apellidos),'') = 'el msellek') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Osama', 'El Msellek', 'osamichi2001@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2024-12-27', NULL, NULL, NULL, '2025-04-21', false, false, true, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mora'), email = COALESCE(email, 'moragenis@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-13'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-12-31'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'moragenis@gmail.com' OR (lower(nombre) = 'genis' AND coalesce(lower(apellidos),'') = 'mora') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Genis', 'Mora', 'moragenis@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-01-13', NULL, NULL, NULL, '2025-12-31', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Alcalá'), email = COALESCE(email, 'christian.almi19@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-01-28'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-07-21'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'christian.almi19@gmail.com' OR (lower(nombre) = 'christian x2' AND coalesce(lower(apellidos),'') = 'alcalá') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Christian x2', 'Alcalá', 'christian.almi19@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-01-28', NULL, NULL, NULL, '2025-07-21', false, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Silva'), email = COALESCE(email, 'irenesilvamarzal@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-03'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'irenesilvamarzal@gmail.com' OR (lower(nombre) = 'irene x2' AND coalesce(lower(apellidos),'') = 'silva') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Irene x2', 'Silva', 'irenesilvamarzal@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-02-03', NULL, NULL, NULL, NULL, true, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Batiste'), email = COALESCE(email, 'anapija123@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'anapija123@gmail.com' OR (lower(nombre) = 'ana' AND coalesce(lower(apellidos),'') = 'batiste') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ana', 'Batiste', 'anapija123@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Jimenez'), email = COALESCE(email, 'joanjimenez361@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'joanjimenez361@gmail.com' OR (lower(nombre) = 'joan x4' AND coalesce(lower(apellidos),'') = 'jimenez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joan x4', 'Jimenez', 'joanjimenez361@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Rito'), email = COALESCE(email, 'chiaranoeliarito@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-26'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-07-21'),
    seg_cambio_fisico = seg_cambio_fisico OR true, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'chiaranoeliarito@gmail.com' OR (lower(nombre) = 'chiara' AND coalesce(lower(apellidos),'') = 'rito') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Chiara', 'Rito', 'chiaranoeliarito@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-02-26', NULL, NULL, NULL, '2025-07-21', true, true, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Delgado'), email = COALESCE(email, 'saradelgado.fer@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-02-25'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-06-13'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'saradelgado.fer@gmail.com' OR (lower(nombre) = 'sara' AND coalesce(lower(apellidos),'') = 'delgado') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sara', 'Delgado', 'saradelgado.fer@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-02-25', NULL, NULL, NULL, '2025-06-13', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Onofre'), email = COALESCE(email, 'onofrerocio33@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-03-21'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-03-21'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'onofrerocio33@gmail.com' OR (lower(nombre) = 'rocío x2' AND coalesce(lower(apellidos),'') = 'onofre') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Rocío x2', 'Onofre', 'onofrerocio33@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-03-21', NULL, NULL, NULL, '2025-03-21', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Montero'), email = COALESCE(email, 'pau@mondreu.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-04-02'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2025-08-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'pau@mondreu.com' OR (lower(nombre) = 'pau' AND coalesce(lower(apellidos),'') = 'montero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pau', 'Montero', 'pau@mondreu.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-04-02', NULL, NULL, NULL, '2025-08-01', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Morant'), email = COALESCE(email, 'izanmorant@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'izanmorant@gmail.com' OR (lower(nombre) = 'izan' AND coalesce(lower(apellidos),'') = 'morant') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Izan', 'Morant', 'izanmorant@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Aguilera'), email = COALESCE(email, 'aguileraalex170@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-05-12'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'aguileraalex170@gmail.com' OR (lower(nombre) = 'alex' AND coalesce(lower(apellidos),'') = 'aguilera') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alex', 'Aguilera', 'aguileraalex170@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-05-12', NULL, NULL, NULL, NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Recasens'), email = COALESCE(email, 'polrecasensr2002@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-06-13'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, '2025-05-31'), fecha_compra = COALESCE(fecha_compra, '2025-06-13'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'polrecasensr2002@gmail.com' OR (lower(nombre) = 'pol' AND coalesce(lower(apellidos),'') = 'recasens') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pol', 'Recasens', 'polrecasensr2002@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-06-13', NULL, '2025-05-31', '2025-06-13', NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Navarro'), email = COALESCE(email, 'elmpdmjr13@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, NULL),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2025-06-26'), fecha_registro = COALESCE(fecha_registro, NULL),
    primer_contacto = COALESCE(primer_contacto, '2025-06-17'), fecha_compra = COALESCE(fecha_compra, '2025-06-26'),
    fecha_baja = COALESCE(fecha_baja, '2025-10-08'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'elmpdmjr13@gmail.com' OR (lower(nombre) = 'francesc' AND coalesce(lower(apellidos),'') = 'navarro') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Francesc', 'Navarro', 'elmpdmjr13@gmail.com', NULL, NULL, 'luis', 'cliente', NULL, NULL, '2025-06-26', NULL, '2025-06-17', '2025-06-26', '2025-10-08', false, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Barrera Robles'), email = COALESCE(email, 'juanbr405@gmail.com'),
    nif = COALESCE(nif, '45129952L'), telefono = COALESCE(telefono, '664 57 45 99'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-18'), fecha_registro = COALESCE(fecha_registro, '2025-07-18'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'juanbr405@gmail.com' OR (lower(nombre) = 'juan' AND coalesce(lower(apellidos),'') = 'barrera robles') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Juan', 'Barrera Robles', 'juanbr405@gmail.com', '45129952L', '664 57 45 99', 'luis', 'cliente', NULL, 'Plan entrenamiento básico', '2025-07-18', '2025-07-18', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Arboleda Hurtado'), email = COALESCE(email, 'ana.arboleda06@gmail.com'),
    nif = COALESCE(nif, '47927292F'), telefono = COALESCE(telefono, '635994232'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-23'), fecha_registro = COALESCE(fecha_registro, '2025-07-22'),
    primer_contacto = COALESCE(primer_contacto, '2025-07-21'), fecha_compra = COALESCE(fecha_compra, '2025-07-23'),
    fecha_baja = COALESCE(fecha_baja, '2025-10-29'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'ana.arboleda06@gmail.com' OR (lower(nombre) = 'ana' AND coalesce(lower(apellidos),'') = 'arboleda hurtado') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ana', 'Arboleda Hurtado', 'ana.arboleda06@gmail.com', '47927292F', '635994232', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición premium', '2025-07-23', '2025-07-22', '2025-07-21', '2025-07-23', '2025-10-29', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Peñalba Lopez'), email = COALESCE(email, 'tomi231102balmes@gmail.com'),
    nif = COALESCE(nif, '47325451F'), telefono = COALESCE(telefono, '657855663'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-25'), fecha_registro = COALESCE(fecha_registro, '2025-07-25'),
    primer_contacto = COALESCE(primer_contacto, '2025-07-02'), fecha_compra = COALESCE(fecha_compra, '2025-07-25'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'tomi231102balmes@gmail.com' OR (lower(nombre) = 'tomas' AND coalesce(lower(apellidos),'') = 'peñalba lopez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Tomas', 'Peñalba Lopez', 'tomi231102balmes@gmail.com', '47325451F', '657855663', 'luis', 'cliente', NULL, 'Plan nutrición premium', '2025-07-25', '2025-07-25', '2025-07-02', '2025-07-25', NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'López'), email = COALESCE(email, 'noeliaa.lc1@gmail.com'),
    nif = COALESCE(nif, '47747099L'), telefono = COALESCE(telefono, '632007986'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-07-31'), fecha_registro = COALESCE(fecha_registro, '2025-07-31'),
    primer_contacto = COALESCE(primer_contacto, '2025-07-30'), fecha_compra = COALESCE(fecha_compra, '2025-07-31'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'noeliaa.lc1@gmail.com' OR (lower(nombre) = 'noelia' AND coalesce(lower(apellidos),'') = 'lópez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Noelia', 'López', 'noeliaa.lc1@gmail.com', '47747099L', '632007986', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-07-31', '2025-07-31', '2025-07-30', '2025-07-31', NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Perez gomez'), email = COALESCE(email, 'sweetblendzz@gmail.com'),
    nif = COALESCE(nif, '53316878A'), telefono = COALESCE(telefono, '662654048'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-08-04'), fecha_registro = COALESCE(fecha_registro, '2025-08-03'),
    primer_contacto = COALESCE(primer_contacto, '2025-08-01'), fecha_compra = COALESCE(fecha_compra, '2025-08-04'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'sweetblendzz@gmail.com' OR (lower(nombre) = 'pau' AND coalesce(lower(apellidos),'') = 'perez gomez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pau', 'Perez gomez', 'sweetblendzz@gmail.com', '53316878A', '662654048', 'luis', 'cliente', NULL, 'Plan nutrición premium', '2025-08-04', '2025-08-03', '2025-08-01', '2025-08-04', NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Cidrera Gonzalez'), email = COALESCE(email, 'gerardcidrera13@gmail.com'),
    nif = COALESCE(nif, '53323970B'), telefono = COALESCE(telefono, '603613882'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-08-12'), fecha_registro = COALESCE(fecha_registro, '2025-08-12'),
    primer_contacto = COALESCE(primer_contacto, '2025-08-07'), fecha_compra = COALESCE(fecha_compra, '2025-08-14'),
    fecha_baja = COALESCE(fecha_baja, '2026-05-15'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'gerardcidrera13@gmail.com' OR (lower(nombre) = 'gerard' AND coalesce(lower(apellidos),'') = 'cidrera gonzalez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Gerard', 'Cidrera Gonzalez', 'gerardcidrera13@gmail.com', '53323970B', '603613882', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-08-12', '2025-08-12', '2025-08-07', '2025-08-14', '2026-05-15', false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Pavón Torres'), email = COALESCE(email, 'cotodesucre12@gmail.com'),
    nif = COALESCE(nif, '53313636g'), telefono = COALESCE(telefono, '675847584'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-08-27'), fecha_registro = COALESCE(fecha_registro, '2025-08-27'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'cotodesucre12@gmail.com' OR (lower(nombre) = 'elisabet' AND coalesce(lower(apellidos),'') = 'pavón torres') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Elisabet', 'Pavón Torres', 'cotodesucre12@gmail.com', '53313636g', '675847584', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-08-27', '2025-08-27', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Leno Domínguez'), email = COALESCE(email, 'mireialeno@gmail.com'),
    nif = COALESCE(nif, '53971041T'), telefono = COALESCE(telefono, '622589073'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-01'), fecha_registro = COALESCE(fecha_registro, '2025-09-01'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'mireialeno@gmail.com' OR (lower(nombre) = 'mireia' AND coalesce(lower(apellidos),'') = 'leno domínguez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Mireia', 'Leno Domínguez', 'mireialeno@gmail.com', '53971041T', '622589073', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-09-01', '2025-09-01', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Singh Kaur'), email = COALESCE(email, 'theonlyonetanu@gmail.com'),
    nif = COALESCE(nif, '60436524E'), telefono = COALESCE(telefono, '631675445'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-02'), fecha_registro = COALESCE(fecha_registro, '2025-09-02'),
    primer_contacto = COALESCE(primer_contacto, '2025-08-27'), fecha_compra = COALESCE(fecha_compra, '2025-09-03'),
    fecha_baja = COALESCE(fecha_baja, '2026-06-22'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'theonlyonetanu@gmail.com' OR (lower(nombre) = 'tarunpreet' AND coalesce(lower(apellidos),'') = 'singh kaur') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Tarunpreet', 'Singh Kaur', 'theonlyonetanu@gmail.com', '60436524E', '631675445', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición premium', '2025-09-02', '2025-09-02', '2025-08-27', '2025-09-03', '2026-06-22', false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'zahrane'), email = COALESCE(email, 'rayanzn09@gmail.com'),
    nif = COALESCE(nif, '53322705B'), telefono = COALESCE(telefono, '612492397'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-05'), fecha_registro = COALESCE(fecha_registro, '2025-09-05'),
    primer_contacto = COALESCE(primer_contacto, '2025-09-04'), fecha_compra = COALESCE(fecha_compra, '2025-09-05'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'rayanzn09@gmail.com' OR (lower(nombre) = 'rayan' AND coalesce(lower(apellidos),'') = 'zahrane') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'rayan', 'zahrane', 'rayanzn09@gmail.com', '53322705B', '612492397', 'luis', 'cliente', NULL, 'Otro', '2025-09-05', '2025-09-05', '2025-09-04', '2025-09-05', NULL, false, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martin Jimenez'), email = COALESCE(email, 'sandra.maji85@gmail.com'),
    nif = COALESCE(nif, '47810969h'), telefono = COALESCE(telefono, '608 17 52 40'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-09-25'), fecha_registro = COALESCE(fecha_registro, '2025-09-25'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sandra.maji85@gmail.com' OR (lower(nombre) = 'sandra' AND coalesce(lower(apellidos),'') = 'martin jimenez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sandra', 'Martin Jimenez', 'sandra.maji85@gmail.com', '47810969h', '608 17 52 40', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-09-25', '2025-09-25', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'de Marco Cabanillas'), email = COALESCE(email, 'jdemarcocabanillas@gmail.com'),
    nif = COALESCE(nif, '24413968C'), telefono = COALESCE(telefono, '633 76 66 87'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, 'presencial'), tipo_plan = COALESCE(tipo_plan, 'Plan entreno Presencial 3xSemana y Dieta'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-10-02'), fecha_registro = COALESCE(fecha_registro, '2025-10-02'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'jdemarcocabanillas@gmail.com' OR (lower(nombre) = 'júlia' AND coalesce(lower(apellidos),'') = 'de marco cabanillas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Júlia', 'de Marco Cabanillas', 'jdemarcocabanillas@gmail.com', '24413968C', '633 76 66 87', 'david', 'cliente', 'presencial', 'Plan entreno Presencial 3xSemana y Dieta', '2025-10-02', '2025-10-02', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Ramos'), email = COALESCE(email, 'jaimealpe2000@gmail.com'),
    nif = COALESCE(nif, '02571916X'), telefono = COALESCE(telefono, '640601104'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-10-07'), fecha_registro = COALESCE(fecha_registro, '2025-10-07'),
    primer_contacto = COALESCE(primer_contacto, '2025-10-07'), fecha_compra = COALESCE(fecha_compra, '2025-10-13'),
    fecha_baja = COALESCE(fecha_baja, '2026-02-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR true,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'jaimealpe2000@gmail.com' OR (lower(nombre) = 'jaime' AND coalesce(lower(apellidos),'') = 'ramos') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jaime', 'Ramos', 'jaimealpe2000@gmail.com', '02571916X', '640601104', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-10-07', '2025-10-07', '2025-10-07', '2025-10-13', '2026-02-01', false, true, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Junquero Ojeda'), email = COALESCE(email, 'junqueromartin@gmail.com'),
    nif = COALESCE(nif, '45155754S'), telefono = COALESCE(telefono, '633511161'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-10-10'), fecha_registro = COALESCE(fecha_registro, '2025-10-10'),
    primer_contacto = COALESCE(primer_contacto, '2025-10-10'), fecha_compra = COALESCE(fecha_compra, '2025-10-27'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'junqueromartin@gmail.com' OR (lower(nombre) = 'martin' AND coalesce(lower(apellidos),'') = 'junquero ojeda') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Martin', 'Junquero Ojeda', 'junqueromartin@gmail.com', '45155754S', '633511161', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-10-10', '2025-10-10', '2025-10-10', '2025-10-27', NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Alberola Romero'), email = COALESCE(email, 'alberolaromerojessica@gmail.com'),
    nif = COALESCE(nif, '47665670X'), telefono = COALESCE(telefono, '603414935'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento: Pago único'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-10-30'), fecha_registro = COALESCE(fecha_registro, '2025-10-16'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'alberolaromerojessica@gmail.com' OR (lower(nombre) = 'jessica' AND coalesce(lower(apellidos),'') = 'alberola romero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Jessica', 'Alberola Romero', 'alberolaromerojessica@gmail.com', '47665670X', '603414935', 'luis', 'cliente', NULL, 'Plan entrenamiento: Pago único', '2025-10-30', '2025-10-16', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Lobez Mateo'), email = COALESCE(email, 'adrianalobez@gmail.com'),
    nif = COALESCE(nif, '73022275N'), telefono = COALESCE(telefono, '645872562'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-11-11'), fecha_registro = COALESCE(fecha_registro, '2025-11-11'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'adrianalobez@gmail.com' OR (lower(nombre) = 'adriana' AND coalesce(lower(apellidos),'') = 'lobez mateo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adriana', 'Lobez Mateo', 'adrianalobez@gmail.com', '73022275N', '645872562', 'luis', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-11-11', '2025-11-11', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Francescon Ortega'), email = COALESCE(email, 'erikafrancescon2802@gmail.com'),
    nif = COALESCE(nif, '47986144W'), telefono = COALESCE(telefono, '640260620'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-11-13'), fecha_registro = COALESCE(fecha_registro, '2025-11-13'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'erikafrancescon2802@gmail.com' OR (lower(nombre) = 'erika' AND coalesce(lower(apellidos),'') = 'francescon ortega') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Erika', 'Francescon Ortega', 'erikafrancescon2802@gmail.com', '47986144W', '640260620', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2025-11-13', '2025-11-13', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Margarit Ruiz'), email = COALESCE(email, 'margamargarit02@gmail.com'),
    nif = COALESCE(nif, '49184852L'), telefono = COALESCE(telefono, '646028871'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2025-11-14'), fecha_registro = COALESCE(fecha_registro, '2025-11-15'),
    primer_contacto = COALESCE(primer_contacto, '2025-11-10'), fecha_compra = COALESCE(fecha_compra, '2025-11-24'),
    fecha_baja = COALESCE(fecha_baja, '2026-02-01'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'margamargarit02@gmail.com' OR (lower(nombre) = 'blanca' AND coalesce(lower(apellidos),'') = 'margarit ruiz') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Blanca', 'Margarit Ruiz', 'margamargarit02@gmail.com', '49184852L', '646028871', 'luis', 'cliente', NULL, 'Plan nutrición premium', '2025-11-14', '2025-11-15', '2025-11-10', '2025-11-24', '2026-02-01', false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Callejas Garrido'), email = COALESCE(email, 'juanlupi1@gmail.com'),
    nif = COALESCE(nif, '38459179M'), telefono = COALESCE(telefono, '649508922'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-01-07'), fecha_registro = COALESCE(fecha_registro, '2026-01-07'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'juanlupi1@gmail.com' OR (lower(nombre) = 'juan antonio' AND coalesce(lower(apellidos),'') = 'callejas garrido') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Juan Antonio', 'Callejas Garrido', 'juanlupi1@gmail.com', '38459179M', '649508922', 'ethos', 'cliente', NULL, 'Plan entrenamiento + nutrición básico', '2026-01-07', '2026-01-07', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Garcia'), email = COALESCE(email, 'anabelhermo278@gmail.com'),
    nif = COALESCE(nif, '36173050F'), telefono = COALESCE(telefono, '615240799'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-01-13'), fecha_registro = COALESCE(fecha_registro, '2026-01-13'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'anabelhermo278@gmail.com' OR (lower(nombre) = 'belen' AND coalesce(lower(apellidos),'') = 'garcia') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Belen', 'Garcia', 'anabelhermo278@gmail.com', '36173050F', '615240799', 'david', 'cliente', NULL, 'Otro', '2026-01-13', '2026-01-13', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Munar Palmer'), email = COALESCE(email, 'martimunar95@gmail.com'),
    nif = COALESCE(nif, '43209061L'), telefono = COALESCE(telefono, '646006231'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento: Pago único'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-04'), fecha_registro = COALESCE(fecha_registro, '2026-02-04'),
    primer_contacto = COALESCE(primer_contacto, '2026-02-02'), fecha_compra = COALESCE(fecha_compra, '2026-02-04'),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'martimunar95@gmail.com' OR (lower(nombre) = 'martí' AND coalesce(lower(apellidos),'') = 'munar palmer') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Martí', 'Munar Palmer', 'martimunar95@gmail.com', '43209061L', '646006231', 'luis', 'cliente', NULL, 'Plan entrenamiento: Pago único', '2026-02-04', '2026-02-04', '2026-02-02', '2026-02-04', NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Barrera Robles'), email = COALESCE(email, 'juanbr405@gmail.com'),
    nif = COALESCE(nif, '45129952L'), telefono = COALESCE(telefono, '664574599'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-09'), fecha_registro = COALESCE(fecha_registro, '2026-02-06'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'juanbr405@gmail.com' OR (lower(nombre) = 'juan' AND coalesce(lower(apellidos),'') = 'barrera robles') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Juan', 'Barrera Robles', 'juanbr405@gmail.com', '45129952L', '664574599', 'ethos', 'cliente', NULL, 'Plan entrenamiento básico', '2026-02-09', '2026-02-06', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Romero Nicolás'), email = COALESCE(email, 'ruldisseny@hotmail.es'),
    nif = COALESCE(nif, '52912436Q'), telefono = COALESCE(telefono, '670217721'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-07'), fecha_registro = COALESCE(fecha_registro, '2026-02-07'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'ruldisseny@hotmail.es' OR (lower(nombre) = 'raul' AND coalesce(lower(apellidos),'') = 'romero nicolás') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Raul', 'Romero Nicolás', 'ruldisseny@hotmail.es', '52912436Q', '670217721', 'ethos', 'cliente', NULL, 'Plan entrenamiento básico', '2026-02-07', '2026-02-07', NULL, NULL, NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Moraño'), email = COALESCE(email, 'silvieeeta@gmail.com'),
    nif = COALESCE(nif, '53970425M'), telefono = COALESCE(telefono, '627374613'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento: Pago único'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-07'), fecha_registro = COALESCE(fecha_registro, '2026-02-07'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'silvieeeta@gmail.com' OR (lower(nombre) = 'silvia' AND coalesce(lower(apellidos),'') = 'moraño') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Silvia', 'Moraño', 'silvieeeta@gmail.com', '53970425M', '627374613', 'ethos', 'cliente', NULL, 'Plan entrenamiento: Pago único', '2026-02-07', '2026-02-07', NULL, NULL, NULL, false, false, false, false, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Expósito Corral'), email = COALESCE(email, 'vecbcn@gmail.com'),
    nif = COALESCE(nif, '46467984A'), telefono = COALESCE(telefono, '658061573'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-10'), fecha_registro = COALESCE(fecha_registro, '2026-02-09'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'vecbcn@gmail.com' OR (lower(nombre) = 'verónica' AND coalesce(lower(apellidos),'') = 'expósito corral') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Verónica', 'Expósito Corral', 'vecbcn@gmail.com', '46467984A', '658061573', 'ethos', 'cliente', NULL, 'Plan entrenamiento básico', '2026-02-10', '2026-02-09', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Leon'), email = COALESCE(email, 'patrizialv6@gmail.com'),
    nif = COALESCE(nif, '47606373F'), telefono = COALESCE(telefono, '627439289'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-10'), fecha_registro = COALESCE(fecha_registro, '2026-02-09'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'patrizialv6@gmail.com' OR (lower(nombre) = 'patricia' AND coalesce(lower(apellidos),'') = 'leon') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Patricia', 'Leon', 'patrizialv6@gmail.com', '47606373F', '627439289', 'ethos', 'cliente', NULL, 'Plan entrenamiento básico', '2026-02-10', '2026-02-09', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Parra Baños'), email = COALESCE(email, 'silvipb@gmail.com'),
    nif = COALESCE(nif, '46467949Z'), telefono = COALESCE(telefono, '645413000'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, '2026-02-09'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'silvipb@gmail.com' OR (lower(nombre) = 'silvia' AND coalesce(lower(apellidos),'') = 'parra baños') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Silvia', 'Parra Baños', 'silvipb@gmail.com', '46467949Z', '645413000', 'ethos', 'cliente', NULL, 'Plan entrenamiento básico', NULL, '2026-02-09', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Garcia lopez'), email = COALESCE(email, 'annigarcia72@gmail.com'),
    nif = COALESCE(nif, '52207752Y'), telefono = COALESCE(telefono, '677797588'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento + nutrición premium'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-10'), fecha_registro = COALESCE(fecha_registro, '2026-02-10'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'annigarcia72@gmail.com' OR (lower(nombre) = 'ani' AND coalesce(lower(apellidos),'') = 'garcia lopez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ani', 'Garcia lopez', 'annigarcia72@gmail.com', '52207752Y', '677797588', 'david', 'cliente', NULL, 'Plan entrenamiento + nutrición premium', '2026-02-10', '2026-02-10', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Valls Bosch'), email = COALESCE(email, 'mlluisa.vallsmk@gmail.com'),
    nif = COALESCE(nif, '35032497R'), telefono = COALESCE(telefono, '6008817760'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-11'), fecha_registro = COALESCE(fecha_registro, '2026-02-11'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'mlluisa.vallsmk@gmail.com' OR (lower(nombre) = 'maria luisa' AND coalesce(lower(apellidos),'') = 'valls bosch') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Maria Luisa', 'Valls Bosch', 'mlluisa.vallsmk@gmail.com', '35032497R', '6008817760', 'ethos', 'cliente', NULL, 'Otro', '2026-02-11', '2026-02-11', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Tortosa Domingo'), email = COALESCE(email, 'tatutortosa@gmail.com'),
    nif = COALESCE(nif, '37318985J'), telefono = COALESCE(telefono, '696657576'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-12'), fecha_registro = COALESCE(fecha_registro, '2026-02-12'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'tatutortosa@gmail.com' OR (lower(nombre) = 'francisco' AND coalesce(lower(apellidos),'') = 'tortosa domingo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Francisco', 'Tortosa Domingo', 'tatutortosa@gmail.com', '37318985J', '696657576', 'luis', 'cliente', NULL, 'Otro', '2026-02-12', '2026-02-12', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martí Gil'), email = COALESCE(email, 'maivlis@gmail.com'),
    nif = COALESCE(nif, '46357521D'), telefono = COALESCE(telefono, '615986260'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Plan entrenamiento básico'),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-12'), fecha_registro = COALESCE(fecha_registro, '2026-02-12'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'maivlis@gmail.com' OR (lower(nombre) = 'silvia' AND coalesce(lower(apellidos),'') = 'martí gil') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Silvia', 'Martí Gil', 'maivlis@gmail.com', '46357521D', '615986260', 'ethos', 'cliente', NULL, 'Plan entrenamiento básico', '2026-02-12', '2026-02-12', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Viciana castro'), email = COALESCE(email, 'healtytrix@gmail.com'),
    nif = COALESCE(nif, '40996308G'), telefono = COALESCE(telefono, '686987156'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-02-25'), fecha_registro = COALESCE(fecha_registro, '2026-02-25'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'healtytrix@gmail.com' OR (lower(nombre) = 'beatriz' AND coalesce(lower(apellidos),'') = 'viciana castro') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Beatriz', 'Viciana castro', 'healtytrix@gmail.com', '40996308G', '686987156', 'ethos', 'cliente', NULL, NULL, '2026-02-25', '2026-02-25', NULL, NULL, NULL, false, false, false, true, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martin sosa'), email = COALESCE(email, 'marimartinsosa@gmail.com'),
    nif = COALESCE(nif, '44190358k'), telefono = COALESCE(telefono, '678779580'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-01'), fecha_registro = COALESCE(fecha_registro, '2026-03-01'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'marimartinsosa@gmail.com' OR (lower(nombre) = 'marian' AND coalesce(lower(apellidos),'') = 'martin sosa') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'MARIAN', 'Martin sosa', 'marimartinsosa@gmail.com', '44190358k', '678779580', 'ethos', 'cliente', NULL, NULL, '2026-03-01', '2026-03-01', NULL, NULL, NULL, false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Álvarez Diaz'), email = COALESCE(email, 'dialcri@gmail.com'),
    nif = COALESCE(nif, '53321851P'), telefono = COALESCE(telefono, '646202226'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-01'), fecha_registro = COALESCE(fecha_registro, '2026-03-01'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'dialcri@gmail.com' OR (lower(nombre) = 'cristian' AND coalesce(lower(apellidos),'') = 'álvarez diaz') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Cristian', 'Álvarez Diaz', 'dialcri@gmail.com', '53321851P', '646202226', 'david', 'cliente', NULL, NULL, '2026-03-01', '2026-03-01', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Cano Fernández'), email = COALESCE(email, 'siddhartha.14@hotmail.com'),
    nif = COALESCE(nif, '52206027Y'), telefono = COALESCE(telefono, '649344273'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-04'), fecha_registro = COALESCE(fecha_registro, '2026-03-04'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-03-04'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'siddhartha.14@hotmail.com' OR (lower(nombre) = 'christian' AND coalesce(lower(apellidos),'') = 'cano fernández') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Christian', 'Cano Fernández', 'siddhartha.14@hotmail.com', '52206027Y', '649344273', 'luis', 'cliente', NULL, NULL, '2026-03-04', '2026-03-04', NULL, NULL, '2026-03-04', false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martín'), email = COALESCE(email, 'emimaro@gmail.com'),
    nif = COALESCE(nif, '53325628'), telefono = COALESCE(telefono, '687195249'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-17'), fecha_registro = COALESCE(fecha_registro, '2026-03-17'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'emimaro@gmail.com' OR (lower(nombre) = 'emilio' AND coalesce(lower(apellidos),'') = 'martín') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Emilio', 'Martín', 'emimaro@gmail.com', '53325628', '687195249', 'ethos', 'cliente', NULL, NULL, '2026-03-17', '2026-03-17', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Solís herrero'), email = COALESCE(email, 'ikersolisherrero@gmail.com'),
    nif = COALESCE(nif, '53324493M'), telefono = COALESCE(telefono, '663 30 76 27'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-18'), fecha_registro = COALESCE(fecha_registro, '2026-03-18'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'ikersolisherrero@gmail.com' OR (lower(nombre) = 'iker' AND coalesce(lower(apellidos),'') = 'solís herrero') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Iker', 'Solís herrero', 'ikersolisherrero@gmail.com', '53324493M', '663 30 76 27', 'david', 'cliente', NULL, NULL, '2026-03-18', '2026-03-18', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Joel Garcia'), email = COALESCE(email, 'jooeelssj@gmail.com'),
    nif = COALESCE(nif, '49875749B'), telefono = COALESCE(telefono, '6646698881'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, 'Otro'),
    fecha_inicio = COALESCE(fecha_inicio, NULL), fecha_registro = COALESCE(fecha_registro, '2026-03-23'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'jooeelssj@gmail.com' OR (lower(nombre) = 'joel' AND coalesce(lower(apellidos),'') = 'joel garcia') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joel', 'Joel Garcia', 'jooeelssj@gmail.com', '49875749B', '6646698881', 'david', 'cliente', NULL, 'Otro', NULL, '2026-03-23', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Lasheras Agudo'), email = COALESCE(email, 'lasheras.m.a@gmail.com'),
    nif = COALESCE(nif, '47189101R'), telefono = COALESCE(telefono, '654850567'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-25'), fecha_registro = COALESCE(fecha_registro, '2026-03-25'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'lasheras.m.a@gmail.com' OR (lower(nombre) = 'marina' AND coalesce(lower(apellidos),'') = 'lasheras agudo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Marina', 'Lasheras Agudo', 'lasheras.m.a@gmail.com', '47189101R', '654850567', 'ethos', 'cliente', NULL, NULL, '2026-03-25', '2026-03-25', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Paz Cardenas'), email = COALESCE(email, 'fernandopazcardenas@hotmail.com'),
    nif = COALESCE(nif, '46599408m'), telefono = COALESCE(telefono, '670931350'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-31'), fecha_registro = COALESCE(fecha_registro, '2026-03-31'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'fernandopazcardenas@hotmail.com' OR (lower(nombre) = 'fernando' AND coalesce(lower(apellidos),'') = 'paz cardenas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Fernando', 'Paz Cardenas', 'fernandopazcardenas@hotmail.com', '46599408m', '670931350', 'david', 'cliente', NULL, NULL, '2026-03-31', '2026-03-31', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Quiroz Albizúres'), email = COALESCE(email, 'estephani.quiroz8@gmail.com'),
    nif = COALESCE(nif, 'Y7805502Y'), telefono = COALESCE(telefono, '644428025'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-03-31'), fecha_registro = COALESCE(fecha_registro, '2026-03-31'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'estephani.quiroz8@gmail.com' OR (lower(nombre) = 'estephani' AND coalesce(lower(apellidos),'') = 'quiroz albizúres') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Estephani', 'Quiroz Albizúres', 'estephani.quiroz8@gmail.com', 'Y7805502Y', '644428025', 'ethos', 'cliente', NULL, NULL, '2026-03-31', '2026-03-31', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Miranda saldaña'), email = COALESCE(email, 'angeli_1974@hotmail.com'),
    nif = COALESCE(nif, '53319499W'), telefono = COALESCE(telefono, '699066170'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-01'), fecha_registro = COALESCE(fecha_registro, '2026-04-01'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'angeli_1974@hotmail.com' OR (lower(nombre) = 'mariela' AND coalesce(lower(apellidos),'') = 'miranda saldaña') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Mariela', 'Miranda saldaña', 'angeli_1974@hotmail.com', '53319499W', '699066170', 'ethos', 'cliente', NULL, NULL, '2026-04-01', '2026-04-01', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Romano Lorenzo'), email = COALESCE(email, 'sofiaromanolorenzo04@gmail.com'),
    nif = COALESCE(nif, '47192386C'), telefono = COALESCE(telefono, '675250841'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-01'), fecha_registro = COALESCE(fecha_registro, '2026-04-01'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'sofiaromanolorenzo04@gmail.com' OR (lower(nombre) = 'sofia' AND coalesce(lower(apellidos),'') = 'romano lorenzo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Sofia', 'Romano Lorenzo', 'sofiaromanolorenzo04@gmail.com', '47192386C', '675250841', 'ethos', 'cliente', NULL, NULL, '2026-04-01', '2026-04-01', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'ARREBOLA ROCA'), email = COALESCE(email, 'claudiaarrebola@gmail.com'),
    nif = COALESCE(nif, '53968880R'), telefono = COALESCE(telefono, '655419487'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-08'), fecha_registro = COALESCE(fecha_registro, '2026-04-08'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'claudiaarrebola@gmail.com' OR (lower(nombre) = 'claudia' AND coalesce(lower(apellidos),'') = 'arrebola roca') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'CLAUDIA', 'ARREBOLA ROCA', 'claudiaarrebola@gmail.com', '53968880R', '655419487', 'luis', 'cliente', NULL, NULL, '2026-04-08', '2026-04-08', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Soldevila'), email = COALESCE(email, 'judith.soldevilaa@gmail.com'),
    nif = COALESCE(nif, '53319471C'), telefono = COALESCE(telefono, '699081698'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-14'), fecha_registro = COALESCE(fecha_registro, '2026-04-14'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'judith.soldevilaa@gmail.com' OR (lower(nombre) = 'judith' AND coalesce(lower(apellidos),'') = 'soldevila') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Judith', 'Soldevila', 'judith.soldevilaa@gmail.com', '53319471C', '699081698', 'ethos', 'cliente', NULL, NULL, '2026-04-14', '2026-04-14', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Alcalá Miranda'), email = COALESCE(email, 'christian.almi19@gmail.com'),
    nif = COALESCE(nif, '53323452E'), telefono = COALESCE(telefono, '664879861'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-15'), fecha_registro = COALESCE(fecha_registro, '2026-04-15'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, '2026-04-15'),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR true, seg_trustpilot = seg_trustpilot OR true
  WHERE lower(email) = 'christian.almi19@gmail.com' OR (lower(nombre) = 'christian' AND coalesce(lower(apellidos),'') = 'alcalá miranda') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Christian', 'Alcalá Miranda', 'christian.almi19@gmail.com', '53323452E', '664879861', 'david', 'cliente', NULL, NULL, '2026-04-15', '2026-04-15', NULL, NULL, '2026-04-15', false, false, false, true, true WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mayor Lombardo'), email = COALESCE(email, 'ana.mayor01@gmail.com'),
    nif = COALESCE(nif, '53322945K'), telefono = COALESCE(telefono, '697461770'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-22'), fecha_registro = COALESCE(fecha_registro, '2026-04-22'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'ana.mayor01@gmail.com' OR (lower(nombre) = 'ana' AND coalesce(lower(apellidos),'') = 'mayor lombardo') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ana', 'Mayor Lombardo', 'ana.mayor01@gmail.com', '53322945K', '697461770', 'luis', 'cliente', NULL, NULL, '2026-04-22', '2026-04-22', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Valverde'), email = COALESCE(email, 'juliavalverde79@gmail.com'),
    nif = COALESCE(nif, '53970255L'), telefono = COALESCE(telefono, '640581302'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-24'), fecha_registro = COALESCE(fecha_registro, '2026-04-24'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'juliavalverde79@gmail.com' OR (lower(nombre) = 'júlia' AND coalesce(lower(apellidos),'') = 'valverde') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Júlia', 'Valverde', 'juliavalverde79@gmail.com', '53970255L', '640581302', 'ethos', 'cliente', NULL, NULL, '2026-04-24', '2026-04-24', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Clemente Mombiela'), email = COALESCE(email, 'mcleme4@gmail.com'),
    nif = COALESCE(nif, '53310984C'), telefono = COALESCE(telefono, '615854811'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-25'), fecha_registro = COALESCE(fecha_registro, '2026-04-25'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'mcleme4@gmail.com' OR (lower(nombre) = 'maría del carmen' AND coalesce(lower(apellidos),'') = 'clemente mombiela') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'María del Carmen', 'Clemente Mombiela', 'mcleme4@gmail.com', '53310984C', '615854811', 'ethos', 'cliente', NULL, NULL, '2026-04-25', '2026-04-25', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'López Vargas'), email = COALESCE(email, 'javierlopvargas@gmail.com'),
    nif = COALESCE(nif, '53324046H'), telefono = COALESCE(telefono, '666899618'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-04-25'), fecha_registro = COALESCE(fecha_registro, '2026-04-25'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'javierlopvargas@gmail.com' OR (lower(nombre) = 'javier' AND coalesce(lower(apellidos),'') = 'lópez vargas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Javier', 'López Vargas', 'javierlopvargas@gmail.com', '53324046H', '666899618', 'ethos', 'cliente', NULL, NULL, '2026-04-25', '2026-04-25', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Ramirez'), email = COALESCE(email, 'katherinrami.10@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '631455970'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-05-11'), fecha_registro = COALESCE(fecha_registro, '2026-05-11'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'katherinrami.10@gmail.com' OR (lower(nombre) = 'katherine' AND coalesce(lower(apellidos),'') = 'ramirez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Katherine', 'Ramirez', 'katherinrami.10@gmail.com', NULL, '631455970', 'luis', 'cliente', NULL, NULL, '2026-05-11', '2026-05-11', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Torres Caravante'), email = COALESCE(email, 'ctorrescaravante@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '620684419'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-05-19'), fecha_registro = COALESCE(fecha_registro, '2026-05-19'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'ctorrescaravante@gmail.com' OR (lower(nombre) = 'christian' AND coalesce(lower(apellidos),'') = 'torres caravante') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Christian', 'Torres Caravante', 'ctorrescaravante@gmail.com', NULL, '620684419', 'ethos', 'cliente', NULL, NULL, '2026-05-19', '2026-05-19', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Llamazares'), email = COALESCE(email, 'iraiallamazares2001@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '655924706'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-05-19'), fecha_registro = COALESCE(fecha_registro, '2026-05-19'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'iraiallamazares2001@gmail.com' OR (lower(nombre) = 'iraia' AND coalesce(lower(apellidos),'') = 'llamazares') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Iraia', 'Llamazares', 'iraiallamazares2001@gmail.com', NULL, '655924706', 'ethos', 'cliente', NULL, NULL, '2026-05-19', '2026-05-19', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Belmonte Miras'), email = COALESCE(email, 'aliciabelmiras@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '609175817'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-05-20'), fecha_registro = COALESCE(fecha_registro, '2026-05-20'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'aliciabelmiras@gmail.com' OR (lower(nombre) = 'alicia' AND coalesce(lower(apellidos),'') = 'belmonte miras') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alicia', 'Belmonte Miras', 'aliciabelmiras@gmail.com', NULL, '609175817', 'ethos', 'cliente', NULL, NULL, '2026-05-20', '2026-05-20', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Portillo Antón'), email = COALESCE(email, 'portilloantonines@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '611482096'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'david' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-05-22'), fecha_registro = COALESCE(fecha_registro, '2026-05-22'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'portilloantonines@gmail.com' OR (lower(nombre) = 'inés' AND coalesce(lower(apellidos),'') = 'portillo antón') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Inés', 'Portillo Antón', 'portilloantonines@gmail.com', NULL, '611482096', 'david', 'cliente', NULL, NULL, '2026-05-22', '2026-05-22', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Fernández Solanilla'), email = COALESCE(email, 'manel_ek4@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '672799129'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-08'), fecha_registro = COALESCE(fecha_registro, '2026-06-08'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'manel_ek4@hotmail.com' OR (lower(nombre) = 'manel' AND coalesce(lower(apellidos),'') = 'fernández solanilla') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Manel', 'Fernández Solanilla', 'manel_ek4@hotmail.com', NULL, '672799129', 'ethos', 'cliente', NULL, NULL, '2026-06-08', '2026-06-08', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Bausa Soriano'), email = COALESCE(email, 'bausasoriano2000@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '670392258'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-08'), fecha_registro = COALESCE(fecha_registro, '2026-06-08'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'bausasoriano2000@gmail.com' OR (lower(nombre) = 'joan' AND coalesce(lower(apellidos),'') = 'bausa soriano') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Joan', 'Bausa Soriano', 'bausasoriano2000@gmail.com', NULL, '670392258', 'luis', 'cliente', NULL, NULL, '2026-06-08', '2026-06-08', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Portillo Rodríguez'), email = COALESCE(email, 'adrianportillo083@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '651673889'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-10'), fecha_registro = COALESCE(fecha_registro, '2026-06-10'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'adrianportillo083@gmail.com' OR (lower(nombre) = 'adrián' AND coalesce(lower(apellidos),'') = 'portillo rodríguez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adrián', 'Portillo Rodríguez', 'adrianportillo083@gmail.com', NULL, '651673889', 'ethos', 'cliente', NULL, NULL, '2026-06-10', '2026-06-10', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'López Jiménez'), email = COALESCE(email, 'arturolopezbat15@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '690730298'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-23'), fecha_registro = COALESCE(fecha_registro, '2026-06-23'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'arturolopezbat15@gmail.com' OR (lower(nombre) = 'arturo' AND coalesce(lower(apellidos),'') = 'lópez jiménez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Arturo', 'López Jiménez', 'arturolopezbat15@gmail.com', NULL, '690730298', 'ethos', 'cliente', NULL, NULL, '2026-06-23', '2026-06-23', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Fernández Fernández'), email = COALESCE(email, 'chandra116@hotmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '665865785'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-26'), fecha_registro = COALESCE(fecha_registro, '2026-06-26'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'chandra116@hotmail.com' OR (lower(nombre) = 'alexandra' AND coalesce(lower(apellidos),'') = 'fernández fernández') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Alexandra', 'Fernández Fernández', 'chandra116@hotmail.com', NULL, '665865785', 'ethos', 'cliente', NULL, NULL, '2026-06-26', '2026-06-26', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Ayala Rivas'), email = COALESCE(email, 'arpablo833@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '640261976'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-29'), fecha_registro = COALESCE(fecha_registro, '2026-06-29'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'arpablo833@gmail.com' OR (lower(nombre) = 'pablo' AND coalesce(lower(apellidos),'') = 'ayala rivas') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Pablo', 'Ayala Rivas', 'arpablo833@gmail.com', NULL, '640261976', 'ethos', 'cliente', NULL, NULL, '2026-06-29', '2026-06-29', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Sanchez Malia'), email = COALESCE(email, 'fatimasanchezmalia1308@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '657894023'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-30'), fecha_registro = COALESCE(fecha_registro, '2026-06-30'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'fatimasanchezmalia1308@gmail.com' OR (lower(nombre) = 'fatima' AND coalesce(lower(apellidos),'') = 'sanchez malia') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Fatima', 'Sanchez Malia', 'fatimasanchezmalia1308@gmail.com', NULL, '657894023', 'ethos', 'cliente', NULL, NULL, '2026-06-30', '2026-06-30', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Arjona Miranda'), email = COALESCE(email, 'cristianarjona25@institutdesales.net'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '658674619'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-30'), fecha_registro = COALESCE(fecha_registro, '2026-06-30'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'cristianarjona25@institutdesales.net' OR (lower(nombre) = 'cristian' AND coalesce(lower(apellidos),'') = 'arjona miranda') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Cristian', 'Arjona Miranda', 'cristianarjona25@institutdesales.net', NULL, '658674619', 'luis', 'cliente', NULL, NULL, '2026-06-30', '2026-06-30', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Mejias Vazquez'), email = COALESCE(email, 'erikmejiasvazquez@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '633687644'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'luis' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-06-30'), fecha_registro = COALESCE(fecha_registro, '2026-06-30'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'erikmejiasvazquez@gmail.com' OR (lower(nombre) = 'erik' AND coalesce(lower(apellidos),'') = 'mejias vazquez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Erik', 'Mejias Vazquez', 'erikmejiasvazquez@gmail.com', NULL, '633687644', 'luis', 'cliente', NULL, NULL, '2026-06-30', '2026-06-30', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Vocero Pacho'), email = COALESCE(email, 'reginavocero@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '622925586'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-07-04'), fecha_registro = COALESCE(fecha_registro, '2026-07-04'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'reginavocero@gmail.com' OR (lower(nombre) = 'regina' AND coalesce(lower(apellidos),'') = 'vocero pacho') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Regina', 'Vocero Pacho', 'reginavocero@gmail.com', NULL, '622925586', 'ethos', 'cliente', NULL, NULL, '2026-07-04', '2026-07-04', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Benaiges Fernández'), email = COALESCE(email, 'anaybena@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '681238626'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-07-06'), fecha_registro = COALESCE(fecha_registro, '2026-07-06'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'anaybena@gmail.com' OR (lower(nombre) = 'ana' AND coalesce(lower(apellidos),'') = 'benaiges fernández') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Ana', 'Benaiges Fernández', 'anaybena@gmail.com', NULL, '681238626', 'ethos', 'cliente', NULL, NULL, '2026-07-06', '2026-07-06', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Cánovas Rodríguez'), email = COALESCE(email, 'lourdescanovas@hotmail.es'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '619120071'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-07-08'), fecha_registro = COALESCE(fecha_registro, '2026-07-08'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'lourdescanovas@hotmail.es' OR (lower(nombre) = 'lourdes' AND coalesce(lower(apellidos),'') = 'cánovas rodríguez') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Lourdes', 'Cánovas Rodríguez', 'lourdescanovas@hotmail.es', NULL, '619120071', 'ethos', 'cliente', NULL, NULL, '2026-07-08', '2026-07-08', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Martínez Galván'), email = COALESCE(email, 'miquelmartinezgalvan@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '722391091'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-07-09'), fecha_registro = COALESCE(fecha_registro, '2026-07-09'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'miquelmartinezgalvan@gmail.com' OR (lower(nombre) = 'miquel' AND coalesce(lower(apellidos),'') = 'martínez galván') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Miquel', 'Martínez Galván', 'miquelmartinezgalvan@gmail.com', NULL, '722391091', 'ethos', 'cliente', NULL, NULL, '2026-07-09', '2026-07-09', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'Sáenz González'), email = COALESCE(email, 'andreusaenzgonzalez88@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '651903237'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-07-16'), fecha_registro = COALESCE(fecha_registro, '2026-07-16'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'andreusaenzgonzalez88@gmail.com' OR (lower(nombre) = 'andreu' AND coalesce(lower(apellidos),'') = 'sáenz gonzález') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Andreu', 'Sáenz González', 'andreusaenzgonzalez88@gmail.com', NULL, '651903237', 'ethos', 'cliente', NULL, NULL, '2026-07-16', '2026-07-16', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, 'García Quesada'), email = COALESCE(email, 'adriangarciaquesada1@gmail.com'),
    nif = COALESCE(nif, NULL), telefono = COALESCE(telefono, '615602617'),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN 'ethos' ELSE entrenador END,
    canal = COALESCE(canal, NULL), tipo_plan = COALESCE(tipo_plan, NULL),
    fecha_inicio = COALESCE(fecha_inicio, '2026-07-18'), fecha_registro = COALESCE(fecha_registro, '2026-07-18'),
    primer_contacto = COALESCE(primer_contacto, NULL), fecha_compra = COALESCE(fecha_compra, NULL),
    fecha_baja = COALESCE(fecha_baja, NULL),
    seg_cambio_fisico = seg_cambio_fisico OR false, seg_satisfaccion = seg_satisfaccion OR false,
    seg_marcha = seg_marcha OR false, seg_google_maps = seg_google_maps OR false, seg_trustpilot = seg_trustpilot OR false
  WHERE lower(email) = 'adriangarciaquesada1@gmail.com' OR (lower(nombre) = 'adrián' AND coalesce(lower(apellidos),'') = 'garcía quesada') RETURNING id )
INSERT INTO clientes (nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot)
SELECT 'Adrián', 'García Quesada', 'adriangarciaquesada1@gmail.com', NULL, '615602617', 'ethos', 'cliente', NULL, NULL, '2026-07-18', '2026-07-18', NULL, NULL, NULL, false, false, false, false, false WHERE NOT EXISTS (SELECT 1 FROM m);
COMMIT;
SELECT count(*) AS clientes_crm FROM clientes WHERE fecha_inicio IS NOT NULL OR tipo_plan IS NOT NULL;
