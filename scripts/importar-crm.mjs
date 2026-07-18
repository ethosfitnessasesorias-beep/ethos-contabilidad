// Importa la hoja "CRM Clientes" del Excel a la tabla clientes (upsert por
// email/nombre). Filtra filas que no son clientes y agregados.
// Uso: node scripts/importar-crm.mjs "C:/ruta/CRM 2.0, referidos y clientes.xlsx"
// Genera supabase/import_crm.sql (pegar en el SQL Editor).
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";

const RUTA = process.argv[2];
if (!RUTA) { console.error("Falta la ruta del Excel"); process.exit(1); }
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(RUTA);
const ws = wb.getWorksheet("CRM Clientes");

const raw = (r, c) => {
  let v = ws.getRow(r).getCell(c).value;
  if (v && typeof v === "object") {
    if (v instanceof Date) return v;
    if (v.result !== undefined) return v.result;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.text) return v.text;
    return null;
  }
  return v;
};
const txt = (r, c) => { const v = raw(r, c); return v == null ? "" : String(v).trim(); };
const fecha = (r, c) => { const v = raw(r, c); return v instanceof Date ? v.toISOString().slice(0, 10) : null; };
const boolv = (r, c) => { const v = raw(r, c); return v === true || /^(true|s[ií]|x)$/i.test(String(v ?? "")); };

// nombres que NO son clientes
const JUNK = /botella|agua|shaker|strap|bizum|devoluc|entrenos? grupal|grupal|merch|hsn|patrocin|acceso libre|recuento|media|rese[ñn]as|total|embajador|clientes activos|^bolsa$|prueba|^test$/i;
const PREP = (s) => {
  const t = s.toLowerCase();
  if (t.includes("david")) return "david";
  if (t.includes("luis")) return "luis";
  if (t.includes("esteban")) return "alex_esteban";
  if (t.includes("guerrero")) return "alex_guerrero";
  return "ethos";
};
const canalDe = (plan) => {
  const t = plan.toLowerCase();
  if (/online|remoto|a distancia/.test(t)) return "online";
  if (/gym|gimnasio|presencial|centro/.test(t)) return "presencial";
  return null; // se ajusta en la app
};
const q = (s) => (s == null || s === "" ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);
const qd = (d) => (d ? `'${d}'` : "NULL");
const b = (v) => (v ? "true" : "false");

const clientes = [];
let saltados = 0;
for (let r = 2; r <= ws.rowCount; r++) {
  const nombre = txt(r, 1);
  if (!nombre || JUNK.test(nombre)) { if (nombre) saltados++; continue; }
  const email = txt(r, 3).toLowerCase();
  const tel = txt(r, 5).replace(/\s+/g, " ");
  const inicio = fecha(r, 6);
  // Debe parecer un cliente: algún dato de contacto o fecha
  if (!email && !tel && !inicio) { saltados++; continue; }
  const plan = txt(r, 7);
  const estadoAct = txt(r, 9).toLowerCase();
  const fin = fecha(r, 19);
  clientes.push({
    nombre,
    apellidos: txt(r, 2) || null,
    email: email || null,
    dni: txt(r, 4) || null,
    tel: tel || null,
    inicio,
    plan: plan || null,
    prep: PREP(txt(r, 8)),
    canal: canalDe(plan),
    reg: fecha(r, 10),
    prim: fecha(r, 17),
    compra: fecha(r, 18),
    baja: estadoAct.includes("baja") ? (fin ?? inicio ?? fecha(r, 10)) : null,
    s1: boolv(r, 11), s2: boolv(r, 12), s3: boolv(r, 13), s4: boolv(r, 14), s5: boolv(r, 15),
  });
}

let sql = `-- Importación CRM Clientes desde el Excel. Upsert por email/nombre.\nBEGIN;\n`;
for (const c of clientes) {
  const cols = `nombre, apellidos, email, nif, telefono, entrenador, estado, canal, tipo_plan, fecha_inicio, fecha_registro, primer_contacto, fecha_compra, fecha_baja, seg_cambio_fisico, seg_satisfaccion, seg_marcha, seg_google_maps, seg_trustpilot`;
  const vals = `${q(c.nombre)}, ${q(c.apellidos)}, ${q(c.email)}, ${q(c.dni)}, ${q(c.tel)}, ${q(c.prep)}, 'cliente', ${q(c.canal)}, ${q(c.plan)}, ${qd(c.inicio)}, ${qd(c.reg)}, ${qd(c.prim)}, ${qd(c.compra)}, ${qd(c.baja)}, ${b(c.s1)}, ${b(c.s2)}, ${b(c.s3)}, ${b(c.s4)}, ${b(c.s5)}`;
  const matchEmail = c.email ? `lower(email) = ${q(c.email)}` : `false`;
  const matchNombre = `lower(nombre) = ${q(c.nombre.toLowerCase())} AND coalesce(lower(apellidos),'') = ${q((c.apellidos ?? "").toLowerCase())}`;
  sql += `WITH m AS (
  UPDATE clientes SET
    apellidos = COALESCE(apellidos, ${q(c.apellidos)}), email = COALESCE(email, ${q(c.email)}),
    nif = COALESCE(nif, ${q(c.dni)}), telefono = COALESCE(telefono, ${q(c.tel)}),
    entrenador = CASE WHEN entrenador IS NULL OR entrenador = 'ethos' THEN ${q(c.prep)} ELSE entrenador END,
    canal = COALESCE(canal, ${q(c.canal)}), tipo_plan = COALESCE(tipo_plan, ${q(c.plan)}),
    fecha_inicio = COALESCE(fecha_inicio, ${qd(c.inicio)}), fecha_registro = COALESCE(fecha_registro, ${qd(c.reg)}),
    primer_contacto = COALESCE(primer_contacto, ${qd(c.prim)}), fecha_compra = COALESCE(fecha_compra, ${qd(c.compra)}),
    fecha_baja = COALESCE(fecha_baja, ${qd(c.baja)}),
    seg_cambio_fisico = seg_cambio_fisico OR ${b(c.s1)}, seg_satisfaccion = seg_satisfaccion OR ${b(c.s2)},
    seg_marcha = seg_marcha OR ${b(c.s3)}, seg_google_maps = seg_google_maps OR ${b(c.s4)}, seg_trustpilot = seg_trustpilot OR ${b(c.s5)}
  WHERE ${matchEmail} OR (${matchNombre}) RETURNING id )
INSERT INTO clientes (${cols})
SELECT ${vals} WHERE NOT EXISTS (SELECT 1 FROM m);\n`;
}
sql += `COMMIT;\nSELECT count(*) AS clientes_crm FROM clientes WHERE fecha_inicio IS NOT NULL OR tipo_plan IS NOT NULL;\n`;

writeFileSync("supabase/import_crm.sql", "﻿" + sql, "utf8");
console.log(`Clientes a importar: ${clientes.length} · filas saltadas (no clientes): ${saltados}`);
console.log("Ejemplos:", clientes.slice(0, 5).map((c) => `${c.nombre} ${c.apellidos ?? ""}`.trim()).join(" | "));
console.log("Generado supabase/import_crm.sql");
