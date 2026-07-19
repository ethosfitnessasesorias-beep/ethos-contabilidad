// Inspecciona el Excel de KPIs: hojas, cabeceras y muestras de filas
import ExcelJS from "exceljs";

const RUTA = process.argv[2];
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(RUTA);

for (const ws of wb.worksheets) {
  console.log(`\n=== HOJA: "${ws.name}" · ${ws.rowCount} filas × ${ws.columnCount} cols ===`);
  const maxR = Math.min(ws.rowCount, 14);
  for (let r = 1; r <= maxR; r++) {
    const fila = [];
    for (let c = 1; c <= Math.min(ws.columnCount, 20); c++) {
      let v = ws.getRow(r).getCell(c).value;
      if (v && typeof v === "object") {
        if (v instanceof Date) v = v.toISOString().slice(0, 10);
        else if (v.result !== undefined) v = `=${JSON.stringify(v.result)}`;
        else if (v.richText) v = v.richText.map((t) => t.text).join("");
        else if (v.text) v = v.text;
        else v = JSON.stringify(v).slice(0, 30);
      }
      fila.push(v === null || v === undefined ? "" : String(v).slice(0, 22));
    }
    // recorta colas vacías
    while (fila.length && fila[fila.length - 1] === "") fila.pop();
    if (fila.length) console.log(`${String(r).padStart(3)}| ${fila.join(" § ")}`);
  }
}
