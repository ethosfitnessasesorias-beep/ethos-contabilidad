"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Categoria {
  id: number;
  grupo: string;
  nombre: string;
  tipo: string;
}
interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
}
interface FacturaPend {
  id: number;
  cliente: string | null;
  concepto: string;
  pendiente: number;
}
interface Fila {
  idx: number;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  importe: number; // con signo
  tipo: "gasto" | "ingreso";
  categoriaId: number | null; // para gasto
  facturaId: number | null; // para ingreso (match)
  incluir: boolean;
  duplicado: boolean;
}

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-red-500";

// --- Parseo de CSV robusto (delimiter ; o , ; comillas) ---
function parseCSV(texto: string): string[][] {
  const delim = (texto.match(/;/g)?.length ?? 0) > (texto.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  for (const linea of texto.split(/\r?\n/)) {
    if (linea.trim() === "") continue;
    const celdas: string[] = [];
    let cur = "", enComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const ch = linea[i];
      if (ch === '"') enComillas = !enComillas;
      else if (ch === delim && !enComillas) {
        celdas.push(cur);
        cur = "";
      } else cur += ch;
    }
    celdas.push(cur);
    filas.push(celdas.map((c) => c.trim().replace(/^"|"$/g, "")));
  }
  return filas;
}

function parseImporte(s: string): number | null {
  let t = s.replace(/[€\s]/g, "");
  if (t === "") return null;
  // Formato español: 1.234,56 → quitar puntos de miles, coma decimal a punto
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (t.includes(",")) t = t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseFecha(s: string): string | null {
  const t = s.trim();
  let m = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/); // YYYY-MM-DD
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/); // DD/MM/YYYY
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

const contiene = (h: string, claves: string[]) => claves.some((k) => h.toLowerCase().includes(k));

export default function ImportarPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [pendientes, setPendientes] = useState<FacturaPend[]>([]);
  const [cuentaCodigo, setCuentaCodigo] = useState("banco");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  // Datos crudos + mapeo
  const [crudo, setCrudo] = useState<string[][]>([]);
  const [tieneCabecera, setTieneCabecera] = useState(true);
  const [colFecha, setColFecha] = useState(0);
  const [colConcepto, setColConcepto] = useState(1);
  const [colImporte, setColImporte] = useState(2);
  const [filas, setFilas] = useState<Fila[]>([]);

  const cargar = useCallback(async () => {
    const [cat, cue, pend] = await Promise.all([
      supabase.from("categorias").select("id, grupo, nombre, tipo").eq("tipo", "gasto").eq("activa", true).order("grupo"),
      supabase.from("cuentas").select("id, codigo, nombre").eq("activa", true).order("id"),
      supabase.from("v_facturas_saldo").select("id, cliente, concepto, pendiente").gt("pendiente", 0.01),
    ]);
    setCategorias((cat.data as Categoria[]) ?? []);
    setCuentas((cue.data as Cuenta[]) ?? []);
    setPendientes((pend.data as FacturaPend[]) ?? []);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const lector = new FileReader();
    lector.onload = () => {
      const rows = parseCSV(String(lector.result ?? ""));
      if (rows.length === 0) return setError("El archivo está vacío o no se pudo leer.");
      setCrudo(rows);
      setError(null);
      // Auto-mapeo por cabecera
      const cab = rows[0];
      const f = cab.findIndex((h) => contiene(h, ["fecha", "date"]));
      const c = cab.findIndex((h) => contiene(h, ["concepto", "descrip", "detalle", "movimiento"]));
      const i = cab.findIndex((h) => contiene(h, ["importe", "amount", "cantidad"]));
      const parece = f >= 0 || i >= 0;
      setTieneCabecera(parece);
      setColFecha(f >= 0 ? f : 0);
      setColConcepto(c >= 0 ? c : 1);
      setColImporte(i >= 0 ? i : cab.length - 1);
    };
    lector.readAsText(file, "utf-8");
  }

  const catId = (nombre: string) => categorias.find((c) => c.nombre === nombre || c.grupo === nombre)?.id ?? null;

  // Genera las filas a importar a partir del mapeo
  function procesar() {
    const cuerpo = tieneCabecera ? crudo.slice(1) : crudo;
    const otros = catId("Otros") ?? categorias[0]?.id ?? null;
    const out: Fila[] = [];
    let idx = 0;
    for (const r of cuerpo) {
      const fecha = parseFecha(r[colFecha] ?? "");
      const importe = parseImporte(r[colImporte] ?? "");
      if (!fecha || importe === null || importe === 0) continue;
      const concepto = (r[colConcepto] ?? "Movimiento").slice(0, 120);
      out.push({
        idx: idx++,
        fecha,
        concepto,
        importe,
        tipo: importe < 0 ? "gasto" : "ingreso",
        categoriaId: importe < 0 ? otros : null,
        facturaId: null,
        incluir: true,
        duplicado: false,
      });
    }
    marcarDuplicados(out);
  }

  // Marca posibles duplicados contra lo ya registrado (por fecha + importe)
  async function marcarDuplicados(lista: Fila[]) {
    if (lista.length === 0) return setFilas([]);
    const fechas = lista.map((f) => f.fecha).sort();
    const desde = fechas[0], hasta = fechas[fechas.length - 1];
    const [g, c] = await Promise.all([
      supabase.from("gastos").select("fecha, total").gte("fecha", desde).lte("fecha", hasta),
      supabase.from("cobros").select("fecha, importe").gte("fecha", desde).lte("fecha", hasta),
    ]);
    const claves = new Set<string>();
    for (const x of (g.data as { fecha: string; total: number }[]) ?? []) claves.add(`${x.fecha}|${Math.abs(Number(x.total)).toFixed(2)}`);
    for (const x of (c.data as { fecha: string; importe: number }[]) ?? []) claves.add(`${x.fecha}|${Math.abs(Number(x.importe)).toFixed(2)}`);
    setFilas(
      lista.map((f) => {
        const dup = claves.has(`${f.fecha}|${Math.abs(f.importe).toFixed(2)}`);
        return { ...f, duplicado: dup, incluir: f.incluir && !dup };
      })
    );
  }

  function actualizar(idx: number, campos: Partial<Fila>) {
    setFilas((prev) => prev.map((f) => (f.idx === idx ? { ...f, ...campos } : f)));
  }

  const seleccionadas = useMemo(() => filas.filter((f) => f.incluir), [filas]);
  const cuentaId = cuentas.find((c) => c.codigo === cuentaCodigo)?.id ?? cuentas[0]?.id ?? null;

  async function importar() {
    const gastos = seleccionadas.filter((f) => f.tipo === "gasto" && f.categoriaId);
    const cobros = seleccionadas.filter((f) => f.tipo === "ingreso" && f.facturaId);
    if (gastos.length === 0 && cobros.length === 0)
      return setError("Nada que importar: elige categoría en los gastos o factura en los ingresos.");
    setImportando(true);
    setError(null);

    let nG = 0, nC = 0;
    if (gastos.length) {
      const filasG = gastos.map((f) => ({
        fecha: f.fecha,
        concepto: f.concepto,
        categoria_id: f.categoriaId,
        cuenta_id: cuentaId,
        imputado_a: "ethos",
        base: Math.round(Math.abs(f.importe) * 100) / 100, // sin IVA desglosado: base = importe (iva 0)
        iva_pct: 0,
        irpf_pct: 0,
        deducible: false,
        tiene_factura: false,
        es_fijo: false,
        canal: "presencial",
      }));
      const { error } = await supabase.from("gastos").insert(filasG);
      if (error) {
        setImportando(false);
        return setError(`Gastos: ${error.message}`);
      }
      nG = filasG.length;
    }
    if (cobros.length) {
      const filasC = cobros.map((f) => ({
        factura_id: f.facturaId,
        fecha: f.fecha,
        importe: Math.round(Math.abs(f.importe) * 100) / 100,
        cuenta_id: cuentaId,
        metodo: "transferencia",
      }));
      const { error } = await supabase.from("cobros").insert(filasC);
      if (error) {
        setImportando(false);
        return setError(`Cobros: ${error.message}`);
      }
      nC = filasC.length;
    }
    setImportando(false);
    setOk(`Importados ${nG} gastos y ${nC} cobros ✓`);
    setFilas((prev) => prev.filter((f) => !f.incluir));
    cargar();
    setTimeout(() => setOk(null), 4000);
  }

  const gruposCat = useMemo(() => {
    const m = new Map<string, Categoria[]>();
    for (const c of categorias) m.set(c.grupo, [...(m.get(c.grupo) ?? []), c]);
    return [...m.entries()];
  }, [categorias]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-black text-white">Importar extracto del banco</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Sube el CSV del banco, cuadra las columnas y crea gastos y cobros de golpe. Detecta posibles duplicados.
        </p>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

      {/* Paso 1: subir */}
      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
            Elegir CSV
            <input type="file" accept=".csv,text/csv" onChange={onArchivo} className="hidden" />
          </label>
          <span className="text-xs text-zinc-500">
            {crudo.length > 0 ? `${crudo.length} líneas leídas` : "Ningún archivo aún"}
          </span>
          <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
            Cuenta destino
            <select value={cuentaCodigo} onChange={(e) => setCuentaCodigo(e.target.value)} className={inputCls}>
              {cuentas.map((c) => (
                <option key={c.codigo} value={c.codigo}>{c.nombre.split(" (")[0]}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Paso 2: mapear columnas */}
        {crudo.length > 0 && (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">¿Qué columna es cada cosa?</p>
            <div className="flex flex-wrap items-end gap-3">
              {([
                ["Fecha", colFecha, setColFecha] as const,
                ["Concepto", colConcepto, setColConcepto] as const,
                ["Importe", colImporte, setColImporte] as const,
              ]).map(([et, val, set]) => (
                <label key={et} className="flex flex-col gap-1 text-xs text-zinc-400">
                  {et}
                  <select value={val} onChange={(e) => set(Number(e.target.value))} className={inputCls}>
                    {crudo[0].map((h, i) => (
                      <option key={i} value={i}>
                        col {i + 1}
                        {tieneCabecera ? `: ${h.slice(0, 18)}` : `: ${(crudo[0][i] ?? "").slice(0, 18)}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={tieneCabecera} onChange={(e) => setTieneCabecera(e.target.checked)} className="accent-red-600" />
                La primera fila es cabecera
              </label>
              <button onClick={procesar} className="rounded-xl bg-zinc-200 px-4 py-2 text-sm font-bold text-zinc-900">
                Previsualizar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Paso 3: revisar y asignar */}
      {filas.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-zinc-400">
              {filas.length} movimientos · {seleccionadas.length} seleccionados
            </h3>
            <button
              onClick={importar}
              disabled={importando}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {importando ? "Importando…" : `Importar ${seleccionadas.length}`}
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-[11px] uppercase text-zinc-500">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2 text-right">Importe</th>
                  <th className="px-3 py-2">Asignar</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.idx} className={`border-b border-zinc-800/60 last:border-0 ${f.duplicado ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={f.incluir} onChange={(e) => actualizar(f.idx, { incluir: e.target.checked })} className="accent-red-600" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-400">{new Date(f.fecha).toLocaleDateString("es-ES")}</td>
                    <td className="px-3 py-2">
                      <span className="text-zinc-200">{f.concepto}</span>
                      {f.duplicado && <span className="ml-2 rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">posible duplicado</span>}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right font-bold ${f.importe < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {f.importe < 0 ? "" : "+"}{eur(f.importe)}
                    </td>
                    <td className="px-3 py-2">
                      {f.tipo === "gasto" ? (
                        <select
                          value={f.categoriaId ?? ""}
                          onChange={(e) => actualizar(f.idx, { categoriaId: Number(e.target.value) || null })}
                          className={inputCls}
                        >
                          <option value="">Categoría…</option>
                          {gruposCat.map(([grupo, cats]) => (
                            <optgroup key={grupo} label={grupo}>
                              {cats.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={f.facturaId ?? ""}
                          onChange={(e) => actualizar(f.idx, { facturaId: Number(e.target.value) || null })}
                          className={inputCls}
                        >
                          <option value="">Cobro de… (factura pendiente)</option>
                          {pendientes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.cliente ?? p.concepto} · debe {eur(Number(p.pendiente))}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Los <span className="text-red-400">gastos</span> se crean con la categoría que elijas (IVA sin desglosar: revísalo
            en el Libro si necesitas deducir). Los <span className="text-emerald-400">ingresos</span> solo se importan si los
            asocias a una factura pendiente (se registran como cobro).
          </p>
        </>
      )}
    </div>
  );
}
