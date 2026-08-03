"use client";

// Gestión de clientes: matriz cliente × mes (como la hoja del Excel).
// Cobrado real por mes, BAJA en gris, previsión de cuota en los meses
// futuros (atenuada), totales por entrenador y total anual.

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Cli {
  id: number;
  nombre: string;
  apellidos: string | null;
  entrenador: string;
  tipo_plan: string | null;
  fecha_inicio: string | null;
  fecha_baja: string | null;
  cuota_id: number | null;
  cuota_periodicidad: string;
  cuota_desde: string | null;
  descuento_pct: number;
  descuento_eur: number;
  domiciliado: boolean;
}
interface CobroRow { fecha: string; importe: number; facturas: { cliente_id: number | null } | null }
interface CuotaCat {
  id: number;
  precio_mensual: number | null;
  precio_trimestral: number | null;
  precio_semestral: number | null;
  precio_anual: number | null;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PERIODO: Record<string, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
const GRUPO: Record<string, string> = { david: "David", luis: "Luis" };

const n2 = (v: number) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function GestionClientesPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [clientes, setClientes] = useState<Cli[]>([]);
  const [cobros, setCobros] = useState<CobroRow[]>([]);
  const [cuotas, setCuotas] = useState<CuotaCat[]>([]);
  const [pendientes, setPendientes] = useState<Map<number, number>>(new Map());
  const [fEntrenador, setFEntrenador] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const desde = `${anyo}-01-01`;
      const hasta = `${anyo + 1}-01-01`;
      const [cli, cob, q, sal] = await Promise.all([
        supabase.from("clientes").select("id, nombre, apellidos, entrenador, tipo_plan, fecha_inicio, fecha_baja, cuota_id, cuota_periodicidad, cuota_desde, descuento_pct, descuento_eur, domiciliado"),
        supabase.from("cobros").select("fecha, importe, facturas!inner(cliente_id)").gte("fecha", desde).lt("fecha", hasta),
        supabase.from("cuotas").select("id, precio_mensual, precio_trimestral, precio_semestral, precio_anual"),
        supabase.from("v_facturas_saldo").select("cliente_id, pendiente"),
      ]);
      if (cli.error) return setError(cli.error.message);
      setClientes((cli.data as Cli[]) ?? []);
      setCobros((cob.data as unknown as CobroRow[]) ?? []);
      setCuotas((q.data as CuotaCat[]) ?? []);
      const p = new Map<number, number>();
      for (const s of (sal.data as { cliente_id: number | null; pendiente: number }[]) ?? []) {
        if (s.cliente_id && Number(s.pendiente) > 0.01) p.set(s.cliente_id, (p.get(s.cliente_id) ?? 0) + Number(s.pendiente));
      }
      setPendientes(p);
    })();
  }, [anyo]);

  const hoy = new Date();
  const mesActualIdx = hoy.getFullYear() === anyo ? hoy.getMonth() : hoy.getFullYear() < anyo ? -1 : 12;

  // Cobrado por cliente y mes (+ fila de ingresos sin cliente)
  const { porCliente, sinCliente } = useMemo(() => {
    const pc = new Map<number, number[]>();
    const sc = Array(12).fill(0);
    for (const c of cobros) {
      const m = new Date(c.fecha + "T00:00:00").getMonth();
      const id = c.facturas?.cliente_id ?? null;
      if (id === null) { sc[m] += Number(c.importe); continue; }
      const arr = pc.get(id) ?? Array(12).fill(0);
      arr[m] += Number(c.importe);
      pc.set(id, arr);
    }
    return { porCliente: pc, sinCliente: sc };
  }, [cobros]);

  // Precio previsto de la cuota del cliente para un mes concreto (según su ciclo)
  const previstoDe = (c: Cli, mesIdx: number): number | null => {
    if (!c.cuota_id || c.fecha_baja) return null;
    const q = cuotas.find((x) => x.id === c.cuota_id);
    if (!q) return null;
    const campo = (`precio_${c.cuota_periodicidad || "mensual"}`) as keyof CuotaCat;
    const base = q[campo];
    if (base === null || base === undefined) return null;
    const desde = c.cuota_desde ?? c.fecha_inicio;
    const ancla = desde ? new Date(desde + "T00:00:00") : null;
    const periodo = PERIODO[c.cuota_periodicidad] ?? 1;
    if (ancla) {
      const diff = (anyo - ancla.getFullYear()) * 12 + (mesIdx - ancla.getMonth());
      if (diff < 0 || diff % periodo !== 0) return null;
    } else if (periodo > 1) {
      return null;
    }
    return Math.max(0, Math.round((Number(base) * (1 - Number(c.descuento_pct) / 100) - Number(c.descuento_eur)) * 100) / 100);
  };

  // Filas visibles: con cobros en el año, o activos con cuota (para ver la previsión)
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return clientes
      .filter((c) => porCliente.has(c.id) || (!c.fecha_baja && c.cuota_id))
      .filter((c) => {
        if (fEntrenador === "david" || fEntrenador === "luis") return c.entrenador === fEntrenador;
        if (fEntrenador === "empresa") return c.entrenador !== "david" && c.entrenador !== "luis";
        return true;
      })
      .filter((c) => !q || `${c.nombre} ${c.apellidos ?? ""}`.toLowerCase().includes(q))
      .map((c) => ({ c, vals: porCliente.get(c.id) ?? Array(12).fill(0) }))
      .sort((a, b) => {
        const g = (x: Cli) => (x.entrenador === "david" ? 0 : x.entrenador === "luis" ? 1 : 2);
        if (g(a.c) !== g(b.c)) return g(a.c) - g(b.c);
        return b.vals.reduce((s: number, x: number) => s + x, 0) - a.vals.reduce((s: number, x: number) => s + x, 0);
      });
  }, [clientes, porCliente, fEntrenador, busqueda]);

  // Totales por grupo (David / Luis / Empresa) y total mensual — sobre TODO, sin filtros
  const totales = useMemo(() => {
    const g: Record<string, number[]> = { David: Array(12).fill(0), Luis: Array(12).fill(0), Empresa: [...sinCliente] };
    for (const c of clientes) {
      const vals = porCliente.get(c.id);
      if (!vals) continue;
      const clave = GRUPO[c.entrenador] ?? "Empresa";
      vals.forEach((v, i) => (g[clave][i] += v));
    }
    const mensual = Array(12).fill(0);
    (Object.values(g) as number[][]).forEach((arr) => arr.forEach((v, i) => (mensual[i] += v)));
    return { g, mensual };
  }, [clientes, porCliente, sinCliente]);

  const bajaEnMes = (c: Cli, mesIdx: number) => {
    if (!c.fecha_baja) return false;
    const b = new Date(c.fecha_baja + "T00:00:00");
    return anyo > b.getFullYear() || (anyo === b.getFullYear() && mesIdx > b.getMonth());
  };

  const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);

  const celda = (v: number, cls = "text-zinc-300") =>
    Math.abs(v) < 0.005 ? <td className="px-2 py-1 text-right text-zinc-800">·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls}`}>{n2(v)}</td>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input placeholder="Buscar cliente…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-48 flex-1 sm:max-w-xs`} />
        <select value={fEntrenador} onChange={(e) => setFEntrenador(e.target.value)} className={`${inputCls} appearance-none`}>
          <option value="todos">Entrenador: todos</option>
          <option value="david">David</option>
          <option value="luis">Luis</option>
          <option value="empresa">Empresa (Ethos/Alex)</option>
        </select>
        <select value={anyo} onChange={(e) => setAnyo(Number(e.target.value))} className={`${inputCls} appearance-none`}>
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Totales por entrenador (como la cabecera del Excel) */}
      <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Ingresos {anyo}</th>
              {MESES.map((m) => <th key={m} className="min-w-16 px-2 py-1.5 text-right">{m}</th>)}
              <th className="min-w-20 border-l border-zinc-800 px-3 py-1.5 text-right text-zinc-400">Total anual</th>
            </tr>
          </thead>
          <tbody>
            {(["David", "Luis", "Empresa"] as const).map((gr) => (
              <tr key={gr} className="border-b border-zinc-800/50">
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1 font-bold text-zinc-300">{gr}</td>
                {totales.g[gr].map((v, i) => <Fragment key={i}>{celda(v)}</Fragment>)}
                <td className="border-l border-zinc-800 px-3 py-1 text-right font-bold tabular-nums text-zinc-200">{n2(suma(totales.g[gr]))}</td>
              </tr>
            ))}
            <tr className="bg-emerald-950/30 font-black">
              <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 text-emerald-400">TOTAL MENSUAL</td>
              {totales.mensual.map((v, i) => <Fragment key={i}>{celda(v, "text-emerald-400 font-black")}</Fragment>)}
              <td className="border-l border-zinc-800 px-3 py-1.5 text-right tabular-nums text-emerald-400">{n2(suma(totales.mensual))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Matriz cliente × mes */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Cliente</th>
              <th className="px-2 py-1.5 text-left">Ent.</th>
              {MESES.map((m, i) => (
                <th key={m} className={`min-w-16 px-2 py-1.5 text-right ${i === mesActualIdx ? "text-red-400" : ""}`}>{m}</th>
              ))}
              <th className="min-w-20 border-l border-zinc-800 px-3 py-1.5 text-right text-zinc-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ c, vals }) => {
              const pend = pendientes.get(c.id) ?? 0;
              return (
                <tr key={c.id} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/40">
                  <td className="sticky left-0 z-10 max-w-48 bg-zinc-950/95 px-3 py-1">
                    <Link href={`/clientes/${c.id}`} className="block truncate font-semibold text-zinc-200 hover:text-red-400">
                      {c.nombre} {c.apellidos ?? ""}
                    </Link>
                    <span className="block truncate text-[10px] text-zinc-600">
                      {c.tipo_plan ?? ""}
                      {pend > 0.01 && <span className="ml-1 rounded bg-amber-950 px-1 py-0.5 text-[9px] font-bold text-amber-400">debe {n2(pend)}</span>}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-[10px] text-zinc-500">{GRUPO[c.entrenador] ?? "Emp."}</td>
                  {vals.map((v: number, i: number) => {
                    if (bajaEnMes(c, i)) return <td key={i} className="px-2 py-1 text-center text-[9px] font-bold uppercase text-zinc-700">baja</td>;
                    if (Math.abs(v) > 0.005) return <Fragment key={i}>{celda(v, i === mesActualIdx ? "text-white font-bold" : "text-zinc-300")}</Fragment>;
                    // Sin cobro: si es un mes futuro y tiene cuota, enseña lo previsto atenuado
                    if (i > mesActualIdx && anyo >= hoy.getFullYear()) {
                      const prev = previstoDe(c, i);
                      if (prev !== null && prev > 0) return <td key={i} className="px-2 py-1 text-right italic tabular-nums text-zinc-600" title="Previsto (cuota asignada)">{n2(prev)}</td>;
                    }
                    return <td key={i} className="px-2 py-1 text-right text-zinc-800">·</td>;
                  })}
                  <td className="border-l border-zinc-800 px-3 py-1 text-right font-bold tabular-nums text-zinc-200">{n2(suma(vals))}</td>
                </tr>
              );
            })}
            {/* Ingresos sin cliente (grupales, merch, fisio…) */}
            <tr className="border-t border-zinc-700 bg-zinc-900/60">
              <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-bold text-zinc-400">Sin cliente (grupales, merch, fisio…)</td>
              <td className="px-2 py-1 text-[10px] text-zinc-500">Emp.</td>
              {sinCliente.map((v, i) => <Fragment key={i}>{celda(v, "text-zinc-400")}</Fragment>)}
              <td className="border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums text-zinc-300">{n2(suma(sinCliente))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-zinc-600">
        Cobrado real por mes (cash collected, incluye correcciones históricas). <b>baja</b> = meses posteriores a su baja ·
        <span className="italic"> cursiva</span> = previsto por su cuota en meses futuros · <b className="text-amber-500">debe</b> = pendiente de cobro.
        Clic en el nombre para abrir su ficha.
      </p>
    </div>
  );
}
