"use client";

// Previsión de tesorería BASADA EN LA REALIDAD: parte de la media real de los
// últimos 3 meses completos de lo que entra (cobros) y sale (gastos) en el
// Libro, y proyecta el saldo mes a mes con escenarios (% de ajuste). Se
// actualiza sola con los datos reales: no hay lista de recurrentes que mantener.

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

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const mesNombre = (d: Date) => d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function Tesoreria() {
  const [saldoActual, setSaldoActual] = useState(0);
  const [entraMedia, setEntraMedia] = useState(0);
  const [saleMedia, setSaleMedia] = useState(0);
  const [nominaMedia, setNominaMedia] = useState(0);
  const [mesesBase, setMesesBase] = useState<{ mes: string; entra: number; sale: number }[]>([]);
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
    const ini3ISO = primerDiaISO(-3);
    const ini3rep = ini3ISO;

    const [s, cob, gas, rep] = await Promise.all([
      supabase.from("v_saldo_cuentas").select("saldo"),
      // Lo que entra de verdad (cobros que tocan caja) en los 3 meses completos
      supabase.from("cobros").select("fecha, importe").eq("afecta_caja", true).gte("fecha", ini3ISO).lt("fecha", iniMesActualISO),
      // Lo que sale de verdad (gastos, neto de IRPF retenido) en los 3 meses
      supabase.from("gastos").select("fecha, total, irpf_soportado").gte("fecha", ini3ISO).lt("fecha", iniMesActualISO),
      supabase.from("v_reparto_beneficios").select("mes, beneficio").gte("mes", ini3rep),
    ]);
    if (s.error) return setError(s.error.message);

    setSaldoActual((s.data ?? []).reduce((t: number, x: { saldo: number }) => t + Number(x.saldo), 0));

    const porMes = new Map<string, { entra: number; sale: number }>();
    const key = (f: string) => f.slice(0, 7);
    for (const c of (cob.data as { fecha: string; importe: number }[]) ?? []) {
      const k = key(c.fecha);
      const m = porMes.get(k) ?? { entra: 0, sale: 0 };
      m.entra += Number(c.importe);
      porMes.set(k, m);
    }
    for (const g of (gas.data as { fecha: string; total: number; irpf_soportado: number }[]) ?? []) {
      const k = key(g.fecha);
      const m = porMes.get(k) ?? { entra: 0, sale: 0 };
      m.sale += Number(g.total) - Number(g.irpf_soportado);
      porMes.set(k, m);
    }
    const filasMes = [...porMes.entries()]
      .map(([mes, v]) => ({ mes, entra: Math.round(v.entra * 100) / 100, sale: Math.round(v.sale * 100) / 100 }))
      .sort((a, b) => (a.mes < b.mes ? -1 : 1));
    setMesesBase(filasMes);
    const n = Math.max(1, filasMes.length);
    setEntraMedia(filasMes.reduce((t, m) => t + m.entra, 0) / n);
    setSaleMedia(filasMes.reduce((t, m) => t + m.sale, 0) / n);

    // Nómina media (referencia): 80% del beneficio por mes. Ya va incluida en
    // "sale" si la apuntáis como gasto al retirarla.
    const repMes = new Map<string, number>();
    for (const f of (rep.data as { mes: string; beneficio: number }[]) ?? [])
      repMes.set(f.mes, (repMes.get(f.mes) ?? 0) + Math.max(0, Number(f.beneficio) * 0.8));
    const noms = [...repMes.values()];
    setNominaMedia(noms.length ? noms.reduce((a, b) => a + b, 0) / noms.length : 0);

    // Gastos fijos de este mes por apuntar: copiar los del mes pasado que falten
    const iniMesPasado = primerDiaISO(-1);
    const [gPasado, gEste] = await Promise.all([
      supabase
        .from("gastos")
        .select("concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, imputado_a, canal, deducible, tiene_factura, categorias!inner(es_fijo, nombre)")
        .gte("fecha", iniMesPasado)
        .lt("fecha", iniMesActualISO),
      supabase.from("gastos").select("concepto").gte("fecha", iniMesActualISO),
    ]);
    const yaEste = new Set(((gEste.data as { concepto: string }[]) ?? []).map((g) => g.concepto.trim().toLowerCase()));
    const pend: GastoFijo[] = [];
    for (const g of (gPasado.data as unknown as (GastoFijo & { categorias: { es_fijo: boolean; nombre: string } })[]) ?? []) {
      if (!g.categorias?.es_fijo) continue;
      if (/mina/i.test(g.categorias.nombre)) continue;
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

  const netoMedia = Math.round((entraMedia - saleMedia) * 100) / 100;

  // Proyección: cada mes suma la media real, ajustada por escenario
  const proyeccion = useMemo(() => {
    const filas: { mes: string; ingresos: number; gastos: number; saldos: number[] }[] = [];
    const saldos = escenarios.map(() => saldoActual);
    const now = new Date();
    for (let i = 1; i <= meses; i++) {
      const primerDia = new Date(now.getFullYear(), now.getMonth() + i, 1);
      escenarios.forEach((e, k) => {
        saldos[k] += entraMedia * (1 + e.ing / 100) - saleMedia * (1 + e.gas / 100);
      });
      filas.push({ mes: mesNombre(primerDia), ingresos: entraMedia, gastos: saleMedia, saldos: [...saldos] });
    }
    return filas;
  }, [entraMedia, saleMedia, saldoActual, meses, escenarios]);

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

      {/* Base real */}
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Saldo actual</p>
          <p className="text-base font-black text-white">{eur(saldoActual)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Entra / mes (media real)</p>
          <p className="text-base font-black text-emerald-400">{eur(entraMedia)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Sale / mes (media real)</p>
          <p className="text-base font-black text-red-400">{eur(saleMedia)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Neto / mes</p>
          <p className={`text-base font-black ${netoMedia < 0 ? "text-red-400" : "text-emerald-400"}`}>{eur(netoMedia)}</p>
        </div>
      </div>
      {mesesBase.length > 0 && (
        <p className="mb-4 text-[11px] text-zinc-600">
          Media de {mesesBase.map((m) => `${m.mes} (${eur(m.entra)} / ${eur(m.sale)})`).join(" · ")}.
          «Sale» ya incluye lo que retiráis de nómina si lo apuntáis como gasto (nómina teórica media ≈ {eur(nominaMedia)}).
        </p>
      )}

      {/* Proyección */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white">Previsión de tesorería</h2>
            <p className="text-xs text-zinc-500">Proyecta el saldo con la media real mensual</p>
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
            <p className="text-[10px] text-zinc-600">Cada escenario ajusta en % la media de ingresos y gastos. Ej: Pesimista = ingresos −15% y gastos +10%.</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase text-zinc-500">
                <th className="py-2">Mes</th>
                <th className="py-2 text-right">Ingresos</th>
                <th className="py-2 text-right">Gastos</th>
                {escenarios.map((e, k) => <th key={k} className="py-2 text-right">{e.nombre}</th>)}
              </tr>
            </thead>
            <tbody>
              {proyeccion.map((f) => (
                <tr key={f.mes} className="border-b border-zinc-800/60 last:border-0">
                  <td className="py-2.5 capitalize text-zinc-300">{f.mes}</td>
                  <td className="py-2.5 text-right text-emerald-400">{eur(f.ingresos)}</td>
                  <td className="py-2.5 text-right text-red-400">{eur(f.gastos)}</td>
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
          La previsión usa la media real de los últimos 3 meses del Libro, así que se actualiza sola a medida que apuntáis.
          Los escenarios ajustan esa media en %. No hay lista de recurrentes que mantener.
        </p>
      </div>
    </div>
  );
}
