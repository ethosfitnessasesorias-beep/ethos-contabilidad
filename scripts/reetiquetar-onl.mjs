// =====================================================================
// Recupera la marca "ONL" (negocio online) de los gastos históricos.
//
// El importador original colapsó las subcategorías "ONL - Marketing" y
// "ONL - Software" en sus equivalentes presenciales y no fijó gastos.canal,
// así que el detalle online del Excel se perdió. Este script lo recupera.
//
// Uso:  node scripts/reetiquetar-onl.mjs "C:/ruta/al/Contabilidad 2.0.xlsx"
//
// No toca la base de datos. Genera:
//   supabase/reetiquetar_onl.sql  -> pegar en el SQL Editor de Supabase
// y muestra por consola el resumen de coincidencias.
// =====================================================================

import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";

const RUTA_EXCEL = process.argv[2];
if (!RUTA_EXCEL) {
  console.error('Uso: node scripts/reetiquetar-onl.mjs "ruta/al/excel.xlsx"');
  process.exit(1);
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(RUTA_EXCEL);
const ws = wb.getWorksheet("Libro diario - IG");
if (!ws) {
  console.error("No encuentro la hoja 'Libro diario - IG'.");
  process.exit(1);
}

function leer(hoja, r, c) {
  let v = hoja.getRow(r).getCell(c).value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object") {
    if (v instanceof Date) return v;
    if (v.result !== undefined) return v.result;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    return null;
  }
  return v;
}
const texto = (r, c) => {
  const v = leer(ws, r, c);
  return v === null ? null : String(v).trim() || null;
};
const numero = (r, c) => {
  const v = leer(ws, r, c);
  return typeof v === "number" ? v : null;
};
const fechaISO = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : null);
const r2 = (n) => Math.round(n * 100) / 100;

// --- Bloque GASTOS (mismas columnas que scripts/importar-excel.mjs) ---
const onl = [];
for (let r = 3; r <= ws.rowCount; r++) {
  const fGas = leer(ws, r, 40);
  if (!(fGas instanceof Date)) continue;
  const tipo = texto(r, 47);
  if (tipo !== "Gasto") continue;
  const subcategoria = texto(r, 50) ?? "";
  const categoria = texto(r, 49) ?? "";
  // La marca online del Excel: subcategoría o categoría con prefijo "ONL"
  if (!/^ONL\b/i.test(subcategoria) && !/^ONL\b/i.test(categoria)) continue;
  onl.push({
    fila: r,
    fecha: fechaISO(fGas),
    concepto: texto(r, 45) ?? "(sin concepto)",
    subcategoria,
    importeConIva: numero(r, 53),
    ivaPct: texto(r, 55) === "Si" ? (numero(r, 56) ?? 0.21) : 0,
  });
}

if (onl.length === 0) {
  console.log("No hay gastos con marca ONL en el Excel. Nada que hacer.");
  process.exit(0);
}

// --- SQL: un UPDATE por gasto, casando por fecha + concepto + importe ---
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

let sql = `-- =====================================================================
-- REETIQUETADO ONL: gastos del negocio online (canal = 'online')
-- Generado por scripts/reetiquetar-onl.mjs el ${new Date().toISOString().slice(0, 10)}
-- Ejecutar UNA VEZ en: Supabase Dashboard > SQL Editor
-- Cada UPDATE casa por fecha + concepto + importe con IVA (tolerancia 1 cent).
-- =====================================================================

BEGIN;

`;

for (const g of onl) {
  const base = g.importeConIva !== null ? r2(g.importeConIva / (1 + g.ivaPct)) : null;
  sql += `-- Fila ${g.fila}: ${g.fecha} "${g.concepto}" (${g.subcategoria}) ${g.importeConIva ?? "?"} €\n`;
  if (g.importeConIva === null) {
    sql += `-- SIN IMPORTE en el Excel: revisar a mano.\n\n`;
    continue;
  }
  sql += `UPDATE gastos SET canal = 'online'
WHERE fecha = ${q(g.fecha)}
  AND concepto = ${q(g.concepto)}
  AND (ABS(total - ${g.importeConIva}) < 0.01 OR ABS(base - ${base}) < 0.01);\n\n`;
}

sql += `COMMIT;

-- Comprobación: gastos marcados online por mes
SELECT DATE_TRUNC('month', fecha)::DATE AS mes, COUNT(*) AS n, SUM(total) AS total
FROM gastos WHERE canal = 'online' GROUP BY 1 ORDER BY 1;
`;

writeFileSync("supabase/reetiquetar_onl.sql", "﻿" + sql, "utf8");

console.log(`Encontrados ${onl.length} gastos ONL en el Excel:`);
for (const g of onl) {
  console.log(`  fila ${g.fila} · ${g.fecha} · ${g.concepto} · ${g.importeConIva ?? "?"} € (${g.subcategoria})`);
}
console.log(`\nGenerado supabase/reetiquetar_onl.sql — revisa y ejecútalo en el SQL Editor.`);
