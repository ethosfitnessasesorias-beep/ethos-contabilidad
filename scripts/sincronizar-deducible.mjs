// =====================================================================
// Resincroniza el flag "deducible" de los gastos desde el Excel.
// En el Excel la columna que decide deducir IVA/IRPF es "Deducible"
// (col 54 = "Si"/"No"), NO la casilla "Factura" (col 59). El importador
// las mezcló y dejó casi todo como no deducible.
//
// Uso:  node scripts/sincronizar-deducible.mjs "C:/ruta/Contabilidad 2.0.xlsx"
// Genera supabase/sync_deducible.sql (pegar en el SQL Editor).
// =====================================================================

import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";

const RUTA = process.argv[2];
if (!RUTA) {
  console.error('Uso: node scripts/sincronizar-deducible.mjs "ruta/al/excel.xlsx"');
  process.exit(1);
}
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(RUTA);
const ws = wb.getWorksheet("Libro diario - IG");
const raw = (r, c) => {
  let v = ws.getRow(r).getCell(c).value;
  if (v && typeof v === "object") {
    if (v instanceof Date) return v;
    if (v.result !== undefined) return v.result;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    return null;
  }
  return v;
};
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

let sql = `-- Resincroniza gastos.deducible desde el Excel (columna "Deducible").
-- Generado el ${new Date().toISOString().slice(0, 10)}. Ejecutar UNA vez.
BEGIN;
`;
let n = 0,
  ded = 0;
for (let r = 3; r <= ws.rowCount; r++) {
  const f = raw(r, 40);
  if (!(f instanceof Date)) continue;
  const tipo = raw(r, 47);
  if (tipo !== "Gasto") continue; // saltar traspasos/nóminas apuntadas como traspaso
  const concepto = String(raw(r, 45) ?? "").trim();
  const importe = raw(r, 53);
  if (importe == null || concepto === "") continue;
  const esDed = String(raw(r, 54) ?? "").trim() === "Si";
  if (esDed) ded++;
  n++;
  const fecha = f.toISOString().slice(0, 10);
  // El check chk_deducible_requiere_factura obliga: si es deducible, tiene_factura=true.
  sql += `UPDATE gastos SET tiene_factura = (tiene_factura OR ${esDed}), deducible = ${esDed}, iva_soportado = CASE WHEN ${esDed} THEN ROUND(base * iva_pct, 2) ELSE 0 END
WHERE fecha = ${q(fecha)} AND concepto = ${q(concepto)} AND ABS(total - ${importe}) < 0.02;\n`;
}
sql += `COMMIT;

-- Comprobación
SELECT deducible, COUNT(*) n, SUM(ROUND(base*iva_pct,2)) iva FROM gastos GROUP BY 1;
`;
writeFileSync("supabase/sync_deducible.sql", "﻿" + sql, "utf8");
console.log(`Gastos en Excel: ${n} · marcados deducible=Sí: ${ded}`);
console.log("Generado supabase/sync_deducible.sql");
