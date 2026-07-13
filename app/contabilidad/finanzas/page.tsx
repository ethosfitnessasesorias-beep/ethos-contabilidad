"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Atribucion } from "@/lib/tipos";

interface Kpis {
  caja_total: number;
  iva_pendiente: number;
  irpf_pendiente: number;
  hucha_actual: number;
  caja_libre: number;
  gasto_fijo_mensual: number;
  runway_meses: number | null;
  cobertura_fijos: number | null;
  mrr: number;
  pct_efectivo: number | null;
}
interface Saldo {
  codigo: string;
  nombre: string;
  es_transito: boolean;
  saldo: number;
}
interface Moroso {
  id: number;
  cliente: string | null;
  concepto: string;
  fecha_emision: string;
  pendiente: number;
}
interface RepartoFila {
  atribucion: Atribucion;
  cobrado: number;
  gasto: number;
  balance: number;
  a_entrenador: number;
  a_hucha: number;
}

const eur = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

function Tarjeta({ titulo, valor, detalle, alarma }: { titulo: string; valor: string; detalle?: string; alarma?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${alarma ? "border-red-700 bg-red-950" : "border-zinc-800 bg-zinc-900/40"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-black ${alarma ? "text-red-300" : "text-white"}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-zinc-600">{detalle}</p>}
    </div>
  );
}

export default function FinanzasPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [morosos, setMorosos] = useState<Moroso[]>([]);
  const [reparto, setReparto] = useState<RepartoFila[]>([]);
  const [alarma, setAlarma] = useState(3);

  useEffect(() => {
    (async () => {
      const mesActual = new Date().toISOString().slice(0, 8) + "01";
      const [k, s, m, r, cfg] = await Promise.all([
        supabase.from("v_kpis").select("*").single(),
        supabase.from("v_saldo_cuentas").select("*").order("id"),
        supabase.from("v_morosos").select("id, cliente, concepto, fecha_emision, pendiente").limit(50),
        supabase.from("v_reparto_mensual").select("*").eq("mes", mesActual),
        supabase.from("config").select("valor").eq("clave", "alarma_runway_meses").single(),
      ]);
      if (k.data) setKpis(k.data as Kpis);
      setSaldos((s.data as Saldo[]) ?? []);
      setMorosos((m.data as Moroso[]) ?? []);
      setReparto((r.data as RepartoFila[]) ?? []);
      if (cfg.data) setAlarma(Number(cfg.data.valor));
    })();
  }, []);

  if (!kpis) return <p className="py-8 text-center text-sm text-zinc-500">Cargando…</p>;

  const runwayAlarma = kpis.runway_meses !== null && Number(kpis.runway_meses) < alarma;

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <Tarjeta
            titulo="Caja libre"
            valor={eur(kpis.caja_libre)}
            detalle="Dinero realmente tuyo y usable (ya restados impuestos y hucha)"
          />
        </div>
        <Tarjeta
          titulo="Meses de autonomía (runway)"
          valor={kpis.runway_meses === null ? "—" : `${kpis.runway_meses} meses`}
          detalle={`Lo que aguantarías sin ingresar nada, pagando ${eur(kpis.gasto_fijo_mensual)}/mes de fijos`}
          alarma={runwayAlarma}
        />
        <Tarjeta
          titulo="Fijos por MRR"
          valor={kpis.cobertura_fijos === null ? "—" : `${Math.round(Number(kpis.cobertura_fijos) * 100)}%`}
          detalle={`MRR ${eur(kpis.mrr)}`}
        />
        <Tarjeta titulo="% efectivo" valor={kpis.pct_efectivo === null ? "—" : `${kpis.pct_efectivo}%`} detalle="tiende a 0" />
        <Tarjeta titulo="Hucha real" valor={eur(kpis.hucha_actual)} />
      </div>

      {/* Saldos */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-400">Saldo por cuenta</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          {saldos.map((s) => (
            <div key={s.codigo} className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0">
              <span className="text-sm text-zinc-300">
                {s.nombre.split(" (")[0]}
                {s.es_transito && <span className="ml-2 text-xs text-zinc-600">(en tránsito)</span>}
              </span>
              <span className={`text-sm font-bold ${Number(s.saldo) < 0 ? "text-red-400" : "text-white"}`}>
                {eur(s.saldo)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Reparto */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-400">Reparto del mes</h2>
        {reparto.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
            Aún no hay cobros este mes.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {reparto.map((r) => {
              const colaborador = r.atribucion === "alex_esteban" || r.atribucion === "alex_guerrero";
              return (
                <div key={r.atribucion} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{NOMBRES[r.atribucion]}</span>
                    <span className="text-sm text-zinc-400">
                      {colaborador ? "bruto sin IVA" : "balance"} {eur(r.balance)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                      <p className="text-xs text-zinc-500">{colaborador ? "Cobrado (gastos no restan)" : "Cobrado − gastos"}</p>
                      <p className="text-zinc-300">
                        {colaborador ? eur(r.cobrado) : `${eur(r.cobrado)} − ${eur(r.gasto)}`}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-950/60 px-3 py-2">
                      <p className="text-xs text-red-400">{colaborador ? "Colaborador / Ethos" : "Entrenador / Hucha"}</p>
                      <p className="text-red-300">
                        {eur(r.a_entrenador)} / {eur(r.a_hucha)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Morosos */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-400">
          Pendiente de cobro ({morosos.length})
        </h2>
        {morosos.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
            Nadie debe nada. 🎉
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {morosos.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{m.cliente ?? m.concepto}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {m.concepto} · {new Date(m.fecha_emision).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-amber-400">{eur(Number(m.pendiente))}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
