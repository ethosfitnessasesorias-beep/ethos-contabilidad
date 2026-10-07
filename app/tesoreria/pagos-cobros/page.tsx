"use client";

// Gestión de clientes: hoja de control tipo Excel (fila × mes). En cada casilla
// escribes el IMPORTE cobrado ese mes; los totales por fila, por mes y el total
// facturado se calculan solos. Es un esquema VISUAL vuestro: NO lee ni escribe
// la contabilidad (los cobros reales se apuntan en el Libro). Datos en
// pagos_cobros_filas (filas + próximo cobro) y pagos_cobros_marcas (importe/mes).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Cli {
  id: number;
  nombre: string;
  apellidos: string | null;
  entrenador: string;
  tipo_plan: string | null;
  fecha_baja: string | null;
}
interface Fila {
  id: number;
  orden: number;
  etiqueta: string;
  cliente_id: number | null;
  patron: string | null;
  proximo_cobro: string | null;
  entrenador: string | null;
}

// Entrenador de una fila: manda el campo propio de la fila; si no tiene, se hereda
// del cliente vinculado; si tampoco, Empresa. Normalizado a david/luis/ethos.
const normEnt = (e: string | null | undefined) => (e === "david" || e === "luis" ? e : "ethos");

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const n2 =(v: number) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const eur0 = (v: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

interface Celda { estado: string; nota: string | null; importe: number }

export default function GestionClientesPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [filasBD, setFilasBD] = useState<Fila[]>([]);
  const [clientes, setClientes] = useState<Cli[]>([]);
  const [fEntrenador, setFEntrenador] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gestionando, setGestionando] = useState(false);

  const [addCliente, setAddCliente] = useState("");
  const [altaNombre, setAltaNombre] = useState("");
  const [altaEntrenador, setAltaEntrenador] = useState("ethos");
  const [altaPlan, setAltaPlan] = useState("");

  // Celdas: clave "filaId-mesIdx" -> { estado, nota, importe }
  const [celdas, setCeldas] = useState<Map<string, Celda>>(new Map());
  const [selIni, setSelIni] = useState<{ fi: number; mi: number } | null>(null);
  const [selFin, setSelFin] = useState<{ fi: number; mi: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [barra, setBarra] = useState<{ celdas: { filaId: number; mesIdx: number }[] } | null>(null);
  const [impBarra, setImpBarra] = useState("");
  const [notaBarra, setNotaBarra] = useState("");

  const mesISO = (mesIdx: number) => `${anyo}-${String(mesIdx + 1).padStart(2, "0")}-01`;
  const clave = (filaId: number, mesIdx: number) => `${filaId}-${mesIdx}`;

  const enSeleccion = (fi: number, mi: number) => {
    if (!selIni || !selFin) return false;
    return fi >= Math.min(selIni.fi, selFin.fi) && fi <= Math.max(selIni.fi, selFin.fi) &&
      mi >= Math.min(selIni.mi, selFin.mi) && mi <= Math.max(selIni.mi, selFin.mi);
  };

  const cargar = useCallback(async () => {
    const desde = `${anyo}-01-01`;
    const hasta = `${anyo + 1}-01-01`;
    const [fil, cli] = await Promise.all([
      supabase.from("pagos_cobros_filas").select("id, orden, etiqueta, cliente_id, patron, proximo_cobro, entrenador").eq("activa", true).order("orden"),
      supabase.from("clientes").select("id, nombre, apellidos, entrenador, tipo_plan, fecha_baja"),
    ]);
    if (fil.error) return setError(fil.error.message);
    if (cli.error) return setError(cli.error.message);
    setFilasBD((fil.data as Fila[]) ?? []);
    setClientes((cli.data as Cli[]) ?? []);
    const { data: mk } = await supabase
      .from("pagos_cobros_marcas")
      .select("fila_id, mes, estado, nota, importe")
      .gte("mes", desde).lt("mes", hasta);
    const mm = new Map<string, Celda>();
    for (const x of (mk as { fila_id: number; mes: string; estado: string; nota: string | null; importe: number | null }[]) ?? []) {
      mm.set(`${x.fila_id}-${new Date(x.mes + "T00:00:00").getMonth()}`, { estado: x.estado, nota: x.nota, importe: Number(x.importe) || 0 });
    }
    setCeldas(mm);
  }, [anyo]);

  useEffect(() => { cargar(); }, [cargar]);

  const hoy = new Date();
  const mesActualIdx = hoy.getFullYear() === anyo ? hoy.getMonth() : hoy.getFullYear() < anyo ? -1 : 12;
  const porId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  const ordenSiguiente = () => (filasBD.length ? Math.max(...filasBD.map((f) => f.orden)) + 10 : 10);

  async function anadirFilaCliente() {
    const id = Number(addCliente);
    if (!id) return;
    const c = porId.get(id);
    if (!c) return;
    const { error } = await supabase.from("pagos_cobros_filas").insert({
      orden: ordenSiguiente(), etiqueta: `${c.nombre} ${c.apellidos ?? ""}`.trim(), cliente_id: id,
    });
    if (error) return setError(error.message);
    setAddCliente("");
    cargar();
  }

  async function crearClienteRapido() {
    const nombre = altaNombre.trim();
    if (!nombre) return setError("Pon el nombre.");
    const nn = nombre.toLowerCase();
    const parecido = clientes.find((x) => `${x.nombre} ${x.apellidos ?? ""}`.trim().toLowerCase().includes(nn));
    if (parecido && !confirm(`Ya existe "${parecido.nombre} ${parecido.apellidos ?? ""}". ¿Crear otra ficha igualmente?`)) return;
    const { data, error } = await supabase.from("clientes").insert({
      nombre, entrenador: altaEntrenador, estado: "cliente", origen: "manual",
      tipo_plan: altaPlan.trim() || null, fecha_inicio: hoy.toISOString().slice(0, 10),
    }).select("id").single();
    if (error || !data) return setError(error?.message ?? "No se pudo crear.");
    await supabase.from("pagos_cobros_filas").insert({ orden: ordenSiguiente(), etiqueta: nombre, cliente_id: data.id });
    setAltaNombre(""); setAltaPlan("");
    cargar();
  }

  // El entrenador se guarda en la propia fila (no toca el CRM ni a otros socios).
  async function cambiarEntrenador(filaId: number, entrenador: string) {
    setFilasBD((prev) => prev.map((f) => (f.id === filaId ? { ...f, entrenador } : f)));
    const { error } = await supabase.from("pagos_cobros_filas").update({ entrenador }).eq("id", filaId);
    if (error) setError(error.message);
  }

  async function quitarFila(f: Fila) {
    if (!confirm(`¿Quitar la fila "${f.etiqueta}"? (no borra al cliente ni sus datos)`)) return;
    const { error } = await supabase.from("pagos_cobros_filas").delete().eq("id", f.id);
    if (error) return setError(error.message);
    cargar();
  }

  // Entrenador efectivo de la fila: propio > heredado del cliente > empresa.
  const entDe = useCallback((f: Fila, c: Cli | null) => normEnt(f.entrenador ?? c?.entrenador ?? null), []);

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filasBD
      .map((f) => ({ f, c: f.cliente_id ? porId.get(f.cliente_id) ?? null : null }))
      .filter(({ f, c }) => {
        const e = entDe(f, c);
        if (fEntrenador === "david" || fEntrenador === "luis") return e === fEntrenador;
        if (fEntrenador === "empresa") return e === "ethos";
        return true;
      })
      .filter(({ f, c }) => !q || f.etiqueta.toLowerCase().includes(q) || (c && `${c.nombre} ${c.apellidos ?? ""}`.toLowerCase().includes(q)));
  }, [filasBD, porId, fEntrenador, busqueda]);

  const clientesSinFila = useMemo(() => {
    const con = new Set(filasBD.map((f) => f.cliente_id).filter(Boolean));
    return clientes.filter((c) => !con.has(c.id)).sort((a, b) => `${a.nombre} ${a.apellidos ?? ""}`.localeCompare(`${b.nombre} ${b.apellidos ?? ""}`));
  }, [clientes, filasBD]);

  const bajaEnMes = (c: Cli | null, mesIdx: number) => {
    if (!c?.fecha_baja) return false;
    const b = new Date(c.fecha_baja + "T00:00:00");
    return anyo > b.getFullYear() || (anyo === b.getFullYear() && mesIdx > b.getMonth());
  };

  // Totales SOLO de lo cobrado (verde). Por fila, por mes, por entrenador y total.
  // Lo marcado "no pagado" no suma: es un recordatorio de lo que deben.
  const grupoDe = (e: string) => (e === "david" ? "David" : e === "luis" ? "Luis" : "Empresa");
  const totales = useMemo(() => {
    const porFila = new Map<number, number>();
    const porMes = Array(12).fill(0);
    const porGrupo: Record<string, number[]> = { David: Array(12).fill(0), Luis: Array(12).fill(0), Empresa: Array(12).fill(0) };
    let total = 0;
    const grupoFila = new Map(filas.map(({ f, c }) => [f.id, grupoDe(entDe(f, c))]));
    for (const [k, v] of celdas) {
      const [fid, mi] = k.split("-").map(Number);
      if (!grupoFila.has(fid) || v.estado !== "pagado" || !v.importe) continue;
      porFila.set(fid, (porFila.get(fid) ?? 0) + v.importe);
      porMes[mi] += v.importe;
      total += v.importe;
      porGrupo[grupoFila.get(fid)!][mi] += v.importe;
    }
    return { porFila, porMes, porGrupo, total: Math.round(total * 100) / 100 };
  }, [celdas, filas, entDe]);
  const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);

  // ---------- Selección por arrastre ----------
  function inicioArrastre(fi: number, mi: number) {
    setSelIni({ fi, mi }); setSelFin({ fi, mi }); setArrastrando(true); setBarra(null);
  }
  function entraArrastre(fi: number, mi: number) { if (arrastrando) setSelFin({ fi, mi }); }
  // Si sueltas el ratón FUERA de la tabla, la selección se quedaba "pegada" y
  // seguía seleccionando al pasar por encima. Un listener global lo evita.
  const finRef = useRef<() => void>(() => {});
  useEffect(() => {
    const h = () => finRef.current();
    window.addEventListener("mouseup", h);
    return () => window.removeEventListener("mouseup", h);
  }, []);
  function finArrastre() {
    if (!arrastrando || !selIni || !selFin) { setArrastrando(false); return; }
    setArrastrando(false);
    const cs: { filaId: number; mesIdx: number }[] = [];
    for (let fi = Math.min(selIni.fi, selFin.fi); fi <= Math.max(selIni.fi, selFin.fi); fi++) {
      const fila = filas[fi];
      if (!fila) continue;
      for (let mi = Math.min(selIni.mi, selFin.mi); mi <= Math.max(selIni.mi, selFin.mi); mi++) cs.push({ filaId: fila.f.id, mesIdx: mi });
    }
    // Precarga importe/nota si la selección es una sola celda con datos
    const prim = cs.length === 1 ? celdas.get(clave(cs[0].filaId, cs[0].mesIdx)) : null;
    setImpBarra(prim?.importe ? String(prim.importe) : "");
    const nMeses = Math.abs(selFin.mi - selIni.mi) + 1;
    setNotaBarra(prim?.nota ?? (nMeses === 3 ? "Trimestral" : nMeses === 6 ? "Semestral" : nMeses === 12 ? "Anual" : ""));
    setBarra({ celdas: cs });
  }
  finRef.current = finArrastre;

  async function aplicar(modo: "importe" | "no_pagado" | "borrar") {
    if (!barra) return;
    if (modo === "borrar") {
      for (const cel of barra.celdas) await supabase.from("pagos_cobros_marcas").delete().eq("fila_id", cel.filaId).eq("mes", mesISO(cel.mesIdx));
    } else {
      const impTecleado = Math.round((Number(impBarra.replace(",", ".")) || 0) * 100) / 100;
      if (modo === "importe" && impTecleado <= 0) return setError("Pon un importe mayor que 0 (o usa «No pagado» / «Quitar»).");
      // "No pagado" conserva el importe (lo que debe) como recordatorio; si no
      // tecleas importe, mantiene el que ya tuviera la casilla.
      const filasSQL = barra.celdas.map((cel) => {
        const previo = celdas.get(clave(cel.filaId, cel.mesIdx))?.importe ?? 0;
        const imp = modo === "importe" ? impTecleado : (impTecleado > 0 ? impTecleado : previo);
        return {
          fila_id: cel.filaId, mes: mesISO(cel.mesIdx),
          estado: modo === "importe" ? "pagado" : "no_pagado",
          importe: imp, nota: notaBarra.trim() || null, actualizado_en: new Date().toISOString(),
        };
      });
      const { error } = await supabase.from("pagos_cobros_marcas").upsert(filasSQL, { onConflict: "fila_id,mes" });
      if (error) return setError(error.message);
    }
    setBarra(null); setSelIni(null); setSelFin(null); setImpBarra(""); setNotaBarra("");
    cargar();
  }

  const cancelarSel = () => { setBarra(null); setSelIni(null); setSelFin(null); setImpBarra(""); setNotaBarra(""); };
  const anyos = [new Date().getFullYear() + 1, new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input placeholder="Buscar cliente…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-44 flex-1 sm:max-w-xs`} />
        <select value={fEntrenador} onChange={(e) => setFEntrenador(e.target.value)} className={`${inputCls} appearance-none`}>
          <option value="todos">Entrenador: todos</option>
          <option value="david">David</option>
          <option value="luis">Luis</option>
          <option value="empresa">Empresa (Ethos/Alex)</option>
        </select>
        <select value={anyo} onChange={(e) => setAnyo(Number(e.target.value))} className={`${inputCls} appearance-none`}>
          {anyos.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="rounded-full bg-emerald-950 px-3 py-1.5 text-xs font-bold text-emerald-300" title="Suma de todos los importes de la rejilla (solo visual, no afecta a la contabilidad)">
          Facturado {fEntrenador !== "todos" ? `(${fEntrenador})` : ""} <span className="text-emerald-400">{eur0(totales.total)}</span>
        </span>
        <button onClick={() => setGestionando(!gestionando)} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white">
          {gestionando ? "Cerrar" : "+ Añadir cliente"}
        </button>
      </div>

      {gestionando && (
        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Cliente existente:</span>
            <select value={addCliente} onChange={(e) => setAddCliente(e.target.value)} className={`${inputCls} min-w-56 appearance-none`}>
              <option value="">— elige cliente —</option>
              {clientesSinFila.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ""}</option>)}
            </select>
            <button onClick={anadirFilaCliente} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white">Añadir</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-2">
            <span className="text-xs font-bold text-zinc-400">Cliente nuevo:</span>
            <input placeholder="Nombre y apellidos" value={altaNombre} onChange={(e) => setAltaNombre(e.target.value)} className={inputCls} />
            <select value={altaEntrenador} onChange={(e) => setAltaEntrenador(e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="ethos">Empresa</option>
              <option value="david">David</option>
              <option value="luis">Luis</option>
            </select>
            <input placeholder="Servicio/plan (opcional)" value={altaPlan} onChange={(e) => setAltaPlan(e.target.value)} className={inputCls} />
            <button onClick={crearClienteRapido} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white">Crear y añadir</button>
            <span className="text-[10px] text-zinc-600">Se crea también en Contactos.</span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="mb-2 rounded-xl border border-sky-900 bg-sky-950/20 px-3 py-2 text-[11px] leading-snug text-zinc-400">
        <b className="text-sky-400">Hoja de clientes.</b> Pincha una casilla (o arrastra varias para juntar un periodo) y escribe el <b>importe</b>.
        <span className="text-emerald-400"> Verde = cobrado</span> (suma al facturado) · <span className="text-amber-400">ámbar = debe</span> (recordatorio, no suma).
        Los totales por entrenador y por mes salen solos. Esquema visual vuestro: <b>no afecta a la contabilidad</b>.
      </div>

      {/* Barra de acción tras seleccionar celdas */}
      {barra && (
        <div className="sticky top-2 z-20 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
          <span className="text-xs font-bold text-white">{barra.celdas.length} casilla(s)</span>
          <input inputMode="decimal" placeholder="Importe €" value={impBarra} onChange={(e) => setImpBarra(e.target.value)}
            className="w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-right text-xs tabular-nums text-white outline-none focus:border-red-500" autoFocus />
          <input placeholder="Nota (trimestral, pagó en enero…)" value={notaBarra} onChange={(e) => setNotaBarra(e.target.value)}
            className="min-w-36 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-red-500" />
          <button onClick={() => aplicar("importe")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">✓ Aplicar importe</button>
          <button onClick={() => aplicar("no_pagado")} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600">✕ No pagado</button>
          <button onClick={() => aplicar("borrar")} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:bg-zinc-700">Quitar</button>
          <button onClick={cancelarSel} className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-500">Cancelar</button>
        </div>
      )}

      {/* Totales por entrenador y por mes (como el Excel) — solo lo cobrado */}
      {filas.length > 0 && (
        <div className="mb-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Cobrado {anyo}</th>
                {MESES.map((m, i) => <th key={m} className={`min-w-14 px-2 py-1.5 text-right ${i === mesActualIdx ? "text-red-400" : ""}`}>{m}</th>)}
                <th className="min-w-16 border-l border-zinc-800 px-2 py-1.5 text-right text-zinc-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {(["David", "Luis", "Empresa"] as const).map((g) => (
                <tr key={g} className="border-b border-zinc-800/50">
                  <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1 font-bold text-zinc-300">{g}</td>
                  {totales.porGrupo[g].map((v: number, i: number) => <td key={i} className="px-2 py-1 text-right tabular-nums text-zinc-400">{v > 0 ? n2(v) : <span className="text-zinc-800">·</span>}</td>)}
                  <td className="border-l border-zinc-800 px-2 py-1 text-right font-bold tabular-nums text-zinc-200">{n2(suma(totales.porGrupo[g]))}</td>
                </tr>
              ))}
              <tr className="bg-emerald-950/30 font-black">
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 text-emerald-400">TOTAL</td>
                {totales.porMes.map((v: number, i: number) => <td key={i} className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{v > 0 ? n2(v) : <span className="text-zinc-800">·</span>}</td>)}
                <td className="border-l border-zinc-800 px-2 py-1.5 text-right tabular-nums text-emerald-400">{n2(totales.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full select-none text-xs" onMouseLeave={() => arrastrando && finArrastre()} onMouseUp={finArrastre}>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Cliente</th>
              <th className="px-2 py-1.5 text-left">Ent.</th>
              {MESES.map((m, i) => <th key={m} className={`min-w-14 px-2 py-1.5 text-center ${i === mesActualIdx ? "text-red-400" : ""}`}>{m}</th>)}
              <th className="min-w-16 border-l border-zinc-800 px-2 py-1.5 text-right text-zinc-400">Total</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ f, c }, fi) => (
              <tr key={f.id} className="group border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/40">
                <td className="sticky left-0 z-10 max-w-48 bg-zinc-950/95 px-3 py-1">
                  {c ? (
                    <Link href={`/clientes/${c.id}`} className="block truncate font-semibold text-zinc-200 hover:text-red-400">{f.etiqueta}</Link>
                  ) : (
                    <span className="block truncate font-semibold text-zinc-400">{f.etiqueta}</span>
                  )}
                  <span className="block truncate text-[10px] text-zinc-600">{c?.tipo_plan ?? (f.patron ? "agregado" : "")}</span>
                </td>
                <td className="px-1 py-1">
                  <select
                    value={entDe(f, c)}
                    onChange={(e) => cambiarEntrenador(f.id, e.target.value)}
                    title="Cambiar entrenador de esta fila"
                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-[10px] text-zinc-400 outline-none hover:border-zinc-700 focus:border-red-500"
                  >
                    <option value="david">David</option>
                    <option value="luis">Luis</option>
                    <option value="ethos">Empresa</option>
                  </select>
                </td>
                {MESES.map((_, i) => {
                  const cel = celdas.get(clave(f.id, i));
                  const sel = enSeleccion(fi, i);
                  const pagado = cel?.estado === "pagado" && cel.importe > 0;
                  const debe = cel?.estado === "no_pagado";
                  const bg = pagado ? "bg-emerald-900/50" : debe ? "bg-amber-900/40" : "";
                  const borde = sel ? "ring-1 ring-inset ring-sky-400 bg-sky-500/20" : "";
                  const baja = bajaEnMes(c, i) && !cel;
                  const contenido = pagado
                    ? <span className="tabular-nums text-emerald-300">{n2(cel!.importe)}</span>
                    : debe
                      ? (cel!.importe > 0 ? <span className="tabular-nums text-amber-400">{n2(cel!.importe)}</span> : <span className="text-amber-400">✕</span>)
                      : baja ? <span className="text-[9px] font-bold uppercase text-zinc-700">baja</span> : <span className="text-zinc-800">·</span>;
                  return (
                    <td key={i}
                      onMouseDown={(e) => { e.preventDefault(); inicioArrastre(fi, i); }}
                      onMouseEnter={() => entraArrastre(fi, i)}
                      title={debe ? `Debe${cel!.importe > 0 ? ` ${n2(cel!.importe)} €` : ""}${cel!.nota ? ` · ${cel!.nota}` : ""}` : (cel?.nota ?? "Pincha o arrastra para poner importe")}
                      className={`cursor-cell px-1 py-1.5 text-right ${bg} ${borde} ${i === mesActualIdx && !bg ? "bg-zinc-900/40" : ""}`}>
                      {contenido}
                    </td>
                  );
                })}
                <td className="border-l border-zinc-800 px-2 py-1 text-right font-bold tabular-nums text-zinc-200">
                  {totales.porFila.get(f.id) ? n2(totales.porFila.get(f.id)!) : <span className="text-zinc-700">·</span>}
                </td>
                <td className="px-1 py-1 text-center">
                  <button onClick={() => quitarFila(f)} title="Quitar fila (no borra al cliente)" className="font-bold text-transparent group-hover:text-zinc-600 hover:!text-red-400">✕</button>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={16} className="px-3 py-6 text-center text-xs text-zinc-600">No hay clientes. Usa «+ Añadir cliente» para empezar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-zinc-600">
        <b>Pincha/arrastra</b> casillas y escribe el importe. <b>Juntar un periodo</b>: arrastra varios meses y pon la nota (semestral…).
        <b> baja</b> = meses posteriores a la baja del cliente. Esto es <b>solo vuestra hoja de control</b>: no toca la contabilidad.
        Los cobros reales se apuntan en <Link href="/apuntar" className="text-red-400 hover:underline">Apuntar</Link>.
      </p>
    </div>
  );
}
