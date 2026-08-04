"use client";

// Pérdidas y ganancias: ingresos − gastos por mes, separando los dos negocios
// (ONLINE coaching y PRESENCIAL gym) y el total Ethos. Devengo: facturas por
// fecha de emisión y gastos por fecha. Las nóminas no son gasto (son reparto)
// y las correcciones históricas / aportaciones de capital no computan.

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FactRow { fecha_emision: string; total: number; canal: string | null; computa_reparto: boolean | null }
interface GastoRow { fecha: string; total: number; canal: string | null; categorias: { es_inversion: boolean } | null }

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const n2 = (v: number) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500";

type Negocio = "online" | "presencial";

interface Bloque {
  ingresos: number[];
  gastosOp: number[]; // sin inversión
  inversion: number[];
}

const bloqueVacio = (): Bloque => ({ ingresos: Array(12).fill(0), gastosOp: Array(12).fill(0), inversion: Array(12).fill(0) });

export default function PyGPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [facturas, setFacturas] = useState<FactRow[]>([]);
  const [gastos, setGastos] = useState<GastoRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const desde = `${anyo}-01-01`;
      const hasta = `${anyo + 1}-01-01`;
      const [f, g] = await Promise.all([
        supabase.from("facturas").select("fecha_emision, total, canal, computa_reparto").gte("fecha_emision", desde).lt("fecha_emision", hasta),
        supabase.from("gastos").select("fecha, total, canal, categorias(es_inversion)").gte("fecha", desde).lt("fecha", hasta),
      ]);
      if (f.error) return setError(f.error.message);
      if (g.error) return setError(g.error.message);
      setFacturas((f.data as unknown as FactRow[]) ?? []);
      setGastos((g.data as unknown as GastoRow[]) ?? []);
    })();
  }, [anyo]);

  const datos = useMemo(() => {
    const b: Record<Negocio, Bloque> = { online: bloqueVacio(), presencial: bloqueVacio() };
    for (const f of facturas) {
      if (f.computa_reparto === false) continue; // aportaciones de capital / correcciones
      const m = new Date(f.fecha_emision + "T00:00:00").getMonth();
      const n: Negocio = f.canal === "online" ? "online" : "presencial";
      b[n].ingresos[m] += Number(f.total);
    }
    for (const g of gastos) {
      const m = new Date(g.fecha + "T00:00:00").getMonth();
      const n: Negocio = g.canal === "online" ? "online" : "presencial";
      if (g.categorias?.es_inversion) b[n].inversion[m] += Number(g.total);
      else b[n].gastosOp[m] += Number(g.total);
    }
    const total: Bloque = bloqueVacio();
    (["online", "presencial"] as Negocio[]).forEach((n) => {
      b[n].ingresos.forEach((v, i) => (total.ingresos[i] += v));
      b[n].gastosOp.forEach((v, i) => (total.gastosOp[i] += v));
      b[n].inversion.forEach((v, i) => (total.inversion[i] += v));
    });
    return { ...b, total };
  }, [facturas, gastos]);

  const celda = (v: number, cls = "text-zinc-300") =>
    Math.abs(v) < 0.005 ? <td className="px-2 py-1 text-right text-zinc-800">·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls}`}>{n2(v)}</td>;

  const tabla = (titulo: string, colorTitulo: string, b: Bloque) => {
    const resultadoOp = b.ingresos.map((v, i) => v - b.gastosOp[i]);
    const resultadoNeto = resultadoOp.map((v, i) => v - b.inversion[i]);
    const ingresosTot = suma(b.ingresos);
    const margen = ingresosTot > 0 ? (suma(resultadoOp) / ingresosTot) * 100 : null;
    const filas: { nombre: string; vals: number[]; cls: string; negRojo?: boolean }[] = [
      { nombre: "Ingresos", vals: b.ingresos, cls: "text-emerald-400" },
      { nombre: "Gastos operativos", vals: b.gastosOp, cls: "text-red-400" },
      { nombre: "Resultado operativo", vals: resultadoOp, cls: "font-bold text-white", negRojo: true },
      { nombre: "Inversión", vals: b.inversion, cls: "text-orange-400" },
      { nombre: "Resultado neto", vals: resultadoNeto, cls: "font-black text-white", negRojo: true },
    ];
    return (
      <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className={`sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left text-[11px] ${colorTitulo}`}>
                {titulo}
                {margen !== null && <span className="ml-2 font-bold normal-case text-zinc-500">margen op. {margen.toFixed(1)}%</span>}
              </th>
              {MESES.map((m) => <th key={m} className="min-w-16 px-2 py-2 text-right">{m}</th>)}
              <th className="min-w-20 border-l border-zinc-800 px-3 py-2 text-right text-zinc-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre} className={`border-b border-zinc-800/50 last:border-0 ${f.nombre.startsWith("Resultado") ? "bg-zinc-900/60" : ""}`}>
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-semibold text-zinc-300">{f.nombre}</td>
                {f.vals.map((v, i) => (
                  <Fragment key={i}>{celda(v, f.negRojo && v < -0.005 ? "font-bold text-red-400" : f.cls)}</Fragment>
                ))}
                <td className={`border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums ${f.negRojo && suma(f.vals) < -0.005 ? "text-red-400" : "text-zinc-100"}`}>
                  {n2(suma(f.vals))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={anyo} onChange={(e) => setAnyo(Number(e.target.value))} className={`${inputCls} appearance-none`}>
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <p className="text-[11px] text-zinc-600">
          Devengo (facturado por emisión, gastos por fecha). Nóminas fuera (son reparto) · inversión separada del gasto operativo.
        </p>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {tabla("ETHOS · Total", "text-white", datos.total)}
      {tabla("ONLINE · Coaching", "text-sky-400", datos.online)}
      {tabla("PRESENCIAL · Gym", "text-amber-400", datos.presencial)}
    </div>
  );
}
