# Informe de importación — Contabilidad 2.0.xlsx

Generado el 2026-07-11 por `scripts/importar-excel.mjs`.
Las filas citadas son las de la hoja **"Libro diario - IG"** del Excel original.

## Resumen de lo importado

| Tabla | Filas | Importe |
|---|---|---|
| clientes | 112 | — |
| facturas | 155 | 54671.02 € facturados |
| cobros | 155 | 52540.00 € cobrados |
| gastos | 391 | 52707.98 € (con IVA) |
| traspasos | 18 | — |

## ⚠ Filas NO importadas (requieren decisión manual)

### Devoluciones de compras (14)
El esquema nuevo no modela reembolsos de compras. Opciones: apuntarlas como
gasto negativo no existe; lo habitual será restarlas del gasto de obra a mano
o crear un gasto rectificativo. **Dinero afectado: entra en cuenta.**
- Fila 17: 2026-01-07 "DEVOLUCIÓN KITTLE" +15 € en Cuenta Ethos
- Fila 18: 2026-01-09 "DEVOLUCIÓN PORTAROLLOS OBRAMAT" +14.55 € en Cuenta Ethos
- Fila 19: 2026-01-11 "DEVOLUCIÓN ENCHUFES Y EMPOTRADOR DE PLADUR" +12.89 € en Cuenta Ethos
- Fila 20: 2026-01-12 "DEVOLUCIÓN PINTURAS: 3 BLANCOS Y 1 NEGRO" +94.31 € en Cuenta Ethos
- Fila 25: 2026-01-21 "DEVOLUCIÓN OBRAMAT" +42.05 € en Cuenta Ethos
- Fila 26: 2026-01-22 "DEVOLUCIÓN OBRAMAT" +65.5 € en Cuenta Ethos
- Fila 27: 2026-01-22 "DEVOLUCIÓN MERCA ASIA" +1.9 € en Cuenta Ethos
- Fila 33: 2026-01-31 "DEVOLUCIÓN OBRAMAT" +31.6 € en Cuenta Ethos
- Fila 34: 2026-01-31 "DEVOLUCIÓN LEROY MERLIN" +10.61 € en Cuenta Ethos
- Fila 41: 2026-02-04 "DEVOLUCIÓN OBRAMAT" +36.7 € en Cuenta Ethos
- Fila 43: 2026-02-07 "DEVOLUCIÓN LEROY MERLIN" +4.32 € en Cuenta Ethos
- Fila 58: 2026-02-14 "BIZUM LUIS" +30 € en Cuenta Ethos
- Fila 59: 2026-02-14 "BIZUM LUIS" +17 € en Cuenta Ethos
- Fila 224: 2026-06-13 "null" +5.04 € en Cuenta Ethos

### Traspasos sin pareja (21)
Cada traspaso del Excel debía aparecer como salida en un bloque y entrada en el
otro. Estos aparecen solo en un lado; hay que decidir si eran nóminas (gasto),
aportaciones personales o errores de apunte.
- Fila 393 (salida): 2026-06-02 "NOMINA FISIO ALEX" 0 € desde Cuenta Ethos — sin entrada pareja
- Fila 395 (salida): 2026-06-02 "TRANSFERENCIA" 500 € desde Cuenta Efectivo Ethos — sin entrada pareja
- Fila 397 (salida): 2026-06-02 "TRANSFERENCIA" 610 € desde Cuenta Efectivo Ethos — sin entrada pareja
- Fila 398 (salida): 2026-06-02 "TRANSFERENCIA" 65 € desde Cuenta Ethos — sin entrada pareja
- Fila 426 (salida): 2026-06-20 "TRANSFERENCIA" 25.2 € desde Cuenta Efectivo Ethos — sin entrada pareja
- Fila 427 (salida): 2026-06-20 "TRANSFERENCIA" 5 € desde Cuenta Efectivo Ethos — sin entrada pareja
- Fila 457 (salida): 2026-06-30 "TRANSFERENCIA" 675 € desde Cuenta Efectivo Ethos — sin entrada pareja
- Fila 4 (entrada): 2026-01-02 "Aportación de la nómina de Luis" 65 € hacia Cuenta Efectivo Ethos — sin salida pareja
- Fila 7 (entrada): 2026-01-05 "Aportación David" 35.44 € hacia Cuenta David — sin salida pareja
- Fila 8 (entrada): 2026-01-07 "Aportación de Luis" 300 € hacia Cuenta Ethos — sin salida pareja
- Fila 9 (entrada): 2026-01-07 "Aportación de Luis" 372.19 € hacia Cuenta Ethos — sin salida pareja
- Fila 10 (entrada): 2026-01-02 "Aportación David" 60 € hacia Cuenta David — sin salida pareja
- Fila 11 (entrada): 2026-01-02 "Aportación David" 21.56 € hacia Cuenta David — sin salida pareja
- Fila 12 (entrada): 2026-01-05 "Aportación David" 11.88 € hacia Cuenta David — sin salida pareja
- Fila 13 (entrada): 2026-01-08 "Aportación de Luis" 180 € hacia Cuenta Ethos — sin salida pareja
- Fila 16 (entrada): 2026-01-05 "CAPCUT SURI" 20 € hacia Cuenta Ethos — sin salida pareja
- Fila 21 (entrada): 2026-01-08 "Aportación David" 1053.72 € hacia Cuenta David — sin salida pareja
- Fila 24 (entrada): 2026-01-05 "Aportación David" 13.6 € hacia Cuenta David — sin salida pareja
- Fila 36 (entrada): 2026-02-01 "null" null € hacia Cuenta Ethos — sin salida pareja
- Fila 54 (entrada): 2026-02-01 "Pago Kaizen" 3000 € hacia Cuenta Ethos — sin salida pareja
- Fila 228 (entrada): 2026-06-20 "EFECTIVO ETHOS A CUENTA ETHOS" 25.8 € hacia Cuenta Ethos — sin salida pareja

### Gastos con categoría no mapeable (15)
La categoría antigua no tiene traducción clara al catálogo nuevo ("Otro" o vacía).
Añadirlos a mano desde la app cuando exista el formulario, eligiendo categoría.
- Fila 24: 2026-01-05 "ROBO" 25 € — categoría antigua: "— / —"
- Fila 120: 2026-02-01 "Parking evento" 17.65 € — categoría antigua: "GYM - Otro / Otro"
- Fila 122: 2026-02-02 "Rampa minus" 35 € — categoría antigua: "GYM - Otro / Otro"
- Fila 147: 2026-02-08 "PRUEBA EURO" 1 € — categoría antigua: "GYM - Otro / Otro"
- Fila 148: 2026-02-08 "Monster" 1.79 € — categoría antigua: "GYM - Otro / Otro"
- Fila 159: 2026-02-11 "¿?" 1 € — categoría antigua: "GYM - Otro / Otro"
- Fila 173: 2026-02-14 "Spar" 2.99 € — categoría antigua: "GYM - Otro / Otro"
- Fila 175: 2026-02-16 "Ropa" 761.43 € — categoría antigua: "GYM - Otro / Otro"
- Fila 183: 2026-02-24 "Spar" 3.09 € — categoría antigua: "GYM - Otro / Otro"
- Fila 184: 2026-02-24 "Spar" 2.2 € — categoría antigua: "GYM - Otro / Otro"
- Fila 289: 2026-04-11 "Aguas" 1.62 € — categoría antigua: "GYM - Otro / Otro"
- Fila 311: 2026-04-24 "Aguas" 2.37 € — categoría antigua: "GYM - Otro / Otro"
- Fila 328: 2026-05-08 "Bocatas pipa" 18 € — categoría antigua: "GYM - Gastos operativos / Corrientes / Otro"
- Fila 332: 2026-05-08 "aguas" 3.55 € — categoría antigua: "GYM - Gastos operativos / Corrientes / Otro"
- Fila 342: 2026-05-07 "ni idea" 4.2 € — categoría antigua: "GYM - Otro / Otro"

### Gastos sin tipo de transacción (11)
- Fila 99: 2026-01-20 "Factura gym luis" ? € — tipo de transacción vacío
- Fila 131: 2026-02-04 "Mutua Luis" ? € — tipo de transacción vacío
- Fila 202: 2026-01-05 "Reparación Moto Luis" ? € — tipo de transacción vacío
- Fila 276: 2026-03-18 "Factura KITTL" ? € — tipo de transacción vacío
- Fila 277: 2026-03-04 "Mutua Luis" ? € — tipo de transacción vacío
- Fila 278: 2026-02-10 "Compra moto" ? € — tipo de transacción vacío
- Fila 279: 2026-03-04 "Revisión moto" ? € — tipo de transacción vacío
- Fila 305: 2026-04-18 "Hucha y cosas chino" 10.76 € — tipo de transacción vacío
- Fila 361: 2026-05-17 "DEVOLUCION QR" 0 € — tipo de transacción vacío
- Fila 362: 2026-05-18 "Medallas niñas feria" 3.6 € — tipo de transacción vacío
- Fila 449: 2026-06-17 "Mutua Luis" ? € — tipo de transacción vacío

## ℹ Avisos (importados con ajustes)

### Traspasos que se anulan al fundir cuentas personales (7)
Al mapear las cuentas personales a banco/caja, origen y destino coinciden y el
traspaso deja de mover saldo. No se importan porque el esquema lo prohíbe (y no
haría nada).
- Filas 13/5: 2026-01-02 "NOMINA LUIS" 11.76 € (Cuenta Ethos -> Cuenta Ethos; ambas se funden en "banco", no mueve saldo)
- Filas 14/6: 2026-01-02 "NOMINA DAVID" 602.09 € (Efectivo David -> Efectivo David; ambas se funden en "caja", no mueve saldo)
- Filas 132/40: 2026-02-04 "APOTACION LUIS" 300 € (Cuenta Luis -> Cuenta Ethos; ambas se funden en "banco", no mueve saldo)
- Filas 273/133: 2026-04-02 "TRANSFERENCIA DE SOBRANTE LUIS A EFECTIVO ETHOS" 1110 € (Efectivo Luis -> Cuenta Efectivo Ethos; ambas se funden en "caja", no mueve saldo)
- Filas 294/143: 2026-04-16 "CAMBIO CLAUDIA" 6 € (Cuenta Efectivo Ethos -> Efectivo Luis; ambas se funden en "caja", no mueve saldo)
- Filas 321/174: 2026-05-01 "TRANSFERENCIA" 872 € (Efectivo David -> Cuenta Efectivo Ethos; ambas se funden en "caja", no mueve saldo)
- Filas 394/215: 2026-06-02 "TRANSFERENCIA" 260 € (Efectivo David -> Cuenta Efectivo Ethos; ambas se funden en "caja", no mueve saldo)

### Cuentas personales remapeadas
El modelo nuevo no tiene cuentas personales. Los movimientos históricos que las
usaban se han volcado así: Cuenta Luis/David → **banco**, Efectivo Luis/David → **caja**.
- Cobros afectados: 63
- Gastos afectados: 25
- Traspasos afectados: 11

**Consecuencia:** el saldo de `banco` y `caja` tras importar puede no cuadrar
con la realidad si quedó dinero sin aportar en cuentas personales. Comparad el
saldo real y, si hay diferencia, apuntadla con un traspaso o gasto de ajuste.

### Facturas cobradas parcialmente (7)
Aparecerán en morosos con el resto pendiente — eso es correcto, revisadlo.
- Fila 63: "Ventas efectivo del 23 al 28 de feb" — facturado 304.5 €, cobrado 242.5 € (queda pendiente en morosos)
- Fila 72: "Ventas EFECTIVO del 02 al 8 de marzo" — facturado 357.5 €, cobrado 419.5 € (queda pendiente en morosos)
- Fila 96: "20 pareja - Pago 1/3" — facturado 680 €, cobrado 250 € (queda pendiente en morosos)
- Fila 217: "EPs Mayo y Abril + Trim online" — facturado 590 €, cobrado 550 € (queda pendiente en morosos)
- Fila 235: "Anual entreno" — facturado 825 €, cobrado 425 € (queda pendiente en morosos)
- Fila 237: "Anual entreno" — facturado 1235 €, cobrado 494 € (queda pendiente en morosos)
- Fila 272: "Pago 1/4" — facturado 1169.9 €, cobrado 292.45 € (queda pendiente en morosos)

### Nóminas apuntadas como traspaso (29)
En el Excel las nóminas de los socios estaban en el bloque de traspasos, pero es
dinero que SALE del negocio: se importan como gasto **Personal / Nóminas**,
imputadas a *ethos* (la nómina es el resultado del reparto, no un gasto del
entrenador).
- Fila 12: 2026-01-02 "NOMINA LUIS" 1065 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 196: 2026-03-02 "NÓMINA LUIS" 1180 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 197: 2026-03-02 "NÓMINA LUIS" 88.19 € desde Cuenta Luis -> gasto Personal/Nóminas
- Fila 198: 2026-03-02 "NÓMINA LUIS" 1319.93 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 199: 2026-03-02 "NÓMINA DAVID" 1140 € desde Efectivo David -> gasto Personal/Nóminas
- Fila 200: 2026-03-02 "NÓMINA DAVID" 19.2 € desde Cuenta David -> gasto Personal/Nóminas
- Fila 201: 2026-03-02 "NÓMINA DAVID" 489.15 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 266: 2026-04-02 "NOMINA LUIS" 1400 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 267: 2026-04-02 "NOMINA LUIS" 979.23 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 268: 2026-04-02 "NOMINA LUIS" 30 € desde Cuenta Luis -> gasto Personal/Nóminas
- Fila 269: 2026-04-02 "NOMINA DAVID" 850 € desde Efectivo David -> gasto Personal/Nóminas
- Fila 270: 2026-04-02 "NOMINA DAVID" 120 € desde Cuenta David -> gasto Personal/Nóminas
- Fila 271: 2026-04-02 "NOMINA DAVID" 225.22 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 272: 2026-04-02 "NOMINA IRENE" 100 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 319: 2026-05-01 "NOMINA LUIS" 1156 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 320: 2026-05-01 "NOMINA LUIS" 1386.61 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 322: 2026-05-01 "NOMINA DAVID" 1000 € desde Efectivo David -> gasto Personal/Nóminas
- Fila 323: 2026-05-01 "NOMINA DAVID" 922.69 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 388: 2026-06-02 "NOMINA LUIS" 1290 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 389: 2026-06-02 "NOMINA LUIS" 56.96 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 391: 2026-06-02 "NOMINA DAVID" 91.76 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 392: 2026-06-02 "NOMINA DAVID" 180 € desde Cuenta David -> gasto Personal/Nóminas
- Fila 452: 2026-06-30 "NOMINA LUIS" 1425 € desde Efectivo Luis -> gasto Personal/Nóminas
- Fila 453: 2026-06-30 "NOMINA LUIS" 1740.87 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 454: 2026-06-30 "NOMINA LUIS" 86.5 € desde Cuenta Luis -> gasto Personal/Nóminas
- Fila 455: 2026-06-30 "NOMINA DAVID" 1030 € desde Efectivo David -> gasto Personal/Nóminas
- Fila 456: 2026-06-30 "NOMINA DAVID" 970 € desde Cuenta Ethos -> gasto Personal/Nóminas
- Fila 458: 2026-06-30 "NOMINA ALEX" 133.5 € desde Cuenta Efectivo Ethos -> gasto Personal/Nóminas
- Fila 459: 2026-06-30 "NOMINA ALEX" 66.5 € desde Cuenta Efectivo Ethos -> gasto Personal/Nóminas

### Cobros asumidos por el total de la factura (0)
La celda de "Cash collected" era una fórmula sin valor guardado, pero el estado
del Excel decía "cobrado" y había fecha de cobro. Se asume cobro completo.
_(ninguna)_

### Base imponible derivada (1)
Filas sin base en el Excel; se calculó desde el total/cobrado quitando IVA.
- Fila 23: "GARANTIA JUVENIL" — base derivada de 9967.78 € -> 9967.78 €

### Deducible sin factura (5)
El esquema exige factura para deducir. Importados como NO deducibles.
- Fila 33: 2026-01-09 "Césped 2n pago" 133.85 € — marcado deducible pero sin factura; importado como NO deducible
- Fila 146: 2026-02-08 "Césped 3/3" 133.85 € — marcado deducible pero sin factura; importado como NO deducible
- Fila 407: 2026-06-05 "Claude" 0 € — marcado deducible pero sin factura; importado como NO deducible
- Fila 450: 2026-07-31 "Comisiones CAIXA TPV JULIO" 0 € — marcado deducible pero sin factura; importado como NO deducible
- Fila 451: 2026-07-31 "Comisiones Merchan JULIO" 0 € — marcado deducible pero sin factura; importado como NO deducible

### Ingresos con categoría "Otros" (19)
No se pudo deducir el servicio; revisad y recategorizad desde la app.
- Fila 23: "GARANTIA JUVENIL" (cliente: —)
- Fila 35: "null" (cliente: Antonio Lozano)
- Fila 53: "Kallax" (cliente: Wallapop)
- Fila 91: "Wallapop" (cliente: Cajones Wallapop)
- Fila 93: "Trimestre E y N" (cliente: Taruun)
- Fila 96: "20 pareja - Pago 1/3" (cliente: Francesc e Isa)
- Fila 101: "20 pareja - Pago 2/3" (cliente: Francesc e Isa)
- Fila 121: "20 pareja - Pago 3/3" (cliente: Francesc e Isa)
- Fila 124: "13 PERSONAS FEB-MARZ" (cliente: ADISGA)
- Fila 127: "null" (cliente: Reca)
- Fila 129: "Suplemento por libre" (cliente: Ana Maria Garcia)
- Fila 184: "trimestre" (cliente: Adri Monge)
- Fila 190: "DEV" (cliente: RAUL LERMA Y FAMILIA)
- Fila 191: "DEV" (cliente: CAFETERA DEV)
- Fila 223: "1ER PAGO INES ANUAL" (cliente: INES PORTILLO)
- Fila 230: "EFECTIVO" (cliente: MULTAS JUNIO)
- Fila 231: "BIZUM O TPV" (cliente: AGUAS JUNIO)
- Fila 232: "EFECTIVO" (cliente: AGUAS JUNIO)
- Fila 233: "13 PERSONAS FEB-MARZ" (cliente: ADISGA JUNIO)

### Otros avisos (4)
- Fila 286 (gasto): sin importe. NO importado.
- Fila 326 (gasto): sin importe. NO importado.
- Fila 348 (gasto): sin cuenta; asignado a banco.
- Fila 387 (gasto): sin importe. NO importado.

### Filas plantilla a cero omitidas: 61
Filas semanales agregadas sin importe (semanas sin ventas de ese tipo). No se importan.

## Datos que faltan en el Excel

- **Gastos de 2025**: hay ingresos desde abril de 2025 pero los gastos empiezan
  en enero de 2026. Si existen en otro fichero, se pueden importar aparte.
- **Facturas sin cobro registrado**: 0
  facturas quedaron sin ningún cobro y aparecerán como pendientes en morosos.
