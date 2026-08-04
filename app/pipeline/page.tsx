"use client";

// Embudo de ventas estilo Holded: varios embudos, cada uno con sus fases.
// Las tarjetas se editan al clic, van ligadas a un contacto, admiten notas y
// fecha de seguimiento (aviso en Dashboard, Actividades y correo del lunes).
// No tiene efecto contable hasta que se marca Ganado.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import type { Canal, Cliente, Deal } from "@/lib/tipos";

interface Embudo {
  id: number;
  nombre: string;
  orden: number;
}
interface Columna {
  id: number;
  titulo: string;
  orden: number;
  embudo_id: number | null;
}
interface Persona {
  codigo: string;
  nombre: string;
}
interface DealConCliente extends Deal {
  columna_id: number | null;
  embudo_id: number | null;
  seguimiento: string | null;
  seguimiento_nota: string | null;
  clientes: { nombre: string } | null;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function EmbudoVentas() {
  const sesionOk = useSesion();
  const router = useRouter();
  const [embudos, setEmbudos] = useState<Embudo[]>([]);
  const [embudoSel, setEmbudoSel] = useState<number | null>(null);
  const [columnas, setColumnas] = useState<Columna[]>([]);
  const [deals, setDeals] = useState<DealConCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Embudos (crear/renombrar/borrar)
  const [gestionEmbudo, setGestionEmbudo] = useState(false);
  const [nombreEmbudo, setNombreEmbudo] = useState("");

  // Deal (alta/edición)
  const [editando, setEditando] = useState<DealConCliente | null>(null);
  const [creando, setCreando] = useState(false);
  const [fTitulo, setFTitulo] = useState("");
  const [fClienteNombre, setFClienteNombre] = useState("");
  const [fCanal, setFCanal] = useState<Canal>("presencial");
  const [fImporte, setFImporte] = useState("");
  const [fResponsable, setFResponsable] = useState("ethos");
  const [fOrigen, setFOrigen] = useState("");
  const [fNotas, setFNotas] = useState("");
  const [fSeguimiento, setFSeguimiento] = useState("");
  const [fSeguimientoNota, setFSeguimientoNota] = useState("");

  // Columnas
  const [colEditando, setColEditando] = useState<number | null>(null);
  const [colTitulo, setColTitulo] = useState("");
  const [creandoCol, setCreandoCol] = useState(false);
  const [nuevaCol, setNuevaCol] = useState("");

  const cargar = useCallback(async () => {
    const [em, col, d, c, per] = await Promise.all([
      supabase.from("embudos").select("id, nombre, orden").eq("activo", true).order("orden"),
      supabase.from("pipeline_columnas").select("*").order("orden"),
      supabase
        .from("deals")
        .select("*, clientes(nombre)")
        .not("etapa", "in", "(ganado,perdido)")
        .order("creado_en", { ascending: false }),
      supabase.from("clientes").select("id, nombre, entrenador").is("fecha_baja", null).order("nombre"),
      supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
    ]);
    if (em.error) return setError(em.error.message.includes("embudos") ? "Falta la migración de embudos." : em.error.message);
    const listaEm = (em.data as Embudo[]) ?? [];
    setEmbudos(listaEm);
    setEmbudoSel((prev) => (prev && listaEm.some((e) => e.id === prev) ? prev : listaEm[0]?.id ?? null));
    setColumnas((col.data as Columna[]) ?? []);
    setDeals((d.data as unknown as DealConCliente[]) ?? []);
    setClientes((c.data as Cliente[]) ?? []);
    setPersonas((per.data as Persona[]) ?? []);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  const nombrePersona = (codigo: string) => personas.find((p) => p.codigo === codigo)?.nombre ?? codigo;

  const colsEmbudo = columnas.filter((c) => c.embudo_id === embudoSel);
  const dealsEmbudo = deals.filter((d) => d.embudo_id === embudoSel);

  // --- Embudos ---
  async function crearEmbudo() {
    const nombre = nombreEmbudo.trim();
    if (!nombre) return;
    const maxOrden = Math.max(0, ...embudos.map((e) => e.orden));
    const { data, error } = await supabase.from("embudos").insert({ nombre, orden: maxOrden + 1 }).select("id").single();
    if (error || !data) return setError(error?.message ?? "No se pudo crear.");
    // Fases de arranque del embudo nuevo
    await supabase.from("pipeline_columnas").insert(
      ["Lead", "Contactado", "Propuesta", "Cierre"].map((t, i) => ({ titulo: t, orden: i + 1, embudo_id: data.id }))
    );
    setNombreEmbudo("");
    setGestionEmbudo(false);
    await cargar();
    setEmbudoSel(data.id);
  }

  async function renombrarEmbudo() {
    const nombre = nombreEmbudo.trim();
    if (!nombre || !embudoSel) return;
    await supabase.from("embudos").update({ nombre }).eq("id", embudoSel);
    setNombreEmbudo("");
    setGestionEmbudo(false);
    cargar();
  }

  async function borrarEmbudo() {
    if (!embudoSel) return;
    if (embudos.length <= 1) return setError("Debe quedar al menos un embudo.");
    if (dealsEmbudo.length > 0) return setError("Este embudo tiene tarjetas: muévelas o ciérralas antes de borrarlo.");
    const em = embudos.find((e) => e.id === embudoSel);
    if (!window.confirm(`¿Borrar el embudo "${em?.nombre}" y sus fases?`)) return;
    await supabase.from("pipeline_columnas").delete().eq("embudo_id", embudoSel);
    const { error } = await supabase.from("embudos").delete().eq("id", embudoSel);
    if (error) return setError(error.message);
    setGestionEmbudo(false);
    setEmbudoSel(null);
    cargar();
  }

  // --- Deals ---
  function abrirCrear() {
    setEditando(null);
    setFTitulo("");
    setFClienteNombre("");
    setFCanal("presencial");
    setFImporte("");
    setFResponsable("ethos");
    setFOrigen("");
    setFNotas("");
    setFSeguimiento("");
    setFSeguimientoNota("");
    setCreando(true);
  }

  function abrirEditar(d: DealConCliente) {
    setCreando(false);
    setEditando(d);
    setFTitulo(d.titulo);
    setFClienteNombre(d.clientes?.nombre ?? "");
    setFCanal(d.canal);
    setFImporte(String(d.importe_estimado || ""));
    setFResponsable(d.responsable);
    setFOrigen(d.origen ?? "");
    setFNotas(d.notas ?? "");
    setFSeguimiento(d.seguimiento ?? "");
    setFSeguimientoNota(d.seguimiento_nota ?? "");
  }

  async function resolverCliente(): Promise<number | null> {
    const nombre = fClienteNombre.trim();
    if (!nombre) return null;
    const existente = clientes.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) return existente.id;
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nombre, entrenador: fResponsable, estado: "lead", canal: fCanal, origen: fOrigen.trim() || null })
      .select("id")
      .single();
    if (error || !data) {
      setError(error?.message ?? "No se pudo crear el contacto");
      return null;
    }
    return data.id;
  }

  // El seguimiento crea/actualiza su aviso en Actividades
  async function sincronizarActividad(dealTitulo: string, clienteId: number | null, seguimientoPrevio: string | null) {
    if (!fSeguimiento || fSeguimiento === seguimientoPrevio) return;
    const { data: cols } = await supabase.from("tablero_columnas").select("id").order("orden").limit(1);
    const colId = (cols as { id: number }[] | null)?.[0]?.id ?? null;
    await supabase.from("actividades").insert({
      titulo: `Seguimiento: ${dealTitulo}`,
      tipo: "tarea",
      prioridad: "alta",
      responsable: fResponsable,
      cuando: new Date(fSeguimiento + "T09:00:00").toISOString(),
      notas: fSeguimientoNota.trim() || null,
      cliente_id: clienteId,
      columna_id: colId,
      etiquetas: [],
      hecha: false,
      archivada_en: null,
      orden: 0,
    });
  }

  async function guardarDeal() {
    if (!fTitulo.trim()) return setError("Pon un título a la tarjeta.");
    setError(null);
    const clienteId = await resolverCliente();
    const datos = {
      titulo: fTitulo.trim(),
      cliente_id: clienteId,
      canal: fCanal,
      importe_estimado: Number(fImporte.replace(",", ".")) || 0,
      responsable: fResponsable,
      origen: fOrigen.trim() || null,
      notas: fNotas.trim() || null,
      seguimiento: fSeguimiento || null,
      seguimiento_nota: fSeguimientoNota.trim() || null,
    };
    const res = editando
      ? await supabase.from("deals").update(datos).eq("id", editando.id)
      : await supabase
          .from("deals")
          .insert({ ...datos, etapa: "lead", embudo_id: embudoSel, columna_id: colsEmbudo[0]?.id ?? null });
    if (res.error) return setError(res.error.message);
    await sincronizarActividad(datos.titulo, clienteId, editando?.seguimiento ?? null);
    setCreando(false);
    setEditando(null);
    cargar();
  }

  async function borrarDeal() {
    if (!editando) return;
    if (!window.confirm(`¿Borrar la tarjeta "${editando.titulo}"?`)) return;
    const { error } = await supabase.from("deals").delete().eq("id", editando.id);
    if (error) return setError(error.message);
    setEditando(null);
    cargar();
  }

  async function moverColumna(id: number, columna: Columna) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, columna_id: columna.id } : d)));
    const { error } = await supabase.from("deals").update({ columna_id: columna.id }).eq("id", id);
    if (error) {
      setError(error.message);
      cargar();
    }
  }

  async function ganar(d: DealConCliente) {
    const r1 = await supabase
      .from("deals")
      .update({ etapa: "ganado", fecha_cierre: new Date().toISOString().slice(0, 10) })
      .eq("id", d.id);
    if (r1.error) return setError(r1.error.message);
    if (d.cliente_id) await supabase.from("clientes").update({ estado: "cliente" }).eq("id", d.cliente_id);
    sessionStorage.setItem(
      "prefill_ingreso",
      JSON.stringify({
        clienteNombre: d.clientes?.nombre ?? "",
        importe: d.importe_estimado || "",
        canal: d.canal,
        atribucion: d.responsable,
        concepto: d.titulo,
      })
    );
    router.push("/apuntar");
  }

  async function perder(d: DealConCliente) {
    const { error } = await supabase
      .from("deals")
      .update({ etapa: "perdido", fecha_cierre: new Date().toISOString().slice(0, 10) })
      .eq("id", d.id);
    if (error) return setError(error.message);
    setAviso(`"${d.titulo}" marcado como perdido.`);
    setTimeout(() => setAviso(null), 3000);
    cargar();
  }

  // --- Columnas ---
  async function crearColumna() {
    if (!nuevaCol.trim() || !embudoSel) return;
    const maxOrden = Math.max(0, ...colsEmbudo.map((c) => c.orden));
    const { error } = await supabase
      .from("pipeline_columnas")
      .insert({ titulo: nuevaCol.trim(), orden: maxOrden + 1, embudo_id: embudoSel });
    if (error) return setError(error.message);
    setNuevaCol("");
    setCreandoCol(false);
    cargar();
  }
  async function guardarColumna() {
    if (colEditando === null || !colTitulo.trim()) return;
    await supabase.from("pipeline_columnas").update({ titulo: colTitulo.trim() }).eq("id", colEditando);
    setColEditando(null);
    cargar();
  }
  async function borrarColumna(c: Columna) {
    if (dealsEmbudo.some((d) => d.columna_id === c.id)) return setError(`"${c.titulo}" tiene tarjetas: muévelas antes de borrarla.`);
    if (!window.confirm(`¿Borrar la fase "${c.titulo}"?`)) return;
    await supabase.from("pipeline_columnas").delete().eq("id", c.id);
    setColEditando(null);
    cargar();
  }
  async function moverColOrden(c: Columna, dir: -1 | 1) {
    const idx = colsEmbudo.findIndex((x) => x.id === c.id);
    const vecina = colsEmbudo[idx + dir];
    if (!vecina) return;
    await supabase.from("pipeline_columnas").update({ orden: vecina.orden }).eq("id", c.id);
    await supabase.from("pipeline_columnas").update({ orden: c.orden }).eq("id", vecina.id);
    cargar();
  }

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const dias = (fecha: string) => Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 86400000));

  // Estado del seguimiento de una tarjeta: vencido (rojo) / próximo ≤3 días (ámbar)
  const badgeSeguimiento = (d: DealConCliente) => {
    if (!d.seguimiento) return null;
    const hoy = hoyISO();
    const en3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const fecha = new Date(d.seguimiento + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    if (d.seguimiento <= hoy)
      return <span className="rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-400" title={d.seguimiento_nota ?? ""}>⏰ {fecha}</span>;
    if (d.seguimiento <= en3)
      return <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-400" title={d.seguimiento_nota ?? ""}>⏰ {fecha}</span>;
    return <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-500" title={d.seguimiento_nota ?? ""}>⏰ {fecha}</span>;
  };

  const formulario = (creando || editando) && (
    <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{editando ? "Editar tarjeta" : "Nueva tarjeta"}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input placeholder="Título (ej: Trimestre entreno + nutri)" value={fTitulo} onChange={(e) => setFTitulo(e.target.value)} className={inputCls} />
        <input list="lista-contactos" placeholder="Contacto (si no existe, se crea)" value={fClienteNombre} onChange={(e) => setFClienteNombre(e.target.value)} className={inputCls} />
        <datalist id="lista-contactos">
          {clientes.map((c) => (
            <option key={c.id} value={c.nombre} />
          ))}
        </datalist>
        <input placeholder="Importe estimado €" inputMode="decimal" value={fImporte} onChange={(e) => setFImporte(e.target.value)} className={inputCls} />
        <input placeholder="Origen (Instagram, referido…)" value={fOrigen} onChange={(e) => setFOrigen(e.target.value)} className={inputCls} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Canal:</span>
        {(["presencial", "online"] as Canal[]).map((c) => (
          <button key={c} onClick={() => setFCanal(c)} className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${fCanal === c ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{c}</button>
        ))}
        <span className="ml-2 text-xs text-zinc-500">Responsable:</span>
        {personas.map((p) => (
          <button key={p.codigo} onClick={() => setFResponsable(p.codigo)} className={`rounded-full px-3 py-1 text-xs font-semibold ${fResponsable === p.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{p.nombre}</button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-zinc-500">Seguimiento (aviso ese día)</span>
          <input type="date" value={fSeguimiento} onChange={(e) => setFSeguimiento(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-zinc-500">Qué hacer en el seguimiento</span>
          <input placeholder="Ej: llamarle tras su semana de prueba" value={fSeguimientoNota} onChange={(e) => setFSeguimientoNota(e.target.value)} className={inputCls} />
        </label>
      </div>
      <textarea placeholder="Notas (opcional)" rows={2} value={fNotas} onChange={(e) => setFNotas(e.target.value)} className={inputCls} />
      <div className="flex gap-2">
        <button onClick={guardarDeal} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">{editando ? "Guardar cambios" : "Crear tarjeta"}</button>
        <button onClick={() => { setCreando(false); setEditando(null); }} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-zinc-300">Cancelar</button>
        {editando && <button onClick={borrarDeal} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-red-400">Borrar</button>}
      </div>
      {fSeguimiento && (
        <p className="text-[10px] text-zinc-600">
          El seguimiento avisa ese día en el Dashboard, crea una tarjeta en Actividades y sale en el correo del lunes.
        </p>
      )}
    </div>
  );

  return (
    <Shell titulo="Embudo de ventas">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Embudo de ventas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Varios embudos, cada uno con sus fases. Nada de esto toca la contabilidad hasta marcar <b>Ganado</b>.
            </p>
          </div>
          <button onClick={abrirCrear} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">+ Nueva tarjeta</button>
        </div>

        {/* Selector de embudos */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {embudos.map((e) => (
            <button
              key={e.id}
              onClick={() => setEmbudoSel(e.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                embudoSel === e.id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {e.nombre}
            </button>
          ))}
          <button
            onClick={() => { setGestionEmbudo(!gestionEmbudo); setNombreEmbudo(""); }}
            className="rounded-full border border-dashed border-zinc-700 px-3 py-1.5 text-sm font-bold text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            title="Crear, renombrar o borrar embudos"
          >
            ✎ Embudos
          </button>
        </div>

        {gestionEmbudo && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <input placeholder="Nombre del embudo…" value={nombreEmbudo} onChange={(e) => setNombreEmbudo(e.target.value)} className={inputCls} autoFocus />
            <button onClick={crearEmbudo} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">+ Crear nuevo</button>
            <button onClick={renombrarEmbudo} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300">Renombrar el actual</button>
            <button onClick={borrarEmbudo} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-red-400">Borrar el actual</button>
            <span className="text-[10px] text-zinc-600">El nuevo embudo arranca con fases Lead → Contactado → Propuesta → Cierre.</span>
          </div>
        )}

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}
        {aviso && <p className="mb-4 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300">{aviso}</p>}
        {formulario}

        <div className="flex snap-x items-start gap-4 overflow-x-auto pb-4">
          {colsEmbudo.map((col, iCol) => {
            const lista = dealsEmbudo.filter((d) => d.columna_id === col.id);
            const totalCol = lista.reduce((s, d) => s + Number(d.importe_estimado || 0), 0);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastrando !== null) moverColumna(arrastrando, col);
                  setArrastrando(null);
                }}
                className="w-[85vw] max-w-xs shrink-0 snap-start rounded-2xl border border-zinc-800 bg-zinc-900/40 md:w-80"
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <h2 className="truncate text-sm font-black uppercase tracking-wide text-zinc-300">{col.titulo}</h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {totalCol > 0 && <span className="text-xs font-bold text-zinc-500">{eur(totalCol)}</span>}
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">{lista.length}</span>
                    <button onClick={() => (colEditando === col.id ? setColEditando(null) : (setColEditando(col.id), setColTitulo(col.titulo)))} className="text-zinc-600 hover:text-zinc-300">✎</button>
                  </div>
                </div>

                {colEditando === col.id && (
                  <div className="mx-3 mb-3 flex flex-col gap-2 rounded-xl bg-zinc-950 p-3">
                    <input value={colTitulo} onChange={(e) => setColTitulo(e.target.value)} className={inputCls} />
                    <div className="flex gap-2">
                      <button onClick={() => moverColOrden(col, -1)} disabled={iCol === 0} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 disabled:opacity-20">←</button>
                      <button onClick={() => moverColOrden(col, 1)} disabled={iCol === colsEmbudo.length - 1} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 disabled:opacity-20">→</button>
                      <button onClick={guardarColumna} className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Guardar</button>
                      <button onClick={() => borrarColumna(col)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-red-400">Borrar</button>
                    </div>
                  </div>
                )}

                <div className="flex min-h-24 flex-col gap-2 px-3 pb-3">
                  {lista.map((d) => (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={() => setArrastrando(d.id)}
                      onClick={() => abrirEditar(d)}
                      className="cursor-grab rounded-xl border border-zinc-800 bg-zinc-950 p-3 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{d.clientes?.nombre ?? d.titulo}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${d.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"}`}>{d.canal === "online" ? "Online" : "Presencial"}</span>
                      </div>
                      {d.clientes?.nombre && <p className="mt-0.5 truncate text-xs text-zinc-500">{d.titulo}</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="text-lg font-black text-red-500">{eur(Number(d.importe_estimado || 0))}</p>
                        {badgeSeguimiento(d)}
                      </div>
                      <p className="text-xs text-zinc-500">{nombrePersona(d.responsable)} · hace {dias(d.fecha_alta)}d{d.origen ? ` · ${d.origen}` : ""}</p>
                      {d.notas && <p className="mt-1 truncate text-[11px] italic text-zinc-600" title={d.notas}>{d.notas}</p>}
                      <div className="mt-2 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                        <button disabled={iCol === 0} onClick={() => moverColumna(d.id, colsEmbudo[iCol - 1])} className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400 disabled:opacity-20">←</button>
                        <button onClick={() => perder(d)} className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-500">Perdido</button>
                        <button onClick={() => ganar(d)} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white">✓ Ganado</button>
                        <button disabled={iCol === colsEmbudo.length - 1} onClick={() => moverColumna(d.id, colsEmbudo[iCol + 1])} className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400 disabled:opacity-20">→</button>
                      </div>
                    </div>
                  ))}
                  {lista.length === 0 && <p className="py-4 text-center text-xs text-zinc-700">Suelta tarjetas aquí</p>}
                </div>
              </div>
            );
          })}

          {/* Añadir fase */}
          <div className="w-[70vw] max-w-xs shrink-0 snap-start md:w-60">
            {creandoCol ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                <input autoFocus placeholder="Título de la fase" value={nuevaCol} onChange={(e) => setNuevaCol(e.target.value)} onKeyDown={(e) => e.key === "Enter" && crearColumna()} className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={crearColumna} className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white">Crear</button>
                  <button onClick={() => setCreandoCol(false)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setCreandoCol(true)} className="w-full rounded-2xl border border-dashed border-zinc-800 py-4 text-sm font-bold text-zinc-600 hover:border-zinc-600 hover:text-zinc-400">+ Fase</button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
