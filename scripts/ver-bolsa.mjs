import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);
console.log("HOJAS:", wb.worksheets.map((w) => `"${w.name}"`).join(", "));
const ws = wb.getWorksheet("CRM Clientes");
const val = (r, c) => {
  let v = ws.getRow(r).getCell(c).value;
  if (v && typeof v === "object") {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (v.result !== undefined && v.result !== null) v = v.result;
    else if (v.richText) v = v.richText.map((t) => t.text).join("");
    else if (v.text !== undefined) v = v.text;
    else return "";
  }
  return v === null || v === undefined ? "" : String(v).trim();
};
console.log("\nCabeceras (fila 1):");
for (let c = 1; c <= Math.min(ws.columnCount, 30); c++) {
  const h = val(1, c);
  if (h) console.log(`  col ${c}: ${h}`);
}
// muestra 3 filas de ejemplo con todas las columnas con contenido
console.log("\nEjemplo filas 2-4:");
for (let r = 2; r <= 4; r++) {
  const fila = [];
  for (let c = 1; c <= Math.min(ws.columnCount, 30); c++) { const v = val(r, c); if (v !== "") fila.push(`${c}:${v}`); }
  console.log(`  ${fila.join(" | ")}`);
}
