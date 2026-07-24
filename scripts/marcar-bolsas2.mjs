// Segunda pasada con matching mas laxo (trim + nombre completo en una sola columna)
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);
const ws = wb.getWorksheet("CRM Clientes");
const raw = (r, c) => { let v = ws.getRow(r).getCell(c).value; if (v && typeof v === "object") { if (v.result !== undefined) return v.result; if (v.richText) return v.richText.map((t) => t.text).join(""); if (v.text) return v.text; return null; } return v; };
const txt = (r, c) => { const v = raw(r, c); return v == null ? "" : String(v).trim(); };
const boolv = (r, c) => { const v = raw(r, c); return v === true || /^(true|s[ií]|x)$/i.test(String(v ?? "")); };
const JUNK = /botella|agua|shaker|strap|bizum|devoluc|entrenos? grupal|grupal|merch|hsn|patrocin|acceso libre|recuento|media|rese[ñn]as|total|embajador|clientes activos|^bolsa$|prueba|^test$/i;
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

let sql = "BEGIN;\n";
const nombres = [];
for (let r = 2; r <= ws.rowCount; r++) {
  const nombre = txt(r, 1);
  if (!nombre || JUNK.test(nombre) || !boolv(r, 16)) continue;
  const completo = `${nombre} ${txt(r, 2)}`.trim().toLowerCase();
  const email = txt(r, 3).toLowerCase();
  nombres.push(completo);
  const conds = [
    email ? `lower(email) = ${q(email)}` : "false",
    `lower(trim(nombre || ' ' || coalesce(apellidos, ''))) = ${q(completo)}`,
    `lower(trim(nombre)) = ${q(completo)}`,
  ];
  sql += `UPDATE clientes SET seg_bolsa = true WHERE ${conds.join(" OR ")};\n`;
}
sql += "COMMIT;\nSELECT count(*) AS con_bolsa FROM clientes WHERE seg_bolsa;";
writeFileSync("supabase/marcar_bolsas.sql", sql, "utf8");
writeFileSync(process.argv[3], JSON.stringify(nombres), "utf8");
console.log("filas con bolsa:", nombres.length);
