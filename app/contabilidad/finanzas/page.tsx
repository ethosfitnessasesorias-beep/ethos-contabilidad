"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

function Tarjeta({ titulo, valor, detalle, alarma, children }: { titulo: string; valor: string; detalle?: string; alarma?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-3 ${alarma ? "border-red-700 bg-red-950" : "border-zinc-800 bg-zinc-900/40"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{titulo}</p>
      <p className={`mt-0.5 text-lg font-black ${alarma ? "text-red-300" : "text-white"}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-[11px] leading-tight text-zinc-600">{detalle}</p>}
      {children}
    </div>
  );
}

export default function FinanzasPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [morosos, setMorosos] = useState<Moroso[]>([]);
  const [reparto, setReparto] = useState<RepartoFila[]>([]);
  const [mesReparto, setMesReparto] = useState(new Date().toISOString().slice(0, 7));
  const [alarma, setAlarma] = useState(3);

  useEffect(() => {
    (async () => {
      const [k, s, m, cfg] = await Promise.all([
        supabase.from("v_kpis").select("*").single(),
        supabase.from("v_saldo_cuentas").select("*").order("id"),
        supabase.from("v_morosos").select("id, cliente, concepto, fecha_emision, pendiente").limit(50),
        supabase.from("config").select("valor").eq("clave", "alarma_runway_meses").single(),
      ]);
      if (k.data) setKpis(k.data as Kpis);
      setSaldos((s.data as Saldo[]) ?? []);
      setMorosos((m.data as Moroso[]) ?? []);
      if (cfg.data) setAlarma(Number(cfg.data.valor));
    })();
  }, []);

  useEffect(() => {
    supabase
      .from("v_reparto_mensual")
      .select("*")
      .eq("mes", `${mesReparto}-01`)
      .then(({ data }) => setReparto((data as RepartoFila[]) ?? []));
  }, [mesReparto]);

  if (!kpis) return <p className="py-8 text-center text-sm text-zinc-500">Cargando…</p>;

  const runwayAlarma = kpis.runway_meses !== null && Number(kpis.runway_meses) < alarma;

  const saldoDe = (codigo: string) => Number(saldos.find((s) => s.codigo === codigo)?.saldo ?? 0);
  const reservado = Number(kpis.iva_pendiente) + Number(kpis.irpf_pendiente) + Number(kpis.hucha_actual);
  const efectivoLibre = saldoDe("caja");
  const bancoLibre = saldoDe("banco") - reservado;

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <Tarjeta titulo="Caja libre" valor={eur(kpis.caja_libre)} detalle="Tuyo y usable (ya restados impuestos y hucha)">
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-800 pt-2 text-[11px]">
              <span><span className="font-black text-white">{eur(efectivoLibre)}</span> <span className="text-zinc-500">efectivo libre</span></span>
              <span><span className={`font-black ${bancoLibre < 0 ? "text-red-400" : "text-white"}`}>{eur(bancoLibre)}</span> <span className="text-zinc-500">banco libre</span></span>
            </div>
          </Tarjeta>
        </div>
        <Tarjeta
          titulo="Runway"
          valor={kpis.runway_meses === null ? "—" : `${kpis.runway_meses} meses`}
          detalle={`Sin ingresar nada, pagando ${eur(kpis.gasto_fijo_mensual)}/mes de fijos`}
          alarma={runwayAlarma}
        />
        <Tarjeta
          titulo="Fijos por MRR"
          valor={kpis.cobertura_fijos === null ? "—" : `${Math.round(Number(kpis.cobertura_fijos) * 100)}%`}
          detalle={`MRR ${eur(kpis.mrr)}`}
        />
        <Tarjeta titulo="Hucha real" valor={eur(kpis.hucha_actual)} detalle={`Reservado (impuestos + hucha) ${eur(reservado)}`} />
        <Tarjeta titulo="% efectivo" valor={kpis.pct_efectivo === null ? "—" : `${kpis.pct_efectivo}%`} detalle="tiende a 0" />
      </div>

      {/* Saldos */}
      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">Saldo por cuenta</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          {saldos.map((s) => (
            <div key={s.codigo} className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 last:border-0">
              <span className="text-[13px] text-zinc-300">
                {s.nombre.split(" (")[0]}
                {s.es_transito && <span className="ml-2 text-[11px] text-zinc-600">(en tránsito)</span>}
              </span>
              <span className={`text-[13px] font-bold ${Number(s.saldo) < 0 ? "text-red-400" : "text-white"}`}>
                {eur(s.saldo)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Reparto */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-400">Reparto por socio</h2>
          <input
            type="month"
            value={mesReparto}
            onChange={(e) => setMesReparto(e.target.value || new Date().toISOString().slice(0, 7))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
          />
        </div>
        {reparto.filter((r) => r.atribucion !== "ethos").length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
            Sin cobros en este mes.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr] bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
              <span>Socio</span><span className="text-right">Cobrado − gastos</span><span className="text-right">Nómina</span><span className="text-right">A hucha</span>
            </div>
            {reparto
              .filter((r) => r.atribucion !== "ethos")
              .map((r) => {
                const colaborador = r.atribucion === "alex_esteban" || r.atribucion === "alex_guerrero";
                return (
                  <div key={r.atribucion} className="grid grid-cols-[1fr_1.4fr_1fr_1fr] items-center border-t border-zinc-800 px-3 py-2 text-[13px]">
                    <span className="font-bold text-white">{NOMBRES[r.atribucion]}</span>
                    <span className="text-right text-zinc-400">
                      {colaborador ? eur(r.cobrado) : `${eur(r.cobrado)} − ${eur(r.gasto)}`}
                    </span>
                    <span className="text-right font-bold text-emerald-400">{eur(r.a_entrenador)}</span>
                    <span className="text-right text-zinc-400">{eur(r.a_hucha)}</span>
                  </div>
                );
              })}
          </div>
        )}
        <p className="mt-1.5 px-1 text-[11px] text-zinc-600">
          Nómina = 80% del balance; el 20% va a la hucha. Los Alex aportan a ETHOS; no tienen reparto propio.
        </p>
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
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            {morosos.map((m) => (
              <Link
                key={m.id}
                href={`/facturas/${m.id}`}
                className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2 last:border-0 hover:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white">{m.cliente ?? m.concepto}</p>
                  <p className="truncate text-[11px] text-zinc-500">
                    Factura · {m.concepto} · {new Date(m.fecha_emision).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[13px] font-bold text-amber-400">{eur(Number(m.pendiente))}</span>
                  <span className="text-[11px] text-zinc-600">editar ›</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
