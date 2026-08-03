import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);
const ws = wb.getWorksheet("Gestión de clientes") ?? wb.worksheets.find((w) => /gesti/i.test(w.name));
if (!ws) { console.log("HOJAS:", wb.worksheets.map((w) => w.name).join(", ")); process.exit(1); }
console.log(`Hoja "${ws.name}": ${ws.rowCount} filas x ${ws.columnCount} cols\n`);
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
const col = (n) => { let s = ""; while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); } return s; };
// cabeceras: primeras 3 filas completas
for (let r = 1; r <= 3; r++) {
  const fila = [];
  for (let c = 1; c <= Math.min(ws.columnCount, 40); c++) { const v = val(r, c); if (v !== "") fila.push(`[${col(c)}]${v}`); }
  if (fila.length) console.log(`F${r}: ${fila.join(" | ")}`);
}
console.log("\n-- Filas 4-20 (muestra) --");
for (let r = 4; r <= 20; r++) {
  const fila = [];
  for (let c = 1; c <= Math.min(ws.columnCount, 40); c++) { const v = val(r, c); if (v !== "") fila.push(`${col(c)}:${v}`); }
  if (fila.length) console.log(`${r}| ${fila.join(" | ")}`);
}
console.log("\n-- Ultimas filas con datos --");
let vistas = 0;
for (let r = ws.rowCount; r >= 21 && vistas < 8; r--) {
  const fila = [];
  for (let c = 1; c <= Math.min(ws.columnCount, 40); c++) { const v = val(r, c); if (v !== "") fila.push(`${col(c)}:${v}`); }
  if (fila.length) { console.log(`${r}| ${fila.join(" | ")}`); vistas++; }
}
