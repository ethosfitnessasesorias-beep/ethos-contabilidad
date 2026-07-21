// Convierte un fichero SQL en un body JSON ASCII-safe para la Management API
import { readFileSync, writeFileSync } from "node:fs";
const sql = readFileSync(process.argv[2], "utf8");
const body = JSON.stringify({ query: sql }).replace(/[-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
writeFileSync(process.argv[3], body, "ascii");
console.log("body listo:", body.length, "bytes");
