"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";

interface FlujoFila {
  mes: string;
  entradas: number;
  salidas: number;
  neto: number;
}

interface RepartoFila {
  mes: string;
  atribucion: string;
  cobrado: number;
  gasto: number;
  balance: number;
  a_entrenador: number;
  a_hucha: number;
}

interface FactMes {
  mes: string;
  atribucion: string;
  base: number;
  total: number;
}

interface GastoDetalle {
  mes: string;
  categoria: string;
  subcategoria: string;
  es_inversion: boolean;
  canal: "online" | "presencial";
  total: number;
}

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const mesCorto = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

function Seccion(props: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="mb-4 text-lg font-black text-white">{props.titulo}</h2>
      {props.children}
    </section>
  );
}

export default function Reportes() {
  const sesionOk = useSesion();
  const [flujo, setFlujo] = useState<FlujoFila[]>([]);
  const [reparto, setReparto] = useState<RepartoFila[]>([]);
  const [factMensual, setFactMensual] = useState<FactMes[]>([]);
  const [gastos, setGastos] = useState<GastoDetalle[]>([]);
  const [canalGasto, setCanalGasto] = useState<"todos" | "presencial" | "online">("todos");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const [f, r, fm, g] = await Promise.all([
        supabase.from("v_flujo_mensual").select("*").order("mes", { ascending: false }).limit(12),
        supabase.from("v_reparto_mensual").select("*").order("mes", { ascending: false }).limit(60),
        supabase.from("v_facturacion_mensual").select("*").order("mes", { ascending: false }).limit(60),
        supabase.from("v_gastos_detalle").select("*"),
      ]);
      const fallo = f.error ?? r.error ?? fm.error ?? g.error;
      if (fallo) return setError(fallo.message);
      setFlujo(((f.data as FlujoFila[]) ?? []).reverse());
      setReparto((r.data as RepartoFila[]) ?? []);
      setFactMensual((fm.data as FactMes[]) ?? []);
      setGastos((g.data as GastoDetalle[]) ?? []);
    })();
  }, [sesionOk]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  // Barras: escala común para el flujo
  const maxFlujo = Math.max(1, ...flujo.map((f) => Math.max(Number(f.entradas), Number(f.salidas))));

  // Reparto: acumulado del año en curso por persona
  const anyo = new Date().getFullYear();
  const repartoAnyo = new Map<string, { cobrado: number; aPersona: number }>();
  for (const r of reparto) {
    if (new Date(r.mes).getFullYear() !== anyo) continue;
    const acc = repartoAnyo.get(r.atribucion) ?? { cobrado: 0, aPersona: 0 };
    acc.cobrado += Number(r.cobrado);
    acc.aPersona += Number(r.a_entrenador);
    repartoAnyo.set(r.atribucion, acc);
  }

  // Facturación del año por atribución
  const factAnyo = new Map<string, number>();
  for (const f of factMensual) {
    if (new Date(f.mes).getFullYear() !== anyo) continue;
    factAnyo.set(f.atribucion, (factAnyo.get(f.atribucion) ?? 0) + Number(f.total));
  }
  const totalFactAnyo = [...factAnyo.values()].reduce((s, n) => s + n, 0);

  // Gasto del año agrupado por categoría → subcategoría, filtrado por canal
  const gastosAnyo = gastos.filter(
    (g) => new Date(g.mes).getFullYear() === anyo && (canalGasto === "todos" || g.canal === canalGasto)
  );
  const porCategoria = new Map<
    string,
    { total: number; subs: Map<string, { total: number; online: number; presencial: number }> }
  >();
  for (const g of gastosAnyo) {
    const cat = porCategoria.get(g.categoria) ?? { total: 0, subs: new Map() };
    cat.total += Number(g.total);
    const sub = cat.subs.get(g.subcategoria) ?? { total: 0, online: 0, presencial: 0 };
    sub.total += Number(g.total);
    sub[g.canal] += Number(g.total);
    cat.subs.set(g.subcategoria, sub);
    porCategoria.set(g.categoria, cat);
  }
  const categoriasOrden = [...porCategoria.entries()].sort((a, b) => b[1].total - a[1].total);
  const totalGastoAnyo = categoriasOrden.reduce((s, [, c]) => s + c.total, 0);

  return (
    <Shell titulo="Reportes">
      <div className="px-5 py-6 md:px-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Reportes</h1>
        <p className="mt-1 text-sm text-zinc-500">Todo calculado en vivo desde facturas, cobros y gastos.</p>

        {error && <p className="mt-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Flujo de caja 12 meses */}
        <Seccion titulo="Entradas vs salidas (últimos 12 meses)">
          <div className="flex flex-col gap-3">
            {flujo.map((f) => (
              <div key={f.mes}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-zinc-400">{mesCorto(f.mes)}</span>
                  <span className={Number(f.neto) < 0 ? "font-bold text-red-400" : "font-bold text-emerald-400"}>
                    {Number(f.neto) >= 0 ? "+" : ""}
                    {eur(Number(f.neto))}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${(Number(f.entradas) / maxFlujo) * 100}%` }}
                    />
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-red-600"
                      style={{ width: `${(Number(f.salidas) / maxFlujo) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-0.5 flex justify-between text-[10px] text-zinc-600">
                  <span>entra {eur(Number(f.entradas))}</span>
                  <span>sale {eur(Number(f.salidas))}</span>
                </div>
              </div>
            ))}
            {flujo.length === 0 && <p className="text-sm text-zinc-600">Sin datos todavía.</p>}
          </div>
        </Seccion>

        {/* Facturación del año por persona */}
        <Seccion titulo={`Facturación ${anyo} por persona`}>
          <div className="flex flex-col gap-2.5">
            {[...factAnyo.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([atr, total]) => (
                <div key={atr}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-bold text-zinc-300">{NOMBRES[atr] ?? atr}</span>
                    <span className="text-zinc-400">
                      {eur(total)} · {totalFactAnyo > 0 ? Math.round((total / totalFactAnyo) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-red-600"
                      style={{ width: `${totalFactAnyo > 0 ? (total / totalFactAnyo) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            {factAnyo.size === 0 && <p className="text-sm text-zinc-600">Sin facturación este año.</p>}
          </div>
        </Seccion>

        {/* Gasto desglosado por categoría y subcategoría */}
        <Seccion titulo={`Gasto ${anyo} por categoría`}>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["todos", "Todos"],
                ["presencial", "Presencial"],
                ["online", "Online"],
              ] as const
            ).map(([id, etiqueta]) => (
              <button
                key={id}
                onClick={() => setCanalGasto(id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  canalGasto === id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {etiqueta}
              </button>
            ))}
            <span className="ml-auto self-center text-sm font-black text-white">
              Total {eur(totalGastoAnyo)}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {categoriasOrden.map(([categoria, cat]) => (
              <div key={categoria}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-black text-white">{categoria}</span>
                  <span className="text-sm font-bold text-zinc-300">
                    {eur(cat.total)}
                    <span className="ml-1 text-xs font-normal text-zinc-600">
                      {totalGastoAnyo > 0 ? Math.round((cat.total / totalGastoAnyo) * 100) : 0}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-red-600"
                    style={{ width: `${totalGastoAnyo > 0 ? (cat.total / totalGastoAnyo) * 100 : 0}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-col gap-1 pl-3">
                  {[...cat.subs.entries()]
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([sub, v]) => (
                      <div key={sub} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{sub}</span>
                        <span className="flex items-center gap-2">
                          {canalGasto === "todos" && v.online > 0 && (
                            <span className="rounded-full bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              on {eur(v.online)}
                            </span>
                          )}
                          <span className="font-semibold text-zinc-300">{eur(v.total)}</span>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {categoriasOrden.length === 0 && <p className="text-sm text-zinc-600">Sin gastos este año.</p>}
          </div>
        </Seccion>

        {/* Reparto acumulado del año */}
        <Seccion titulo={`Reparto acumulado ${anyo} (lo cobrado por cada uno)`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase text-zinc-500">
                  <th className="py-2">Persona</th>
                  <th className="py-2 text-right">Cash collected</th>
                  <th className="py-2 text-right">Su parte</th>
                </tr>
              </thead>
              <tbody>
                {[...repartoAnyo.entries()]
                  .filter(([atr]) => atr !== "ethos")
                  .sort((a, b) => b[1].aPersona - a[1].aPersona)
                  .map(([atr, v]) => (
                    <tr key={atr} className="border-b border-zinc-800/60 last:border-0">
                      <td className="py-2.5 font-semibold text-zinc-200">{NOMBRES[atr] ?? atr}</td>
                      <td className="py-2.5 text-right text-zinc-400">{eur(v.cobrado)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">{eur(v.aPersona)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {repartoAnyo.size === 0 && <p className="text-sm text-zinc-600">Sin cobros este año.</p>}
          </div>
        </Seccion>
      </div>
    </Shell>
  );
}
