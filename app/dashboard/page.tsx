"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { type Canal } from "@/lib/tipos";

interface NegocioFila { canal: Canal; facturado: number; cobrado: number }
interface Saldo { codigo: string; nombre: string; es_transito: boolean; saldo: number }
interface Kpis { caja_libre: number; iva_pendiente: number; irpf_pendiente: number; hucha_actual: number; runway_meses: number | null; gasto_fijo_mensual: number; cobrado_mes: number }
interface Reparto { atribucion: string; balance: number; a_entrenador: number }
interface Actividad { id: number; titulo: string; cuando: string }
interface Cli { fecha_inicio: string | null; fecha_baja: string | null; estado: string | null }
interface Beneficio { mes: string; socio: string; beneficio: number }

// Inversión total del local desde la apertura (se puede sobreescribir con la
// clave 'inversion_local_total' en la tabla config)
const INVERSION_LOCAL = 84333.09;

const eur0 = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const eur2 = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n || 0);

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
  const [gastosCanal, setGastosCanal] = useState<{ online: number; presencial: number }>({ online: 0, presencial: 0 });
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [cobradoMesCuenta, setCobradoMesCuenta] = useState<Map<string, number>>(new Map());
  const [inversionTotal, setInversionTotal] = useState(INVERSION_LOCAL);
  const [objetivos, setObjetivos] = useState<{ online: number; presencial: number }>({ online: 0, presencial: 0 });
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

      const [n, s, k, r, a, cli, sal, fact, cob, gm, ben, cfg, cu, cmes] = await Promise.all([
        supabase.from("v_dashboard_negocio").select("*"),
        supabase.from("v_saldo_cuentas").select("codigo, nombre, es_transito, saldo").order("id"),
        supabase.from("v_kpis").select("*").single(),
        supabase.from("v_reparto_mensual").select("atribucion, balance, a_entrenador").eq("mes", `${mesActual}-01`),
        supabase.from("actividades").select("id, titulo, cuando").eq("hecha", false).gte("cuando", new Date().toISOString()).order("cuando").limit(6),
        supabase.from("clientes").select("fecha_inicio, fecha_baja, estado"),
        supabase.from("v_facturas_saldo").select("pendiente"),
        supabase.from("facturas").select("fecha_emision, base").gte("fecha_emision", desde6),
        supabase.from("cobros").select("fecha, importe").gte("fecha", desde6),
        supabase.from("gastos").select("canal, total, categorias!inner(nombre)").gte("fecha", `${mesActual}-01`),
        supabase.from("v_reparto_beneficios").select("mes, socio, beneficio").order("mes"),
        supabase.from("config").select("clave, valor").in("clave", ["inversion_local_total", "objetivo_online", "objetivo_presencial"]),
        supabase.from("cuentas").select("id, codigo"),
        supabase.from("cobros").select("importe, cuenta_id, facturas!inner(computa_reparto)").gte("fecha", `${mesActual}-01`),
      ]);
      if (n.error) { setError(n.error.message.includes("v_dashboard_negocio") ? "Falta ejecutar supabase/crm.sql en el SQL Editor." : n.error.message); }
      setNeg((n.data as NegocioFila[]) ?? []);
      setSaldos((s.data as Saldo[]) ?? []);
      if (k.data) setKpis(k.data as Kpis);
      setReparto((r.data as Reparto[]) ?? []);
      setActs((a.data as Actividad[]) ?? []);
      setClientes((cli.data as Cli[]) ?? []);
      setPendiente(((sal.data as { pendiente: number }[]) ?? []).reduce((t, x) => t + Number(x.pendiente), 0));

      // Gastos del mes por canal (nóminas fuera: son reparto, no gasto)
      const gc = { online: 0, presencial: 0 };
      for (const row of (gm.data as unknown as { canal: string | null; total: number; categorias: { nombre: string } | null }[]) ?? []) {
        if (/mina/i.test(row.categorias?.nombre ?? "")) continue;
        gc[row.canal === "online" ? "online" : "presencial"] += Number(row.total);
      }
      setGastosCanal(gc);
      setBeneficios((ben.data as Beneficio[]) ?? []);

      // Cobros del mes por cuenta: dinero comprometido (nóminas y gastos del mes)
      const codigoDe = new Map<number, string>();
      for (const c of (cu.data as { id: number; codigo: string }[]) ?? []) codigoDe.set(c.id, c.codigo);
      const porCuenta = new Map<string, number>();
      for (const co of (cmes.data as unknown as { importe: number; cuenta_id: number; facturas: { computa_reparto: boolean | null } }[]) ?? []) {
        if (co.facturas?.computa_reparto === false) continue;
        const cod = codigoDe.get(co.cuenta_id);
        if (cod) porCuenta.set(cod, (porCuenta.get(cod) ?? 0) + Number(co.importe));
      }
      setCobradoMesCuenta(porCuenta);
      const claves: Record<string, number> = {};
      for (const x of (cfg.data as { clave: string; valor: number }[]) ?? []) claves[x.clave] = Number(x.valor);
      if (claves.inversion_local_total > 0) setInversionTotal(claves.inversion_local_total);
      setObjetivos({ online: claves.objetivo_online ?? 0, presencial: claves.objetivo_presencial ?? 0 });

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
  // Usable = saldo − apartado. Apartado: lo cobrado este mes (sale la nómina y
  // los gastos del mes) y, en banco, también impuestos + hucha.
  const cobMes = (c: string) => cobradoMesCuenta.get(c) ?? 0;
  const efectivoApartado = Math.min(saldoDe("caja"), cobMes("caja"));
  const efectivoLibre = saldoDe("caja") - efectivoApartado;
  const bancoApartado = Math.min(saldoDe("banco"), retenido + cobMes("banco"));
  const bancoLibre = saldoDe("banco") - bancoApartado;
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

  // --- Retorno de la inversión del local ---
  // Beneficio total por mes (Luis + David, meses en negativo cuentan 0)
  const benMes = new Map<string, number>();
  for (const b of beneficios) benMes.set(b.mes, (benMes.get(b.mes) ?? 0) + Number(b.beneficio));
  const mesesBen = [...benMes.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const recuperado = mesesBen.reduce((t, [, v]) => t + Math.max(0, v), 0);
  const restanteROI = Math.max(0, inversionTotal - recuperado);
  const ultimos3 = mesesBen.slice(-3).map(([, v]) => Math.max(0, v));
  const ritmo = ultimos3.length ? ultimos3.reduce((s, x) => s + x, 0) / ultimos3.length : 0;
  const mesesROI = ritmo > 0 ? Math.ceil(restanteROI / ritmo) : null;
  const fechaROI = mesesROI !== null ? new Date(new Date().getFullYear(), new Date().getMonth() + mesesROI, 1) : null;

  // Proyección: favorable (beneficio +5 %/mes) vs estancado (−2 %/mes)
  const proyeccion = (() => {
    if (ritmo <= 0 || restanteROI <= 0) return null;
    const fav: number[] = [restanteROI];
    const est: number[] = [restanteROI];
    let rf = restanteROI, re = restanteROI, vf = ritmo, ve = ritmo;
    for (let i = 1; i <= 48 && (rf > 0 || re > 0); i++) {
      vf *= 1.05; ve *= 0.98;
      rf = Math.max(0, rf - vf); re = Math.max(0, re - ve);
      fav.push(rf); est.push(re);
    }
    return { fav, est };
  })();

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
        <div className="mb-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi label="Dinero usable" valor={eur2(kpis?.caja_libre ?? 0)} color="text-emerald-400" sub="sin impuestos, hucha ni lo cobrado este mes" />
          <Kpi label="Cobrado este mes (apartado)" valor={eur2(Number(kpis?.cobrado_mes ?? 0))} color="text-amber-400" sub="de aquí salen nóminas y gastos del mes" />
          <Kpi label="Retenido" valor={eur2(retenido)} color="text-amber-400" sub="impuestos + hucha (no tocar)" />
          <Kpi label="Runway" valor={kpis?.runway_meses == null ? "—" : `${kpis.runway_meses} meses`} alarma={runwayAlarma} sub={`fijos ${eur0(kpis?.gasto_fijo_mensual ?? 0)}/mes`} />
        </div>

        {/* Desglose usable / apartado por cuenta, al céntimo */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                <th className="px-3 py-1.5 text-left">Cuenta</th>
                <th className="px-3 py-1.5 text-right">Saldo total</th>
                <th className="px-3 py-1.5 text-right text-emerald-500">Usable</th>
                <th className="px-3 py-1.5 text-right text-amber-500">Apartado (no usable)</th>
                <th className="hidden px-3 py-1.5 text-left sm:table-cell">Por qué está apartado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-800/50">
                <td className="px-3 py-1.5 font-bold text-white">Banco</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-zinc-200">{eur2(saldoDe("banco"))}</td>
                <td className="px-3 py-1.5 text-right font-bold tabular-nums text-emerald-400">{eur2(bancoLibre)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-amber-400">{eur2(bancoApartado)}</td>
                <td className="hidden px-3 py-1.5 text-[10px] text-zinc-500 sm:table-cell">
                  impuestos + hucha {eur2(retenido)} · cobrado este mes {eur2(cobMes("banco"))}
                </td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="px-3 py-1.5 font-bold text-white">Efectivo</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-zinc-200">{eur2(saldoDe("caja"))}</td>
                <td className="px-3 py-1.5 text-right font-bold tabular-nums text-emerald-400">{eur2(efectivoLibre)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-amber-400">{eur2(efectivoApartado)}</td>
                <td className="hidden px-3 py-1.5 text-[10px] text-zinc-500 sm:table-cell">
                  cobrado en efectivo este mes
                </td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-bold text-white">Stripe / TPV</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-zinc-200">{eur2(transito)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-zinc-600">—</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-amber-400">{eur2(transito)}</td>
                <td className="hidden px-3 py-1.5 text-[10px] text-zinc-500 sm:table-cell">
                  en tránsito: no es usable hasta pasarlo al banco
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Negocio del mes, por canal */}
        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-600">Negocio del mes</p>
        <div className="mb-2.5 grid gap-2.5 lg:grid-cols-2">
          {([
            ["online", "Online", "bg-blue-500", gastosCanal.online],
            ["presencial", "Presencial (GYM)", "bg-red-500", gastosCanal.presencial],
          ] as [Canal, string, string, number][]).map(([canal, titulo, color, gasto]) => {
            const d = neg.find((x) => x.canal === canal);
            const fact = Number(d?.facturado ?? 0);
            const cobr = Number(d?.cobrado ?? 0);
            const neto = fact - gasto;
            const objetivo = objetivos[canal];
            return (
              <div key={canal} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="text-sm font-black text-white">{titulo}</span>
                  <span className={`ml-auto text-sm font-black ${neto < 0 ? "text-red-400" : "text-emerald-400"}`}>neto {eur0(neto)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Facturado</p>
                    <p className="text-sm font-black text-white">{eur0(fact)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Cobrado</p>
                    <p className="text-sm font-black text-emerald-400">{eur0(cobr)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-950/60 px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Gastos</p>
                    <p className="text-sm font-black text-red-400">{eur0(gasto)}</p>
                  </div>
                </div>
                {objetivo > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className={`h-full rounded-full ${fact >= objetivo ? "bg-emerald-500" : color}`} style={{ width: `${Math.min(100, (fact / objetivo) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      objetivo {eur0(objetivo)} · {Math.round((fact / objetivo) * 100)}%{fact >= objetivo ? " ✓ conseguido" : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi label="Total facturado" valor={eur0(facturadoMes)} />
          <Kpi label="Total cobrado" valor={eur0(cobradoMes)} color="text-emerald-400" />
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

        {/* Retorno de la inversión del local */}
        <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-600">Inversión del local</p>
        <div className="mb-4 grid gap-2.5 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recuperar la inversión</p>
            <p className="mt-0.5 text-lg font-black text-white">{eur0(restanteROI)} <span className="text-xs font-bold text-zinc-500">restante</span></p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (recuperado / inversionTotal) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-600">
              Invertido {eur0(inversionTotal)} · recuperado {eur0(recuperado)} ({Math.round((recuperado / inversionTotal) * 100)}%)
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {mesesROI === null
                ? "Aún sin ritmo de beneficio para estimar el plazo."
                : <>Al ritmo actual ({eur0(ritmo)}/mes): <b className="text-white">≈ {mesesROI} meses</b> ({fechaROI?.toLocaleDateString("es-ES", { month: "long", year: "numeric" })})</>}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 lg:col-span-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Proyección del retorno · 2 escenarios</p>
              <div className="flex gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-emerald-500" /> Creciendo +5%/mes</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-amber-500" /> Estancado −2%/mes</span>
              </div>
            </div>
            {!proyeccion ? (
              <p className="py-6 text-center text-sm text-zinc-600">Sin datos suficientes para proyectar.</p>
            ) : (() => {
              const n = Math.max(proyeccion.fav.length, proyeccion.est.length);
              const W = 600, H = 140, PAD = 4;
              const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
              const y = (v: number) => PAD + (1 - v / restanteROI) * (H - PAD * 2);
              const linea = (arr: number[]) => arr.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
              const finFav = proyeccion.fav.findIndex((v) => v <= 0);
              const finEst = proyeccion.est.findIndex((v) => v <= 0);
              const fecha = (m: number) => new Date(new Date().getFullYear(), new Date().getMonth() + m, 1).toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
              return (
                <>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
                    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#3f3f46" strokeWidth="1" />
                    <polyline points={linea(proyeccion.est)} fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <polyline points={linea(proyeccion.fav)} fill="none" stroke="#10b981" strokeWidth="2" />
                  </svg>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Deuda de inversión pendiente mes a mes.
                    {finFav > 0 && <> Favorable: recuperada en <b className="text-emerald-400">{finFav} meses</b> ({fecha(finFav)}).</>}
                    {finEst > 0 ? <> Estancado: en <b className="text-amber-400">{finEst} meses</b> ({fecha(finEst)}).</> : finFav > 0 ? " Estancado: más de 4 años." : ""}
                  </p>
                </>
              );
            })()}
          </div>
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
            <div className="flex items-stretch gap-3" style={{ height: 150 }}>
              {evo.map((e) => (
                <div key={e.mes} className="flex h-full flex-1 flex-col items-center gap-1">
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
