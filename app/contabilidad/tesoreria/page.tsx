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
  cada: number;
  unidad: "dia" | "semana" | "mes";
  desde: string;
  hasta: string | null;
  activo: boolean;
}

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

// Cuántas veces cae un recurrente dentro de un mes concreto
function vecesEnMes(r: Recurrente, primerDiaMes: Date): number {
  const desde = new Date(r.desde + "T00:00:00");
  const finMes = new Date(primerDiaMes.getFullYear(), primerDiaMes.getMonth() + 1, 0);
  const hasta = r.hasta ? new Date(r.hasta + "T00:00:00") : null;
  const cada = Math.max(1, r.cada || r.cada_meses || 1);

  if (r.unidad === "mes") {
    if (primerDiaMes < new Date(desde.getFullYear(), desde.getMonth(), 1)) return 0;
    if (hasta && primerDiaMes > new Date(hasta.getFullYear(), hasta.getMonth(), 1)) return 0;
    const meses = (primerDiaMes.getFullYear() - desde.getFullYear()) * 12 + (primerDiaMes.getMonth() - desde.getMonth());
    return meses >= 0 && meses % cada === 0 ? 1 : 0;
  }
  // Días o semanas: contamos las fechas que caen en el mes
  const paso = r.unidad === "semana" ? cada * 7 : cada;
  let veces = 0;
  for (let d = new Date(desde); d <= finMes; d.setDate(d.getDate() + paso)) {
    if (d >= primerDiaMes && d <= finMes && (!hasta || d <= hasta)) veces++;
  }
  return veces;
}

export default function Tesoreria() {
  const [recurrentes, setRecurrentes] = useState<Recurrente[]>([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [nominaMedia, setNominaMedia] = useState(0);
  const [inversionMedia, setInversionMedia] = useState(0);
  const [fijosPend, setFijosPend] = useState<GastoFijo[]>([]);
  const [apuntando, setApuntando] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [meses, setMeses] = useState(6);
  const [error, setError] = useState<string | null>(null);

  // Alta
  const [nConcepto, setNConcepto] = useState("");
  const [nTipo, setNTipo] = useState<"ingreso" | "gasto">("gasto");
  const [nImporte, setNImporte] = useState("");
  const [nDia, setNDia] = useState("1");
  const [nCada, setNCada] = useState("1");

  const cargar = useCallback(async () => {
    // Media de los 3 últimos meses de nómina (reparto) e inversión
    const desde3 = new Date();
    desde3.setMonth(desde3.getMonth() - 3, 1);
    const desde3ISO = desde3.toISOString().slice(0, 10);
    const [r, s, rep, inv] = await Promise.all([
      supabase.from("tesoreria_recurrentes").select("*").order("tipo").order("dia_mes"),
      supabase.from("v_saldo_cuentas").select("saldo"),
      supabase.from("v_reparto_beneficios").select("mes, beneficio").gte("mes", desde3ISO),
      supabase.from("v_inversion_mensual").select("mes, inversion").gte("mes", desde3ISO),
    ]);
    if (r.error) return setError(r.error.message);
    setRecurrentes((r.data as Recurrente[]) ?? []);
    setSaldoActual((s.data ?? []).reduce((t: number, x: { saldo: number }) => t + Number(x.saldo), 0));

    // Nómina mensual = suma de las nóminas (80% del beneficio, nunca negativa) por mes
    const porMes = new Map<string, number>();
    for (const f of (rep.data as { mes: string; beneficio: number }[]) ?? [])
      porMes.set(f.mes, (porMes.get(f.mes) ?? 0) + Math.max(0, Number(f.beneficio) * 0.8));
    const nominas = [...porMes.values()];
    setNominaMedia(nominas.length ? nominas.reduce((a, b) => a + b, 0) / nominas.length : 0);
    const invs = ((inv.data as { inversion: number }[]) ?? []).map((x) => Number(x.inversion));
    setInversionMedia(invs.length ? invs.reduce((a, b) => a + b, 0) / invs.length : 0);

    // Gastos fijos por apuntar este mes: copiar los del mes pasado que aún no están
    const hoy = new Date();
    const iniMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const iniMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10);
    const [gPasado, gEste] = await Promise.all([
      supabase
        .from("gastos")
        .select("concepto, proveedor, base, iva_pct, irpf_pct, categoria_id, cuenta_id, imputado_a, canal, deducible, tiene_factura, categorias!inner(es_fijo, nombre)")
        .gte("fecha", iniMesPasado)
        .lt("fecha", iniMes),
      supabase.from("gastos").select("concepto").gte("fecha", iniMes),
    ]);
    const yaEste = new Set(((gEste.data as { concepto: string }[]) ?? []).map((g) => g.concepto.trim().toLowerCase()));
    const pend: GastoFijo[] = [];
    for (const g of (gPasado.data as unknown as (GastoFijo & { categorias: { es_fijo: boolean; nombre: string } })[]) ?? []) {
      if (!g.categorias?.es_fijo) continue;
      if (/mina/i.test(g.categorias.nombre)) continue; // nóminas no
      if (yaEste.has(g.concepto.trim().toLowerCase())) continue; // ya apuntado este mes
      if (pend.some((p) => p.concepto.trim().toLowerCase() === g.concepto.trim().toLowerCase())) continue;
      pend.push(g);
    }
    setFijosPend(pend);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Apunta de golpe los gastos fijos de este mes (copiando los del mes pasado)
  async function apuntarFijos() {
    if (fijosPend.length === 0) return;
    setApuntando(true);
    const fecha = new Date().toISOString().slice(0, 10);
    const filas = fijosPend.map((g) => ({
      fecha,
      concepto: g.concepto,
      proveedor: g.proveedor,
      base: g.base,
      iva_pct: g.iva_pct,
      irpf_pct: g.irpf_pct,
      categoria_id: g.categoria_id,
      cuenta_id: g.cuenta_id,
      imputado_a: g.imputado_a,
      canal: g.canal,
      deducible: g.deducible,
      tiene_factura: g.tiene_factura,
      iva_soportado: g.deducible ? Math.round(g.base * g.iva_pct * 100) / 100 : 0,
      es_fijo: true,
    }));
    const { error } = await supabase.from("gastos").insert(filas);
    setApuntando(false);
    if (error) return setError(error.message);
    setOk(`${filas.length} gastos fijos apuntados a este mes ✓`);
    setTimeout(() => setOk(null), 3000);
    cargar();
  }

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
      nuevos.push({ concepto: nombre, tipo: "gasto", importe: Math.round(total / 3), dia_mes: 1, cada_meses: 1, cada: 1, unidad: "mes", desde: new Date().toISOString().slice(0, 10), hasta: null, activo: true });
    }
    // Ingreso recurrente: MRR medio de domiciliaciones
    const mrrTotal = ((domic.data ?? []) as unknown as { importe: number; facturas: { es_recurrente: boolean } }[])
      .filter((c) => c.facturas?.es_recurrente)
      .reduce((s, c) => s + Number(c.importe), 0);
    if (mrrTotal > 0 && !recurrentes.some((r) => r.concepto === "Domiciliaciones (MRR)")) {
      nuevos.push({ concepto: "Domiciliaciones (MRR)", tipo: "ingreso", importe: Math.round(mrrTotal / 3), dia_mes: 1, cada_meses: 1, cada: 1, unidad: "mes", desde: new Date().toISOString().slice(0, 10), hasta: null, activo: true });
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
        const veces = vecesEnMes(r, primerDia);
        if (veces === 0) continue;
        const monto = Number(r.importe) * veces;
        if (r.tipo === "ingreso") ingresos += monto;
        else gastos += monto;
      }
      saldo += ingresos - gastos;
      filas.push({ mes: mesNombre(primerDia), ingresos, gastos, saldoFinal: saldo });
    }
    return filas;
  }, [recurrentes, saldoActual, meses]);

  const totalFijos = fijosPend.reduce((s, g) => s + g.base * (1 + Number(g.iva_pct)), 0);

  return (
    <div>
      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

      {/* Gastos fijos por apuntar este mes */}
      {fijosPend.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-900 bg-amber-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Gastos fijos de este mes</h2>
              <p className="text-xs text-zinc-400">
                {fijosPend.length} gastos fijos del mes pasado aún sin apuntar este mes (≈ {eur(totalFijos)}).
              </p>
            </div>
            <button
              onClick={apuntarFijos}
              disabled={apuntando}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {apuntando ? "Apuntando…" : `Apuntar los ${fijosPend.length} de golpe`}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {fijosPend.map((g) => (
              <span key={g.concepto} className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                {g.concepto} <span className="text-zinc-500">{eur(g.base * (1 + Number(g.iva_pct)))}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Copia importe, categoría, cuenta y demás del mes pasado. Revisa y edita en el Libro si algo cambió.
          </p>
        </div>
      )}

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

      {/* Nómina e inversión: variables, no entran como gasto fijo */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nómina media (últ. 3 meses)</p>
          <p className="mt-1 text-2xl font-black text-emerald-400">{eur(nominaMedia)}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Es el 80% del beneficio, variable. No se incluye en la previsión de arriba: solo se
            retira lo que hay, así el saldo nunca se fuerza a negativo.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Inversión media (últ. 3 meses)</p>
          <p className="mt-1 text-2xl font-black text-amber-400">{eur(inversionMedia)}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Material, máquinas, obra… Sale de la hucha (el 20% ahorrado), no de los fijos. Es
            discrecional: solo cuando hay ahorro suficiente.
          </p>
        </div>
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
              cada {r.cada || r.cada_meses} {r.unidad === "dia" ? "día(s)" : r.unidad === "semana" ? "semana(s)" : "mes(es)"}
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
