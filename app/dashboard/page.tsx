"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { type Canal } from "@/lib/tipos";

interface NegocioFila { canal: Canal; facturado: number; cobrado: number }
interface Saldo { codigo: string; nombre: string; es_transito: boolean; saldo: number }
interface Kpis { caja_libre: number; iva_pendiente: number; irpf_pendiente: number; hucha_actual: number; runway_meses: number | null; gasto_fijo_mensual: number }
interface Reparto { atribucion: string; balance: number; a_entrenador: number }
interface Actividad { id: number; titulo: string; cuando: string }
interface Cli { fecha_inicio: string | null; fecha_baja: string | null; estado: string | null }

const eur0 = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function Kpi({ label, valor, color = "text-white", sub, alarma }: { label: string; valor: string; color?: string; sub?: string; alarma?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alarma ? "border-red-700 bg-red-950" : "border-zinc-800 bg-zinc-900/40"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-lg font-black ${alarma ? "text-red-300" : color}`}>{valor}</p>
      {sub && <p className="mt-0.5 text-[11px] leading-tight text-zinc-600">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const sesionOk = useSesion();
  const [neg, setNeg] = useState<NegocioFila[]>([]);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [reparto, setReparto] = useState<Reparto[]>([]);
  const [acts, setActs] = useState<Actividad[]>([]);
  const [clientes, setClientes] = useState<Cli[]>([]);
  const [pendiente, setPendiente] = useState(0);
  const [evo, setEvo] = useState<{ mes: string; facturado: number; cobrado: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      // "YYYY-MM" de hace d meses (en horario local, sin líos de zona horaria)
      const ym = (d: number) => { const dt = new Date(now.getFullYear(), now.getMonth() + d, 1); return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`; };
      const mesActual = ym(0);
      const desde6 = `${ym(-5)}-01`;

      const [n, s, k, r, a, cli, sal, fact, cob] = await Promise.all([
        supabase.from("v_dashboard_negocio").select("*"),
        supabase.from("v_saldo_cuentas").select("codigo, nombre, es_transito, saldo").order("id"),
        supabase.from("v_kpis").select("*").single(),
        supabase.from("v_reparto_mensual").select("atribucion, balance, a_entrenador").eq("mes", `${mesActual}-01`),
        supabase.from("actividades").select("id, titulo, cuando").eq("hecha", false).gte("cuando", new Date().toISOString()).order("cuando").limit(6),
        supabase.from("clientes").select("fecha_inicio, fecha_baja, estado"),
        supabase.from("v_facturas_saldo").select("pendiente"),
        supabase.from("facturas").select("fecha_emision, base").gte("fecha_emision", desde6),
        supabase.from("cobros").select("fecha, importe").gte("fecha", desde6),
      ]);
      if (n.error) { setError(n.error.message.includes("v_dashboard_negocio") ? "Falta ejecutar supabase/crm.sql en el SQL Editor." : n.error.message); }
      setNeg((n.data as NegocioFila[]) ?? []);
      setSaldos((s.data as Saldo[]) ?? []);
      if (k.data) setKpis(k.data as Kpis);
      setReparto((r.data as Reparto[]) ?? []);
      setActs((a.data as Actividad[]) ?? []);
      setClientes((cli.data as Cli[]) ?? []);
      setPendiente(((sal.data as { pendiente: number }[]) ?? []).reduce((t, x) => t + Number(x.pendiente), 0));

      const meses: string[] = [];
      for (let i = 5; i >= 0; i--) meses.push(ym(-i));
      const fm = new Map<string, number>(), cm = new Map<string, number>();
      for (const f of (fact.data as { fecha_emision: string; base: number }[]) ?? []) { const m = f.fecha_emision.slice(0, 7); fm.set(m, (fm.get(m) ?? 0) + Number(f.base)); }
      for (const c of (cob.data as { fecha: string; importe: number }[]) ?? []) { const m = c.fecha.slice(0, 7); cm.set(m, (cm.get(m) ?? 0) + Number(c.importe)); }
      setEvo(meses.map((m) => ({ mes: m, facturado: fm.get(m) ?? 0, cobrado: cm.get(m) ?? 0 })));
    })();
  }, [sesionOk]);

  if (sesionOk === null) return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;

  const saldoDe = (c: string) => Number(saldos.find((x) => x.codigo === c)?.saldo ?? 0);
  const retenido = kpis ? Number(kpis.iva_pendiente) + Number(kpis.irpf_pendiente) + Number(kpis.hucha_actual) : 0;
  const transito = saldos.filter((s) => s.es_transito).reduce((t, s) => t + Number(s.saldo), 0);
  const efectivoLibre = saldoDe("caja");
  const bancoLibre = saldoDe("banco") - retenido;
  const facturadoMes = neg.reduce((t, x) => t + Number(x.facturado), 0);
  const cobradoMes = neg.reduce((t, x) => t + Number(x.cobrado), 0);
  const socios = reparto.filter((r) => r.atribucion === "luis" || r.atribucion === "david");
  const nominaMes = socios.reduce((t, r) => t + Math.max(0, Number(r.a_entrenador)), 0);
  const beneficioMes = socios.reduce((t, r) => t + Number(r.balance), 0);
  const mesActualISO = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const activos = clientes.filter((c) => !c.fecha_baja && c.estado !== "lead").length;
  const leads = clientes.filter((c) => !c.fecha_baja && c.estado === "lead").length;
  const altasMes = clientes.filter((c) => c.fecha_inicio?.slice(0, 7) === mesActualISO).length;
  const bajasMes = clientes.filter((c) => c.fecha_baja?.slice(0, 7) === mesActualISO).length;
  const maxEvo = Math.max(1, ...evo.flatMap((e) => [e.facturado, e.cobrado]));
  const mesTexto = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const runwayAlarma = kpis?.runway_meses != null && Number(kpis.runway_meses) < 3;

  return (
    <Shell titulo="Dashboard">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5">
          <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm capitalize text-zinc-500">Resumen del negocio · {mesTexto}</p>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Dinero disponible */}
        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-600">Dinero disponible</p>
        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi label="Caja libre (usable)" valor={eur0(kpis?.caja_libre ?? 0)} sub={`Efectivo ${eur0(efectivoLibre)} · Banco ${eur0(bancoLibre)}`} />
          <Kpi label="Retenido" valor={eur0(retenido)} color="text-amber-400" sub="impuestos + hucha (no tocar)" />
          <Kpi label="En tránsito" valor={eur0(transito)} color="text-zinc-300" sub="TPV/Stripe sin liquidar" />
          <Kpi label="Runway" valor={kpis?.runway_meses == null ? "—" : `${kpis.runway_meses} meses`} alarma={runwayAlarma} sub={`fijos ${eur0(kpis?.gasto_fijo_mensual ?? 0)}/mes`} />
        </div>

        {/* Negocio del mes */}
        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-600">Negocio del mes</p>
        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi label="Facturado" valor={eur0(facturadoMes)} />
          <Kpi label="Cash collected" valor={eur0(cobradoMes)} color="text-emerald-400" />
          <Kpi label="Pendiente de cobro" valor={eur0(pendiente)} color="text-amber-400" />
          <Kpi label="Nómina del mes" valor={eur0(nominaMes)} color="text-emerald-400" sub={`beneficio ${eur0(beneficioMes)}`} />
        </div>

        {/* Clientes */}
        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-600">Clientes</p>
        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi label="Activos" valor={String(activos)} />
          <Kpi label="Altas del mes" valor={String(altasMes)} color="text-emerald-400" />
          <Kpi label="Bajas del mes" valor={String(bajasMes)} color={bajasMes > 0 ? "text-red-400" : "text-white"} />
          <Kpi label="Leads" valor={String(leads)} color="text-amber-400" />
        </div>

        {/* Evolución + próximos eventos */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide text-zinc-400">Evolución (6 meses)</h2>
              <div className="flex gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-zinc-500" /> Facturado</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Cobrado</span>
              </div>
            </div>
            <div className="flex items-end gap-3" style={{ height: 150 }}>
              {evo.map((e) => (
                <div key={e.mes} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end justify-center gap-1">
                    <div className="w-1/2 max-w-5 rounded-t bg-zinc-600" style={{ height: `${(e.facturado / maxEvo) * 100}%` }} title={`Facturado ${eur0(e.facturado)}`} />
                    <div className="w-1/2 max-w-5 rounded-t bg-emerald-500" style={{ height: `${(e.cobrado / maxEvo) * 100}%` }} title={`Cobrado ${eur0(e.cobrado)}`} />
                  </div>
                  <span className="text-[10px] capitalize text-zinc-500">{new Date(e.mes + "-01T00:00:00").toLocaleDateString("es-ES", { month: "short" })}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-400">Próximos eventos</h2>
            {acts.length === 0 ? (
              <p className="text-sm text-zinc-600">Sin actividades programadas.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {acts.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">{a.titulo}</p>
                      <p className="text-xs text-zinc-600">{new Date(a.cuando).toLocaleDateString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
