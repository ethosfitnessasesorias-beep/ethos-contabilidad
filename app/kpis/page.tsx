"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";

// KPIs de los dos negocios, como el Excel "Análisis Mensual":
// - Finanzas y servicio se calculan SOLOS con los datos de la app.
// - Tráfico (seguidores, anuncios…) se apunta a mano, mes a mes.
// - El funnel de ventas se apunta a diario y se suma al mes.

type Negocio = "online" | "gym";

interface KpiValor { mes: string; negocio: string; metrica: string; valor: number }
interface Diario { fecha: string; negocio: string; bienvenidas: number; inbounds: number; agendas_bienvenidas: number; agendas_inbounds: number; cierres: number }

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const METRICAS_MANUALES: Record<Negocio, { clave: string; etiqueta: string }[]> = {
  online: [
    { clave: "nuevos_seguidores", etiqueta: "Nuevos seguidores" },
    { clave: "inversion_anuncios", etiqueta: "Inversión en anuncios €" },
    { clave: "visualizaciones", etiqueta: "Visualizaciones" },
    { clave: "cuentas_alcanzadas", etiqueta: "Cuentas alcanzadas" },
    { clave: "seguidores_totales", etiqueta: "Seguidores totales" },
    { clave: "clientes_a_renovar", etiqueta: "Clientes a renovar" },
    { clave: "renovaciones", etiqueta: "Renovaciones" },
  ],
  gym: [
    { clave: "nuevos_seguidores", etiqueta: "Nuevos seguidores" },
    { clave: "inversion_anuncios", etiqueta: "Inversión en anuncios €" },
    { clave: "seguidores_totales", etiqueta: "Seguidores totales" },
    { clave: "bonos_activos", etiqueta: "Bonos activos" },
  ],
};

const n0 = (v: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(v);
const n2 = (v: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(v);
const pct = (v: number) => `${Math.round(v * 100)}%`;

const celdaNum = (v: number, cls = "text-zinc-300", fmt: (x: number) => string = n0) =>
  Math.abs(v) < 0.005 ? <td className="px-2 py-1 text-right text-zinc-800">·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls}`}>{fmt(v)}</td>;

export default function KpisPage() {
  const sesionOk = useSesion();
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [negocio, setNegocio] = useState<Negocio>("online");
  const [manuales, setManuales] = useState<KpiValor[]>([]);
  const [diario, setDiario] = useState<Diario[]>([]);
  const [auto, setAuto] = useState<{
    fact: Record<Negocio, number[]>; cobrado: Record<Negocio, number[]>; gasto: Record<Negocio, number[]>;
    altas: Record<Negocio, number[]>; bajas: Record<Negocio, number[]>; activos: Record<Negocio, number>;
  } | null>(null);
  const [cajaLibre, setCajaLibre] = useState(0);
  const [sueldo, setSueldo] = useState("1200");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Funnel de hoy (entrada rápida)
  const hoyISO = new Date().toISOString().slice(0, 10);
  const [fechaFunnel, setFechaFunnel] = useState(hoyISO);
  const [funnelHoy, setFunnelHoy] = useState({ bienvenidas: "", inbounds: "", agendas_bienvenidas: "", agendas_inbounds: "", cierres: "" });

  const cargar = useCallback(async () => {
    const desde = `${anyo}-01-01`;
    const hasta = `${anyo + 1}-01-01`;
    const canalDe = (c: string | null): Negocio => (c === "online" ? "online" : "gym");
    const mesDe = (f: string) => new Date(f + "T00:00:00").getMonth();
    const vacio = (): Record<Negocio, number[]> => ({ online: Array(12).fill(0), gym: Array(12).fill(0) });

    const [kv, kd, fac, cob, gas, cli, k] = await Promise.all([
      supabase.from("kpi_valores").select("*").gte("mes", desde).lt("mes", hasta),
      supabase.from("kpi_diario").select("*").gte("fecha", desde).lt("fecha", hasta),
      supabase.from("facturas").select("fecha_emision, total, canal, computa_reparto").gte("fecha_emision", desde).lt("fecha_emision", hasta),
      supabase.from("cobros").select("fecha, importe, facturas!inner(canal, computa_reparto)").gte("fecha", desde).lt("fecha", hasta),
      supabase.from("gastos").select("fecha, total, canal, categorias!inner(nombre)").gte("fecha", desde).lt("fecha", hasta),
      supabase.from("clientes").select("canal, fecha_inicio, fecha_baja"),
      supabase.from("v_kpis").select("caja_libre").single(),
    ]);
    if (kv.error) return setError(kv.error.message.includes("kpi_valores") ? "Falta la migración kpis_notas.sql." : kv.error.message);
    setManuales((kv.data as KpiValor[]) ?? []);
    setDiario((kd.data as Diario[]) ?? []);
    if (k.data) setCajaLibre(Number((k.data as { caja_libre: number }).caja_libre));

    const fact = vacio(), cobrado = vacio(), gasto = vacio(), altas = vacio(), bajas = vacio();
    const activos: Record<Negocio, number> = { online: 0, gym: 0 };
    for (const f of (fac.data as { fecha_emision: string; total: number; canal: string | null; computa_reparto: boolean | null }[]) ?? []) {
      if (f.computa_reparto === false) continue;
      fact[canalDe(f.canal)][mesDe(f.fecha_emision)] += Number(f.total);
    }
    for (const c of (cob.data as unknown as { fecha: string; importe: number; facturas: { canal: string | null; computa_reparto: boolean | null } }[]) ?? []) {
      if (c.facturas?.computa_reparto === false) continue;
      cobrado[canalDe(c.facturas?.canal ?? null)][mesDe(c.fecha)] += Number(c.importe);
    }
    for (const g of (gas.data as unknown as { fecha: string; total: number; canal: string | null; categorias: { nombre: string } }[]) ?? []) {
      if (/mina/i.test(g.categorias?.nombre ?? "")) continue; // nóminas = reparto, no gasto
      gasto[canalDe(g.canal)][mesDe(g.fecha)] += Number(g.total);
    }
    for (const c of (cli.data as { canal: string | null; fecha_inicio: string | null; fecha_baja: string | null }[]) ?? []) {
      const neg = canalDe(c.canal);
      if (c.fecha_inicio?.startsWith(String(anyo))) altas[neg][mesDe(c.fecha_inicio)]++;
      if (c.fecha_baja?.startsWith(String(anyo))) bajas[neg][mesDe(c.fecha_baja)]++;
      if (c.fecha_inicio && !c.fecha_baja) activos[neg]++;
    }
    setAuto({ fact, cobrado, gasto, altas, bajas, activos });
  }, [anyo]);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  // Carga el funnel del día elegido (para editar lo ya apuntado)
  useEffect(() => {
    const d = diario.find((x) => x.fecha === fechaFunnel && x.negocio === negocio);
    setFunnelHoy({
      bienvenidas: d ? String(d.bienvenidas) : "",
      inbounds: d ? String(d.inbounds) : "",
      agendas_bienvenidas: d ? String(d.agendas_bienvenidas) : "",
      agendas_inbounds: d ? String(d.agendas_inbounds) : "",
      cierres: d ? String(d.cierres) : "",
    });
  }, [fechaFunnel, negocio, diario]);

  async function guardarFunnel() {
    const fila = {
      fecha: fechaFunnel,
      negocio,
      bienvenidas: Number(funnelHoy.bienvenidas) || 0,
      inbounds: Number(funnelHoy.inbounds) || 0,
      agendas_bienvenidas: Number(funnelHoy.agendas_bienvenidas) || 0,
      agendas_inbounds: Number(funnelHoy.agendas_inbounds) || 0,
      cierres: Number(funnelHoy.cierres) || 0,
    };
    const { error } = await supabase.from("kpi_diario").upsert(fila);
    if (error) return setError(error.message);
    setOk("Funnel guardado ✓");
    setTimeout(() => setOk(null), 2000);
    cargar();
  }

  async function guardarManual(metrica: string, mesIdx: number, texto: string) {
    const mes = `${anyo}-${String(mesIdx + 1).padStart(2, "0")}-01`;
    const v = texto.trim();
    if (v === "") {
      await supabase.from("kpi_valores").delete().eq("mes", mes).eq("negocio", negocio).eq("metrica", metrica);
    } else {
      const num = Number(v.replace(",", "."));
      if (!Number.isFinite(num)) return setError("Número no válido.");
      const { error } = await supabase.from("kpi_valores").upsert({ mes, negocio, metrica, valor: num });
      if (error) return setError(error.message);
    }
    cargar();
  }

  const valorManual = useCallback(
    (metrica: string, mesIdx: number): number | null => {
      const mes = `${anyo}-${String(mesIdx + 1).padStart(2, "0")}-01`;
      const f = manuales.find((x) => x.mes === mes && x.negocio === negocio && x.metrica === metrica);
      return f ? Number(f.valor) : null;
    },
    [manuales, negocio, anyo]
  );

  // Funnel mensual (suma del diario)
  const funnelMes = useMemo(() => {
    const campos = ["bienvenidas", "inbounds", "agendas_bienvenidas", "agendas_inbounds", "cierres"] as const;
    const out: Record<string, number[]> = {};
    for (const c of campos) out[c] = Array(12).fill(0);
    for (const d of diario) {
      if (d.negocio !== negocio) continue;
      const m = new Date(d.fecha + "T00:00:00").getMonth();
      for (const c of campos) out[c][m] += Number(d[c]);
    }
    return out;
  }, [diario, negocio]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const cabecera = (extra?: string) => (
    <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
      <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">{extra ?? "Métrica"}</th>
      {MESES.map((m) => <th key={m} className="min-w-12 px-2 py-1.5 text-right">{m}</th>)}
      <th className="min-w-14 px-3 py-1.5 text-right text-zinc-400">Total</th>
    </tr>
  );
  const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);

  const filaAuto = (etiqueta: string, vals: number[], cls = "text-zinc-300", fmt: (x: number) => string = n0, totalUltimo = false) => (
    <tr key={etiqueta} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/40">
      <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-1 text-zinc-400">{etiqueta}</td>
      {vals.map((v, i) => <Fragment key={i}>{celdaNum(v, cls, fmt)}</Fragment>)}
      <td className={`px-3 py-1 text-right font-bold tabular-nums ${cls}`}>
        {totalUltimo ? fmt([...vals].reverse().find((v) => Math.abs(v) > 0.005) ?? 0) : fmt(suma(vals))}
      </td>
    </tr>
  );

  const a = auto;
  const fact = a?.fact[negocio] ?? Array(12).fill(0);
  const cobr = a?.cobrado[negocio] ?? Array(12).fill(0);
  const gas = a?.gasto[negocio] ?? Array(12).fill(0);
  const beneficio = fact.map((v, i) => v - gas[i]);
  const margen = fact.map((v, i) => (v > 0 ? (v - gas[i]) / v : 0));

  // Contratación (GYM): beneficio medio de los últimos 3 meses con actividad
  const benGym = (a?.fact.gym ?? []).map((v, i) => v - (a?.gasto.gym[i] ?? 0));
  const mesesConDatos = benGym.map((v, i) => ({ v, i })).filter((x) => Math.abs(x.v) > 0.5 || (a?.fact.gym[x.i] ?? 0) > 0);
  const ultimos3 = mesesConDatos.slice(-3).map((x) => x.v);
  const benMedioGym = ultimos3.length ? ultimos3.reduce((s, x) => s + x, 0) / ultimos3.length : 0;
  const sueldoNum = Number(sueldo.replace(",", ".")) || 0;
  const costeEmpresa = sueldoNum * 1.33; // bruto + Seguridad Social a cargo de la empresa (~33%)
  const consumo = benMedioGym > 0 ? costeEmpresa / benMedioGym : Infinity;
  const colchon = costeEmpresa * 3;
  const semaforo = consumo <= 0.4 ? "verde" : consumo <= 0.7 ? "ambar" : "rojo";

  return (
    <Shell titulo="KPIs">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">KPIs</h1>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500">
              Finanzas y clientes se calculan solos con los datos de la app; tráfico y funnel se apuntan aquí.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-zinc-800">
              {([["online", "Online"], ["gym", "GYM"]] as [Negocio, string][]).map(([v, et]) => (
                <button
                  key={v}
                  onClick={() => setNegocio(v)}
                  className={`px-4 py-1.5 text-sm font-bold ${negocio === v ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"}`}
                >
                  {et}
                </button>
              ))}
            </div>
            <select value={anyo} onChange={(e) => setAnyo(Number(e.target.value))} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none">
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
        {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

        {/* FINANZAS Y CLIENTES (automático) */}
        <section className="mb-5">
          <h2 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-500">
            Finanzas y clientes · automático
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>{cabecera()}</thead>
              <tbody>
                {filaAuto("Facturación €", fact, "text-zinc-200")}
                {filaAuto("Cash collected €", cobr, "text-emerald-400")}
                {filaAuto("Gastos € (sin nóminas)", gas, "text-red-400")}
                {filaAuto("Beneficio €", beneficio, "text-white")}
                {filaAuto("Margen", margen, "text-zinc-400", pct, true)}
                {filaAuto("Altas clientes", a?.altas[negocio] ?? [], "text-emerald-400")}
                {filaAuto("Bajas clientes", a?.bajas[negocio] ?? [], "text-red-400")}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[10px] text-zinc-600">
            Activos ahora mismo: <b className="text-zinc-400">{a?.activos[negocio] ?? 0}</b>. Sale del CRM y el libro: no hay que apuntar nada.
          </p>
        </section>

        {/* TRÁFICO (manual) */}
        <section className="mb-5">
          <h2 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-sky-500">
            Tráfico y servicio · se apunta a mano
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>{cabecera()}</thead>
              <tbody>
                {METRICAS_MANUALES[negocio].map((m) => (
                  <tr key={m.clave} className="border-b border-zinc-800/40 hover:bg-zinc-900/40">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-0.5 text-zinc-400">{m.etiqueta}</td>
                    {MESES.map((_, i) => {
                      const v = valorManual(m.clave, i);
                      return (
                        <td key={i} className="px-0.5 py-0.5">
                          <input
                            key={`${negocio}-${anyo}-${m.clave}-${i}`}
                            defaultValue={v ?? ""}
                            onBlur={(e) => { const t = e.target.value; if ((v === null && t.trim() === "") || String(v ?? "") === t.trim()) return; guardarManual(m.clave, i, t); }}
                            inputMode="decimal"
                            className="w-full min-w-12 rounded border-0 bg-transparent px-1 py-0.5 text-right text-xs tabular-nums text-zinc-200 outline-none placeholder:text-zinc-800 focus:bg-zinc-800"
                            placeholder="·"
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-0.5 text-right font-bold tabular-nums text-zinc-300">
                      {(() => {
                        const vals = MESES.map((_, i) => valorManual(m.clave, i) ?? 0);
                        const t = /totales|activos/.test(m.clave) ? [...vals].reverse().find((x) => x !== 0) ?? 0 : suma(vals);
                        return t === 0 ? "" : n0(t);
                      })()}
                    </td>
                  </tr>
                ))}
                {/* Derivadas */}
                {filaAuto(
                  "Coste por seguidor €",
                  MESES.map((_, i) => {
                    const inv = valorManual("inversion_anuncios", i) ?? 0;
                    const seg = valorManual("nuevos_seguidores", i) ?? 0;
                    return seg > 0 ? inv / seg : 0;
                  }),
                  "text-zinc-500",
                  n2,
                  true
                )}
                {negocio === "online" &&
                  filaAuto(
                    "% Renovaciones",
                    MESES.map((_, i) => {
                      const ren = valorManual("renovaciones", i) ?? 0;
                      const par = valorManual("clientes_a_renovar", i) ?? 0;
                      return par > 0 ? ren / par : 0;
                    }),
                    "text-zinc-500",
                    pct,
                    true
                  )}
              </tbody>
            </table>
          </div>
        </section>

        {/* FUNNEL DE VENTAS */}
        <section className="mb-5">
          <h2 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-violet-400">
            Funnel de ventas · diario (se suma al mes)
          </h2>
          <div className="mb-2 flex flex-wrap items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-zinc-500">Día
              <input type="date" value={fechaFunnel} onChange={(e) => setFechaFunnel(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white outline-none" />
            </label>
            {([["bienvenidas", "Bienvenidas"], ["inbounds", "Inbounds"], ["agendas_bienvenidas", "Agendas B."], ["agendas_inbounds", "Agendas I."], ["cierres", "Cierres"]] as const).map(([k, et]) => (
              <label key={k} className="flex flex-col gap-1 text-[10px] font-bold uppercase text-zinc-500">{et}
                <input
                  inputMode="numeric"
                  value={funnelHoy[k]}
                  onChange={(e) => setFunnelHoy({ ...funnelHoy, [k]: e.target.value })}
                  className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-right text-xs text-white outline-none focus:border-red-500"
                  placeholder="0"
                />
              </label>
            ))}
            <button onClick={guardarFunnel} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white">Guardar día</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>{cabecera("Funnel")}</thead>
              <tbody>
                {filaAuto("Bienvenidas", funnelMes.bienvenidas, "text-zinc-300")}
                {filaAuto("Agendas bienvenidas", funnelMes.agendas_bienvenidas, "text-zinc-300")}
                {filaAuto("% agendas bienv.", funnelMes.bienvenidas.map((v, i) => (v > 0 ? funnelMes.agendas_bienvenidas[i] / v : 0)), "text-zinc-500", pct, true)}
                {filaAuto("Inbounds", funnelMes.inbounds, "text-zinc-300")}
                {filaAuto("Agendas inbounds", funnelMes.agendas_inbounds, "text-zinc-300")}
                {filaAuto("% agendas inb.", funnelMes.inbounds.map((v, i) => (v > 0 ? funnelMes.agendas_inbounds[i] / v : 0)), "text-zinc-500", pct, true)}
                {filaAuto("Agendas totales", funnelMes.agendas_bienvenidas.map((v, i) => v + funnelMes.agendas_inbounds[i]), "text-white")}
                {filaAuto("Cierres", funnelMes.cierres, "text-emerald-400")}
                {filaAuto("% cierre", funnelMes.agendas_bienvenidas.map((v, i) => { const ag = v + funnelMes.agendas_inbounds[i]; return ag > 0 ? funnelMes.cierres[i] / ag : 0; }), "text-emerald-500", pct, true)}
              </tbody>
            </table>
          </div>
        </section>

        {/* CONTRATACIÓN (solo GYM) */}
        {negocio === "gym" && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="mb-1 text-sm font-black text-white">¿Puedo contratar un empleado para el centro?</h2>
            <p className="mb-3 text-[11px] leading-snug text-zinc-500">
              Regla prudente: el coste no debería superar el <b>40%</b> del beneficio medio del gym, y conviene tener 3 meses de su coste como colchón.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                Sueldo bruto
                <input value={sueldo} onChange={(e) => setSueldo(e.target.value)} inputMode="decimal" className="w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-right text-sm text-white outline-none focus:border-red-500" />
                €/mes
              </label>
              <span className="text-[11px] text-zinc-500">
                Coste real empresa ≈ <b className="text-zinc-300">{n0(costeEmpresa)} €/mes</b> (con Seg. Social)
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase text-zinc-500">Beneficio medio GYM (3 meses)</p>
                <p className={`text-base font-black ${benMedioGym < 0 ? "text-red-400" : "text-white"}`}>{n0(benMedioGym)} €/mes</p>
              </div>
              <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase text-zinc-500">Consumiría del beneficio</p>
                <p className={`text-base font-black ${semaforo === "verde" ? "text-emerald-400" : semaforo === "ambar" ? "text-amber-400" : "text-red-400"}`}>
                  {Number.isFinite(consumo) ? pct(consumo) : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase text-zinc-500">Colchón necesario (3 meses)</p>
                <p className={`text-base font-black ${cajaLibre >= colchon ? "text-emerald-400" : "text-amber-400"}`}>
                  {n0(colchon)} € <span className="text-[10px] font-normal text-zinc-500">(caja libre {n0(cajaLibre)} €)</span>
                </p>
              </div>
            </div>
            <p className={`mt-3 rounded-lg px-3 py-2 text-[12px] font-bold ${
              semaforo === "verde" && cajaLibre >= colchon
                ? "bg-emerald-950 text-emerald-300"
                : semaforo === "rojo"
                  ? "bg-red-950 text-red-300"
                  : "bg-amber-950 text-amber-300"
            }`}>
              {semaforo === "verde" && cajaLibre >= colchon
                ? `✓ Sí: podéis pagar ${n0(sueldoNum)} € brutos/mes con margen. Techo prudente ahora mismo: ${n0((benMedioGym * 0.4) / 1.33)} € brutos/mes.`
                : semaforo === "verde"
                  ? `Casi: el sueldo es asumible, pero falta colchón (${n0(Math.max(0, colchon - cajaLibre))} € más de caja libre).`
                  : semaforo === "ambar"
                    ? `Justo: consumiría ${pct(consumo)} del beneficio. Asumible a media jornada o esperando a subir el beneficio a ${n0(costeEmpresa / 0.4)} €/mes.`
                    : benMedioGym > 0
                      ? `Aún no: el beneficio del gym tendría que llegar a ${n0(costeEmpresa / 0.4)} €/mes (hoy ${n0(benMedioGym)} €). Techo asumible hoy: ${n0(Math.max(0, (benMedioGym * 0.4) / 1.33))} € brutos/mes.`
                      : "Aún no: el gym no tiene beneficio medio positivo en los últimos meses."}
            </p>
          </section>
        )}
      </div>
    </Shell>
  );
}
