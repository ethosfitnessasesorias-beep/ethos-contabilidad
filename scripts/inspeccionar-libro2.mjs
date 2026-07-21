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
    else return ""; // formula sin resultado
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") return Math.round(v * 100) / 100;
  return v === null || v === undefined ? "" : String(v).trim();
};
const col = (n) => { let s = ""; while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); } return s; };

console.log("-- Esquina A1:F10 (saldos) --");
for (let r = 1; r <= 10; r++) {
  const fila = [];
  for (let c = 1; c <= 6; c++) { const v = val(r, c); if (v !== "") fila.push(`${col(c)}${r}=${v}`); }
  if (fila.length) console.log(fila.join("  "));
}

console.log("\n-- Cabeceras fila 2, columnas 30-77 --");
const cab = [];
for (let c = 30; c <= 77; c++) { const v = val(2, c); if (v !== "") cab.push(`[${col(c)}]${v}`); }
console.log(cab.join(" "));

// Ultima fila de ingresos (col G con fecha)
let finIng = 0;
for (let r = 4; r <= 1001; r++) if (val(r, 7) !== "") finIng = r;
console.log(`\n-- INGRESOS: ultima fila con fecha = ${finIng} --`);
for (let r = Math.max(4, finIng - 11); r <= finIng; r++) {
  console.log(`${r}| ${[7,11,12,13,14,17,18,19,29].map((c) => val(r, c)).join(" | ")}`);
}

// Bloque gastos: localizar columna de fecha en fila 2 mas alla de col 30
let cFechaG = 0;
for (let c = 30; c <= 77; c++) if (/emisi|fecha/i.test(String(val(2, c)))) { cFechaG = c; break; }
console.log(`\n-- GASTOS: columna fecha = ${cFechaG ? col(cFechaG) : "no encontrada"} --`);
if (cFechaG) {
  let finG = 0;
  for (let r = 4; r <= 1001; r++) if (val(r, cFechaG) !== "") finG = r;
  console.log(`ultima fila con fecha = ${finG}`);
  for (let r = Math.max(4, finG - 11); r <= finG; r++) {
    const fila = [];
    for (let c = cFechaG; c <= Math.min(cFechaG + 16, 77); c++) fila.push(val(r, c));
    console.log(`${r}| ${fila.join(" | ")}`);
  }
}
