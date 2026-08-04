// Casa el listado del Excel "Gestión de clientes" contra los contactos y
// genera las filas fijas de la matriz Pagos y cobros.
// - Coincide → fila con cliente_id.
// - Agregado sin ficha (Grupales, Merchan…) → fila con patrón de concepto.
// - Sin coincidencia → se lista como NO REGISTRADO (no se crea fila).
import { readFileSync, writeFileSync } from "node:fs";

const clientes = JSON.parse(readFileSync(process.argv[2], "utf8").replace(/^﻿/, ""));
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const full = (c) => norm(`${c.nombre} ${c.apellidos}`);

// Listado del usuario (orden del Excel). alias = pista extra para casar.
// patron = agregado sin ficha: casa cobros de facturas SIN cliente por concepto.
const LISTA = [
  { et: "ADISGA" }, { et: "FISIO" }, { et: "ALEX GUERRERO" },
  { et: "Grupales", patron: "grupal|ventas efectivo|ventas tpv|ventas bizum|ventas domiciliado|suscripciones" },
  { et: "PATROCINIO: HSN", patron: "hsn" },
  { et: "VENTA DE MERCHAN", patron: "merch" },
  { et: "VENTA DE AGUAS", patron: "agua" },
  { et: "MULTAS", patron: "multa" },
  { et: "Martin Junquero" }, { et: "Vinicio" }, { et: "WALLAPOP" }, { et: "Ani", alias: "ana maria garcia lopez" },
  { et: "Christian AD" }, { et: "Viti" }, { et: "Pau Perez regalo suegra" }, { et: "Katherine" },
  { et: "Inés" }, { et: "Júlia de Marco", alias: "julia de marco" },
  { et: "Antonio Lozano" }, { et: "Sandra Martin Jimenez" }, { et: "Ramón", alias: "ramon bentayga" },
  { et: "Alejandro Cavanillas" }, { et: "Julia Bascuñana", alias: "julia bascuna" },
  { et: "Rubén Hernandez", alias: "ruben hernandez" }, { et: "Raúl Viladecas", alias: "raul viladecas" },
  { et: "Ana Maria", alias: "ana maria garcia lopez" },
  { et: "Rubén Diaz", alias: "ruben diaz granero" }, { et: "Cristian EP" }, { et: "Iker", alias: "iker solis" },
  { et: "Iker revisiones" }, { et: "Fernando", alias: "fernando paz" }, { et: "Christian Alcalá", alias: "christian alcala" },
  { et: "Juan José & Kinverly" }, { et: "Bea", alias: "beatriz viciana" }, { et: "Javi (hijo)" },
  { et: "Alex Sanchez" }, { et: "Adrian Monge", alias: "adri x1 monge" }, { et: "Victor Valero" },
  { et: "Victor Gallardo" }, { et: "Irene", alias: "irene silva" }, { et: "Alex Aguilera" },
  { et: "Pol Recasens" }, { et: "Tomás Peñalba", alias: "tomas penalba" }, { et: "Noelia", alias: "noelia lopez" },
  { et: "Pau Perez" }, { et: "Gerard Cidrera" }, { et: "Tarunpreet" }, { et: "Rayan", alias: "rayan zahrane" },
  { et: "Martí Munar", alias: "marti munar" }, { et: "Juan Barrera" }, { et: "Tatu padre e Isa" },
  { et: "Marian", alias: "marian martin sosa" }, { et: "Christian TRANS" }, { et: "Claudia", alias: "claudia arrebola" },
  { et: "Ana Mayor" }, { et: "Joan Bausa" }, { et: "Cristian Angy", alias: "cristian arjona hijo angy" },
  { et: "Erik Mejías", alias: "erik mejias" }, { et: "Adri Garcia", alias: "adrian garcia quesada" },
];

const usados = new Set();
const filasSQL = [];
const noRegistrados = [];
const notas = [];
let orden = 0;

for (const item of LISTA) {
  orden += 10;
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  if (item.patron) {
    filasSQL.push(`INSERT INTO pagos_cobros_filas (orden, etiqueta, patron) VALUES (${orden}, ${q(item.et)}, ${q(item.patron)});`);
    continue;
  }
  const objetivo = norm(item.alias ?? item.et);
  let cli =
    clientes.find((c) => full(c) === objetivo) ??
    clientes.find((c) => norm(c.nombre) === objetivo) ??
    clientes.find((c) => objetivo.length >= 5 && full(c).startsWith(objetivo + " ")) ??
    clientes.find((c) => objetivo.length >= 5 && full(c).includes(objetivo)) ??
    null;
  if (!cli) { noRegistrados.push(item.et); continue; }
  if (usados.has(cli.id)) { notas.push(`"${item.et}" -> mismo cliente que otra fila (#${cli.id} ${cli.nombre} ${cli.apellidos}); no se duplica`); continue; }
  usados.add(cli.id);
  filasSQL.push(`INSERT INTO pagos_cobros_filas (orden, etiqueta, cliente_id) VALUES (${orden}, ${q(item.et)}, ${cli.id});`);
}

const sql = "DELETE FROM pagos_cobros_filas;\nBEGIN;\n" + filasSQL.join("\n") + "\nCOMMIT;\nSELECT count(*) AS filas FROM pagos_cobros_filas;";
writeFileSync("supabase/pagos_cobros_seed.sql", sql, "utf8");
console.log(`FILAS CREADAS: ${filasSQL.length}`);
console.log(`\nNO REGISTRADOS (${noRegistrados.length}):`);
noRegistrados.forEach((x) => console.log("  -", x));
console.log(`\nNOTAS (${notas.length}):`);
notas.forEach((x) => console.log("  ·", x));
