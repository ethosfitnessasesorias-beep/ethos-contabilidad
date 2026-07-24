// Marca seg_bolsa=true en la app para los clientes con BOLSA=true en el Excel
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);
const ws = wb.getWorksheet("CRM Clientes");
const raw = (r, c) => {
  let v = ws.getRow(r).getCell(c).value;
  if (v && typeof v === "object") {
    if (v.result !== undefined) return v.result;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.text) return v.text;
    return null;
  }
  return v;
};
const txt = (r, c) => { const v = raw(r, c); return v == null ? "" : String(v).trim(); };
const boolv = (r, c) => { const v = raw(r, c); return v === true || /^(true|s[ií]|x)$/i.test(String(v ?? "")); };
const JUNK = /botella|agua|shaker|strap|bizum|devoluc|entrenos? grupal|grupal|merch|hsn|patrocin|acceso libre|recuento|media|rese[ñn]as|total|embajador|clientes activos|^bolsa$|prueba|^test$/i;
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const con = [];
for (let r = 2; r <= ws.rowCount; r++) {
  const nombre = txt(r, 1);
  if (!nombre || JUNK.test(nombre)) continue;
  if (!boolv(r, 16)) continue;
  con.push({ nombre, apellidos: txt(r, 2), email: txt(r, 3).toLowerCase() });
}

let sql = "BEGIN;\n";
for (const c of con) {
  const porEmail = c.email ? `lower(email) = ${q(c.email)}` : "false";
  const porNombre = `(lower(nombre) = ${q(c.nombre.toLowerCase())} AND coalesce(lower(apellidos),'') = ${q(c.apellidos.toLowerCase())})`;
  const porCompleto = `lower(nombre || ' ' || coalesce(apellidos,'')) = ${q(`${c.nombre} ${c.apellidos}`.trim().toLowerCase())}`;
  sql += `UPDATE clientes SET seg_bolsa = true WHERE ${porEmail} OR ${porNombre} OR ${porCompleto};\n`;
}
sql += "COMMIT;\nSELECT count(*) AS con_bolsa FROM clientes WHERE seg_bolsa;";
writeFileSync("supabase/marcar_bolsas.sql", sql, "utf8");
console.log(`Con BOLSA en el Excel: ${con.length}`);
console.log(con.map((c) => `${c.nombre} ${c.apellidos}`.trim()).join(" | "));
