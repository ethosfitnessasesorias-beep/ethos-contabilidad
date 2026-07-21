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
console.log("fila | fecha | cliente | concepto | cuenta | base | total");
for (let r = 236; r <= 272; r++) {
  const f = [val(r,7), val(r,12), val(r,13), val(r,17), val(r,19), val(r,29)];
  if (f.every((x) => x === "")) continue;
  console.log(`${r}| ${f.join(" | ")}`);
}
console.log("\nGastos comisiones (455-462):");
for (let r = 455; r <= 462; r++) {
  console.log(`${r}| ${[val(r,40), val(r,45), val(r,46), val(r,53), val(r,54)].join(" | ")}`);
}
