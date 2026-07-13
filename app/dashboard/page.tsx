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

interface PipelineFila {
  columna_id: number;
  titulo: string;
  orden: number;
  canal: Canal | null;
  n: number;
  importe: number;
}

interface Saldo {
  codigo: string;
  nombre: string;
  es_transito: boolean;
  saldo: number;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function Metrica({ etiqueta, valor, sub }: { etiqueta: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-zinc-900/60 p-4">
      <p className="text-[10px] font-bold uppercase leading-tight tracking-wider text-zinc-500">
        {etiqueta}
      </p>
      <p className="mt-1.5 text-2xl font-black text-white">{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

function PanelNegocio({
  titulo,
  color,
  datos,
}: {
  titulo: string;
  color: string;
  datos: NegocioFila | undefined;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h2 className="text-lg font-black text-white">{titulo}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metrica etiqueta="Facturación mensual" valor={eur(Number(datos?.facturado ?? 0))} />
        <Metrica etiqueta="Cash collected mensual" valor={eur(Number(datos?.cobrado ?? 0))} />
        <Metrica etiqueta="Leads" valor={String(datos?.leads_mes ?? 0)} sub="este mes" />
        <Metrica
          etiqueta="Tasa de cierre"
          valor={datos?.tasa_cierre === null || datos?.tasa_cierre === undefined ? "—" : `${datos.tasa_cierre}%`}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const sesionOk = useSesion();
  const [negocio, setNegocio] = useState<NegocioFila[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [pipeline, setPipeline] = useState<PipelineFila[]>([]);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const [n, a, p, s] = await Promise.all([
        supabase.from("v_dashboard_negocio").select("*"),
        supabase
          .from("actividades")
          .select("id, tipo, titulo, cuando")
          .eq("hecha", false)
          .gte("cuando", new Date().toISOString())
          .order("cuando")
          .limit(6),
        supabase.from("v_pipeline_conteo").select("*"),
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
      setPipeline((p.data as PipelineFila[]) ?? []);
      setSaldos((s.data as Saldo[]) ?? []);
    })();
  }, [sesionOk]);

  if (sesionOk === null) {
    return (
      <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>
    );
  }

  const online = negocio.find((x) => x.canal === "online");
  const presencial = negocio.find((x) => x.canal === "presencial");
  const saldoDe = (codigo: string) => Number(saldos.find((s) => s.codigo === codigo)?.saldo ?? 0);
  const saldoBanco = saldoDe("banco");
  const saldoCaja = saldoDe("caja");
  const saldoTransito = saldos.filter((s) => s.es_transito).reduce((t, s) => t + Number(s.saldo), 0);
  const mesTexto = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  // Suma por columna del pipeline (una fila por columna×canal en la vista)
  const fasesPipeline = (() => {
    const m = new Map<number, { titulo: string; orden: number; n: number }>();
    for (const p of pipeline) {
      const acc = m.get(p.columna_id) ?? { titulo: p.titulo, orden: p.orden, n: 0 };
      acc.n += Number(p.n);
      m.set(p.columna_id, acc);
    }
    return [...m.values()].sort((a, b) => a.orden - b.orden);
  })();

  return (
    <Shell titulo="Dashboard">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm capitalize text-zinc-500">Resumen de rendimiento · {mesTexto}</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        {/* Saldos de control: banco y caja por separado */}
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Cuenta banco Ethos
            </p>
            <p className={`mt-1.5 text-2xl font-black ${saldoBanco < 0 ? "text-red-400" : "text-white"}`}>
              {eur(saldoBanco)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Caja efectivo
            </p>
            <p className={`mt-1.5 text-2xl font-black ${saldoCaja < 0 ? "text-red-400" : "text-white"}`}>
              {eur(saldoCaja)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              En tránsito (TPV + Stripe)
            </p>
            <p className="mt-1.5 text-2xl font-black text-zinc-300">{eur(saldoTransito)}</p>
            <p className="mt-0.5 text-xs text-zinc-600">pendiente de liquidar al banco</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <PanelNegocio titulo="Online" color="bg-blue-500" datos={online} />
            <PanelNegocio titulo="Presencial (GYM)" color="bg-red-500" datos={presencial} />
          </div>

          {/* Próximos eventos */}
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
                        {new Date(a.cuando).toLocaleDateString("es-ES", {
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pipeline por fases */}
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="mb-4 text-lg font-black text-white">Pipeline por fases</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fasesPipeline.map((f) => (
              <div key={f.titulo} className="rounded-xl bg-zinc-900/60 p-4">
                <p className="text-2xl font-black text-white">{f.n}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-red-600"
                    style={{ width: `${Math.min(100, f.n * 20)}%` }}
                  />
                </div>
                <p className="mt-2 truncate text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {f.titulo}
                </p>
              </div>
            ))}
            {fasesPipeline.length === 0 && (
              <p className="text-sm text-zinc-600">Sin deals en el pipeline.</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
