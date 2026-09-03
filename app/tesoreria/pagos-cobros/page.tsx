"use client";

// Pagos y cobros — "Gestión de clientes": MAPA MANUAL puro.
// Es un cuadro de control vuestro (fila × mes). Las casillas se pintan a mano:
// verde = pagado, rojo = no pagado, con una nota opcional (trimestral, pagó en
// enero…). NO lee ni escribe contabilidad: no muestra cobros reales ni crea
// nada en el Libro. Marcar una casilla NO implica que el dinero haya entrado.
// Las marcas viven en la tabla pagos_cobros_marcas.

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const GRUPO: Record<string, string> = { david: "David", luis: "Luis" };

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function PagosCobrosPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [filasBD, setFilasBD] = useState<Fila[]>([]);
  const [clientes, setClientes] = useState<Cli[]>([]);
  const [fEntrenador, setFEntrenador] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gestionando, setGestionando] = useState(false);

  // Añadir fila: cliente existente o alta rápida
  const [addCliente, setAddCliente] = useState("");
  const [altaNombre, setAltaNombre] = useState("");
  const [altaEntrenador, setAltaEntrenador] = useState("ethos");
  const [altaPlan, setAltaPlan] = useState("");

  // ---- Marcas manuales (verde/rojo): clave "filaId-mesIdx" -> { estado, nota } ----
  const [marcas, setMarcas] = useState<Map<string, { estado: string; nota: string | null }>>(new Map());
  // Selección por arrastre: rectángulo entre inicio y fin (índices de fila y mes)
  const [selIni, setSelIni] = useState<{ fi: number; mi: number } | null>(null);
  const [selFin, setSelFin] = useState<{ fi: number; mi: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [barra, setBarra] = useState<{ celdas: { filaId: number; mesIdx: number }[] } | null>(null);
  const [notaBarra, setNotaBarra] = useState("");

  const mesISO = (mesIdx: number) => `${anyo}-${String(mesIdx + 1).padStart(2, "0")}-01`;
  const claveMarca = (filaId: number, mesIdx: number) => `${filaId}-${mesIdx}`;
  const ESTADO_TXT = (e: string) => (e === "pagado" ? "Pagado ✓" : e === "no_pagado" ? "No pagado ✕" : e);

  const enSeleccion = (fi: number, mi: number) => {
    if (!selIni || !selFin) return false;
    return fi >= Math.min(selIni.fi, selFin.fi) && fi <= Math.max(selIni.fi, selFin.fi) &&
      mi >= Math.min(selIni.mi, selFin.mi) && mi <= Math.max(selIni.mi, selFin.mi);
  };

  const cargar = useCallback(async () => {
    const desde = `${anyo}-01-01`;
    const hasta = `${anyo + 1}-01-01`;
    const [fil, cli] = await Promise.all([
      supabase.from("pagos_cobros_filas").select("id, orden, etiqueta, cliente_id, patron").eq("activa", true).order("orden"),
      supabase.from("clientes").select("id, nombre, apellidos, entrenador, tipo_plan, fecha_baja"),
    ]);
    if (fil.error) return setError(fil.error.message);
    if (cli.error) return setError(cli.error.message);
    setFilasBD((fil.data as Fila[]) ?? []);
    setClientes((cli.data as Cli[]) ?? []);
    // Marcas manuales del año
    const { data: mk } = await supabase
      .from("pagos_cobros_marcas")
      .select("fila_id, mes, estado, nota")
      .gte("mes", desde).lt("mes", hasta);
    const mm = new Map<string, { estado: string; nota: string | null }>();
    for (const x of (mk as { fila_id: number; mes: string; estado: string; nota: string | null }[]) ?? []) {
      mm.set(`${x.fila_id}-${new Date(x.mes + "T00:00:00").getMonth()}`, { estado: x.estado, nota: x.nota });
    }
    setMarcas(mm);
  }, [anyo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = new Date();
  const mesActualIdx = hoy.getFullYear() === anyo ? hoy.getMonth() : hoy.getFullYear() < anyo ? -1 : 12;

  const porId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  // ---------- Gestión de filas ----------
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

  async function quitarFila(f: Fila) {
    if (!confirm(`¿Quitar la fila "${f.etiqueta}" del mapa? (no borra al cliente ni sus datos)`)) return;
    const { error } = await supabase.from("pagos_cobros_filas").delete().eq("id", f.id);
    if (error) return setError(error.message);
    cargar();
  }

  // Filas visibles en el orden fijo del mapa
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filasBD
      .map((f) => ({ f, c: f.cliente_id ? porId.get(f.cliente_id) ?? null : null }))
      .filter(({ c }) => {
        if (fEntrenador === "david" || fEntrenador === "luis") return c?.entrenador === fEntrenador;
        if (fEntrenador === "empresa") return !c || (c.entrenador !== "david" && c.entrenador !== "luis");
        return true;
      })
      .filter(({ f, c }) => !q || f.etiqueta.toLowerCase().includes(q) || (c && `${c.nombre} ${c.apellidos ?? ""}`.toLowerCase().includes(q)));
  }, [filasBD, porId, fEntrenador, busqueda]);

  // Clientes con ficha que aún no tienen fila (para el desplegable de añadir)
  const clientesSinFila = useMemo(() => {
    const con = new Set(filasBD.map((f) => f.cliente_id).filter(Boolean));
    return clientes
      .filter((c) => !con.has(c.id))
      .sort((a, b) => `${a.nombre} ${a.apellidos ?? ""}`.localeCompare(`${b.nombre} ${b.apellidos ?? ""}`));
  }, [clientes, filasBD]);

  const bajaEnMes = (c: Cli | null, mesIdx: number) => {
    if (!c?.fecha_baja) return false;
    const b = new Date(c.fecha_baja + "T00:00:00");
    return anyo > b.getFullYear() || (anyo === b.getFullYear() && mesIdx > b.getMonth());
  };

  // Conteo por mes de casillas marcadas verde/rojo (resumen del mapa)
  const resumen = useMemo(() => {
    const pag = Array(12).fill(0);
    const no = Array(12).fill(0);
    const idsVisibles = new Set(filas.map(({ f }) => f.id));
    for (const [k, v] of marcas) {
      const [fid, mi] = k.split("-").map(Number);
      if (!idsVisibles.has(fid)) continue;
      if (v.estado === "pagado") pag[mi] += 1;
      else if (v.estado === "no_pagado") no[mi] += 1;
    }
    return { pag, no };
  }, [marcas, filas]);

  // ---------- Arrastre de selección y aplicación de marca ----------
  function inicioArrastre(fi: number, mi: number) {
    setSelIni({ fi, mi }); setSelFin({ fi, mi }); setArrastrando(true); setBarra(null);
  }
  function entraArrastre(fi: number, mi: number) {
    if (arrastrando) setSelFin({ fi, mi });
  }
  function finArrastre() {
    if (!arrastrando || !selIni || !selFin) { setArrastrando(false); return; }
    setArrastrando(false);
    const celdas: { filaId: number; mesIdx: number }[] = [];
    for (let fi = Math.min(selIni.fi, selFin.fi); fi <= Math.max(selIni.fi, selFin.fi); fi++) {
      const fila = filas[fi];
      if (!fila) continue;
      for (let mi = Math.min(selIni.mi, selFin.mi); mi <= Math.max(selIni.mi, selFin.mi); mi++) {
        celdas.push({ filaId: fila.f.id, mesIdx: mi });
      }
    }
    // Nota por defecto: si el bloque abarca varios meses, sugiere la periodicidad
    const nMeses = Math.abs(selFin.mi - selIni.mi) + 1;
    // Precarga la nota existente si toda la selección comparte una
    const notas = new Set(celdas.map((c) => marcas.get(claveMarca(c.filaId, c.mesIdx))?.nota ?? "").filter(Boolean));
    setNotaBarra(notas.size === 1 ? [...notas][0] : nMeses === 3 ? "Trimestral" : nMeses === 6 ? "Semestral" : nMeses === 12 ? "Anual" : "");
    setBarra({ celdas });
  }

  async function aplicarMarca(estado: "pagado" | "no_pagado" | "borrar") {
    if (!barra) return;
    if (estado === "borrar") {
      for (const cel of barra.celdas) {
        await supabase.from("pagos_cobros_marcas").delete().eq("fila_id", cel.filaId).eq("mes", mesISO(cel.mesIdx));
      }
    } else {
      const filasSQL = barra.celdas.map((cel) => ({ fila_id: cel.filaId, mes: mesISO(cel.mesIdx), estado, nota: notaBarra.trim() || null, actualizado_en: new Date().toISOString() }));
      const { error } = await supabase.from("pagos_cobros_marcas").upsert(filasSQL, { onConflict: "fila_id,mes" });
      if (error) return setError(error.message);
    }
    setBarra(null); setSelIni(null); setSelFin(null); setNotaBarra("");
    cargar();
  }

  const cancelarSel = () => { setBarra(null); setSelIni(null); setSelFin(null); setNotaBarra(""); };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input placeholder="Buscar fila…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-48 flex-1 sm:max-w-xs`} />
        <select value={fEntrenador} onChange={(e) => setFEntrenador(e.target.value)} className={`${inputCls} appearance-none`}>
          <option value="todos">Entrenador: todos</option>
          <option value="david">David</option>
          <option value="luis">Luis</option>
          <option value="empresa">Empresa (Ethos/Alex)</option>
        </select>
        <select value={anyo} onChange={(e) => setAnyo(Number(e.target.value))} className={`${inputCls} appearance-none`}>
          {[new Date().getFullYear() + 1, new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => setGestionando(!gestionando)} className="ml-auto rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white">
          {gestionando ? "Cerrar" : "+ Añadir fila"}
        </button>
      </div>

      {gestionando && (
        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Cliente existente:</span>
            <select value={addCliente} onChange={(e) => setAddCliente(e.target.value)} className={`${inputCls} min-w-56 appearance-none`}>
              <option value="">— elige cliente —</option>
              {clientesSinFila.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ""}</option>
              ))}
            </select>
            <button onClick={anadirFilaCliente} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white">Añadir al mapa</button>
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
            <span className="text-[10px] text-zinc-600">Se crea también en Contactos (edítalo allí para email, cuota…)</span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-sky-900 bg-sky-950/20 px-3 py-2 text-[11px] text-zinc-400">
        <b className="text-sky-400">Mapa de control.</b> Arrastra el ratón sobre las casillas para seleccionarlas
        (varios meses = un pago trimestral/semestral/anual). Al soltar eliges color y nota.
        <span className="text-zinc-600">Verde = pagado · Rojo = no pagado. Es solo vuestro esquema: no afecta a la contabilidad.</span>
      </div>

      {/* Barra de acción tras seleccionar un rango */}
      {barra && (
        <div className="sticky top-2 z-20 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
          <span className="text-xs font-bold text-white">{barra.celdas.length} casilla(s)</span>
          <input
            placeholder="Nota (ej: Trimestral, pagó en enero…)"
            value={notaBarra}
            onChange={(e) => setNotaBarra(e.target.value)}
            className="min-w-40 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-red-500"
          />
          <button onClick={() => aplicarMarca("pagado")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">✓ Pagado</button>
          <button onClick={() => aplicarMarca("no_pagado")} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600">✕ No pagado</button>
          <button onClick={() => aplicarMarca("borrar")} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:bg-zinc-700">Quitar color</button>
          <button onClick={cancelarSel} className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-500">Cancelar</button>
        </div>
      )}

      {/* Mapa fila × mes */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full select-none text-xs" onMouseLeave={() => arrastrando && finArrastre()} onMouseUp={finArrastre}>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Fila</th>
              <th className="px-2 py-1.5 text-left">Ent.</th>
              {MESES.map((m, i) => (
                <th key={m} className={`min-w-16 px-2 py-1.5 text-center ${i === mesActualIdx ? "text-red-400" : ""}`}>{m}</th>
              ))}
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ f, c }, fi) => (
              <tr key={f.id} className="group border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/40">
                <td className="sticky left-0 z-10 max-w-48 bg-zinc-950/95 px-3 py-1">
                  {c ? (
                    <Link href={`/clientes/${c.id}`} className="block truncate font-semibold text-zinc-200 hover:text-red-400">
                      {f.etiqueta}
                    </Link>
                  ) : (
                    <span className="block truncate font-semibold text-zinc-400">{f.etiqueta}</span>
                  )}
                  <span className="block truncate text-[10px] text-zinc-600">
                    {c?.tipo_plan ?? (f.patron ? "agregado" : "")}
                  </span>
                </td>
                <td className="px-2 py-1 text-[10px] text-zinc-500">{c ? GRUPO[c.entrenador] ?? "Emp." : "Emp."}</td>
                {MESES.map((_, i) => {
                  const marca = marcas.get(claveMarca(f.id, i));
                  const sel = enSeleccion(fi, i);
                  const bgMarca = marca?.estado === "pagado" ? "bg-emerald-900/50" : marca?.estado === "no_pagado" ? "bg-red-900/50" : "";
                  const borde = sel ? "ring-1 ring-inset ring-sky-400 bg-sky-500/20" : "";
                  const baja = bajaEnMes(c, i) && !marca;
                  const contenido = marca?.nota
                    ? <span className="truncate text-[9px] text-zinc-300">{marca.nota}</span>
                    : marca?.estado === "pagado"
                      ? <span className="text-emerald-300">✓</span>
                      : marca?.estado === "no_pagado"
                        ? <span className="text-red-300">✕</span>
                        : baja
                          ? <span className="text-[9px] font-bold uppercase text-zinc-700">baja</span>
                          : <span className="text-zinc-800">·</span>;
                  return (
                    <td
                      key={i}
                      onMouseDown={(e) => { e.preventDefault(); inicioArrastre(fi, i); }}
                      onMouseEnter={() => entraArrastre(fi, i)}
                      title={marca?.nota ? `${ESTADO_TXT(marca.estado)} · ${marca.nota}` : marca ? ESTADO_TXT(marca.estado) : "Arrastra para marcar"}
                      className={`cursor-cell px-1 py-1.5 text-center ${bgMarca} ${borde} ${i === mesActualIdx ? "bg-zinc-900/40" : ""}`}
                    >
                      {contenido}
                    </td>
                  );
                })}
                <td className="px-1 py-1 text-center">
                  <button
                    onClick={() => quitarFila(f)}
                    title="Quitar fila del mapa (no borra al cliente)"
                    className="font-bold text-transparent group-hover:text-zinc-600 hover:!text-red-400"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={15} className="px-3 py-6 text-center text-xs text-zinc-600">No hay filas. Usa «+ Añadir fila» para empezar el mapa.</td></tr>
            )}
          </tbody>
          {filas.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-800 bg-zinc-900/60 text-[10px]">
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-bold text-zinc-500">Resumen</td>
                <td></td>
                {MESES.map((_, i) => (
                  <td key={i} className="px-1 py-1.5 text-center tabular-nums">
                    {resumen.pag[i] > 0 && <span className="text-emerald-400">{resumen.pag[i]}✓</span>}
                    {resumen.pag[i] > 0 && resumen.no[i] > 0 && <span className="text-zinc-700"> </span>}
                    {resumen.no[i] > 0 && <span className="text-red-400">{resumen.no[i]}✕</span>}
                    {resumen.pag[i] === 0 && resumen.no[i] === 0 && <span className="text-zinc-800">·</span>}
                  </td>
                ))}
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-zinc-600">
        <b>Arrastra</b> sobre una o varias casillas y elige <span className="rounded bg-emerald-900/50 px-1 text-emerald-300">verde = pagado</span> ·
        <span className="rounded bg-red-900/50 px-1 text-red-300"> rojo = no pagado</span>, con una nota (trimestral, pagó en enero…).
        <b> baja</b> = meses posteriores a la baja del cliente. Este mapa es <b>solo vuestro control de previsión</b>: no lee ni escribe la
        contabilidad. Los cobros reales se apuntan en <Link href="/apuntar" className="text-red-400 hover:underline">Apuntar</Link> o en la
        ficha del cliente.
      </p>
    </div>
  );
}
