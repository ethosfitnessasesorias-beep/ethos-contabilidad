// Inspecciona la hoja "Libro diario - I/G": estructura, saldos y ultimas filas
import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);
console.log("HOJAS:", wb.worksheets.map((w) => `"${w.name}"`).join(", "));

const ws = wb.getWorksheet("Libro diario - I/G") ?? wb.worksheets.find((w) => /libro/i.test(w.name));
if (!ws) { console.log("NO ENCUENTRO la hoja"); process.exit(1); }
console.log(`\nUsando hoja: "${ws.name}" (${ws.rowCount} filas x ${ws.columnCount} cols)\n`);

const val = (r, c) => {
  let v = ws.getRow(r).getCell(c).value;
  if (v && typeof v === "object") {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (v.result !== undefined) v = v.result;
    else if (v.richText) v = v.richText.map((t) => t.text).join("");
    else if (v.text !== undefined) v = v.text;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") return Math.round(v * 100) / 100;
  return v === null || v === undefined ? "" : String(v).trim();
};

// Cabeceras (primeras 3 filas)
for (let r = 1; r <= 3; r++) {
  const fila = [];
  for (let c = 1; c <= Math.min(ws.columnCount, 30); c++) fila.push(val(r, c));
  while (fila.length && fila[fila.length - 1] === "") fila.pop();
  if (fila.length) console.log(`CAB ${r}| ${fila.map((x, i) => `[${String.fromCharCode(65 + i)}]${x}`).join(" ")}`);
}

// Celdas que mencionen saldo/total (primeras 6 filas y ultimas 10)
console.log("\n-- Celdas con 'saldo/total/caja/banco' --");
for (let r = 1; r <= ws.rowCount; r++) {
  for (let c = 1; c <= Math.min(ws.columnCount, 30); c++) {
    const v = val(r, c);
    if (typeof v === "string" && /saldo|caja|banco|efectivo|total/i.test(v) && v.length < 40) {
      const vecinos = [val(r, c + 1), val(r, c + 2), val(r + 1, c)].filter((x) => x !== "");
      console.log(`${ws.getRow(r).getCell(c).address}: "${v}" -> ${JSON.stringify(vecinos)}`);
    }
  }
  if (r > 8 && r < ws.rowCount - 40) r = ws.rowCount - 40; // salta el medio
}

// Ultimas 25 filas con datos (columnas A..N)
console.log("\n-- Ultimas filas con contenido --");
let mostradas = 0;
for (let r = ws.rowCount; r >= 4 && mostradas < 25; r--) {
  const fila = [];
  for (let c = 1; c <= Math.min(ws.columnCount, 16); c++) fila.push(val(r, c));
  if (fila.every((x) => x === "")) continue;
  while (fila.length && fila[fila.length - 1] === "") fila.pop();
  console.log(`${String(r).padStart(4)}| ${fila.join(" | ")}`);
  mostradas++;
}
