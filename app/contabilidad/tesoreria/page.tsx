"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Recurrente {
  id: number;
  concepto: string;
  tipo: "ingreso" | "gasto";
  importe: number;
  dia_mes: number;
  cada_meses: number;
  desde: string;
  hasta: string | null;
  activo: boolean;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const mesNombre = (d: Date) => d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

// ¿Aplica un recurrente en el mes (primer día del mes) dado?
function aplicaEnMes(r: Recurrente, primerDiaMes: Date): boolean {
  const desde = new Date(r.desde + "T00:00:00");
  if (primerDiaMes < new Date(desde.getFullYear(), desde.getMonth(), 1)) return false;
  if (r.hasta) {
    const hasta = new Date(r.hasta + "T00:00:00");
    if (primerDiaMes > new Date(hasta.getFullYear(), hasta.getMonth(), 1)) return false;
  }
  const meses =
    (primerDiaMes.getFullYear() - desde.getFullYear()) * 12 + (primerDiaMes.getMonth() - desde.getMonth());
  return meses >= 0 && meses % Math.max(1, r.cada_meses) === 0;
}

export default function Tesoreria() {
  const [recurrentes, setRecurrentes] = useState<Recurrente[]>([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [meses, setMeses] = useState(6);
  const [error, setError] = useState<string | null>(null);

  // Alta
  const [nConcepto, setNConcepto] = useState("");
  const [nTipo, setNTipo] = useState<"ingreso" | "gasto">("gasto");
  const [nImporte, setNImporte] = useState("");
  const [nDia, setNDia] = useState("1");
  const [nCada, setNCada] = useState("1");

  const cargar = useCallback(async () => {
    const [r, s] = await Promise.all([
      supabase.from("tesoreria_recurrentes").select("*").order("tipo").order("dia_mes"),
      supabase.from("v_saldo_cuentas").select("saldo"),
    ]);
    if (r.error) return setError(r.error.message);
    setRecurrentes((r.data as Recurrente[]) ?? []);
    setSaldoActual((s.data ?? []).reduce((t: number, x: { saldo: number }) => t + Number(x.saldo), 0));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear() {
    if (!nConcepto.trim() || !Number(nImporte)) return setError("Pon concepto e importe.");
    const { error } = await supabase.from("tesoreria_recurrentes").insert({
      concepto: nConcepto.trim(),
      tipo: nTipo,
      importe: Number(nImporte.replace(",", ".")),
      dia_mes: Math.min(28, Math.max(1, Number(nDia) || 1)),
      cada_meses: Math.max(1, Number(nCada) || 1),
    });
    if (error) return setError(error.message);
    setNConcepto("");
    setNImporte("");
    cargar();
  }

  async function actualizar(id: number, campos: Partial<Recurrente>) {
    const { error } = await supabase.from("tesoreria_recurrentes").update(campos).eq("id", id);
    if (error) return setError(error.message);
    cargar();
  }

  async function borrar(id: number) {
    await supabase.from("tesoreria_recurrentes").delete().eq("id", id);
    cargar();
  }

  // Sugerir recurrentes desde los gastos fijos y domiciliaciones detectados
  async function sugerir() {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 3);
    const [gastosFijos, domic] = await Promise.all([
      supabase
        .from("gastos")
        .select("concepto, total, fecha, categorias!inner(es_fijo, nombre)")
        .gte("fecha", desde.toISOString().slice(0, 10)),
      supabase
        .from("cobros")
        .select("importe, fecha, facturas!inner(es_recurrente)")
        .gte("fecha", desde.toISOString().slice(0, 10)),
    ]);
    const nuevos: Omit<Recurrente, "id">[] = [];
    // Un gasto fijo por subcategoría (media mensual de los últimos 3 meses)
    const porCat = new Map<string, number>();
    for (const g of (gastosFijos.data ?? []) as unknown as { total: number; categorias: { es_fijo: boolean; nombre: string } }[]) {
      if (!g.categorias?.es_fijo) continue;
      porCat.set(g.categorias.nombre, (porCat.get(g.categorias.nombre) ?? 0) + Number(g.total));
    }
    for (const [nombre, total] of porCat) {
      if (recurrentes.some((r) => r.concepto === nombre)) continue;
      nuevos.push({ concepto: nombre, tipo: "gasto", importe: Math.round(total / 3), dia_mes: 1, cada_meses: 1, desde: new Date().toISOString().slice(0, 10), hasta: null, activo: true });
    }
    // Ingreso recurrente: MRR medio de domiciliaciones
    const mrrTotal = ((domic.data ?? []) as unknown as { importe: number; facturas: { es_recurrente: boolean } }[])
      .filter((c) => c.facturas?.es_recurrente)
      .reduce((s, c) => s + Number(c.importe), 0);
    if (mrrTotal > 0 && !recurrentes.some((r) => r.concepto === "Domiciliaciones (MRR)")) {
      nuevos.push({ concepto: "Domiciliaciones (MRR)", tipo: "ingreso", importe: Math.round(mrrTotal / 3), dia_mes: 1, cada_meses: 1, desde: new Date().toISOString().slice(0, 10), hasta: null, activo: true });
    }
    if (nuevos.length === 0) return setError("No hay nada nuevo que sugerir (o ya está todo).");
    const { error } = await supabase.from("tesoreria_recurrentes").insert(nuevos);
    if (error) return setError(error.message);
    setError(null);
    cargar();
  }

  // Proyección de saldo mes a mes
  const proyeccion = useMemo(() => {
    const filas: { mes: string; ingresos: number; gastos: number; saldoFinal: number }[] = [];
    const activos = recurrentes.filter((r) => r.activo);
    let saldo = saldoActual;
    const hoy = new Date();
    for (let i = 1; i <= meses; i++) {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      let ingresos = 0;
      let gastos = 0;
      for (const r of activos) {
        if (!aplicaEnMes(r, primerDia)) continue;
        if (r.tipo === "ingreso") ingresos += Number(r.importe);
        else gastos += Number(r.importe);
      }
      saldo += ingresos - gastos;
      filas.push({ mes: mesNombre(primerDia), ingresos, gastos, saldoFinal: saldo });
    }
    return filas;
  }, [recurrentes, saldoActual, meses]);

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Proyección */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white">Previsión de tesorería</h2>
            <p className="text-xs text-zinc-500">Saldo actual {eur(saldoActual)} · proyectando lo recurrente</p>
          </div>
          <select value={meses} onChange={(e) => setMeses(Number(e.target.value))} className={inputCls}>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
            <option value={24}>24 meses</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase text-zinc-500">
                <th className="py-2">Mes</th>
                <th className="py-2 text-right">Ingresos</th>
                <th className="py-2 text-right">Gastos</th>
                <th className="py-2 text-right">Saldo previsto</th>
              </tr>
            </thead>
            <tbody>
              {proyeccion.map((f) => (
                <tr key={f.mes} className="border-b border-zinc-800/60 last:border-0">
                  <td className="py-2.5 capitalize text-zinc-300">{f.mes}</td>
                  <td className="py-2.5 text-right text-emerald-400">{eur(f.ingresos)}</td>
                  <td className="py-2.5 text-right text-red-400">{eur(f.gastos)}</td>
                  <td className={`py-2.5 text-right font-bold ${f.saldoFinal < 0 ? "text-red-400" : "text-white"}`}>
                    {eur(f.saldoFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {proyeccion.some((f) => f.saldoFinal < 0) && (
          <p className="mt-3 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-300">
            ⚠ La previsión se queda en negativo algún mes. Revisa gastos o adelanta cobros.
          </p>
        )}
      </div>

      {/* Recurrentes editables */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Pagos y cobros recurrentes</h2>
        <button onClick={sugerir} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300">
          Sugerir desde mis datos
        </button>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Edita importes o fechas cuando cambien (ej: cuando acabe la cuota bonificada de autónomos,
        sube el importe o pon una fecha &quot;desde&quot; con el nuevo importe en otra línea).
      </p>

      {/* Alta */}
      <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap gap-2">
          <input placeholder="Concepto" value={nConcepto} onChange={(e) => setNConcepto(e.target.value)} className={inputCls} />
          <select value={nTipo} onChange={(e) => setNTipo(e.target.value as "ingreso" | "gasto")} className={inputCls}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <input placeholder="Importe" inputMode="decimal" value={nImporte} onChange={(e) => setNImporte(e.target.value)} className={`${inputCls} w-24`} />
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">día</span>
            <input value={nDia} onChange={(e) => setNDia(e.target.value)} className={`${inputCls} w-14`} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">cada</span>
            <input value={nCada} onChange={(e) => setNCada(e.target.value)} className={`${inputCls} w-14`} />
            <span className="text-xs text-zinc-500">mes(es)</span>
          </div>
          <button onClick={crear} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Añadir</button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {recurrentes.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-600">
            Nada aún. Pulsa &quot;Sugerir desde mis datos&quot; o añade a mano.
          </p>
        )}
        {recurrentes.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3 last:border-0">
            <span className={`h-2 w-2 shrink-0 rounded-full ${r.tipo === "ingreso" ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="min-w-32 flex-1 text-sm font-semibold text-white">{r.concepto}</span>
            <div className="flex items-center gap-1">
              <input
                defaultValue={Number(r.importe)}
                onBlur={(e) => actualizar(r.id, { importe: Number(e.target.value.replace(",", ".")) })}
                className={`${inputCls} w-24`}
              />
              <span className="text-xs text-zinc-500">€</span>
            </div>
            <span className="text-xs text-zinc-500">
              día {r.dia_mes} · cada {r.cada_meses}m
            </span>
            <button
              onClick={() => actualizar(r.id, { activo: !r.activo })}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                r.activo ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {r.activo ? "Activo" : "Pausado"}
            </button>
            <button onClick={() => borrar(r.id)} className="text-xs font-bold text-zinc-600 hover:text-red-400">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
