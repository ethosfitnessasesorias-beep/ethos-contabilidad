"use client";

// Previsión de tesorería BASADA EN LA REALIDAD, componente a componente:
//  · Entra: MEDIANA de los últimos 6 meses de cobros (los meses con anuales o
//    semestres no la inflan como hacía la media de 3 meses).
//  · Fijos: media de 3 meses. Variables: mediana de 6. Inversión: fuera (puntual).
//  · Hacienda (categoría Impuestos): pago trimestral en ene/abr/jul/oct = total
//    del último año ÷ 4, en vez de diluir el pago de un mes en la media.
//  · Retiradas de socios: se pagan el mes SIGUIENTE al beneficio; se estiman como
//    el % histórico de nómina teórica sobre lo que entra (o media real, o nada).
// Se actualiza sola con los datos reales: no hay lista de recurrentes que mantener.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface GastoFijo {
  concepto: string;
  proveedor: string | null;
  base: number;
  iva_pct: number;
  irpf_pct: number;
  categoria_id: number;
  cuenta_id: number | null;
  imputado_a: string;
  canal: string | null;
  deducible: boolean;
  tiene_factura: boolean;
}

interface MesComp { mes: string; entra: number; fijos: number; variables: number; impuestos: number; retiradas: number; inversion: number; nomina: number }
interface Modelo {
  meses: MesComp[];
  entraMediana: number; entraMedia: number;
  fijos: number; variables: number;
  impuestosTrim: number;   // pago trimestral medio a Hacienda (último año ÷ 4)
  retiradasMedia: number;  // media real de retiradas pagadas (6 meses)
  pctNomina: number;       // nómina teórica (0,8 × beneficio) ÷ lo que entra, 6 meses
  nominaUltimo: number;    // nómina teórica del último mes completo: se paga el mes que viene
}
const modeloVacio: Modelo = { meses: [], entraMediana: 0, entraMedia: 0, fijos: 0, variables: 0, impuestosTrim: 0, retiradasMedia: 0, pctNomina: 0, nominaUltimo: 0 };

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const mesNombre = (d: Date) => d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function Tesoreria() {
  const [saldoActual, setSaldoActual] = useState(0);
  const [modelo, setModelo] = useState<Modelo>(modeloVacio);
  const [modoRetiradas, setModoRetiradas] = useState<"beneficio" | "media" | "ninguna">("beneficio");
  const [fijosPend, setFijosPend] = useState<GastoFijo[]>([]);
  const [verFijos, setVerFijos] = useState(false);
  const [apuntando, setApuntando] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meses, setMeses] = useState(6);
  const [escenarios, setEscenarios] = useState<{ nombre: string; ing: number; gas: number }[]>([
    { nombre: "Base", ing: 0, gas: 0 },
    { nombre: "Pesimista", ing: -15, gas: 10 },
    { nombre: "Optimista", ing: 15, gas: -5 },
  ]);
  const [editEscenarios, setEditEscenarios] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("config_texto").select("valor").eq("clave", "cashflow_escenarios").maybeSingle();
      if (data?.valor) {
        try {
          const v = JSON.parse(data.valor);
          if (Array.isArray(v) && v.length) setEscenarios(v);
        } catch {}
      }
    })();
  }, []);

  async function guardarEscenarios(nuevos: { nombre: string; ing: number; gas: number }[]) {
    setEscenarios(nuevos);
    await supabase.from("config_texto").upsert({
      clave: "cashflow_escenarios",
      valor: JSON.stringify(nuevos),
      descripcion: "Escenarios del cash flow (% ajuste ingresos/gastos)",
    });
  }

  const cargar = useCallback(async () => {
    const now = new Date();
    // Fecha del primer día de un mes con desfase (en meses) respecto al actual,
    // construida como texto para evitar el desplazamiento de zona horaria que da
    // toISOString (en UTC+2 devolvía el último día del mes anterior).
    const pad = (x: number) => String(x).padStart(2, "0");
    const primerDiaISO = (offset: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
    };
    const iniMesActualISO = primerDiaISO(0);
    const ini6ISO = primerDiaISO(-6);
    const ini12ISO = primerDiaISO(-12);

    const [s, cob, gas, rep] = await Promise.all([
      supabase.from("v_saldo_cuentas").select("saldo"),
      // Lo que entra de verdad (cobros que tocan caja) en los últimos 6 meses completos
      supabase.from("cobros").select("fecha, importe").eq("afecta_caja", true).gte("fecha", ini6ISO).lt("fecha", iniMesActualISO),
      // Gastos de 12 meses: los impuestos son trimestrales y hace falta un año para promediarlos
      supabase.from("gastos").select("fecha, total, irpf_soportado, es_fijo, categorias(nombre, es_fijo, es_inversion, es_retirada)").gte("fecha", ini12ISO).lt("fecha", iniMesActualISO),
      supabase.from("v_reparto_beneficios").select("mes, beneficio").gte("mes", ini6ISO).lt("mes", iniMesActualISO),
    ]);
    if (s.error) return setError(s.error.message);
    setSaldoActual((s.data ?? []).reduce((t: number, x: { saldo: number }) => t + Number(x.saldo), 0));

    // Cada mes se descompone en: entra · fijos · variables · Hacienda · retiradas · inversión.
    const key = (f: string) => f.slice(0, 7);
    const porMes = new Map<string, MesComp>();
    const get = (k: string) => {
      const m = porMes.get(k) ?? { mes: k, entra: 0, fijos: 0, variables: 0, impuestos: 0, retiradas: 0, inversion: 0, nomina: 0 };
      porMes.set(k, m);
      return m;
    };
    for (const c of (cob.data as { fecha: string; importe: number }[]) ?? []) get(key(c.fecha)).entra += Number(c.importe);
    let impuestos12 = 0;
    type GRow = { fecha: string; total: number; irpf_soportado: number; es_fijo: boolean | null; categorias: { nombre: string; es_fijo: boolean; es_inversion: boolean; es_retirada: boolean | null } | null };
    for (const g of (gas.data as unknown as GRow[]) ?? []) {
      const neto = Number(g.total) - Number(g.irpf_soportado); // salida real de caja (neto de IRPF retenido)
      const cat = g.categorias;
      const esImpuesto = cat?.nombre === "Impuestos";
      if (esImpuesto) impuestos12 += neto;
      if (g.fecha < ini6ISO) continue; // los 12 meses solo sirven para los impuestos
      const m = get(key(g.fecha));
      if (cat?.es_retirada) m.retiradas += neto;
      else if (cat?.es_inversion) m.inversion += neto;
      else if (esImpuesto) m.impuestos += neto;
      else if (g.es_fijo ?? cat?.es_fijo) m.fijos += neto;
      else m.variables += neto;
    }
    for (const r of (rep.data as { mes: string; beneficio: number }[]) ?? []) get(key(r.mes)).nomina += 0.8 * Math.max(0, Number(r.beneficio));

    const meses = [...porMes.values()].sort((a, b) => (a.mes < b.mes ? -1 : 1));
    const col = (k: keyof MesComp) => meses.map((m) => Number(m[k]));
    const media = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const mediana = (a: number[]) => { if (!a.length) return 0; const o = [...a].sort((x, y) => x - y); const h = o.length >> 1; return o.length % 2 ? o[h] : (o[h - 1] + o[h]) / 2; };
    const entra = col("entra");
    const sumEntra = entra.reduce((x, y) => x + y, 0);
    const ultimo = meses[meses.length - 1];
    setModelo({
      meses,
      entraMediana: mediana(entra),
      entraMedia: media(entra),
      fijos: media(col("fijos").slice(-3)),
      variables: mediana(col("variables")),
      impuestosTrim: impuestos12 / 4,
      retiradasMedia: media(col("retiradas")),
      pctNomina: sumEntra > 0 ? col("nomina").reduce((x, y) => x + y, 0) / sumEntra : 0,
      nominaUltimo: ultimo ? ultimo.nomina : 0,
    });

    // Gastos fijos de este mes por apuntar: copiar los del mes pasado que falten
    const iniMesPasado = primerDiaISO(-1);
    const [gPasado, gEste] = await Promise.all([
      supabase
        .from("gastos")
        .select("concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, imputado_a, canal, deducible, tiene_factura, categorias!inner(es_fijo, nombre, es_retirada)")
        .gte("fecha", iniMesPasado)
        .lt("fecha", iniMesActualISO),
      supabase.from("gastos").select("concepto").gte("fecha", iniMesActualISO),
    ]);
    const yaEste = new Set(((gEste.data as { concepto: string }[]) ?? []).map((g) => g.concepto.trim().toLowerCase()));
    const pend: GastoFijo[] = [];
    for (const g of (gPasado.data as unknown as (GastoFijo & { categorias: { es_fijo: boolean; nombre: string; es_retirada: boolean | null } })[]) ?? []) {
      if (!g.categorias?.es_fijo) continue;
      if (g.categorias.es_retirada) continue;
      if (yaEste.has(g.concepto.trim().toLowerCase())) continue;
      if (pend.some((p) => p.concepto.trim().toLowerCase() === g.concepto.trim().toLowerCase())) continue;
      pend.push(g);
    }
    setFijosPend(pend);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function apuntarFijos() {
    if (fijosPend.length === 0) return;
    setApuntando(true);
    const fecha = new Date().toISOString().slice(0, 10);
    const filas = fijosPend.map((g) => ({
      fecha, concepto: g.concepto, proveedor: g.proveedor, base: g.base, iva_pct: g.iva_pct, irpf_pct: g.irpf_pct,
      categoria_id: g.categoria_id, cuenta_id: g.cuenta_id, imputado_a: g.imputado_a, canal: g.canal,
      deducible: g.deducible, tiene_factura: g.tiene_factura,
      iva_soportado: g.deducible ? Math.round(g.base * g.iva_pct * 100) / 100 : 0, es_fijo: true,
    }));
    const { error } = await supabase.from("gastos").insert(filas);
    setApuntando(false);
    if (error) return setError(error.message);
    setOk(`${filas.length} gastos fijos apuntados a este mes ✓`);
    setTimeout(() => setOk(null), 3000);
    cargar();
  }

  // "Sale" normal de un mes (informativo): fijos + variables + Hacienda prorrateada + retiradas estimadas
  const impuestosMes = modelo.impuestosTrim / 3;
  const retiradaEstimada = modoRetiradas === "ninguna" ? 0 : modoRetiradas === "media" ? modelo.retiradasMedia : modelo.pctNomina * modelo.entraMediana;
  const saleMes = modelo.fijos + modelo.variables + impuestosMes + retiradaEstimada;
  const netoMes = modelo.entraMediana - saleMes;

  // Proyección mes a mes, cada componente con su lógica (ver cabecera del fichero).
  // Las retiradas del mes i salen de lo que entró en i−1 (se pagan con un mes de desfase);
  // el primer mes usa la nómina teórica real del último mes completo.
  const proyeccion = useMemo(() => {
    const filas: { mes: string; entra: number; gastos: number; impuestos: number; retiradas: number; saldos: number[] }[] = [];
    const saldos = escenarios.map(() => saldoActual);
    const entraPrev = escenarios.map(() => 0);
    const now = new Date();
    for (let i = 1; i <= meses; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const impuestos = [0, 3, 6, 9].includes(d.getMonth()) ? modelo.impuestosTrim : 0; // ene/abr/jul/oct
      let base = { entra: 0, gastos: 0, retiradas: 0 };
      escenarios.forEach((e, k) => {
        const entra = modelo.entraMediana * (1 + e.ing / 100);
        const gastos = (modelo.fijos + modelo.variables) * (1 + e.gas / 100);
        const retiradas = modoRetiradas === "ninguna" ? 0
          : modoRetiradas === "media" ? modelo.retiradasMedia
          : i === 1 ? modelo.nominaUltimo : modelo.pctNomina * entraPrev[k];
        saldos[k] += entra - gastos - impuestos - retiradas;
        entraPrev[k] = entra;
        if (k === 0) base = { entra, gastos, retiradas };
      });
      filas.push({ mes: mesNombre(d), ...base, impuestos, saldos: [...saldos] });
    }
    return filas;
  }, [modelo, modoRetiradas, saldoActual, meses, escenarios]);

  const totalFijos = fijosPend.reduce((s, g) => s + g.base * (1 + Number(g.iva_pct)), 0);

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

      {/* Gastos fijos por apuntar este mes */}
      {fijosPend.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-900 bg-amber-950/20 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button onClick={() => setVerFijos(!verFijos)} className="flex items-center gap-2 text-left">
              <span className="text-sm font-black text-white">Gastos fijos de este mes</span>
              <span className="text-xs text-zinc-400">{fijosPend.length} sin apuntar · ≈ {eur(totalFijos)}</span>
              <span className="text-xs text-zinc-500">{verFijos ? "▴" : "▾"}</span>
            </button>
            <button onClick={apuntarFijos} disabled={apuntando} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
              {apuntando ? "Apuntando…" : `Apuntar los ${fijosPend.length}`}
            </button>
          </div>
          {verFijos && (
            <>
              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-amber-900/40 pt-2.5">
                {fijosPend.map((g) => (
                  <span key={g.concepto} className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                    {g.concepto} <span className="text-zinc-500">{eur(g.base * (1 + Number(g.iva_pct)))}</span>
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">Copia importe, categoría y cuenta del mes pasado. Revisa en el Libro si algo cambió.</p>
            </>
          )}
        </div>
      )}

      {/* Base real: cada componente con su lógica */}
      <div className="mb-3 grid gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Saldo actual</p>
          <p className="text-base font-black text-white">{eur(saldoActual)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Entra / mes · mediana 6 meses</p>
          <p className="text-base font-black text-emerald-400">{eur(modelo.entraMediana)}</p>
          <p className="text-[10px] text-zinc-500">media {eur(modelo.entraMedia)} · la mediana no se deja inflar por meses de anuales o semestres</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Sale / mes · normal</p>
          <p className="text-base font-black text-red-400">{eur(saleMes)}</p>
          <p className="text-[10px] text-zinc-500">fijos {eur(modelo.fijos)} · variables {eur(modelo.variables)} · Hacienda ≈{eur(impuestosMes)}/mes · retiradas ≈{eur(retiradaEstimada)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Neto / mes</p>
          <p className={`text-base font-black ${netoMes < 0 ? "text-red-400" : "text-emerald-400"}`}>{eur(netoMes)}</p>
          <p className="text-[10px] text-zinc-500">lo que engorda (o vacía) la caja un mes normal, tras retiradas y Hacienda</p>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span>Retiradas de socios en la previsión:</span>
        <select value={modoRetiradas} onChange={(e) => setModoRetiradas(e.target.value as typeof modoRetiradas)} className={`${inputCls} py-1 text-xs`}>
          <option value="beneficio">según beneficio · {(modelo.pctNomina * 100).toFixed(0)} % de lo que entra, pagado al mes siguiente</option>
          <option value="media">media real · {eur(modelo.retiradasMedia)}/mes</option>
          <option value="ninguna">sin retiradas · qué queda si no os lleváis nada</option>
        </select>
      </div>
      {modelo.meses.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                <th className="px-3 py-1.5 text-left">Últimos 6 meses · real</th>
                <th className="px-2 py-1.5 text-right">Entra</th>
                <th className="px-2 py-1.5 text-right">Fijos</th>
                <th className="px-2 py-1.5 text-right">Variables</th>
                <th className="px-2 py-1.5 text-right">Hacienda</th>
                <th className="px-2 py-1.5 text-right">Retiradas</th>
                <th className="px-2 py-1.5 text-right">Inversión</th>
              </tr>
            </thead>
            <tbody>
              {modelo.meses.map((m) => (
                <tr key={m.mes} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-3 py-1 text-zinc-300">{m.mes}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-emerald-400">{eur(m.entra)}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-zinc-300">{eur(m.fijos)}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-zinc-300">{eur(m.variables)}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-amber-400">{m.impuestos ? eur(m.impuestos) : "·"}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-violet-300">{eur(m.retiradas)}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-orange-400">{m.inversion ? eur(m.inversion) : "·"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-1.5 text-[10px] text-zinc-600">De aquí sale la previsión: entra = mediana · fijos = media de los 3 últimos · variables = mediana · Hacienda = último año ÷ 4 cada trimestre · inversión fuera (es puntual).</p>
        </div>
      )}

      {/* Proyección */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white">Previsión de tesorería</h2>
            <p className="text-xs text-zinc-500">Proyecta el saldo componente a componente (escenario base en las columnas; cada escenario en su saldo)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditEscenarios(!editEscenarios)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700">
              ✎ Escenarios
            </button>
            <select value={meses} onChange={(e) => setMeses(Number(e.target.value))} className={inputCls}>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={24}>24 meses</option>
            </select>
          </div>
        </div>

        {editEscenarios && (
          <div className="mb-3 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            {escenarios.map((e, k) => (
              <div key={k} className="flex flex-wrap items-center gap-2">
                <input value={e.nombre} onChange={(ev) => guardarEscenarios(escenarios.map((x, i) => (i === k ? { ...x, nombre: ev.target.value } : x)))}
                  className="w-28 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs font-bold text-white outline-none focus:border-red-500" />
                <label className="flex items-center gap-1 text-xs text-zinc-400">ingresos
                  <input type="number" value={e.ing} onChange={(ev) => guardarEscenarios(escenarios.map((x, i) => (i === k ? { ...x, ing: Number(ev.target.value) } : x)))}
                    className="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-right text-xs text-white outline-none focus:border-red-500" />%
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-400">gastos
                  <input type="number" value={e.gas} onChange={(ev) => guardarEscenarios(escenarios.map((x, i) => (i === k ? { ...x, gas: Number(ev.target.value) } : x)))}
                    className="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-right text-xs text-white outline-none focus:border-red-500" />%
                </label>
                {escenarios.length > 1 && (
                  <button onClick={() => guardarEscenarios(escenarios.filter((_, i) => i !== k))} className="px-1 font-bold text-zinc-600 hover:text-red-400" title="Quitar escenario">✕</button>
                )}
              </div>
            ))}
            {escenarios.length < 4 && (
              <button onClick={() => guardarEscenarios([...escenarios, { nombre: `Escenario ${escenarios.length + 1}`, ing: 0, gas: 0 }])}
                className="self-start rounded-lg border border-dashed border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-500 hover:border-zinc-500 hover:text-zinc-300">
                + Añadir escenario
              </button>
            )}
            <p className="text-[10px] text-zinc-600">Cada escenario ajusta en % lo que entra y los gastos (fijos + variables). Hacienda y retiradas no se tocan: las retiradas siguen al escenario solas, porque dependen de lo que entra.</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase text-zinc-500">
                <th className="py-2">Mes</th>
                <th className="py-2 text-right">Entra</th>
                <th className="py-2 text-right">Gastos</th>
                <th className="py-2 text-right">Hacienda</th>
                <th className="py-2 text-right">Retiradas</th>
                {escenarios.map((e, k) => <th key={k} className="py-2 text-right">{e.nombre}</th>)}
              </tr>
            </thead>
            <tbody>
              {proyeccion.map((f) => (
                <tr key={f.mes} className="border-b border-zinc-800/60 last:border-0">
                  <td className="py-2.5 capitalize text-zinc-300">{f.mes}</td>
                  <td className="py-2.5 text-right text-emerald-400">{eur(f.entra)}</td>
                  <td className="py-2.5 text-right text-red-400">{eur(f.gastos)}</td>
                  <td className="py-2.5 text-right text-amber-400">{f.impuestos ? eur(f.impuestos) : <span className="text-zinc-700">·</span>}</td>
                  <td className="py-2.5 text-right text-violet-300">{f.retiradas ? eur(f.retiradas) : <span className="text-zinc-700">·</span>}</td>
                  {f.saldos.map((s, k) => (
                    <td key={k} className={`py-2.5 text-right font-bold ${s < 0 ? "text-red-400" : "text-white"}`}>{eur(s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {proyeccion.some((f) => f.saldos.some((s) => s < 0)) && (
          <p className="mt-3 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">⚠ Algún escenario se queda en negativo. Revisa gastos o adelanta cobros.</p>
        )}
        <p className="mt-3 text-[11px] leading-snug text-zinc-600">
          Entra = mediana de 6 meses (un mes de anuales no dispara la previsión). Gastos = fijos (media 3 meses) + variables (mediana 6).
          Hacienda = pago trimestral en ene/abr/jul/oct (último año ÷ 4). Retiradas = se pagan el mes siguiente al beneficio.
          La inversión queda fuera (es puntual). Todo sale del Libro: se actualiza sola a medida que apuntáis.
        </p>
      </div>
    </div>
  );
}
