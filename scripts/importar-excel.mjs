// =====================================================================
// Importador del Excel histórico "Contabilidad 2.0.xlsx"
//
// Uso:  node scripts/importar-excel.mjs "C:/ruta/al/Contabilidad 2.0.xlsx"
//
// No toca la base de datos. Genera dos ficheros:
//   supabase/import_historico.sql   -> pegar en el SQL Editor de Supabase
//   supabase/informe_importacion.md -> filas no mapeables y avisos
// =====================================================================

import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";

const RUTA_EXCEL = process.argv[2];
if (!RUTA_EXCEL) {
  console.error('Uso: node scripts/importar-excel.mjs "ruta/al/excel.xlsx"');
  process.exit(1);
}

// ---------------------------------------------------------------------
// Mapeos del mundo antiguo al esquema nuevo
// ---------------------------------------------------------------------

// Cuentas antiguas -> código de cuenta nuevo.
// Las cuentas personales se vuelcan a banco/caja (no existen en el modelo
// nuevo); cada remapeo queda contado en el informe.
const MAPA_CUENTAS = {
  "Cuenta Ethos": "banco",
  "Cuenta Efectivo Ethos": "caja",
  "Stripe": "stripe",
  "TPV Ethos": "tpv",
  "Cuenta Luis": "banco",
  "Cuenta David": "banco",
  "Efectivo Luis": "caja",
  "Efectivo David": "caja",
};
const CUENTAS_PERSONALES = new Set(["Cuenta Luis", "Cuenta David", "Efectivo Luis", "Efectivo David"]);

const MAPA_METODO = {
  TRANSFERENCIA: "transferencia",
  EFECTIVO: "efectivo",
  STRIPE: "stripe",
  TPV: "tpv",
  BIZUM: "bizum",
};
// Si falta el método, se deduce de la cuenta
const METODO_POR_CUENTA = { banco: "transferencia", caja: "efectivo", stripe: "stripe", tpv: "tpv" };

const MAPA_ATRIBUCION = {
  Ethos: "ethos",
  Empresa: "ethos",
  Luis: "luis",
  David: "david",
  "Alex Esteban": "alex_esteban",
  "Alex Guerrero": "alex_guerrero",
};

// Subcategoría de gasto antigua -> (grupo, nombre) del catálogo nuevo
const MAPA_CAT_GASTO = {
  "Reformas": ["Inversión", "Obra y reformas"],
  "Inversión": ["Inversión", "Maquinaria y material"],
  "Comisiones": ["Operativo", "Comisiones bancarias"],
  "Marketing": ["Operativo", "Marketing"],
  "ONL - Marketing": ["Operativo", "Marketing"],
  "Pago de nóminas": ["Personal", "Nóminas"],
  "Software": ["Operativo", "Software"],
  "ONL - Software": ["Operativo", "Software"],
  "Suministros": ["Operativo", "Suministros"],
  "Mantenimiento": ["Operativo", "Mantenimiento"],
  "Préstamo": ["Financiación", "Préstamo"],
  "Seguros": ["Operativo", "Seguros"],
  "Alquiler": ["Operativo", "Alquiler"],
  "Gestor": ["Personal", "Gestoría"],
  "Autónomos": ["Personal", "Cuota autónomos"],
  "Internet y teléfono": ["Operativo", "Internet y teléfono"],
  "Impuestos": ["Legal", "Impuestos"],
};

// Servicio del cliente + pistas del concepto -> categoría de ingreso
function categoriaIngreso({ cliente, servicio, concepto, cobrador }) {
  if (cliente === "ENTRENOS GRUPALES") return "Clases grupales";
  const cli = (cliente ?? "").toLowerCase();
  const pista = `${servicio ?? ""} ${concepto ?? ""}`.toLowerCase();

  if (cli.includes("merch")) return "Merchandising";
  if (cli.includes("hsn")) return "Patrocinios";
  if (cobrador === "Alex Esteban") return "Fisioterapia";
  if (pista.includes("acceso") || cli.includes("acceso")) return "Acceso libre";
  const online = pista.includes("online") || /\bon\b|on:/.test(pista);
  const nutri = pista.includes("nutri") || pista.includes("dieta");
  const entreno = pista.includes("entreno") || /\bep\b|\beps\b|\bep\s|\d\s*ep/.test(pista) || pista.includes("bono");
  if (entreno) return online ? "Entreno online" : "Entreno presencial";
  if (nutri) return "Nutrición";
  return "Otros";
}

// ---------------------------------------------------------------------
// Lectura del Excel
// ---------------------------------------------------------------------

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(RUTA_EXCEL);
const ws = wb.getWorksheet("Libro diario - IG");
const wsClientes = wb.getWorksheet("Gestión de clientes");
if (!ws || !wsClientes) {
  console.error("No encuentro las hojas 'Libro diario - IG' / 'Gestión de clientes'.");
  process.exit(1);
}

function leer(hoja, r, c) {
  let v = hoja.getRow(r).getCell(c).value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object") {
    if (v instanceof Date) return v;
    if (v.result !== undefined) return v.result;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    return null; // fórmula sin resultado cacheado
  }
  return v;
}
const texto = (hoja, r, c) => {
  const v = leer(hoja, r, c);
  return v === null ? null : String(v).trim() || null;
};
const numero = (hoja, r, c) => {
  const v = leer(hoja, r, c);
  return typeof v === "number" ? v : null;
};
const fechaISO = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : null);
const r2 = (n) => Math.round(n * 100) / 100;

// --- Bloque INGRESOS (cols 7-38) y GASTOS (cols 40-62) ---
const ingresos = [];
const gastosRaw = [];
for (let r = 3; r <= ws.rowCount; r++) {
  const fIng = leer(ws, r, 7);
  if (fIng instanceof Date) {
    ingresos.push({
      fila: r,
      fecha: fechaISO(fIng),
      cliente: texto(ws, r, 12),
      concepto: texto(ws, r, 13),
      tipo: texto(ws, r, 14),
      cobrador: texto(ws, r, 16),
      cuenta: texto(ws, r, 17),
      metodo: texto(ws, r, 18),
      base: numero(ws, r, 19),
      aplicaIva: texto(ws, r, 20),
      ivaPct: numero(ws, r, 21),
      aplicaIrpf: texto(ws, r, 23),
      irpfPct: numero(ws, r, 24),
      total: numero(ws, r, 29),
      fechaCobro: fechaISO(leer(ws, r, 32)),
      estadoCobro: texto(ws, r, 31),
      cash: numero(ws, r, 36),
      notas: texto(ws, r, 38),
    });
  }
  const fGas = leer(ws, r, 40);
  if (fGas instanceof Date) {
    gastosRaw.push({
      fila: r,
      fecha: fechaISO(fGas),
      concepto: texto(ws, r, 45),
      proveedor: texto(ws, r, 46),
      tipo: texto(ws, r, 47),
      pagador: texto(ws, r, 48),
      categoria: texto(ws, r, 49),
      subcategoria: texto(ws, r, 50),
      cuenta: texto(ws, r, 51),
      metodo: texto(ws, r, 52),
      importeConIva: numero(ws, r, 53),
      deducible: texto(ws, r, 54),
      aplicaIva: texto(ws, r, 55),
      ivaPct: numero(ws, r, 56),
      ivaSoportado: numero(ws, r, 57),
      tieneFactura: leer(ws, r, 59) === true,
      notas: texto(ws, r, 62),
    });
  }
}

// --- Clientes de "Gestión de clientes" (cabecera en fila 7, datos desde la 8) ---
const clientesExcel = new Map(); // nombre -> {entrenador, servicio}
for (let r = 8; r <= wsClientes.rowCount; r++) {
  const nombre = texto(wsClientes, r, 2);
  if (!nombre) continue;
  clientesExcel.set(nombre, {
    entrenador: MAPA_ATRIBUCION[texto(wsClientes, r, 3)] ?? "ethos",
    servicio: texto(wsClientes, r, 4),
  });
}

// ---------------------------------------------------------------------
// Transformación
// ---------------------------------------------------------------------

const informe = {
  devoluciones: [],
  traspasosNoEmparejados: [],
  traspasosNoOp: [],
  gastosSinCategoria: [],
  gastosTipoVacio: [],
  cashDistintoTotal: [],
  baseDerivada: [],
  cobroDerivado: [],
  nominasConvertidas: [],
  filasCero: 0,
  deducibleSinFactura: [],
  cuentasPersonales: { ingresos: 0, gastos: 0, traspasos: 0 },
  categoriaOtros: [],
  avisos: [],
};

function cuentaNueva(vieja, contexto, contador) {
  if (!vieja) return null;
  const codigo = MAPA_CUENTAS[vieja];
  if (!codigo) return null;
  if (CUENTAS_PERSONALES.has(vieja)) informe.cuentasPersonales[contador]++;
  return codigo;
}

// --- 1. Clientes: los de la hoja + los que solo aparecen en ingresos ---
const NO_SON_CLIENTES = new Set(["ENTRENOS GRUPALES", "Devolución", "BIZUM"]);
const clientes = new Map(); // nombre -> {id, entrenador, servicio}
let idCliente = 0;
for (const [nombre, info] of clientesExcel) {
  clientes.set(nombre, { id: ++idCliente, ...info });
}
for (const i of ingresos) {
  if (i.tipo !== "Ingreso" || !i.cliente || NO_SON_CLIENTES.has(i.cliente)) continue;
  if (!clientes.has(i.cliente)) {
    clientes.set(i.cliente, {
      id: ++idCliente,
      entrenador: MAPA_ATRIBUCION[i.cobrador] ?? "ethos",
      servicio: null,
    });
  }
}

// --- 2. Ingresos -> facturas + cobros ---
const facturas = [];
const cobros = [];
let idFactura = 0;

for (const i of ingresos.filter((x) => x.tipo === "Ingreso")) {
  const ivaPct = i.aplicaIva === "Si" ? (i.ivaPct ?? 0.21) : 0;
  const irpfPct = i.aplicaIrpf === "Si" ? (i.irpfPct ?? 0) : 0;

  let base = i.base;
  if (base === null) {
    const ref = i.total ?? i.cash;
    if (ref === null) {
      informe.avisos.push(`Fila ${i.fila} (ingreso): sin base, sin total y sin cash. NO importada.`);
      continue;
    }
    base = r2(ref / (1 + ivaPct - irpfPct));
    informe.baseDerivada.push(`Fila ${i.fila}: "${i.concepto}" — base derivada de ${ref} € -> ${base} €`);
  }

  // Filas plantilla a cero (p.ej. "Ventas BIZUM del 09 al 15" sin ventas): fuera
  if (base === 0 && !i.cash && !i.total) {
    informe.filasCero++;
    continue;
  }

  const cli = i.cliente && !NO_SON_CLIENTES.has(i.cliente) ? clientes.get(i.cliente) : null;
  const cat = categoriaIngreso({
    cliente: i.cliente,
    servicio: cli?.servicio,
    concepto: i.concepto,
    cobrador: i.cobrador,
  });
  if (cat === "Otros") {
    informe.categoriaOtros.push(`Fila ${i.fila}: "${i.concepto}" (cliente: ${i.cliente ?? "—"})`);
  }

  const f = {
    id: ++idFactura,
    clienteId: cli?.id ?? null,
    categoria: ["Ingreso", cat],
    atribucion: MAPA_ATRIBUCION[i.cobrador] ?? "ethos",
    fecha: i.fecha,
    concepto: i.concepto ?? "(sin concepto)",
    base: r2(base),
    ivaPct,
    irpfPct,
    notas: i.notas,
  };
  facturas.push(f);

  // Importe cobrado: el del Excel o, si la celda era una fórmula sin valor
  // guardado pero el estado dice "cobrado", el total de la factura.
  let importeCobro = i.cash;
  if (importeCobro === null && i.estadoCobro === "Si") {
    importeCobro = i.total ?? r2(base * (1 + ivaPct - irpfPct));
    informe.cobroDerivado.push(`Fila ${i.fila}: "${f.concepto}" — cobro asumido por el total (${importeCobro} €)`);
  }
  if (importeCobro !== null && importeCobro !== 0) {
    const cuenta = cuentaNueva(i.cuenta, "ingreso", "ingresos");
    if (!cuenta) {
      informe.avisos.push(`Fila ${i.fila} (ingreso): cuenta "${i.cuenta}" desconocida; cobro NO importado.`);
    } else {
      cobros.push({
        facturaId: f.id,
        fecha: i.fechaCobro ?? i.fecha,
        importe: r2(importeCobro),
        cuenta,
        metodo: MAPA_METODO[i.metodo] ?? METODO_POR_CUENTA[cuenta],
      });
      if (i.total !== null && i.cash !== null && Math.abs(i.cash - i.total) > 0.01) {
        informe.cashDistintoTotal.push(
          `Fila ${i.fila}: "${i.concepto}" — facturado ${i.total} €, cobrado ${i.cash} € (queda pendiente en morosos)`
        );
      }
    }
  }
}

// --- 3. Devoluciones -> informe (el esquema nuevo no las modela aún) ---
for (const i of ingresos.filter((x) => x.tipo === "Devolución")) {
  informe.devoluciones.push(
    `Fila ${i.fila}: ${i.fecha} "${i.concepto}" +${i.cash ?? i.base ?? "?"} € en ${i.cuenta}`
  );
}

// --- 4. Traspasos: emparejar salida (bloque gastos) con entrada (bloque ingresos) ---
const traspasosEntrada = ingresos.filter((x) => x.tipo === "Traspaso de dinero");
const traspasosSalida = gastosRaw.filter((x) => x.tipo === "Traspaso de dinero");
const traspasos = [];
const nominas = []; // traspasos sin pareja que en realidad son pagos de nómina
const entradasLibres = [...traspasosEntrada];
const diasEntre = (a, b) => Math.abs(new Date(a) - new Date(b)) / 86400000;

for (const sal of traspasosSalida) {
  // Mismo importe: primero exige la misma fecha; si no, acepta hasta 7 días de diferencia
  let idx = entradasLibres.findIndex(
    (ent) => ent.fecha === sal.fecha && Math.abs((ent.cash ?? -1) - (sal.importeConIva ?? -2)) < 0.005
  );
  if (idx === -1) {
    idx = entradasLibres.findIndex(
      (ent) => diasEntre(ent.fecha, sal.fecha) <= 7 && Math.abs((ent.cash ?? -1) - (sal.importeConIva ?? -2)) < 0.005
    );
  }
  if (idx === -1) {
    // Nóminas apuntadas como traspaso: dinero que sale del negocio hacia una
    // persona. En el modelo nuevo son un gasto de Personal/Nóminas.
    const esNomina = sal.subcategoria === "Pago de nóminas" || /n[oó]mina/i.test(sal.concepto ?? "");
    if (esNomina && sal.importeConIva) {
      nominas.push(sal);
    } else {
      informe.traspasosNoEmparejados.push(
        `Fila ${sal.fila} (salida): ${sal.fecha} "${sal.concepto}" ${sal.importeConIva} € desde ${sal.cuenta} — sin entrada pareja`
      );
    }
    continue;
  }
  const ent = entradasLibres.splice(idx, 1)[0];
  const origen = cuentaNueva(sal.cuenta, "traspaso", "traspasos");
  const destino = cuentaNueva(ent.cuenta, "traspaso", "traspasos");
  if (!origen || !destino) {
    informe.avisos.push(`Filas ${sal.fila}/${ent.fila} (traspaso): cuenta desconocida (${sal.cuenta} -> ${ent.cuenta}). NO importado.`);
    continue;
  }
  if (origen === destino) {
    informe.traspasosNoOp.push(
      `Filas ${sal.fila}/${ent.fila}: ${sal.fecha} "${sal.concepto}" ${sal.importeConIva} € (${sal.cuenta} -> ${ent.cuenta}; ambas se funden en "${origen}", no mueve saldo)`
    );
    continue;
  }
  traspasos.push({
    fecha: sal.fecha,
    origen,
    destino,
    importe: r2(sal.importeConIva),
    motivo: sal.concepto ?? ent.concepto,
  });
}
for (const ent of entradasLibres) {
  informe.traspasosNoEmparejados.push(
    `Fila ${ent.fila} (entrada): ${ent.fecha} "${ent.concepto}" ${ent.cash} € hacia ${ent.cuenta} — sin salida pareja`
  );
}

// --- 5. Gastos ---
const gastos = [];

// 5a. Nóminas que estaban apuntadas como traspaso sin pareja
for (const s of nominas) {
  const cuenta = cuentaNueva(s.cuenta, "gasto", "gastos") ?? "banco";
  gastos.push({
    fecha: s.fecha,
    concepto: s.concepto ?? "Nómina",
    proveedor: null,
    categoria: ["Personal", "Nóminas"],
    cuenta,
    // Siempre 'ethos': la nómina es el RESULTADO del reparto, no un gasto
    // imputable al entrenador (le restaría su propio sueldo del balance).
    imputadoA: "ethos",
    base: r2(s.importeConIva),
    ivaPct: 0,
    ivaSoportado: 0,
    deducible: false,
    tieneFactura: false,
    notas: "Importado: nómina apuntada como traspaso en el Excel",
  });
  informe.nominasConvertidas.push(
    `Fila ${s.fila}: ${s.fecha} "${s.concepto}" ${s.importeConIva} € desde ${s.cuenta} -> gasto Personal/Nóminas`
  );
}

for (const g of gastosRaw) {
  if (g.tipo === "Traspaso de dinero") continue; // ya tratados
  if (g.tipo !== "Gasto") {
    informe.gastosTipoVacio.push(
      `Fila ${g.fila}: ${g.fecha} "${g.concepto}" ${g.importeConIva ?? "?"} € — tipo de transacción vacío`
    );
    continue;
  }
  const cat = MAPA_CAT_GASTO[g.subcategoria];
  if (!cat) {
    informe.gastosSinCategoria.push(
      `Fila ${g.fila}: ${g.fecha} "${g.concepto}" ${g.importeConIva ?? "?"} € — categoría antigua: "${g.categoria ?? "—"} / ${g.subcategoria ?? "—"}"`
    );
    continue;
  }
  if (g.importeConIva === null) {
    informe.avisos.push(`Fila ${g.fila} (gasto): sin importe. NO importado.`);
    continue;
  }
  const cuenta = cuentaNueva(g.cuenta, "gasto", "gastos") ?? "banco";
  if (!g.cuenta) informe.avisos.push(`Fila ${g.fila} (gasto): sin cuenta; asignado a banco.`);

  const ivaPct = g.aplicaIva === "Si" ? (g.ivaPct ?? 0.21) : 0;
  const base = r2(g.importeConIva / (1 + ivaPct));
  const quiereDeducible = g.deducible === "Si";
  const deducible = quiereDeducible && g.tieneFactura;
  if (quiereDeducible && !g.tieneFactura) {
    informe.deducibleSinFactura.push(
      `Fila ${g.fila}: ${g.fecha} "${g.concepto}" ${g.importeConIva} € — marcado deducible pero sin factura; importado como NO deducible`
    );
  }
  gastos.push({
    fecha: g.fecha,
    concepto: g.concepto ?? "(sin concepto)",
    proveedor: g.proveedor,
    categoria: cat,
    cuenta,
    imputadoA: MAPA_ATRIBUCION[g.pagador] ?? "ethos",
    base,
    ivaPct,
    ivaSoportado: deducible ? r2(g.ivaSoportado ?? base * ivaPct) : 0,
    deducible,
    tieneFactura: g.tieneFactura,
    notas: g.notas,
  });
}

// ---------------------------------------------------------------------
// Generación del SQL
// ---------------------------------------------------------------------

const q = (s) => (s === null || s === undefined ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);
const num = (n) => (n === null || n === undefined ? "NULL" : String(n));
const cta = (codigo) => `(SELECT id FROM cuentas WHERE codigo = ${q(codigo)})`;
const catId = ([grupo, nombre]) => `(SELECT id FROM categorias WHERE grupo = ${q(grupo)} AND nombre = ${q(nombre)})`;

let sql = `-- =====================================================================
-- IMPORTACIÓN HISTÓRICA desde "Contabilidad 2.0.xlsx"
-- Generado por scripts/importar-excel.mjs el ${new Date().toISOString().slice(0, 10)}
-- Ejecutar UNA VEZ en: Supabase Dashboard > SQL Editor
-- Si algo falla, no se importa nada (todo va en una única transacción).
-- =====================================================================

BEGIN;

-- Protección: no ejecutar dos veces
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM facturas) OR EXISTS (SELECT 1 FROM gastos) THEN
    RAISE EXCEPTION 'Ya hay datos en facturas/gastos. Importación cancelada para no duplicar.';
  END IF;
END $$;

`;

sql += `-- ---------- CLIENTES (${clientes.size}) ----------\n`;
for (const [nombre, c] of clientes) {
  sql += `INSERT INTO clientes (id, nombre, entrenador, notas) VALUES (${c.id}, ${q(nombre)}, ${q(c.entrenador)}, ${q(c.servicio ? `Servicio (Excel): ${c.servicio}` : null)});\n`;
}
sql += `SELECT setval('clientes_id_seq', ${idCliente});\n\n`;

sql += `-- ---------- FACTURAS (${facturas.length}) ----------\n`;
for (const f of facturas) {
  sql += `INSERT INTO facturas (id, cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, notas) VALUES (${f.id}, ${num(f.clienteId)}, ${catId(f.categoria)}, ${q(f.atribucion)}, ${q(f.fecha)}, ${q(f.concepto)}, ${num(f.base)}, ${num(f.ivaPct)}, ${num(f.irpfPct)}, ${q(f.notas)});\n`;
}
sql += `SELECT setval('facturas_id_seq', ${idFactura});\n\n`;

sql += `-- ---------- COBROS (${cobros.length}) ----------\n`;
for (const c of cobros) {
  sql += `INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo) VALUES (${c.facturaId}, ${q(c.fecha)}, ${num(c.importe)}, ${cta(c.cuenta)}, ${q(c.metodo)});\n`;
}
sql += `\n`;

sql += `-- ---------- GASTOS (${gastos.length}) ----------\n`;
for (const g of gastos) {
  sql += `INSERT INTO gastos (fecha, concepto, proveedor, categoria_id, cuenta_id, imputado_a, base, iva_pct, iva_soportado, deducible, tiene_factura, notas) VALUES (${q(g.fecha)}, ${q(g.concepto)}, ${q(g.proveedor)}, ${catId(g.categoria)}, ${cta(g.cuenta)}, ${q(g.imputadoA)}, ${num(g.base)}, ${num(g.ivaPct)}, ${num(g.ivaSoportado)}, ${g.deducible}, ${g.tieneFactura}, ${q(g.notas)});\n`;
}
sql += `\n`;

sql += `-- ---------- TRASPASOS (${traspasos.length}) ----------\n`;
for (const t of traspasos) {
  sql += `INSERT INTO traspasos (fecha, cuenta_origen_id, cuenta_destino_id, importe, motivo) VALUES (${q(t.fecha)}, ${cta(t.origen)}, ${cta(t.destino)}, ${num(t.importe)}, ${q(t.motivo)});\n`;
}

sql += `
COMMIT;

-- Comprobación rápida
SELECT 'clientes' AS tabla, COUNT(*) FROM clientes
UNION ALL SELECT 'facturas', COUNT(*) FROM facturas
UNION ALL SELECT 'cobros', COUNT(*) FROM cobros
UNION ALL SELECT 'gastos', COUNT(*) FROM gastos
UNION ALL SELECT 'traspasos', COUNT(*) FROM traspasos;
`;

// ---------------------------------------------------------------------
// Generación del informe
// ---------------------------------------------------------------------

const lista = (arr) => (arr.length ? arr.map((x) => `- ${x}`).join("\n") : "_(ninguna)_");
const totalCobrado = r2(cobros.reduce((s, c) => s + c.importe, 0));
const totalFacturado = r2(facturas.reduce((s, f) => s + r2(f.base * (1 + f.ivaPct - f.irpfPct)), 0));
const totalGastos = r2(gastos.reduce((s, g) => s + r2(g.base * (1 + g.ivaPct)), 0));

let md = `# Informe de importación — Contabilidad 2.0.xlsx

Generado el ${new Date().toISOString().slice(0, 10)} por \`scripts/importar-excel.mjs\`.
Las filas citadas son las de la hoja **"Libro diario - IG"** del Excel original.

## Resumen de lo importado

| Tabla | Filas | Importe |
|---|---|---|
| clientes | ${clientes.size} | — |
| facturas | ${facturas.length} | ${totalFacturado.toFixed(2)} € facturados |
| cobros | ${cobros.length} | ${totalCobrado.toFixed(2)} € cobrados |
| gastos | ${gastos.length} | ${totalGastos.toFixed(2)} € (con IVA) |
| traspasos | ${traspasos.length} | — |

## ⚠ Filas NO importadas (requieren decisión manual)

### Devoluciones de compras (${informe.devoluciones.length})
El esquema nuevo no modela reembolsos de compras. Opciones: apuntarlas como
gasto negativo no existe; lo habitual será restarlas del gasto de obra a mano
o crear un gasto rectificativo. **Dinero afectado: entra en cuenta.**
${lista(informe.devoluciones)}

### Traspasos sin pareja (${informe.traspasosNoEmparejados.length})
Cada traspaso del Excel debía aparecer como salida en un bloque y entrada en el
otro. Estos aparecen solo en un lado; hay que decidir si eran nóminas (gasto),
aportaciones personales o errores de apunte.
${lista(informe.traspasosNoEmparejados)}

### Gastos con categoría no mapeable (${informe.gastosSinCategoria.length})
La categoría antigua no tiene traducción clara al catálogo nuevo ("Otro" o vacía).
Añadirlos a mano desde la app cuando exista el formulario, eligiendo categoría.
${lista(informe.gastosSinCategoria)}

### Gastos sin tipo de transacción (${informe.gastosTipoVacio.length})
${lista(informe.gastosTipoVacio)}

## ℹ Avisos (importados con ajustes)

### Traspasos que se anulan al fundir cuentas personales (${informe.traspasosNoOp.length})
Al mapear las cuentas personales a banco/caja, origen y destino coinciden y el
traspaso deja de mover saldo. No se importan porque el esquema lo prohíbe (y no
haría nada).
${lista(informe.traspasosNoOp)}

### Cuentas personales remapeadas
El modelo nuevo no tiene cuentas personales. Los movimientos históricos que las
usaban se han volcado así: Cuenta Luis/David → **banco**, Efectivo Luis/David → **caja**.
- Cobros afectados: ${informe.cuentasPersonales.ingresos}
- Gastos afectados: ${informe.cuentasPersonales.gastos}
- Traspasos afectados: ${informe.cuentasPersonales.traspasos}

**Consecuencia:** el saldo de \`banco\` y \`caja\` tras importar puede no cuadrar
con la realidad si quedó dinero sin aportar en cuentas personales. Comparad el
saldo real y, si hay diferencia, apuntadla con un traspaso o gasto de ajuste.

### Facturas cobradas parcialmente (${informe.cashDistintoTotal.length})
Aparecerán en morosos con el resto pendiente — eso es correcto, revisadlo.
${lista(informe.cashDistintoTotal)}

### Nóminas apuntadas como traspaso (${informe.nominasConvertidas.length})
En el Excel las nóminas de los socios estaban en el bloque de traspasos, pero es
dinero que SALE del negocio: se importan como gasto **Personal / Nóminas**,
imputadas a *ethos* (la nómina es el resultado del reparto, no un gasto del
entrenador).
${lista(informe.nominasConvertidas)}

### Cobros asumidos por el total de la factura (${informe.cobroDerivado.length})
La celda de "Cash collected" era una fórmula sin valor guardado, pero el estado
del Excel decía "cobrado" y había fecha de cobro. Se asume cobro completo.
${lista(informe.cobroDerivado)}

### Base imponible derivada (${informe.baseDerivada.length})
Filas sin base en el Excel; se calculó desde el total/cobrado quitando IVA.
${lista(informe.baseDerivada)}

### Deducible sin factura (${informe.deducibleSinFactura.length})
El esquema exige factura para deducir. Importados como NO deducibles.
${lista(informe.deducibleSinFactura)}

### Ingresos con categoría "Otros" (${informe.categoriaOtros.length})
No se pudo deducir el servicio; revisad y recategorizad desde la app.
${lista(informe.categoriaOtros)}

### Otros avisos (${informe.avisos.length})
${lista(informe.avisos)}

### Filas plantilla a cero omitidas: ${informe.filasCero}
Filas semanales agregadas sin importe (semanas sin ventas de ese tipo). No se importan.

## Datos que faltan en el Excel

- **Gastos de 2025**: hay ingresos desde abril de 2025 pero los gastos empiezan
  en enero de 2026. Si existen en otro fichero, se pueden importar aparte.
- **Facturas sin cobro registrado**: ${facturas.length - new Set(cobros.map((c) => c.facturaId)).size}
  facturas quedaron sin ningún cobro y aparecerán como pendientes en morosos.
`;

// BOM para que los editores de Windows detecten UTF-8 sin dudar
writeFileSync("supabase/import_historico.sql", "﻿" + sql, "utf8");
writeFileSync("supabase/informe_importacion.md", "﻿" + md, "utf8");

console.log(`Generado supabase/import_historico.sql`);
console.log(`  clientes=${clientes.size} facturas=${facturas.length} cobros=${cobros.length} gastos=${gastos.length} traspasos=${traspasos.length}`);
console.log(`Generado supabase/informe_importacion.md`);
console.log(`  No importadas: devoluciones=${informe.devoluciones.length}, traspasos sin pareja=${informe.traspasosNoEmparejados.length}, gastos sin categoría=${informe.gastosSinCategoria.length}, tipo vacío=${informe.gastosTipoVacio.length}`);
