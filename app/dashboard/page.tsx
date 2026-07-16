"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { type Canal } from "@/lib/tipos";

interface NegocioFila {
  canal: Canal;
  facturado: number;
  cobrado: number;
  leads_mes: number;
  tasa_cierre: number | null;
}

interface Actividad {
  id: number;
  tipo: string;
  titulo: string;
  cuando: string;
}

interface Saldo {
  codigo: string;
  nombre: string;
  es_transito: boolean;
  saldo: number;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const eurC = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

function PanelNegocio({
  titulo,
  color,
  datos,
  gasto,
}: {
  titulo: string;
  color: string;
  datos: NegocioFila | undefined;
  gasto: number;
}) {
  const ingreso = Number(datos?.facturado ?? 0);
  const neto = ingreso - gasto;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h2 className="text-lg font-black text-white">{titulo}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-950/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Ingresos (mes)</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-400">{eur(ingreso)}</p>
        </div>
        <div className="rounded-xl bg-red-950/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-500/80">Gastos (mes)</p>
          <p className="mt-1.5 text-2xl font-black text-red-400">{eur(gasto)}</p>
        </div>
        <div className="rounded-xl bg-zinc-900/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Neto (mes)</p>
          <p className={`mt-1.5 text-2xl font-black ${neto < 0 ? "text-red-400" : "text-white"}`}>{eur(neto)}</p>
        </div>
        <div className="rounded-xl bg-zinc-900/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cobrado / Leads</p>
          <p className="mt-1.5 text-2xl font-black text-white">{eur(Number(datos?.cobrado ?? 0))}</p>
          <p className="mt-0.5 text-xs text-zinc-600">{datos?.leads_mes ?? 0} leads este mes</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const sesionOk = useSesion();
  const [negocio, setNegocio] = useState<NegocioFila[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [gastosCanal, setGastosCanal] = useState<{ online: number; presencial: number }>({ online: 0, presencial: 0 });
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const desde = new Date();
      desde.setDate(1);
      const desdeISO = desde.toISOString().slice(0, 10);
      const hastaISO = new Date(desde.getFullYear(), desde.getMonth() + 1, 1).toISOString().slice(0, 10);
      const [n, a, g, s] = await Promise.all([
        supabase.from("v_dashboard_negocio").select("*"),
        supabase
          .from("actividades")
          .select("id, tipo, titulo, cuando")
          .eq("hecha", false)
          .gte("cuando", new Date().toISOString())
          .order("cuando")
          .limit(6),
        supabase.from("gastos").select("canal, total").gte("fecha", desdeISO).lt("fecha", hastaISO),
        supabase.from("v_saldo_cuentas").select("codigo, nombre, es_transito, saldo").order("id"),
      ]);
      if (n.error) {
        setError(
          n.error.message.includes("v_dashboard_negocio")
            ? "Falta ejecutar supabase/crm.sql en el SQL Editor."
            : n.error.message
        );
        return;
      }
      setNegocio((n.data as NegocioFila[]) ?? []);
      setActividades((a.data as Actividad[]) ?? []);
      const gc = { online: 0, presencial: 0 };
      for (const row of (g.data as { canal: string | null; total: number }[]) ?? []) {
        gc[row.canal === "online" ? "online" : "presencial"] += Number(row.total);
      }
      setGastosCanal(gc);
      setSaldos((s.data as Saldo[]) ?? []);
    })();
  }, [sesionOk]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const online = negocio.find((x) => x.canal === "online");
  const presencial = negocio.find((x) => x.canal === "presencial");
  const saldoDe = (codigo: string) => Number(saldos.find((s) => s.codigo === codigo)?.saldo ?? 0);
  const saldoBanco = saldoDe("banco");
  const saldoCaja = saldoDe("caja");
  const saldoTransito = saldos.filter((s) => s.es_transito).reduce((t, s) => t + Number(s.saldo), 0);
  const mesTexto = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <Shell titulo="Dashboard">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm capitalize text-zinc-500">Resumen de rendimiento · {mesTexto}</p>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Saldos de control */}
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cuenta banco Ethos</p>
            <p className={`mt-1.5 text-2xl font-black ${saldoBanco < 0 ? "text-red-400" : "text-white"}`}>{eurC(saldoBanco)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Efectivo</p>
            <p className={`mt-1.5 text-2xl font-black ${saldoCaja < 0 ? "text-red-400" : "text-white"}`}>{eurC(saldoCaja)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">En tránsito (TPV + Stripe)</p>
            <p className="mt-1.5 text-2xl font-black text-zinc-300">{eurC(saldoTransito)}</p>
            <p className="mt-0.5 text-xs text-zinc-600">pendiente de liquidar al banco</p>
          </div>
        </div>

        {/* Ingresos vs gastos por negocio + próximos eventos */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <PanelNegocio titulo="Online" color="bg-blue-500" datos={online} gasto={gastosCanal.online} />
            <PanelNegocio titulo="Presencial (GYM)" color="bg-red-500" datos={presencial} gasto={gastosCanal.presencial} />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-4 text-lg font-black text-white">Próximos eventos</h2>
            {actividades.length === 0 ? (
              <p className="text-sm text-zinc-600">Sin actividades programadas.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {actividades.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{a.titulo}</p>
                      <p className="text-xs text-zinc-600">
                        {new Date(a.cuando).toLocaleDateString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Comparativa ingresos vs gastos del mes (barras) */}
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="mb-4 text-lg font-black text-white">Ingresos vs gastos del mes</h2>
          {(() => {
            const filas = [
              { etiqueta: "Online", ing: Number(online?.facturado ?? 0), gas: gastosCanal.online, color: "bg-blue-500" },
              { etiqueta: "Presencial", ing: Number(presencial?.facturado ?? 0), gas: gastosCanal.presencial, color: "bg-red-500" },
            ];
            const max = Math.max(1, ...filas.flatMap((f) => [f.ing, f.gas]));
            return (
              <div className="flex flex-col gap-4">
                {filas.map((f) => (
                  <div key={f.etiqueta}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold uppercase text-zinc-400">{f.etiqueta}</span>
                      <span className={`font-bold ${f.ing - f.gas < 0 ? "text-red-400" : "text-emerald-400"}`}>
                        neto {eur(f.ing - f.gas)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(f.ing / max) * 100}%` }} />
                        </div>
                        <span className="w-20 shrink-0 text-right text-xs text-emerald-400">{eur(f.ing)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-red-600" style={{ width: `${(f.gas / max) * 100}%` }} />
                        </div>
                        <span className="w-20 shrink-0 text-right text-xs text-red-400">{eur(f.gas)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <p className="mt-4 text-xs text-zinc-600">
            Ingresos = facturado del mes por canal · Gastos = gastos del mes por canal. Barra verde ingresos, roja gastos.
          </p>
        </div>
      </div>
    </Shell>
  );
}
