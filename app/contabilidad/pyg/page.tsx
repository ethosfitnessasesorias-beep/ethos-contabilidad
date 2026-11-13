"use client";

// Pérdidas y ganancias por negocio (ONLINE / PRESENCIAL / total Ethos).
// Criterios pactados con David:
//  · Las RETIRADAS DE SOCIOS no son gasto: son reparto del beneficio (gym a medias +
//    el online de cada uno). Solo en el total, alineadas al mes cuyo beneficio las genera.
//  · Los SUELDOS DE EMPLEADOS sí son gasto (categoría Personal → Sueldos y salarios).
//  · La INVERSIÓN no resta de golpe: se AMORTIZA mes a mes según la vida útil
//    de su categoría (maquinaria 5 años, obra y mobiliario 10; editable en BD).
//  · Devengo: facturas por fecha de emisión, gastos por fecha. Las correcciones
//    históricas y aportaciones de capital (computa_reparto=false) no computan.

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FactRow { fecha_emision: string; total: number; condonado: number | null; canal: string | null; computa_reparto: boolean | null }
interface GastoRow { fecha: string; total: number; canal: string | null; es_fijo: boolean | null; categorias: { nombre: string; es_inversion: boolean; es_retirada: boolean | null; es_fijo: boolean | null } | null }
interface RepRow { mes: string; socio: string; cobrado_propio: number; cobrado_ethos: number; iva_propio: number; iva_ethos: number; irpf_propio: number; irpf_ethos: number; gasto_propio: number; gasto_ethos: number; beneficio: number }
interface InvRow { fecha: string; total: number; canal: string | null; categorias: { amortiza_meses: number | null } | null }

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const n2 = (v: number) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);
const n0 = (v: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(v);

// Barras por mes: ingresos (verde) vs gastos operativos (rojo) y el signo del neto (▲▼).
function MiniBarras({ ing, gas, neto, mesActual, alto = 96 }: { ing: number[]; gas: number[]; neto: number[]; mesActual: number; alto?: number }) {
  const max = Math.max(1, ...ing, ...gas);
  return (
    <div className="flex items-end gap-1 px-3 pt-3" style={{ height: alto }}>
      {MESES.map((m, i) => (
        <div key={m} className={`flex h-full flex-1 flex-col items-center justify-end gap-0.5 rounded ${i === mesActual ? "bg-zinc-800/40" : ""}`}
          title={`${m}: ingresos ${n2(ing[i])} · gastos ${n2(gas[i])} · neto ${n2(neto[i])}`}>
          <span className={`text-[8px] font-bold leading-none ${neto[i] < -0.005 ? "text-red-400" : neto[i] > 0.005 ? "text-emerald-400" : "text-zinc-800"}`}>{Math.abs(neto[i]) > 0.005 ? (neto[i] > 0 ? "▲" : "▼") : ""}</span>
          <div className="flex w-full flex-1 items-end justify-center gap-px">
            <div className="w-1/2 rounded-t bg-emerald-500/80" style={{ height: `${(ing[i] / max) * 100}%` }} />
            <div className="w-1/2 rounded-t bg-red-500/70" style={{ height: `${(gas[i] / max) * 100}%` }} />
          </div>
          <span className={`text-[9px] ${i === mesActual ? "font-bold text-red-400" : "text-zinc-600"}`}>{m}</span>
        </div>
      ))}
    </div>
  );
}

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500";

type Negocio = "online" | "presencial";

// Resultado neto por mes: barra hacia arriba (verde) o hacia abajo (rojo) desde una línea de cero.
function BarrasNeto({ neto, mesActual, alto = 140 }: { neto: number[]; mesActual: number; alto?: number }) {
  const max = Math.max(1, ...neto.map((v) => Math.abs(v)));
  return (
    <div className="px-3 pt-2">
      <div className="flex gap-1" style={{ height: alto }}>
        {MESES.map((m, i) => {
          const v = neto[i];
          const h = (Math.abs(v) / max) * 50; // % de la mitad disponible
          return (
            <div key={m} className={`flex flex-1 flex-col rounded ${i === mesActual ? "bg-zinc-800/40" : ""}`} title={`${m}: neto ${n2(v)}`}>
              <div className="flex flex-1 items-end justify-center">{v > 0.005 && <div className="w-2/3 rounded-t bg-emerald-500/80" style={{ height: `${h * 2}%` }} />}</div>
              <div className="border-t border-zinc-700" />
              <div className="flex flex-1 items-start justify-center">{v < -0.005 && <div className="w-2/3 rounded-b bg-red-500/80" style={{ height: `${h * 2}%` }} />}</div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">{MESES.map((m, i) => <span key={m} className={`flex-1 text-center text-[9px] ${i === mesActual ? "font-bold text-red-400" : "text-zinc-600"}`}>{m}</span>)}</div>
    </div>
  );
}

interface Bloque {
  ingresos: number[];
  gastosOp: number[];   // sin nóminas ni inversión
  amort: number[];      // cuota mensual de amortización de inversiones
  retiradas: number[];  // nóminas (informativo: reparto del beneficio)
  fijos: number[];      // gastos fijos reales (alquiler, préstamo, sueldos…): sin retiradas ni inversión
}

const bloqueVacio = (): Bloque => ({
  ingresos: Array(12).fill(0),
  gastosOp: Array(12).fill(0),
  amort: Array(12).fill(0),
  retiradas: Array(12).fill(0),
  fijos: Array(12).fill(0),
});


export default function PyGPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [facturas, setFacturas] = useState<FactRow[]>([]);
  const [gastos, setGastos] = useState<GastoRow[]>([]);
  const [inversiones, setInversiones] = useState<InvRow[]>([]);
  const [reparto, setReparto] = useState<RepRow[]>([]);
  // Pro-forma de delegación: coste mensual (coste empresa) de pagar a alguien por lo que hoy hacen los socios
  const [imputado, setImputado] = useState<Record<Negocio, number>>({ online: 0, presencial: 0 });
  const [graf, setGraf] = useState<Negocio | "total">("total"); // pestaña de las gráficas del final
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const desde = `${anyo}-01-01`;
      const hasta = `${anyo + 1}-01-01`;
      const [f, g, inv, cfg, rep] = await Promise.all([
        supabase.from("facturas").select("fecha_emision, total, condonado, canal, computa_reparto").gte("fecha_emision", desde).lt("fecha_emision", hasta),
        supabase.from("gastos").select("fecha, total, canal, es_fijo, categorias(nombre, es_inversion, es_retirada, es_fijo)").gte("fecha", desde).lt("fecha", hasta),
        // Inversiones de TODA la historia: su amortización puede caer en este año
        supabase.from("gastos").select("fecha, total, canal, categorias!inner(amortiza_meses, es_inversion)").eq("categorias.es_inversion", true),
        supabase.from("config").select("clave, valor").in("clave", ["coste_gestion_online", "coste_gestion_presencial"]),
        supabase.from("v_reparto_beneficios").select("mes, socio, cobrado_propio, cobrado_ethos, iva_propio, iva_ethos, irpf_propio, irpf_ethos, gasto_propio, gasto_ethos, beneficio").gte("mes", desde).lt("mes", hasta),
      ]);
      if (f.error) return setError(f.error.message);
      if (g.error) return setError(g.error.message);
      setFacturas((f.data as unknown as FactRow[]) ?? []);
      setGastos((g.data as unknown as GastoRow[]) ?? []);
      setInversiones((inv.data as unknown as InvRow[]) ?? []);
      setReparto((rep.data as unknown as RepRow[]) ?? []);
      const imp: Record<Negocio, number> = { online: 0, presencial: 0 };
      for (const c of (cfg.data as { clave: string; valor: number }[]) ?? []) {
        if (c.clave === "coste_gestion_online") imp.online = Number(c.valor);
        if (c.clave === "coste_gestion_presencial") imp.presencial = Number(c.valor);
      }
      setImputado(imp);
    })();
  }, [anyo]);

  const datos = useMemo(() => {
    const b: Record<Negocio, Bloque> = { online: bloqueVacio(), presencial: bloqueVacio() };
    for (const f of facturas) {
      if (f.computa_reparto === false) continue; // aportaciones de capital / correcciones
      const m = new Date(f.fecha_emision + "T00:00:00").getMonth();
      const n: Negocio = f.canal === "online" ? "online" : "presencial";
      // Lo condonado (perdonado) NO es ingreso: se resta para que el P&G sea fiel.
      // No toca Libro ni Reparto, que trabajan sobre lo cobrado.
      b[n].ingresos[m] += Number(f.total) - Math.min(Number(f.condonado ?? 0), Number(f.total));
    }
    for (const g of gastos) {
      if (g.categorias?.es_inversion) continue; // la inversión entra amortizada, no de golpe
      const m = new Date(g.fecha + "T00:00:00").getMonth();
      const n: Negocio = g.canal === "online" ? "online" : "presencial";
      if (g.categorias?.es_retirada) b[n].retiradas[m] += Number(g.total); // reparto, no gasto
      else {
        b[n].gastosOp[m] += Number(g.total);
        if (g.es_fijo ?? g.categorias?.es_fijo) b[n].fijos[m] += Number(g.total);
      }
    }
    // Amortización: cada inversión reparte su coste en su vida útil (meses)
    for (const inv of inversiones) {
      const meses = Number(inv.categorias?.amortiza_meses) || 60;
      const cuota = Number(inv.total) / meses;
      const ini = new Date(inv.fecha + "T00:00:00");
      const n: Negocio = inv.canal === "online" ? "online" : "presencial";
      for (let m = 0; m < 12; m++) {
        const diff = (anyo - ini.getFullYear()) * 12 + (m - ini.getMonth());
        if (diff >= 0 && diff < meses) b[n].amort[m] += cuota;
      }
    }
    const total: Bloque = bloqueVacio();
    (["online", "presencial"] as Negocio[]).forEach((n) => {
      (Object.keys(total) as (keyof Bloque)[]).forEach((k) => {
        b[n][k].forEach((v, i) => (total[k][i] += v));
      });
    });
    // De dónde sale el beneficio que se reparte (misma fórmula que la vista del Reparto):
    // "propio" = el online de cada socio; "ethos" = el gym a medias.
    const origen = { online: Array(12).fill(0), gym: Array(12).fill(0), teorico: Array(12).fill(0), nominaTeorica: Array(12).fill(0) };
    for (const r of reparto) {
      const m = new Date(r.mes + "T00:00:00").getMonth();
      origen.online[m] += Number(r.cobrado_propio) - Number(r.iva_propio) - Number(r.irpf_propio) - Number(r.gasto_propio);
      origen.gym[m] += Number(r.cobrado_ethos) - Number(r.iva_ethos) - Number(r.irpf_ethos) - Number(r.gasto_ethos);
      origen.teorico[m] += Number(r.beneficio);
      origen.nominaTeorica[m] += 0.8 * Math.max(0, Number(r.beneficio)); // nómina teórica = 80% del beneficio positivo de cada socio
    }
    // Las retiradas se pagan al mes SIGUIENTE al beneficio que las genera (la "nómina de
    // agosto" se cobra en septiembre). Comparar el resultado de un mes con lo pagado ese
    // mismo mes mezcla dos meses distintos y da negativos falsos. Se alinean: retiradas del
    // mes i = las pagadas en i+1; si aún no se han pagado, estimación 0,8 × beneficio teórico.
    const pagadas = total.retiradas;
    const alineadas: number[] = Array(12).fill(0);
    const provisional: boolean[] = Array(12).fill(false);
    for (let i = 0; i < 12; i++) {
      const activo = total.ingresos[i] !== 0 || total.gastosOp[i] !== 0;
      if (i < 11 && pagadas[i + 1] > 0) alineadas[i] = pagadas[i + 1];
      else if (activo) { alineadas[i] = origen.nominaTeorica[i]; provisional[i] = true; }
    }
    return { ...b, total, origen, alineadas, provisional };
  }, [facturas, gastos, inversiones, reparto, anyo]);

  async function guardarImputado(neg: Negocio, texto: string) {
    const v = Math.max(0, Math.round((Number(texto.replace(",", ".")) || 0) * 100) / 100);
    setImputado((p) => ({ ...p, [neg]: v }));
    const { error } = await supabase.from("config").upsert({ clave: "coste_gestion_" + neg, valor: v, descripcion: "Pro-forma de delegación (P&G): coste mensual de sustituir el trabajo de los socios en este negocio." });
    if (error) setError(error.message);
  }

  const celda = (v: number, cls = "text-zinc-300", extra = "") =>
    Math.abs(v) < 0.005 ? <td className={`px-2 py-1 text-right text-zinc-800 ${extra}`}>·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls} ${extra}`}>{n2(v)}</td>;
  // Celdas de resultado: verde si positivo, rojo si negativo (con fondo suave para leerlo de un vistazo)
  const celdaResultado = (v: number, fuerte = false) =>
    Math.abs(v) < 0.005 ? <td className="px-2 py-1 text-right text-zinc-800">·</td>
    : <td className={`px-2 py-1 text-right tabular-nums ${fuerte ? "font-black" : "font-bold"} ${v < 0 ? "bg-red-950/40 text-red-300" : "bg-emerald-950/30 text-emerald-300"}`}>{n2(v)}</td>;
  const signo = (v: number) => (v < -0.005 ? "text-red-400" : v > 0.005 ? "text-emerald-400" : "text-zinc-500");
  const colorCobertura = (c: number | null) => (c === null ? "text-zinc-500" : c < 1 ? "text-red-400" : c < 1.5 ? "text-amber-400" : "text-emerald-400");

  const hoy = new Date();
  const mesActual = hoy.getFullYear() === anyo ? hoy.getMonth() : -1;

  // Cálculo común de un bloque: lo usan las tarjetas, la comparativa y las tablas mensuales,
  // así no pueden discrepar entre sí.
  const calc = (b: Bloque, neg: Negocio | "total") => {
    const resultadoOp = b.ingresos.map((v, i) => v - b.gastosOp[i]);
    const resultadoNeto = resultadoOp.map((v, i) => v - b.amort[i]);
    // En el total, "queda en la empresa" usa las retiradas del MES (alineadas), no las pagadas en caja
    const retMes = neg === "total" ? datos.alineadas : b.retiradas;
    const quedaEmpresa = resultadoNeto.map((v, i) => v - retMes[i]);
    // Pro-forma: el coste imputado solo en meses con actividad (no en meses futuros vacíos)
    const imp = neg === "total" ? imputado.online + imputado.presencial : imputado[neg];
    const activo = b.ingresos.map((v, i) => v !== 0 || b.gastosOp[i] !== 0);
    const imputadoVals = activo.map((a) => (a ? imp : 0));
    const conSueldos = resultadoNeto.map((v, i) => v - imputadoVals[i]);
    const ingresosTot = suma(b.ingresos), fijosTot = suma(b.fijos);
    const margen = ingresosTot > 0 ? (suma(resultadoOp) / ingresosTot) * 100 : null;
    const cobertura = fijosTot > 0 ? ingresosTot / fijosTot : null; // ingresos / gastos fijos
    const ultimo = activo.lastIndexOf(true); // último mes con datos
    return { resultadoOp, resultadoNeto, retMes, quedaEmpresa, imp, imputadoVals, conSueldos, margen, cobertura, ultimo };
  };

  type TipoFila = "ing" | "gas" | "sub" | "res" | "info" | "ret" | "queda";
  const estiloFila: Record<TipoFila, { tr: string; nombre: string; barra: string }> = {
    ing: { tr: "", nombre: "text-emerald-300", barra: "border-emerald-500" },
    gas: { tr: "", nombre: "text-red-300", barra: "border-red-500" },
    sub: { tr: "", nombre: "pl-5 text-[11px] text-zinc-500", barra: "border-transparent" },
    res: { tr: "border-t border-zinc-700 bg-zinc-900/70", nombre: "text-white", barra: "border-zinc-300" },
    info: { tr: "", nombre: "text-zinc-400", barra: "border-zinc-700" },
    ret: { tr: "bg-violet-950/15", nombre: "text-violet-300", barra: "border-violet-500" },
    queda: { tr: "border-t border-violet-900 bg-violet-950/25", nombre: "text-violet-100", barra: "border-violet-400" },
  };

  const tabla = (titulo: string, colorTitulo: string, b: Bloque, neg: Negocio | "total") => {
    const c = calc(b, neg);
    type Fila = { nombre: string; vals: number[]; tipo: TipoFila; resultado?: boolean; fuerte?: boolean; nota?: string; cls?: string };
    const filas: Fila[] = [
      { nombre: "Ingresos", vals: b.ingresos, tipo: "ing", cls: "text-emerald-400" },
      { nombre: "Gastos operativos", vals: b.gastosOp, tipo: "gas", cls: "text-red-400", nota: "sin retiradas de socios ni inversión; sueldos de empleados sí" },
      { nombre: "de los cuales fijos", vals: b.fijos, tipo: "sub", cls: "text-zinc-500", nota: "alquiler, préstamo, suministros, sueldos…" },
      { nombre: "Resultado operativo", vals: c.resultadoOp, tipo: "res", resultado: true },
      { nombre: "Amortización inversión", vals: b.amort, tipo: "info", cls: "text-orange-400", nota: "coste repartido en su vida útil" },
      { nombre: "Resultado neto", vals: c.resultadoNeto, tipo: "res", resultado: true, fuerte: true },
      ...(c.imp > 0 ? [
        { nombre: "Coste de gestión imputado", vals: c.imputadoVals, tipo: "info" as TipoFila, cls: "text-fuchsia-400", nota: "pro-forma: pagar a alguien por lo que hoy hacen los socios" },
        { nombre: "Resultado con sueldos de mercado", vals: c.conSueldos, tipo: "res" as TipoFila, resultado: true, fuerte: true, nota: "¿se sostiene delegado?" },
      ] : []),
      // Las retiradas no pertenecen a un negocio: salen del beneficio conjunto. Solo en el total.
      ...(neg === "total" ? [
        { nombre: "Retiradas del mes", vals: datos.alineadas, tipo: "ret" as TipoFila, cls: "text-violet-300", nota: "las que genera el beneficio de este mes (se pagan al mes siguiente)" + (datos.provisional.some((p, i) => p && datos.alineadas[i] > 0) ? " · prev. = 0,8 × beneficio teórico si aún no se han pagado" : "") },
        { nombre: "pagadas en caja este mes", vals: b.retiradas, tipo: "sub" as TipoFila, cls: "text-zinc-500", nota: "lo que salió del banco: cuadra con el Libro" },
        { nombre: "Queda en la empresa", vals: c.quedaEmpresa, tipo: "queda" as TipoFila, resultado: true, fuerte: true, nota: "neto − retiradas del mes" },
      ] : []),
    ];
    return (
      <div className="mb-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-wrap items-baseline gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className={`text-[12px] font-black uppercase tracking-wider ${colorTitulo}`}>{titulo}</span>
          {c.margen !== null && <span className="text-[11px] text-zinc-500">margen op. <b className={c.margen < 0 ? "text-red-400" : "text-zinc-300"}>{c.margen.toFixed(1)}%</b></span>}
          {c.cobertura !== null && <span className="text-[11px] text-zinc-500" title="Ingresos ÷ gastos fijos. Por debajo de ×1 no se cubren ni los fijos.">cobertura fijos <b className={colorCobertura(c.cobertura)}>×{c.cobertura.toFixed(2)}</b></span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left">Concepto</th>
                {MESES.map((m, i) => <th key={m} className={`min-w-16 px-2 py-2 text-right ${i === mesActual ? "text-red-400" : ""}`}>{m}</th>)}
                <th className="min-w-20 border-l border-zinc-800 px-3 py-2 text-right text-zinc-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const e = estiloFila[f.tipo];
                const tot = suma(f.vals);
                return (
                  <tr key={f.nombre} className={`border-b border-zinc-800/50 last:border-0 ${e.tr}`}>
                    <td className={`sticky left-0 z-10 border-l-2 bg-zinc-950/95 px-3 py-1.5 font-semibold ${e.barra} ${e.nombre}`}>
                      {f.nombre}
                      {f.nota && <span className="block text-[9px] font-normal text-zinc-600">{f.nota}</span>}
                    </td>
                    {f.vals.map((v, i) => (
                      <Fragment key={i}>{f.resultado ? celdaResultado(v, f.fuerte) : celda(v, f.cls ?? "text-zinc-300", i === mesActual ? "bg-zinc-800/30" : "")}</Fragment>
                    ))}
                    <td className={`border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums ${f.resultado ? signo(tot) : "text-zinc-100"}`}>{n2(tot)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          Devengo · retiradas de socios aparte (son reparto, no gasto) · sueldos de empleados sí son gasto · inversión amortizada (maquinaria 5 años, obra y mobiliario 10).
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2 rounded-lg border border-fuchsia-900/60 bg-fuchsia-950/20 px-3 py-1.5 text-[11px] text-zinc-400" title="Pro-forma de delegación: lo que costaría al mes (coste empresa, con Seguridad Social) pagar a alguien por lo que hoy hacen los socios en cada negocio. Se guarda y se resta en la fila «Resultado con sueldos de mercado».">
          <span className="font-bold text-fuchsia-300">Coste de gestión imputado €/mes</span>
          {(["presencial", "online"] as Negocio[]).map((ng) => (
            <label key={ng} className="flex items-center gap-1">{ng === "online" ? "online" : "gym"}
              <input key={"imp-" + ng + "-" + imputado[ng]} defaultValue={imputado[ng] || ""} inputMode="decimal" placeholder="0"
                onBlur={(e) => { if (String(imputado[ng] || "") !== e.target.value.trim()) guardarImputado(ng, e.target.value); }}
                className="w-20 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-right text-xs tabular-nums text-white outline-none focus:border-fuchsia-500" />
            </label>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* RESUMEN DEL AÑO · tarjetas (lo que importa, de un vistazo) */}
      {(() => {
        const bloques: { key: Negocio | "total"; titulo: string; color: string; b: Bloque }[] = [
          { key: "total", titulo: "ETHOS · Total", color: "text-white", b: datos.total },
          { key: "online", titulo: "ONLINE · Coaching", color: "text-sky-400", b: datos.online },
          { key: "presencial", titulo: "PRESENCIAL · Gym", color: "text-amber-400", b: datos.presencial },
        ];
        return (
          <div className="mb-5 grid gap-3 lg:grid-cols-3">
            {bloques.map(({ key, titulo, color, b }) => {
              const c = calc(b, key);
              const u = c.ultimo;
              const netoU = u >= 0 ? c.resultadoNeto[u] : 0;
              const netoPrev = u > 0 ? c.resultadoNeto[u - 1] : null;
              return (
                <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className={`text-[11px] font-black uppercase tracking-wider ${color}`}>{titulo} · {anyo}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div><p className="text-[9px] font-bold uppercase text-zinc-500">Ingresos</p><p className="text-base font-black tabular-nums text-emerald-400">{n0(suma(b.ingresos))} €</p></div>
                    <div><p className="text-[9px] font-bold uppercase text-zinc-500">Gastos operativos</p><p className="text-base font-black tabular-nums text-red-400">{n0(suma(b.gastosOp))} €</p></div>
                    <div className="col-span-2 rounded-lg bg-zinc-950/60 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase text-zinc-500">Resultado neto (tras amortización)</p>
                      <p className={`text-2xl font-black tabular-nums ${signo(suma(c.resultadoNeto))}`}>{n0(suma(c.resultadoNeto))} €</p>
                      {u >= 0 && (
                        <p className="text-[10px] text-zinc-500">
                          {MESES[u]}: <b className={signo(netoU)}>{n0(netoU)} €</b>
                          {netoPrev !== null && <> · {MESES[u - 1]}: <b className={signo(netoPrev)}>{n0(netoPrev)} €</b></>}
                        </p>
                      )}
                    </div>
                    <div><p className="text-[9px] font-bold uppercase text-zinc-500">Margen operativo</p><p className={`text-sm font-bold ${c.margen !== null && c.margen < 0 ? "text-red-400" : "text-zinc-200"}`}>{c.margen === null ? "—" : c.margen.toFixed(1) + "%"}</p></div>
                    <div><p className="text-[9px] font-bold uppercase text-zinc-500">Cobertura de fijos</p><p className={`text-sm font-bold ${colorCobertura(c.cobertura)}`}>{c.cobertura === null ? "—" : "×" + c.cobertura.toFixed(2)}</p></div>
                    {c.imp > 0 && <div className="col-span-2"><p className="text-[9px] font-bold uppercase text-fuchsia-400">Con sueldos de mercado (pro-forma)</p><p className={`text-sm font-black tabular-nums ${signo(suma(c.conSueldos))}`}>{n0(suma(c.conSueldos))} €</p></div>}
                    {key === "total" && (
                      <>
                        <div><p className="text-[9px] font-bold uppercase text-violet-400">Retiradas del mes (año)</p><p className="text-sm font-bold tabular-nums text-violet-300">{n0(suma(datos.alineadas))} €</p></div>
                        <div><p className="text-[9px] font-bold uppercase text-violet-400">Queda en la empresa</p><p className={`text-sm font-black tabular-nums ${signo(suma(c.quedaEmpresa))}`}>{n0(suma(c.quedaEmpresa))} €</p></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* COMPARATIVA ANUAL · online vs gym vs total */}
      {(() => {
        const cols: { key: Negocio | "total"; titulo: string; color: string; b: Bloque }[] = [
          { key: "online", titulo: "Online", color: "text-sky-400", b: datos.online },
          { key: "presencial", titulo: "Gym", color: "text-amber-400", b: datos.presencial },
          { key: "total", titulo: "Total", color: "text-white", b: datos.total },
        ];
        const cs = cols.map((x) => ({ ...x, c: calc(x.b, x.key) }));
        const num = (v: number, res: boolean) => <td className={`px-3 py-1.5 text-right tabular-nums ${res ? (v < -0.005 ? "bg-red-950/40 font-black text-red-300" : "bg-emerald-950/30 font-black text-emerald-300") : "text-zinc-300"}`}>{n2(v)}</td>;
        const filasC: { nombre: string; f: (x: (typeof cs)[number]) => number; res?: boolean }[] = [
          { nombre: "Ingresos", f: (x) => suma(x.b.ingresos) },
          { nombre: "Gastos operativos", f: (x) => suma(x.b.gastosOp) },
          { nombre: "de los cuales fijos", f: (x) => suma(x.b.fijos) },
          { nombre: "Resultado operativo", f: (x) => suma(x.c.resultadoOp), res: true },
          { nombre: "Amortización inversión", f: (x) => suma(x.b.amort) },
          { nombre: "Resultado neto", f: (x) => suma(x.c.resultadoNeto), res: true },
          { nombre: "Coste de gestión imputado", f: (x) => suma(x.c.imputadoVals) },
          { nombre: "Resultado con sueldos de mercado", f: (x) => suma(x.c.conSueldos), res: true },
        ];
        return (
          <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                  <th className="px-3 py-2 text-left text-[11px] text-zinc-300">Resumen anual {anyo} · online vs gym</th>
                  {cs.map((x) => <th key={x.key} className={`min-w-24 px-3 py-2 text-right text-[11px] ${x.color}`}>{x.titulo}</th>)}
                  <th className="min-w-28 px-3 py-2 text-right">reparto del total</th>
                </tr>
              </thead>
              <tbody>
                {filasC.map((r) => {
                  const vals = cs.map((x) => r.f(x));
                  const t = vals[2];
                  return (
                    <tr key={r.nombre} className={`border-b border-zinc-800/50 ${r.res ? "bg-zinc-900/60" : ""}`}>
                      <td className={`px-3 py-1.5 font-semibold ${r.res ? "text-white" : r.nombre.startsWith("de los") ? "pl-6 text-zinc-500" : "text-zinc-300"}`}>{r.nombre}</td>
                      {vals.map((v, i) => <Fragment key={i}>{num(v, !!r.res)}</Fragment>)}
                      <td className="px-3 py-1.5 text-right text-[10px] tabular-nums text-zinc-500">{Math.abs(t) > 0.005 ? `online ${((vals[0] / t) * 100).toFixed(0)}% · gym ${((vals[1] / t) * 100).toFixed(0)}%` : "·"}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-zinc-700">
                  <td className="px-3 py-1.5 font-semibold text-zinc-300">Margen operativo</td>
                  {cs.map((x) => <td key={x.key} className={`px-3 py-1.5 text-right font-bold tabular-nums ${x.c.margen !== null && x.c.margen < 0 ? "text-red-400" : "text-zinc-200"}`}>{x.c.margen === null ? "—" : x.c.margen.toFixed(1) + "%"}</td>)}
                  <td />
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-semibold text-zinc-300">Cobertura de fijos <span className="text-[9px] font-normal text-zinc-600">(ingresos ÷ fijos · verde ≥ ×1,5 · ámbar ×1–1,5 · rojo &lt; ×1)</span></td>
                  {cs.map((x) => <td key={x.key} className={`px-3 py-1.5 text-right font-bold tabular-nums ${colorCobertura(x.c.cobertura)}`}>{x.c.cobertura === null ? "—" : "×" + x.c.cobertura.toFixed(2)}</td>)}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* TABLAS MENSUALES */}
      {tabla("ETHOS · Total", "text-white", datos.total, "total")}
      {tabla("ONLINE · Coaching", "text-sky-400", datos.online, "online")}
      {tabla("PRESENCIAL · Gym", "text-amber-400", datos.presencial, "presencial")}

      {/* ¿DE DÓNDE SALE EL BENEFICIO QUE OS REPARTÍS? (según las reglas del Reparto) */}
      {(() => {
        const o = datos.origen;
        const gT = suma(o.gym), tT = suma(o.teorico);
        const filasR: { nombre: string; vals: number[]; cls: string; nota?: string }[] = [
          { nombre: "Lo que pone el gym", vals: o.gym, cls: "text-amber-400", nota: "beneficio del centro: se reparte a medias" },
          { nombre: "Lo que pone el online", vals: o.online, cls: "text-sky-400", nota: "beneficio del online de cada socio: cada uno el suyo" },
          { nombre: "Beneficio a repartir", vals: o.teorico, cls: "font-bold text-violet-300", nota: "gym + online · de aquí salen las «Retiradas del mes» de arriba" },
        ];
        return (
          <div className="mb-5 overflow-x-auto rounded-xl border border-violet-900/60 bg-zinc-900/40">
            <div className="border-b border-zinc-800 bg-zinc-900 px-3 py-2">
              <p className="text-[12px] font-black uppercase tracking-wider text-violet-400">¿De dónde sale lo que os repartís?</p>
              <p className="text-[10px] text-zinc-500">Cada mes el Reparto calcula un beneficio a repartir. Esta tabla lo separa por origen: la parte generada por el gym (a medias) y la generada por el online (cada socio la suya). Si el gym pone el 70 %, el 70 % de lo que os lleváis lo ha generado el gym.</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                  <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left">Origen</th>
                  {MESES.map((m, i) => <th key={m} className={`min-w-16 px-2 py-2 text-right ${i === mesActual ? "text-red-400" : ""}`}>{m}</th>)}
                  <th className="min-w-20 border-l border-zinc-800 px-3 py-2 text-right text-zinc-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {filasR.map((f) => (
                  <tr key={f.nombre} className={`border-b border-zinc-800/50 ${f.nombre.startsWith("Beneficio") ? "bg-violet-950/20" : ""}`}>
                    <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-semibold text-zinc-300">{f.nombre}{f.nota && <span className="block text-[9px] font-normal text-zinc-600">{f.nota}</span>}</td>
                    {f.vals.map((v, i) => <Fragment key={i}>{celda(v, f.cls)}</Fragment>)}
                    <td className="border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums text-zinc-100">{n2(suma(f.vals))}</td>
                  </tr>
                ))}
                <tr className="text-zinc-400">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-semibold">% que pone el gym</td>
                  {o.gym.map((g, i) => { const t = o.teorico[i]; return <td key={i} className="px-2 py-1.5 text-right font-bold tabular-nums">{t > 0.005 ? Math.round((g / t) * 100) + "%" : <span className="text-zinc-800">·</span>}</td>; })}
                  <td className="border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums text-amber-300">{tT > 0.005 ? Math.round((gT / tT) * 100) + "%" : "·"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* GRÁFICAS · con pestaña Total / Online / Gym */}
      {(() => {
        const sel = graf === "total" ? datos.total : graf === "online" ? datos.online : datos.presencial;
        const c = calc(sel, graf);
        const pest: { key: Negocio | "total"; et: string; cls: string }[] = [
          { key: "total", et: "ETHOS · Total", cls: "text-white" },
          { key: "online", et: "Online", cls: "text-sky-400" },
          { key: "presencial", et: "Gym", cls: "text-amber-400" },
        ];
        return (
          <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="text-[12px] font-black uppercase tracking-wider text-zinc-300">Gráficas {anyo}</span>
              <div className="ml-2 flex gap-1">
                {pest.map((p) => (
                  <button key={p.key} onClick={() => setGraf(p.key)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${graf === p.key ? "bg-zinc-700 " + p.cls : "text-zinc-500 hover:bg-zinc-800"}`}>{p.et}</button>
                ))}
              </div>
              <span className="ml-auto flex gap-3 text-[10px] text-zinc-500">
                <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500/80" />ingresos</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-red-500/70" />gastos op.</span>
                <span>▲▼ signo del neto</span>
              </span>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <p className="px-3 pt-2 text-[10px] font-bold uppercase text-zinc-500">Ingresos vs gastos operativos</p>
                <MiniBarras ing={sel.ingresos} gas={sel.gastosOp} neto={c.resultadoNeto} mesActual={mesActual} alto={170} />
              </div>
              <div>
                <p className="px-3 pt-2 text-[10px] font-bold uppercase text-zinc-500">Resultado neto por mes (tras amortización)</p>
                <BarrasNeto neto={c.resultadoNeto} mesActual={mesActual} alto={150} />
              </div>
            </div>
          </div>
        );
      })()}

      <p className="mt-1 text-[10px] leading-snug text-zinc-600">
        <b>Resultado operativo</b> = ingresos − gastos del día a día. <b>Resultado neto</b> = operativo − amortización
        (cada inversión reparte su coste en su vida útil, no resta de golpe). <b>Retiradas de socios</b> = lo que os lleváis
        del beneficio (gym a medias + el online de cada uno): no son gasto de ningún negocio, por eso solo aparecen en el total; van en el mes cuyo beneficio las genera (se cobran al siguiente) y «pagadas en caja» es lo que salió del banco ese mes,
        y el bloque «¿De dónde sale lo que os repartís?» muestra qué parte del beneficio repartido ha generado cada negocio. <b>Sueldos de empleados</b> sí son gasto
        (categoría Personal → Sueldos y salarios). <b>Coste de gestión imputado</b> = pro-forma de delegación: si pagarais a alguien
        por lo que hoy hacéis vosotros, ese sería el resultado real de cada negocio. <b>Cobertura fijos</b> = ingresos ÷ gastos fijos;
        por debajo de ×1 el negocio no cubre ni los fijos.
      </p>
    </div>
  );
}
