"use client";

// Pérdidas y ganancias por negocio (ONLINE / PRESENCIAL / total Ethos).
// Criterios pactados con David:
//  · Las NÓMINAS no son gasto: son retirada del beneficio (50/50 del centro +
//    lo individual del online). Van en una línea informativa aparte.
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

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500";

type Negocio = "online" | "presencial";

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

  const celda = (v: number, cls = "text-zinc-300") =>
    Math.abs(v) < 0.005 ? <td className="px-2 py-1 text-right text-zinc-800">·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls}`}>{n2(v)}</td>;

  const tabla = (titulo: string, colorTitulo: string, b: Bloque, neg: Negocio | "total") => {
    const resultadoOp = b.ingresos.map((v, i) => v - b.gastosOp[i]);
    const resultadoNeto = resultadoOp.map((v, i) => v - b.amort[i]);
    // En el total, "queda en la empresa" usa las retiradas del MES (alineadas), no las pagadas en caja
    const retMes = neg === "total" ? datos.alineadas : b.retiradas;
    const quedaEmpresa = resultadoNeto.map((v, i) => v - retMes[i]);
    const ingresosTot = suma(b.ingresos);
    const margen = ingresosTot > 0 ? (suma(resultadoOp) / ingresosTot) * 100 : null;
    const fijosTot = suma(b.fijos);
    const cobertura = fijosTot > 0 ? ingresosTot / fijosTot : null; // ingresos / gastos fijos
    // Pro-forma: el coste imputado solo en meses con actividad (no en meses futuros vacíos)
    const imp = neg === "total" ? imputado.online + imputado.presencial : imputado[neg];
    const imputadoVals = b.ingresos.map((v, i) => (v !== 0 || b.gastosOp[i] !== 0 ? imp : 0));
    const conSueldos = resultadoNeto.map((v, i) => v - imputadoVals[i]);
    const filas: { nombre: string; vals: number[]; cls: string; negRojo?: boolean; nota?: string }[] = [
      { nombre: "Ingresos", vals: b.ingresos, cls: "text-emerald-400" },
      { nombre: "Gastos operativos", vals: b.gastosOp, cls: "text-red-400", nota: "sin retiradas de socios ni inversión; sueldos de empleados sí" },
      { nombre: "de los cuales fijos", vals: b.fijos, cls: "text-zinc-500", nota: "alquiler, préstamo, suministros, sueldos…" },
      { nombre: "Resultado operativo", vals: resultadoOp, cls: "font-bold text-white", negRojo: true },
      { nombre: "Amortización inversión", vals: b.amort, cls: "text-orange-400", nota: "coste repartido en su vida útil" },
      { nombre: "Resultado neto", vals: resultadoNeto, cls: "font-black text-white", negRojo: true },
      ...(imp > 0 ? [
        { nombre: "Coste de gestión imputado", vals: imputadoVals, cls: "text-fuchsia-400", nota: "pro-forma: pagar a alguien por lo que hoy hacen los socios" },
        { nombre: "Resultado con sueldos de mercado", vals: conSueldos, cls: "font-black text-fuchsia-200", negRojo: true, nota: "¿se sostiene delegado?" },
      ] : []),
      // Las retiradas no pertenecen a un negocio: salen del beneficio conjunto. Solo en el total.
      ...(neg === "total" ? [
        { nombre: "Retiradas del mes", vals: datos.alineadas, cls: "text-violet-400", nota: "las que genera el beneficio de este mes (se pagan al mes siguiente)" + (datos.provisional.some((p, i) => p && datos.alineadas[i] > 0) ? " · prev. = 0,8 × beneficio teórico si aún no se han pagado" : "") },
        { nombre: "pagadas en caja este mes", vals: b.retiradas, cls: "text-zinc-500", nota: "lo que salió del banco: cuadra con el Libro" },
        { nombre: "Queda en la empresa", vals: quedaEmpresa, cls: "font-bold text-zinc-400", negRojo: true, nota: "neto − retiradas del mes" },
      ] : []),
    ];
    return (
      <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className={`sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left text-[11px] ${colorTitulo}`}>
                {titulo}
                {margen !== null && <span className="ml-2 font-bold normal-case text-zinc-500">margen op. {margen.toFixed(1)}%</span>}
                {cobertura !== null && <span className="ml-2 font-bold normal-case text-zinc-500" title="Ingresos ÷ gastos fijos. Por debajo de 1, los fijos no se cubren.">cobertura fijos ×{cobertura.toFixed(2)}</span>}
              </th>
              {MESES.map((m) => <th key={m} className="min-w-16 px-2 py-2 text-right">{m}</th>)}
              <th className="min-w-20 border-l border-zinc-800 px-3 py-2 text-right text-zinc-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre} className={`border-b border-zinc-800/50 last:border-0 ${f.nombre.startsWith("Resultado") ? "bg-zinc-900/60" : ""}`}>
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-semibold text-zinc-300">
                  {f.nombre}
                  {f.nota && <span className="block text-[9px] font-normal text-zinc-600">{f.nota}</span>}
                </td>
                {f.vals.map((v, i) => (
                  <Fragment key={i}>{celda(v, f.negRojo && v < -0.005 ? "font-bold text-red-400" : f.cls)}</Fragment>
                ))}
                <td className={`border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums ${f.negRojo && suma(f.vals) < -0.005 ? "text-red-400" : "text-zinc-100"}`}>
                  {n2(suma(f.vals))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {tabla("ETHOS · Total", "text-white", datos.total, "total")}
      {tabla("ONLINE · Coaching", "text-sky-400", datos.online, "online")}
      {tabla("PRESENCIAL · Gym", "text-amber-400", datos.presencial, "presencial")}

      {/* RETIRADAS DE SOCIOS · de dónde sale el dinero (según el Reparto) */}
      {(() => {
        const o = datos.origen;
        const ret = datos.alineadas; // mismo mes que el beneficio que las genera
        const pctGym = o.gym.map((g, i) => { const t = g + o.online[i]; return t > 0 ? (g / t) * 100 : null; });
        const gT = suma(o.gym), tT = gT + suma(o.online);
        const filasR: { nombre: string; vals: number[]; cls: string; nota?: string }[] = [
          { nombre: "Retiradas del mes", vals: ret, cls: "font-bold text-violet-300", nota: "se pagan al mes siguiente; prev. si aún no se han pagado" },
          { nombre: "Beneficio teórico a repartir", vals: o.teorico, cls: "text-zinc-300", nota: "según las reglas del Reparto" },
          { nombre: "viene del gym (ethos, a medias)", vals: o.gym, cls: "text-amber-400" },
          { nombre: "viene del online (propio de cada socio)", vals: o.online, cls: "text-sky-400" },
        ];
        return (
          <div className="mb-5 overflow-x-auto rounded-xl border border-violet-900/60 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                  <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left text-[11px] text-violet-400">RETIRADAS DE SOCIOS · de dónde sale</th>
                  {MESES.map((m) => <th key={m} className="min-w-16 px-2 py-2 text-right">{m}</th>)}
                  <th className="min-w-20 border-l border-zinc-800 px-3 py-2 text-right text-zinc-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {filasR.map((f) => (
                  <tr key={f.nombre} className="border-b border-zinc-800/50">
                    <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-semibold text-zinc-300">{f.nombre}{f.nota && <span className="block text-[9px] font-normal text-zinc-600">{f.nota}</span>}</td>
                    {f.vals.map((v, i) => <Fragment key={i}>{celda(v, f.cls)}</Fragment>)}
                    <td className="border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums text-zinc-100">{n2(suma(f.vals))}</td>
                  </tr>
                ))}
                <tr className="text-zinc-500">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1">% que pone el gym</td>
                  {pctGym.map((p, i) => <td key={i} className="px-2 py-1 text-right tabular-nums">{p === null ? <span className="text-zinc-800">·</span> : p.toFixed(0) + "%"}</td>)}
                  <td className="border-l border-zinc-800 px-3 py-1 text-right tabular-nums">{tT > 0 ? ((gT / tT) * 100).toFixed(0) + "%" : "·"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      <p className="mt-1 text-[10px] leading-snug text-zinc-600">
        <b>Resultado operativo</b> = ingresos − gastos del día a día. <b>Resultado neto</b> = operativo − amortización
        (cada inversión reparte su coste en su vida útil, no resta de golpe). <b>Retiradas de socios</b> = lo que os lleváis
        del beneficio (gym a medias + el online de cada uno): no son gasto de ningún negocio, por eso solo aparecen en el total; van en el mes cuyo beneficio las genera (se cobran al siguiente) y «pagadas en caja» es lo que salió del banco ese mes,
        y el bloque «de dónde sale» muestra qué parte pone cada negocio según el Reparto. <b>Sueldos de empleados</b> sí son gasto
        (categoría Personal → Sueldos y salarios). <b>Coste de gestión imputado</b> = pro-forma de delegación: si pagarais a alguien
        por lo que hoy hacéis vosotros, ese sería el resultado real de cada negocio. <b>Cobertura fijos</b> = ingresos ÷ gastos fijos;
        por debajo de ×1 el negocio no cubre ni los fijos.
      </p>
    </div>
  );
}
