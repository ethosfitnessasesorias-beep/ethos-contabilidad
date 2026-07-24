import { readFileSync } from "node:fs";
const d = process.argv[2];
const excel = JSON.parse(readFileSync(`${d}/bolsa_nombres.json`, "utf8"));
const app = JSON.parse(readFileSync(`${d}/bolsa_app.json`, "utf8").replace(/^﻿/, "")).map((x) => x.n);
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const appN = app.map(norm);
const sinMatch = excel.filter((e) => {
  const n = norm(e);
  return !appN.some((a) => a === n || a.includes(n) || n.includes(a));
});
console.log("SIN MATCH (" + sinMatch.length + "):");
sinMatch.forEach((x) => console.log(" -", x));
