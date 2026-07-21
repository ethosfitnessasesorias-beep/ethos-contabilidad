// Delta de la ultima semana desde "Contabilidad 2.0.xlsx" (hoja Libro diario - IG).
// Reglas: sin duplicados (nombre+fecha+importe contra el estado actual de la app),
// gastos con Deducible=No -> no deducible y sin factura, CLAUDE -> canal online.
// Genera un body JSON ASCII-safe para la Management API + copia legible en supabase/.
import ExcelJS from "exceljs";
import { readFileSync, writeFileSync } from "node:fs";

const RUTA_XLSX = process.argv[2];
const RUTA_ESTADO = process.argv[3];
let _raw = JSON.parse(readFileSync(RUTA_ESTADO, "utf8").replace(/^﻿/, ""));
if (Array.isArray(_raw)) _raw = _raw[0];
const estado = _raw.estado ?? _raw;

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(RUTA_XLSX);
const ws = wb.getWorksheet("Libro diario - IG");

const val = (r, c) => {
  let v = ws.getRow(r).getCell(c).value;
  if (v && typeof v === "object") {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (v.result !== undefined && v.result !== null) v = v.result;
    else if (v.richText) v = v.richText.map((t) => t.text).join("");
    else if (v.text !== undefined) v = v.text;
    else return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") return Math.round(v * 100) / 100;
  return v === null || v === undefined ? "" : String(v).trim();
};
const num = (x) => (typeof x === "number" ? x : Number(String(x).replace(",", ".")) || 0);
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const parecidos = (a, b) => { a = norm(a); b = norm(b); return a !== "" && b !== "" && (a.includes(b) || b.includes(a)); };
const dias = (a, b) => Math.abs((new Date(a) - new Date(b)) / 86400000);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

// --- dedup contra la app ---
const dupFactura = (fecha, total, nombre) =>
  estado.facturas.some((f) => Math.abs(num(f.total) - total) < 0.011 && dias(f.fecha, fecha) <= 3 &&
    (dias(f.fecha, fecha) === 0 || parecidos(nombre, f.cliente ?? "") || parecidos(nombre, f.concepto)));
const dupGasto = (fecha, total, nombre) =>
  estado.gastos.some((g) => Math.abs(num(g.total) - total) < 0.011 && dias(g.fecha, fecha) <= 3 &&
    (dias(g.fecha, fecha) === 0 || parecidos(nombre, g.concepto) || parecidos(nombre, g.proveedor ?? "")));
const dupTraspaso = (fecha, importe) =>
  estado.traspasos.some((t) => Math.abs(num(t.importe) - importe) < 0.011 && dias(t.fecha, fecha) <= 3);

// --- mapeos ---
const cuentaDe = (s) => {
  const t = norm(s);
  if (t.includes("stripe")) return "stripe";
  if (t.includes("tpv")) return "tpv";
  if (t.includes("efectivo") || t.includes("suelto")) return "caja";
  return "banco";
};
const CUENTA_ID = Object.fromEntries(estado.cuentas.map((c) => [c.codigo, c.id]));
const METODO = { banco: "transferencia", caja: "efectivo", stripe: "stripe", tpv: "tpv" };
const atribDe = (s) => {
  const t = norm(s);
  if (t.includes("luis")) return "luis";
  if (t.includes("david")) return "david";
  if (t.includes("esteban")) return "alex_esteban";
  if (t.includes("guerrero")) return "alex_guerrero";
  return "ethos";
};
const catsIng = estado.categorias.filter((c) => c.tipo === "ingreso");
const catsGas = estado.categorias.filter((c) => c.tipo === "gasto");
const catPorNombre = (lista, nombre) =>
  lista.find((c) => norm(c.nombre) === norm(nombre)) ?? lista.find((c) => parecidos(c.nombre, nombre));
const catIngresoDe = (texto) => {
  const t = norm(texto);
  let n = "Otros";
  if (/nutri/.test(t)) n = "Nutricion";
  else if (/grupal|cuota|lulu|juanito/.test(t)) n = "Clases grupales";
  else if (/online/.test(t)) n = "Entreno online";
  else if (/\bep\b|entreno|personal/.test(t)) n = "Entreno presencial";
  else if (/acceso/.test(t)) n = "Acceso libre";
  else if (/merch|ropa|botella|agua/.test(t)) n = "Merchandising";
  return catPorNombre(catsIng, n) ?? catPorNombre(catsIng, "Otros") ?? catsIng[0];
};
const catGastoDe = (cat, sub) => {
  const limpio = String(sub).replace(/^(onl|gym)\s*-\s*/i, "").trim();
  let c = catPorNombre(catsGas, limpio);
  if (!c && /invers|capital|reforma/i.test(String(cat) + String(sub)))
    c = catPorNombre(catsGas, "Reformas") ?? catPorNombre(catsGas, "Maquinaria");
  return c ?? catPorNombre(catsGas, "Otros") ?? catsGas[0];
};
const clienteDe = (nombre) => {
  const t = norm(nombre);
  if (!t) return null;
  return (
    estado.clientes.find((c) => norm(`${c.nombre} ${c.apellidos ?? ""}`) === t) ??
    estado.clientes.find((c) => norm(c.nombre) === t) ??
    estado.clientes.find((c) => t.length > 4 && norm(`${c.nombre} ${c.apellidos ?? ""}`).includes(t)) ??
    null
  );
};

const sqls = [];
const resumen = { ingresos: [], gastos: [], traspasos: [], saltados: [], avisos: [] };

// ================= INGRESOS (julio) =================
for (let r = 4; r <= 1001; r++) {
  const fecha = String(val(r, 7));
  if (!fecha.startsWith("2026-07")) continue;
  const tipo = String(val(r, 14));
  const cliente = String(val(r, 12));
  const concepto = String(val(r, 13));
  if (/traspaso/i.test(tipo)) continue; // se tratan aparte
  const base = num(val(r, 19)) || num(val(r, 29));
  const total = num(val(r, 29)) || base;
  if (total <= 0) { resumen.avisos.push(`ING fila ${r}: sin importe (${cliente} ${concepto})`); continue; }
  const nombreRef = cliente || concepto;
  if (dupFactura(fecha, total, nombreRef)) { resumen.saltados.push(`ING ${fecha} ${nombreRef} ${total}`); continue; }
  const iva = String(val(r, 20)) === "Si" ? num(val(r, 21)) || 0.21 : 0;
  const irpf = String(val(r, 23)) === "Si" ? num(val(r, 24)) || 0.07 : 0;
  const cli = clienteDe(cliente);
  const cat = catIngresoDe(`${cliente} ${concepto}`);
  const canal = cat.es_online ? "online" : "presencial";
  const atrib = atribDe(val(r, 16));
  const recurrente = /grupal|cuota|lulu|juanito|mensualidad/i.test(`${cliente} ${concepto}`);
  const conceptoF = (cli ? concepto || "Ingreso" : `${cliente} ${concepto}`.trim()) || "Ingreso";
  const pagado = /pagado/i.test(String(val(r, 11)));
  const fCobro = String(val(r, 32)).startsWith("2026") ? String(val(r, 32)) : fecha;
  const impCobro = num(val(r, 36)) || Math.round((base * (1 + iva) - base * irpf) * 100) / 100;
  const cta = cuentaDe(val(r, 17));
  let sql = `WITH f AS (INSERT INTO facturas (cliente_id, categoria_id, atribucion, fecha_emision, concepto, base, iva_pct, irpf_pct, canal, es_recurrente) VALUES (${cli ? cli.id : "NULL"}, ${cat.id}, ${q(atrib)}, ${q(fecha)}, ${q(conceptoF)}, ${base}, ${iva}, ${irpf}, ${q(canal)}, ${recurrente}) RETURNING id)`;
  sql += pagado
    ? ` INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo) SELECT id, ${q(fCobro)}, ${impCobro}, ${CUENTA_ID[cta]}, ${q(METODO[cta])} FROM f;`
    : ` SELECT id FROM f;`;
  sqls.push(sql);
  resumen.ingresos.push(`${fecha} ${nombreRef} ${total}${pagado ? ` -> ${cta}` : " (pendiente)"}`);
}

// ================= GASTOS (julio) =================
for (let r = 4; r <= 1001; r++) {
  const fecha = String(val(r, 40));
  if (!fecha.startsWith("2026-07")) continue;
  const tipo = String(val(r, 47));
  const concepto = String(val(r, 45));
  const proveedor = String(val(r, 46));
  if (/traspaso/i.test(tipo)) continue;
  const total = num(val(r, 53));
  if (total <= 0) { resumen.avisos.push(`GAS fila ${r}: sin importe (${concepto})`); continue; }
  if (dupGasto(fecha, total, `${concepto} ${proveedor}`)) { resumen.saltados.push(`GAS ${fecha} ${concepto} ${total}`); continue; }
  const esClaude = /claude/i.test(concepto + proveedor);
  const deducible = String(val(r, 54)) === "Si";
  const iva = deducible ? num(val(r, 56)) || 0.21 : 0;
  const base = deducible ? Math.round((total / (1 + iva)) * 100) / 100 : total;
  const ivaSop = deducible ? Math.round((total - base) * 100) / 100 : 0;
  const catTxt = String(val(r, 49));
  const cat = catGastoDe(catTxt, val(r, 50));
  const canal = esClaude ? "online" : /^onl/i.test(catTxt) ? "online" : "presencial";
  const cta = cuentaDe(val(r, 51));
  const esFijo = /alquiler|software|suministr|seguro|gestor|cuota autonomo/i.test(String(val(r, 50)) + concepto);
  sqls.push(
    `INSERT INTO gastos (fecha, concepto, proveedor, categoria_id, cuenta_id, imputado_a, base, iva_pct, iva_soportado, deducible, tiene_factura, canal, es_fijo) VALUES (${q(fecha)}, ${q(concepto)}, ${proveedor ? q(proveedor) : "NULL"}, ${cat.id}, ${CUENTA_ID[cta]}, ${q(atribDe(val(r, 48)))}, ${base}, ${iva}, ${ivaSop}, ${deducible}, ${deducible}, ${q(canal)}, ${esFijo});`
  );
  resumen.gastos.push(`${fecha} ${concepto} ${total} ${deducible ? "(deducible)" : "(NO deducible)"} ${canal}`);
}

// ================= TRASPASOS (julio) =================
for (let r = 4; r <= 1001; r++) {
  const fecha = String(val(r, 40));
  if (!fecha.startsWith("2026-07")) continue;
  if (!/traspaso/i.test(String(val(r, 47)))) continue;
  const concepto = String(val(r, 45));
  const importe = num(val(r, 53));
  if (importe <= 0) { resumen.avisos.push(`TRASP "${concepto}" sin importe: fuera`); continue; }
  const origen = cuentaDe(val(r, 51));
  // destino: fila de ingresos tipo traspaso con la misma fecha
  let destino = null;
  for (let r2 = 4; r2 <= 1001; r2++) {
    if (String(val(r2, 7)) === fecha && /traspaso/i.test(String(val(r2, 14)))) { destino = cuentaDe(val(r2, 17)); break; }
  }
  if (/devoluci/i.test(concepto)) {
    const nombre = concepto.replace(/devoluci\w*/i, "").trim();
    const fac = estado.facturas
      .filter((f) => parecidos(nombre, f.cliente ?? ""))
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
    if (fac) {
      sqls.push(`INSERT INTO cobros (factura_id, fecha, importe, cuenta_id, metodo) VALUES (${fac.id}, ${q(fecha)}, ${-importe}, ${CUENTA_ID.banco}, 'transferencia');`);
      resumen.traspasos.push(`${fecha} devolucion ${nombre} -${importe} (cobro negativo sobre su factura)`);
    } else {
      sqls.push(`INSERT INTO gastos (fecha, concepto, categoria_id, cuenta_id, imputado_a, base, iva_pct, iva_soportado, deducible, tiene_factura, canal, es_fijo) VALUES (${q(fecha)}, ${q(concepto)}, ${(catPorNombre(catsGas, "Otros") ?? catsGas[0]).id}, ${CUENTA_ID.banco}, 'ethos', ${importe}, 0, 0, false, false, 'presencial', false);`);
      resumen.traspasos.push(`${fecha} ${concepto} ${importe} (como salida no deducible; cliente no encontrado)`);
    }
    continue;
  }
  if (!destino || destino === origen) { resumen.avisos.push(`TRASP "${concepto}" ${importe}: destino no claro, fuera`); continue; }
  if (dupTraspaso(fecha, importe)) { resumen.saltados.push(`TRASP ${fecha} ${concepto} ${importe}`); continue; }
  sqls.push(`INSERT INTO traspasos (fecha, cuenta_origen_id, cuenta_destino_id, importe, motivo) VALUES (${q(fecha)}, ${CUENTA_ID[origen]}, ${CUENTA_ID[destino]}, ${importe}, ${q(concepto)});`);
  resumen.traspasos.push(`${fecha} ${concepto} ${importe} ${origen} -> ${destino}`);
}

// CLAUDE ya existente en la app -> canal online
sqls.push(`UPDATE gastos SET canal = 'online' WHERE concepto ILIKE '%claude%';`);

const sqlFinal = "BEGIN;\n" + sqls.join("\n") + "\nCOMMIT;";
writeFileSync("supabase/import_julio_delta.sql", sqlFinal, "utf8");
const body = JSON.stringify({ query: sqlFinal }).replace(/[-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
writeFileSync(process.argv[4], body, "ascii");

console.log(`NUEVOS INGRESOS (${resumen.ingresos.length}):`);
resumen.ingresos.forEach((x) => console.log("  +", x));
console.log(`\nNUEVOS GASTOS (${resumen.gastos.length}):`);
resumen.gastos.forEach((x) => console.log("  +", x));
console.log(`\nTRASPASOS/DEVOLUCIONES (${resumen.traspasos.length}):`);
resumen.traspasos.forEach((x) => console.log("  +", x));
console.log(`\nYA ESTABAN (saltados, ${resumen.saltados.length}):`);
resumen.saltados.forEach((x) => console.log("  =", x));
console.log(`\nAVISOS (${resumen.avisos.length}):`);
resumen.avisos.forEach((x) => console.log("  !", x));
