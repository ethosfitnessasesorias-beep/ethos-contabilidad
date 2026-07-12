"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Barra } from "../barra";
import { NavInferior } from "../nav";
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
  vencimiento: string | null;
  total: number;
  cobrado: number;
  pendiente: number;
}

interface RepartoFila {
  mes: string;
  atribucion: Atribucion;
  cobrado: number;
  gasto: number;
  balance: number;
  a_entrenador: number;
  a_hucha: number;
}

interface FlujoFila {
  mes: string;
  entradas: number;
  salidas: number;
  neto: number;
}

const eur = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const mesCorto = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

function Tarjeta(props: {
  titulo: string;
  valor: string;
  detalle?: string;
  alarma?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        props.alarma ? "bg-red-950 ring-1 ring-red-700" : "bg-zinc-900"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{props.titulo}</p>
      <p className={`mt-1 text-2xl font-black ${props.alarma ? "text-red-300" : "text-white"}`}>
        {props.valor}
      </p>
      {props.detalle && <p className="mt-1 text-xs text-zinc-500">{props.detalle}</p>}
    </div>
  );
}

function Seccion(props: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-400">
        {props.titulo}
      </h2>
      {props.children}
    </section>
  );
}

export default function Panel() {
  const router = useRouter();
  const [sesionOk, setSesionOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [morosos, setMorosos] = useState<Moroso[]>([]);
  const [reparto, setReparto] = useState<RepartoFila[]>([]);
  const [flujo, setFlujo] = useState<FlujoFila[]>([]);
  const [alarmaRunway, setAlarmaRunway] = useState(3);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setSesionOk(true);
    });
  }, [router]);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const mesActual = new Date().toISOString().slice(0, 8) + "01";
      const [k, s, m, r, f, cfg] = await Promise.all([
        supabase.from("v_kpis").select("*").single(),
        supabase.from("v_saldo_cuentas").select("*").order("id"),
        supabase.from("v_morosos").select("*").limit(50),
        supabase.from("v_reparto_mensual").select("*").eq("mes", mesActual),
        supabase.from("v_flujo_mensual").select("*").order("mes", { ascending: false }).limit(6),
        supabase.from("config").select("valor").eq("clave", "alarma_runway_meses").single(),
      ]);
      const fallo = k.error ?? s.error ?? m.error ?? r.error ?? f.error;
      if (fallo) {
        setError(
          fallo.message.includes("v_flujo_mensual")
            ? "Falta la vista v_flujo_mensual: ejecuta supabase/fase3_vistas.sql en el SQL Editor."
            : `No se pudieron cargar los datos: ${fallo.message}`
        );
        return;
      }
      setKpis(k.data as Kpis);
      setSaldos((s.data as Saldo[]) ?? []);
      setMorosos((m.data as Moroso[]) ?? []);
      setReparto((r.data as RepartoFila[]) ?? []);
      setFlujo(((f.data as FlujoFila[]) ?? []).reverse());
      if (cfg.data) setAlarmaRunway(Number(cfg.data.valor));
    })();
  }, [sesionOk]);

  if (sesionOk === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  const runwayEnAlarma = kpis?.runway_meses !== null && kpis !== null && Number(kpis.runway_meses) < alarmaRunway;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-zinc-950 px-4 pb-24 pt-4">
      <Barra />

      {error && (
        <p className="rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {!error && !kpis && <p className="py-8 text-center text-zinc-500">Cargando datos…</p>}

      {kpis && (
        <>
          {/* Las 5 métricas obligatorias */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Tarjeta
                titulo="Caja libre"
                valor={eur(kpis.caja_libre)}
                detalle={`Caja ${eur(kpis.caja_total)} − IVA ${eur(kpis.iva_pendiente)} − IRPF ${eur(
                  kpis.irpf_pendiente
                )} − hucha ${eur(kpis.hucha_actual)}`}
              />
            </div>
            <Tarjeta
              titulo="Runway"
              valor={kpis.runway_meses === null ? "—" : `${kpis.runway_meses} meses`}
              detalle={`Gasto fijo ${eur(kpis.gasto_fijo_mensual)}/mes`}
              alarma={runwayEnAlarma}
            />
            <Tarjeta
              titulo="Fijos cubiertos por MRR"
              valor={kpis.cobertura_fijos === null ? "—" : `${Math.round(Number(kpis.cobertura_fijos) * 100)}%`}
              detalle={`MRR ${eur(kpis.mrr)}`}
            />
            <Tarjeta
              titulo="% en efectivo (mes)"
              valor={kpis.pct_efectivo === null ? "—" : `${kpis.pct_efectivo}%`}
              detalle="Debe tender a 0"
            />
            <Tarjeta titulo="Hucha real" valor={eur(kpis.hucha_actual)} />
          </div>

          {/* Saldos por cuenta: para cuadrar con la realidad */}
          <Seccion titulo="Saldo por cuenta">
            <div className="overflow-hidden rounded-2xl bg-zinc-900">
              {saldos.map((s) => (
                <div
                  key={s.codigo}
                  className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0"
                >
                  <span className="text-sm text-zinc-300">
                    {s.nombre.split(" (")[0]}
                    {s.es_transito && (
                      <span className="ml-2 text-xs text-zinc-600">(en tránsito)</span>
                    )}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      Number(s.saldo) < 0 ? "text-red-400" : "text-white"
                    }`}
                  >
                    {eur(s.saldo)}
                  </span>
                </div>
              ))}
            </div>
          </Seccion>

          {/* Reparto del mes en curso */}
          <Seccion titulo="Reparto del mes (80/20)">
            {reparto.length === 0 ? (
              <p className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
                Aún no hay cobros este mes.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Resumen: lo que cobrará cada uno si el mes acabara hoy */}
                <div className="rounded-2xl bg-emerald-950/60 p-4 ring-1 ring-emerald-900">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    A pagar a final de mes (si acabara hoy)
                  </p>
                  {reparto
                    .filter((r) => r.atribucion !== "ethos")
                    .map((r) => (
                      <div key={r.atribucion} className="flex justify-between py-0.5 text-sm">
                        <span className="text-zinc-300">{NOMBRES[r.atribucion]}</span>
                        <span className="font-bold text-emerald-300">{eur(r.a_entrenador)}</span>
                      </div>
                    ))}
                </div>
                {reparto.map((r) => {
                  const colaborador =
                    r.atribucion === "alex_esteban" || r.atribucion === "alex_guerrero";
                  return (
                    <div key={r.atribucion} className="rounded-2xl bg-zinc-900 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{NOMBRES[r.atribucion]}</span>
                        <span className="text-sm text-zinc-400">
                          {colaborador ? "bruto sin IVA" : "balance"} {eur(r.balance)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-zinc-800 px-3 py-2">
                          <p className="text-xs text-zinc-500">
                            {colaborador ? "Cobrado (sus gastos no restan)" : "Cobrado − gastos"}
                          </p>
                          <p className="text-zinc-300">
                            {colaborador ? eur(r.cobrado) : `${eur(r.cobrado)} − ${eur(r.gasto)}`}
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-950 px-3 py-2">
                          <p className="text-xs text-emerald-500">
                            {colaborador ? "Colaborador / Ethos" : "Entrenador / Hucha"}
                          </p>
                          <p className="text-emerald-300">
                            {eur(r.a_entrenador)} / {eur(r.a_hucha)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Seccion>

          {/* Morosos */}
          <Seccion titulo={`Pendiente de cobro (${morosos.length})`}>
            {morosos.length === 0 ? (
              <p className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
                Nadie debe nada. 🎉
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-zinc-900">
                {morosos.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {m.cliente ?? m.concepto}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {m.concepto} · {new Date(m.fecha_emision).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-amber-400">
                      {eur(m.pendiente)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          {/* Flujo de caja */}
          <Seccion titulo="Flujo de caja (últimos meses)">
            <div className="overflow-hidden rounded-2xl bg-zinc-900">
              <div className="grid grid-cols-4 gap-2 border-b border-zinc-800 px-4 py-2 text-xs font-semibold uppercase text-zinc-500">
                <span>Mes</span>
                <span className="text-right">Entra</span>
                <span className="text-right">Sale</span>
                <span className="text-right">Neto</span>
              </div>
              {flujo.map((f) => (
                <div
                  key={f.mes}
                  className="grid grid-cols-4 gap-2 border-b border-zinc-800 px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="text-zinc-400">{mesCorto(f.mes)}</span>
                  <span className="text-right text-zinc-300">{eur(f.entradas)}</span>
                  <span className="text-right text-zinc-300">{eur(f.salidas)}</span>
                  <span
                    className={`text-right font-bold ${
                      Number(f.neto) < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {eur(f.neto)}
                  </span>
                </div>
              ))}
            </div>
          </Seccion>
        </>
      )}

      <NavInferior />
    </main>
  );
}
