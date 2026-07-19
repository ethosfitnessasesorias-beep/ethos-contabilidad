"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";

// Reportes estilo Excel ("Libro - I/G"): tablas categoría × mes del año
// entero para comparar meses de un vistazo, y una gráfica compacta debajo.

interface FactRow { fecha_emision: string; total: number; computa_reparto: boolean | null; categorias: { grupo: string; nombre: string } | null }
interface GastoRow { fecha: string; total: number; categorias: { grupo: string; nombre: string; es_inversion: boolean } | null }

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const n0 = (v: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(v);
const eur0 = (v: number) => `${n0(v)} €`;

// Celda numérica de la tabla: vacía si no hay valor (como el Excel)
const celda = (v: number, cls = "text-zinc-300") =>
  Math.abs(v) < 0.5 ? <td className="px-2 py-1 text-right text-zinc-800">·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls}`}>{n0(v)}</td>;

const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);

export default function Reportes() {
  const sesionOk = useSesion();
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [ing, setIng] = useState<FactRow[]>([]);
  const [gas, setGas] = useState<GastoRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const desde = `${anyo}-01-01`;
      const hasta = `${anyo + 1}-01-01`;
      const [f, g] = await Promise.all([
        supabase.from("facturas").select("fecha_emision, total, computa_reparto, categorias(grupo, nombre)").gte("fecha_emision", desde).lt("fecha_emision", hasta),
        supabase.from("gastos").select("fecha, total, categorias(grupo, nombre, es_inversion)").gte("fecha", desde).lt("fecha", hasta),
      ]);
      if (f.error) return setError(f.error.message);
      setIng((f.data as unknown as FactRow[]) ?? []);
      setGas((g.data as unknown as GastoRow[]) ?? []);
    })();
  }, [sesionOk, anyo]);

  // Ingresos: subcategoría × mes (las aportaciones de capital no computan)
  const pivotIng = useMemo(() => {
    const filas = new Map<string, number[]>();
    for (const f of ing) {
      if (f.computa_reparto === false) continue;
      const m = new Date(f.fecha_emision + "T00:00:00").getMonth();
      const k = f.categorias?.nombre ?? "Sin categoría";
      const arr = filas.get(k) ?? Array(12).fill(0);
      arr[m] += Number(f.total);
      filas.set(k, arr);
    }
    const lista = [...filas.entries()].sort((a, b) => suma(b[1]) - suma(a[1]));
    const total = Array(12).fill(0);
    for (const [, arr] of lista) arr.forEach((v, i) => (total[i] += v));
    return { lista, total };
  }, [ing]);

  // Gastos: grupo (categoría) → subcategorías × mes, separando inversión
  const pivotGas = useMemo(() => {
    interface Sub { nombre: string; vals: number[]; inv: boolean }
    const grupos = new Map<string, Map<string, Sub>>();
    for (const g of gas) {
      const m = new Date(g.fecha + "T00:00:00").getMonth();
      const grupo = g.categorias?.grupo ?? "Otros";
      const nombre = g.categorias?.nombre ?? "Sin categoría";
      const gm = grupos.get(grupo) ?? new Map<string, Sub>();
      const sub = gm.get(nombre) ?? { nombre, vals: Array(12).fill(0), inv: !!g.categorias?.es_inversion };
      sub.vals[m] += Number(g.total);
      gm.set(nombre, sub);
      grupos.set(grupo, gm);
    }
    const lista = [...grupos.entries()]
      .map(([grupo, subs]) => {
        const subL = [...subs.values()].sort((a, b) => suma(b.vals) - suma(a.vals));
        const tot = Array(12).fill(0);
        subL.forEach((s) => s.vals.forEach((v, i) => (tot[i] += v)));
        return { grupo, subs: subL, tot };
      })
      .sort((a, b) => suma(b.tot) - suma(a.tot));
    const total = Array(12).fill(0);
    const totalInv = Array(12).fill(0);
    for (const g of lista) g.subs.forEach((s) => s.vals.forEach((v, i) => { total[i] += v; if (s.inv) totalInv[i] += v; }));
    const totalSinInv = total.map((v, i) => v - totalInv[i]);
    return { lista, total, totalInv, totalSinInv };
  }, [gas]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const cabecera = (
    <tr className="border-b border-zinc-800 bg-zinc-900 text-[10px] font-black uppercase tracking-wider text-zinc-500">
      <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left">Categoría</th>
      {MESES.map((m) => <th key={m} className="min-w-14 px-2 py-2 text-right">{m}</th>)}
      <th className="min-w-16 px-3 py-2 text-right text-zinc-300">Total</th>
    </tr>
  );

  const maxChart = Math.max(1, ...pivotIng.total, ...pivotGas.total);

  return (
    <Shell titulo="Reportes">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Reportes</h1>
            <p className="mt-1 text-sm text-zinc-500">Año completo, mes a mes, para comparar de un vistazo (como el Excel).</p>
          </div>
          <select
            value={anyo}
            onChange={(e) => setAnyo(Number(e.target.value))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none"
          >
            {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* INGRESOS */}
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-emerald-400">Ingresos · {anyo}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>{cabecera}</thead>
              <tbody>
                {pivotIng.lista.map(([nombre, vals]) => (
                  <tr key={nombre} className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-1 text-zinc-300">{nombre}</td>
                    {vals.map((v, i) => <Fragment key={i}>{celda(v)}</Fragment>)}
                    <td className="px-3 py-1 text-right font-bold tabular-nums text-zinc-200">{n0(suma(vals))}</td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-700 bg-emerald-950/30 font-black">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 text-emerald-400">TOTAL INGRESOS</td>
                  {pivotIng.total.map((v, i) => <Fragment key={i}>{celda(v, "text-emerald-400 font-black")}</Fragment>)}
                  <td className="px-3 py-1.5 text-right tabular-nums text-emerald-400">{n0(suma(pivotIng.total))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* GASTOS */}
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-red-400">Gastos · {anyo}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>{cabecera}</thead>
              <tbody>
                {pivotGas.lista.map((g) => (
                  <FilaGrupo key={g.grupo} grupo={g} />
                ))}
                <tr className="border-t border-zinc-700 bg-red-950/30 font-black">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 text-red-400">TOTAL GASTOS</td>
                  {pivotGas.total.map((v, i) => <Fragment key={i}>{celda(v, "text-red-400 font-black")}</Fragment>)}
                  <td className="px-3 py-1.5 text-right tabular-nums text-red-400">{n0(suma(pivotGas.total))}</td>
                </tr>
                <tr className="border-t border-zinc-800/60 text-zinc-500">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1">de los cuales inversión</td>
                  {pivotGas.totalInv.map((v, i) => <Fragment key={i}>{celda(v, "text-amber-500/80")}</Fragment>)}
                  <td className="px-3 py-1 text-right tabular-nums text-amber-500/80">{n0(suma(pivotGas.totalInv))}</td>
                </tr>
                <tr className="bg-zinc-900/60 font-bold">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 text-zinc-300">GASTO SIN INVERSIÓN</td>
                  {pivotGas.totalSinInv.map((v, i) => <Fragment key={i}>{celda(v, "text-zinc-200 font-bold")}</Fragment>)}
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-200">{n0(suma(pivotGas.totalSinInv))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* RESULTADO */}
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">Resultado (ingresos − gastos)</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>{cabecera}</thead>
              <tbody>
                {([
                  ["Con inversión", pivotIng.total.map((v, i) => v - pivotGas.total[i])],
                  ["Sin inversión", pivotIng.total.map((v, i) => v - pivotGas.totalSinInv[i])],
                ] as [string, number[]][]).map(([et, vals]) => (
                  <tr key={et} className="border-b border-zinc-800/50 last:border-0 font-bold">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-1.5 text-zinc-300">{et}</td>
                    {vals.map((v, i) => <Fragment key={i}>{celda(v, v < 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold")}</Fragment>)}
                    <td className={`px-3 py-1.5 text-right tabular-nums ${suma(vals) < 0 ? "text-red-400" : "text-emerald-400"}`}>{n0(suma(vals))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GRÁFICA */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-zinc-400">Ingresos vs gastos por mes</h2>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red-500" /> Gasto corriente</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-500" /> Inversión</span>
            </div>
          </div>
          <div className="flex items-stretch gap-2" style={{ height: 150 }}>
            {MESES.map((m, i) => (
              <div key={m} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                  <div className="w-1/2 max-w-5 rounded-t bg-emerald-500" style={{ height: `${(pivotIng.total[i] / maxChart) * 100}%` }} title={`Ingresos ${eur0(pivotIng.total[i])}`} />
                  <div className="flex w-1/2 max-w-5 flex-col justify-end" style={{ height: "100%" }}>
                    <div className="rounded-t bg-amber-500" style={{ height: `${(pivotGas.totalInv[i] / maxChart) * 100}%` }} title={`Inversión ${eur0(pivotGas.totalInv[i])}`} />
                    <div className={pivotGas.totalInv[i] > 0 ? "bg-red-500" : "rounded-t bg-red-500"} style={{ height: `${(pivotGas.totalSinInv[i] / maxChart) * 100}%` }} title={`Gasto corriente ${eur0(pivotGas.totalSinInv[i])}`} />
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500">{m}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-3 text-[10px] text-zinc-600">
          Importes con IVA (lo que entra y sale de verdad). Las aportaciones de capital (p. ej. Garantía Juvenil) no cuentan como ingreso.
          Las nóminas aparecen como categoría propia: recuerda que son reparto de beneficio, no gasto del negocio.
        </p>
      </div>
    </Shell>
  );
}

// Grupo de gasto: fila de categoría en negrita + subcategorías debajo
function FilaGrupo({ grupo }: { grupo: { grupo: string; subs: { nombre: string; vals: number[]; inv: boolean }[]; tot: number[] } }) {
  const [abierto, setAbierto] = useState(true);
  const multi = grupo.subs.length > 1 || grupo.subs[0]?.nombre !== grupo.grupo;
  return (
    <>
      <tr className="border-b border-zinc-800/50 bg-zinc-900/50 font-bold hover:bg-zinc-900/70">
        <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-1 text-zinc-200">
          {multi ? (
            <button onClick={() => setAbierto(!abierto)} className="flex items-center gap-1.5 font-bold hover:text-white">
              <span className="text-[9px] text-zinc-600">{abierto ? "▼" : "▶"}</span>
              {grupo.grupo}
            </button>
          ) : (
            grupo.grupo
          )}
        </td>
        {grupo.tot.map((v, i) => <Fragment key={i}>{celda(v, "text-zinc-200 font-bold")}</Fragment>)}
        <td className="px-3 py-1 text-right font-black tabular-nums text-zinc-100">{n0(suma(grupo.tot))}</td>
      </tr>
      {abierto && multi && grupo.subs.map((s) => (
        <tr key={s.nombre} className="border-b border-zinc-800/40 hover:bg-zinc-900/30">
          <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/95 py-1 pl-8 pr-3 text-zinc-500">
            {s.nombre}{s.inv && <span className="ml-1.5 text-[9px] font-bold text-amber-600">INV</span>}
          </td>
          {s.vals.map((v, i) => <Fragment key={i}>{celda(v, "text-zinc-400")}</Fragment>)}
          <td className="px-3 py-1 text-right tabular-nums text-zinc-400">{n0(suma(s.vals))}</td>
        </tr>
      ))}
    </>
  );
}
