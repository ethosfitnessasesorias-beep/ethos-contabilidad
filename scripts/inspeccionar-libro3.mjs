import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);
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

console.log("-- Esquina A1:F16 completa --");
for (let r = 1; r <= 16; r++) {
  const fila = [];
  for (let c = 1; c <= 6; c++) { const v = val(r, c); if (v !== "") fila.push(`${"ABCDEF"[c-1]}${r}=${v}`); }
  if (fila.length) console.log(fila.join("  "));
}

// GASTOS: fecha de pago en AN = col 40
const AN = 40;
let finG = 0;
for (let r = 4; r <= 1001; r++) if (val(r, AN) !== "") finG = r;
console.log(`\n-- GASTOS (AN..BI): ultima fila = ${finG} --`);
console.log("fecha | estado | concepto | proveedor | tipo | pagador | categoria | subcat | cuenta | metodo | importe | deducible | IVA% | factura");
for (let r = Math.max(4, finG - 17); r <= finG; r++) {
  console.log(`${r}| ${[40,44,45,46,47,48,49,50,51,52,53,54,56,59].map((c) => val(r, c)).join(" | ")}`);
}

// INGRESOS julio: todas las filas de julio para contarlas
let nJul = 0, sumJul = 0;
for (let r = 4; r <= 1001; r++) {
  const f = String(val(r, 7));
  if (f.startsWith("2026-07")) { nJul++; const imp = Number(val(r, 29)) || Number(val(r, 19)) || 0; sumJul += imp; }
}
console.log(`\nINGRESOS con fecha julio: ${nJul} filas · total facturado ~${Math.round(sumJul * 100) / 100}`);
let nJulG = 0, sumJulG = 0;
for (let r = 4; r <= 1001; r++) {
  const f = String(val(r, AN));
  if (f.startsWith("2026-07")) { nJulG++; sumJulG += Number(val(r, 53)) || 0; }
}
console.log(`GASTOS con fecha julio: ${nJulG} filas · total ~${Math.round(sumJulG * 100) / 100}`);
