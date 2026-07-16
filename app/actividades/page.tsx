"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import Modal from "@/components/Modal";

type Prioridad = "alta" | "media" | "baja";

interface Columna {
  id: number;
  titulo: string;
  orden: number;
  es_final: boolean;
}
interface Etiqueta {
  id: number;
  nombre: string;
  color: string;
  orden: number;
}
interface Persona {
  codigo: string;
  nombre: string;
}
interface Tarjeta {
  id: number;
  titulo: string;
  tipo: string;
  columna_id: number | null;
  prioridad: Prioridad;
  responsable: string;
  cuando: string;
  notas: string | null;
  cliente_id: number | null;
  etiquetas: number[];
  archivada_en: string | null;
  orden: number;
}

const TIPOS = ["tarea", "llamada", "visita", "email", "whatsapp", "nota"];

const PRIORIDADES: { valor: Prioridad; etiqueta: string; clase: string }[] = [
  { valor: "alta", etiqueta: "Alta", clase: "bg-red-950 text-red-400 ring-red-800" },
  { valor: "media", etiqueta: "Media", clase: "bg-amber-950 text-amber-400 ring-amber-800" },
  { valor: "baja", etiqueta: "Baja", clase: "bg-sky-950 text-sky-400 ring-sky-800" },
];

const COLORES_ETIQUETA: Record<string, string> = {
  red: "bg-red-600",
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
  sky: "bg-sky-600",
  violet: "bg-violet-600",
  pink: "bg-pink-600",
  zinc: "bg-zinc-600",
};

const MESES_ARCHIVO = 6;

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

// ids del espacio DnD: tarjetas "c<id>", columnas "k<id>"
const cardDnd = (id: number) => `c${id}`;
const colDnd = (id: number) => `k${id}`;
const parseCard = (dnd: string) => Number(dnd.slice(1));

function ChipEtiqueta({ e, mini = false }: { e: Etiqueta; mini?: boolean }) {
  const color = COLORES_ETIQUETA[e.color] ?? COLORES_ETIQUETA.zinc;
  return (
    <span
      className={`${color} rounded-full font-bold text-white ${mini ? "px-2 py-px text-[10px]" : "px-3 py-1 text-xs"}`}
    >
      {e.nombre}
    </span>
  );
}

// Contenido visual de una tarjeta (compartido por la tarjeta y el overlay)
function CuerpoTarjeta({
  t,
  etiquetas,
  nombres,
}: {
  t: Tarjeta;
  etiquetas: Etiqueta[];
  nombres: Record<string, string>;
}) {
  const pri = PRIORIDADES.find((p) => p.valor === t.prioridad) ?? PRIORIDADES[1];
  const mias = etiquetas.filter((e) => t.etiquetas?.includes(e.id));
  return (
    <>
      {mias.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {mias.map((e) => (
            <ChipEtiqueta key={e.id} e={e} mini />
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white">{t.titulo}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${pri.clase}`}>
          {pri.etiqueta}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">
        {t.tipo} · {nombres[t.responsable] ?? t.responsable} ·{" "}
        {new Date(t.cuando).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
      </p>
      {t.notas && <p className="mt-1 truncate text-xs text-zinc-600">{t.notas}</p>}
    </>
  );
}

// Tarjeta ordenable (drag dentro y entre columnas). Click = abrir modal.
function SortableCard({
  t,
  etiquetas,
  nombres,
  onAbrir,
  onArchivar,
}: {
  t: Tarjeta;
  etiquetas: Etiqueta[];
  nombres: Record<string, string>;
  onAbrir: () => void;
  onArchivar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDnd(t.id),
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: "none" }}
      {...attributes}
      {...listeners}
      onClick={onAbrir}
      className={`group cursor-grab rounded-xl border border-zinc-800 bg-zinc-950 p-3 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CuerpoTarjeta t={t} etiquetas={etiquetas} nombres={nombres} />
      <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onArchivar}
          title="Archivar"
          aria-label="Archivar tarjeta"
          className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs text-zinc-600 opacity-0 transition group-hover:opacity-100"
        >
          📦 Archivar
        </button>
      </div>
    </div>
  );
}

function ColumnaDrop({
  col,
  children,
}: {
  col: Columna;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colDnd(col.id) });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-24 flex-1 flex-col gap-2 rounded-xl px-1 pb-2 transition ${
        isOver ? "bg-zinc-800/40 ring-1 ring-red-500/40" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function Actividades() {
  const sesionOk = useSesion();
  const [columnas, setColumnas] = useState<Columna[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [verArchivo, setVerArchivo] = useState(false);
  const [activo, setActivo] = useState<number | null>(null); // tarjeta que se arrastra

  // Orden de trabajo del tablero: colId -> ids de tarjeta en orden
  const [orden, setOrden] = useState<Record<number, number[]>>({});

  // Modal de tarjeta
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Tarjeta | null>(null);
  const [fTitulo, setFTitulo] = useState("");
  const [fTipo, setFTipo] = useState("tarea");
  const [fPrioridad, setFPrioridad] = useState<Prioridad>("media");
  const [fResponsable, setFResponsable] = useState("ethos");
  const [fCuando, setFCuando] = useState("");
  const [fNotas, setFNotas] = useState("");
  const [fColumna, setFColumna] = useState<number | null>(null);
  const [fEtiquetas, setFEtiquetas] = useState<number[]>([]);
  const [gestionandoEtiquetas, setGestionandoEtiquetas] = useState(false);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");
  const [nuevoColor, setNuevoColor] = useState("red");

  // Columnas
  const [colEditando, setColEditando] = useState<number | null>(null);
  const [colTitulo, setColTitulo] = useState("");
  const [colFinal, setColFinal] = useState(false);
  const [creandoCol, setCreandoCol] = useState(false);
  const [nuevaColTitulo, setNuevaColTitulo] = useState("");

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const nombres: Record<string, string> = Object.fromEntries(personas.map((p) => [p.codigo, p.nombre]));
  const tarjetaPorId = useMemo(() => new Map(tarjetas.map((t) => [t.id, t])), [tarjetas]);

  const cargar = useCallback(async () => {
    const [cols, tars, etis, pers] = await Promise.all([
      supabase.from("tablero_columnas").select("*").order("orden"),
      supabase
        .from("actividades")
        .select(
          "id, titulo, tipo, columna_id, prioridad, responsable, cuando, notas, cliente_id, etiquetas, archivada_en, orden"
        )
        .order("orden")
        .order("cuando"),
      supabase.from("tablero_etiquetas").select("*").order("orden"),
      supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
    ]);
    if (cols.error || tars.error || etis.error) {
      const msg = (cols.error ?? tars.error ?? etis.error)!.message;
      setError(
        msg.includes("tablero_columnas")
          ? "Falta la migración del tablero (tablero_personalizable.sql)."
          : msg.includes("orden") || msg.includes("etiquetas") || msg.includes("archivada_en")
            ? "Falta la migración de etiquetas/orden (mejoras_kanban_canal.sql + mejoras_v2.sql)."
            : msg
      );
      return;
    }
    const listaCols = (cols.data as Columna[]) ?? [];
    const listaTar = (tars.data as Tarjeta[]) ?? [];
    setColumnas(listaCols);
    setTarjetas(listaTar);
    setEtiquetas((etis.data as Etiqueta[]) ?? []);
    setPersonas((pers.data as Persona[]) ?? []);

    // Construir el orden de trabajo por columna
    const o: Record<number, number[]> = {};
    for (const c of listaCols) o[c.id] = [];
    for (const t of listaTar) {
      if (t.archivada_en || t.columna_id == null || !o[t.columna_id]) continue;
      o[t.columna_id].push(t.id);
    }
    setOrden(o);

    // Purga silenciosa de archivadas de más de 6 meses
    const limite = new Date();
    limite.setMonth(limite.getMonth() - MESES_ARCHIVO);
    supabase.from("actividades").delete().lt("archivada_en", limite.toISOString()).then(() => {});
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  const archivadas = tarjetas
    .filter((t) => t.archivada_en)
    .sort((a, b) => (b.archivada_en! < a.archivada_en! ? -1 : 1));

  // ---------- DnD ----------

  function columnaDe(dndId: string): number | null {
    if (dndId.startsWith("k")) return Number(dndId.slice(1));
    const cardId = parseCard(dndId);
    for (const [colId, ids] of Object.entries(orden)) if (ids.includes(cardId)) return Number(colId);
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    setActivo(parseCard(String(e.active.id)));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = columnaDe(String(active.id));
    const overCol = columnaDe(String(over.id));
    if (activeCol == null || overCol == null || activeCol === overCol) return;
    // Mover la tarjeta activa a la columna de destino (en vivo)
    setOrden((prev) => {
      const activeId = parseCard(String(active.id));
      const origen = prev[activeCol].filter((id) => id !== activeId);
      const destino = [...prev[overCol]];
      let idx = destino.length;
      if (!String(over.id).startsWith("k")) {
        const overIdx = destino.indexOf(parseCard(String(over.id)));
        if (overIdx >= 0) idx = overIdx;
      }
      destino.splice(idx, 0, activeId);
      return { ...prev, [activeCol]: origen, [overCol]: destino };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActivo(null);
    if (!over) return;
    const activeId = parseCard(String(active.id));
    const col = columnaDe(String(active.id));
    if (col == null) return;

    // Reordenar dentro de la columna final si soltamos sobre otra tarjeta
    let nuevoOrden = orden;
    if (!String(over.id).startsWith("k")) {
      const overCol = columnaDe(String(over.id));
      if (overCol === col) {
        const ids = orden[col];
        const from = ids.indexOf(activeId);
        const to = ids.indexOf(parseCard(String(over.id)));
        if (from !== to && from >= 0 && to >= 0) {
          nuevoOrden = { ...orden, [col]: arrayMove(ids, from, to) };
          setOrden(nuevoOrden);
        }
      }
    }

    // Persistir: columna + orden de la tarjeta movida y renumerar su columna
    const colObj = columnas.find((c) => c.id === col);
    const cardActual = tarjetaPorId.get(activeId);
    const cambioColumna = cardActual && cardActual.columna_id !== col;
    if (cambioColumna) {
      setTarjetas((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, columna_id: col } : t))
      );
      await supabase
        .from("actividades")
        .update({ columna_id: col, hecha: colObj?.es_final ?? false })
        .eq("id", activeId);
    }
    // Renumerar orden en la(s) columna(s) afectada(s)
    const columnasAfectadas = new Set<number>([col]);
    if (cardActual?.columna_id != null) columnasAfectadas.add(cardActual.columna_id);
    const updates: PromiseLike<unknown>[] = [];
    for (const colId of columnasAfectadas) {
      (nuevoOrden[colId] ?? []).forEach((id, i) => {
        updates.push(supabase.from("actividades").update({ orden: i }).eq("id", id));
      });
    }
    await Promise.all(updates);
  }

  // ---------- Tarjetas ----------

  function abrirCrear() {
    setEditando(null);
    setFTitulo("");
    setFTipo("tarea");
    setFPrioridad("media");
    setFResponsable(personas[0]?.codigo ?? "ethos");
    setFCuando(new Date().toISOString().slice(0, 16));
    setFNotas("");
    setFColumna(columnas[0]?.id ?? null);
    setFEtiquetas([]);
    setGestionandoEtiquetas(false);
    setModalAbierto(true);
  }

  function abrirEditar(t: Tarjeta) {
    setEditando(t);
    setFTitulo(t.titulo);
    setFTipo(t.tipo);
    setFPrioridad(t.prioridad);
    setFResponsable(t.responsable);
    setFCuando(t.cuando.slice(0, 16));
    setFNotas(t.notas ?? "");
    setFColumna(t.columna_id);
    setFEtiquetas(t.etiquetas ?? []);
    setGestionandoEtiquetas(false);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
  }

  async function guardarTarjeta() {
    if (!fTitulo.trim()) return setError("Pon un título.");
    setError(null);
    const col = columnas.find((c) => c.id === fColumna);
    const datos = {
      titulo: fTitulo.trim(),
      tipo: fTipo,
      prioridad: fPrioridad,
      responsable: fResponsable,
      cuando: new Date(fCuando).toISOString(),
      notas: fNotas.trim() || null,
      columna_id: fColumna,
      etiquetas: fEtiquetas,
      hecha: col?.es_final ?? false,
    };
    const res = editando
      ? await supabase.from("actividades").update(datos).eq("id", editando.id)
      : await supabase.from("actividades").insert({ ...datos, archivada_en: null, orden: 0 });
    if (res.error) return setError(res.error.message);
    cerrarModal();
    cargar();
  }

  async function borrarTarjeta() {
    if (!editando) return;
    if (!window.confirm(`¿Borrar "${editando.titulo}" definitivamente?`)) return;
    const { error } = await supabase.from("actividades").delete().eq("id", editando.id);
    if (error) return setError(error.message);
    cerrarModal();
    cargar();
  }

  async function archivarTarjeta(t: Tarjeta) {
    const { error } = await supabase
      .from("actividades")
      .update({ archivada_en: new Date().toISOString() })
      .eq("id", t.id);
    if (error) return setError(error.message);
    if (modalAbierto) cerrarModal();
    cargar();
  }

  async function restaurarTarjeta(t: Tarjeta) {
    const { error } = await supabase.from("actividades").update({ archivada_en: null }).eq("id", t.id);
    if (error) return setError(error.message);
    cargar();
  }

  // ---------- Etiquetas ----------

  function alternarEtiqueta(id: number) {
    setFEtiquetas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function crearEtiqueta() {
    if (!nuevaEtiqueta.trim()) return;
    const maxOrden = Math.max(0, ...etiquetas.map((e) => e.orden));
    const { data, error } = await supabase
      .from("tablero_etiquetas")
      .insert({ nombre: nuevaEtiqueta.trim(), color: nuevoColor, orden: maxOrden + 1 })
      .select()
      .single();
    if (error) return setError(error.message);
    setEtiquetas((prev) => [...prev, data as Etiqueta]);
    setFEtiquetas((prev) => [...prev, (data as Etiqueta).id]);
    setNuevaEtiqueta("");
  }

  async function renombrarEtiqueta(e: Etiqueta, nombre: string) {
    if (!nombre.trim() || nombre === e.nombre) return;
    const { error } = await supabase.from("tablero_etiquetas").update({ nombre: nombre.trim() }).eq("id", e.id);
    if (error) return setError(error.message);
    setEtiquetas((prev) => prev.map((x) => (x.id === e.id ? { ...x, nombre: nombre.trim() } : x)));
  }

  async function cambiarColorEtiqueta(e: Etiqueta, color: string) {
    const { error } = await supabase.from("tablero_etiquetas").update({ color }).eq("id", e.id);
    if (error) return setError(error.message);
    setEtiquetas((prev) => prev.map((x) => (x.id === e.id ? { ...x, color } : x)));
  }

  async function borrarEtiqueta(e: Etiqueta) {
    if (!window.confirm(`¿Borrar la etiqueta "${e.nombre}"? Se quitará de todas las tarjetas.`)) return;
    const { error } = await supabase.from("tablero_etiquetas").delete().eq("id", e.id);
    if (error) return setError(error.message);
    setEtiquetas((prev) => prev.filter((x) => x.id !== e.id));
    setFEtiquetas((prev) => prev.filter((x) => x !== e.id));
    tarjetas
      .filter((t) => t.etiquetas?.includes(e.id))
      .forEach((t) =>
        supabase
          .from("actividades")
          .update({ etiquetas: t.etiquetas.filter((x) => x !== e.id) })
          .eq("id", t.id)
          .then(() => {})
      );
  }

  // ---------- Columnas ----------

  function abrirEditarCol(c: Columna) {
    setColEditando(c.id);
    setColTitulo(c.titulo);
    setColFinal(c.es_final);
  }
  async function guardarCol() {
    if (colEditando === null || !colTitulo.trim()) return;
    const { error } = await supabase
      .from("tablero_columnas")
      .update({ titulo: colTitulo.trim(), es_final: colFinal })
      .eq("id", colEditando);
    if (error) return setError(error.message);
    setColEditando(null);
    cargar();
  }
  async function borrarCol(c: Columna) {
    if ((orden[c.id] ?? []).length > 0) return setError(`"${c.titulo}" tiene tarjetas: muévelas antes de borrarla.`);
    if (!window.confirm(`¿Borrar la columna "${c.titulo}"?`)) return;
    const { error } = await supabase.from("tablero_columnas").delete().eq("id", c.id);
    if (error) return setError(error.message);
    setColEditando(null);
    cargar();
  }
  async function moverCol(c: Columna, dir: -1 | 1) {
    const idx = columnas.findIndex((x) => x.id === c.id);
    const vecina = columnas[idx + dir];
    if (!vecina) return;
    const r1 = await supabase.from("tablero_columnas").update({ orden: vecina.orden }).eq("id", c.id);
    const r2 = await supabase.from("tablero_columnas").update({ orden: c.orden }).eq("id", vecina.id);
    if (r1.error || r2.error) return setError((r1.error ?? r2.error)!.message);
    cargar();
  }
  async function crearCol() {
    if (!nuevaColTitulo.trim()) return;
    const maxOrden = Math.max(0, ...columnas.map((c) => c.orden));
    const { error } = await supabase
      .from("tablero_columnas")
      .insert({ titulo: nuevaColTitulo.trim(), orden: maxOrden + 1 });
    if (error) return setError(error.message);
    setNuevaColTitulo("");
    setCreandoCol(false);
    cargar();
  }

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const tarjetaActiva = activo != null ? tarjetaPorId.get(activo) : null;

  // ---------- Modal ----------
  const modalTarjeta = (
    <Modal
      abierto={modalAbierto}
      onCerrar={cerrarModal}
      titulo={editando ? "Editar tarjeta" : "Nueva tarjeta"}
      ancho="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <input
          placeholder="Título de la tarjeta"
          value={fTitulo}
          onChange={(e) => setFTitulo(e.target.value)}
          className={`${inputCls} text-base font-semibold`}
          autoFocus
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Columna</span>
            <select value={fColumna ?? ""} onChange={(e) => setFColumna(Number(e.target.value))} className={`${inputCls} appearance-none`}>
              {columnas.map((c) => (
                <option key={c.id} value={c.id}>{c.titulo}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tipo</span>
            <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} className={`${inputCls} appearance-none`}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fecha</span>
            <input type="datetime-local" value={fCuando} onChange={(e) => setFCuando(e.target.value)} className={inputCls} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Importancia</span>
          {PRIORIDADES.map((p) => (
            <button
              key={p.valor}
              onClick={() => setFPrioridad(p.valor)}
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                fPrioridad === p.valor ? p.clase : "bg-zinc-950 text-zinc-500 ring-zinc-800"
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Responsable</span>
          {personas.map((p) => (
            <button
              key={p.codigo}
              onClick={() => setFResponsable(p.codigo)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                fResponsable === p.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {p.nombre}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Etiquetas</span>
            <button onClick={() => setGestionandoEtiquetas((v) => !v)} className="text-xs font-semibold text-zinc-400 hover:text-white">
              {gestionandoEtiquetas ? "Cerrar gestión" : "Gestionar ✎"}
            </button>
          </div>
          {!gestionandoEtiquetas ? (
            <div className="flex flex-wrap gap-2">
              {etiquetas.map((e) => (
                <button
                  key={e.id}
                  onClick={() => alternarEtiqueta(e.id)}
                  className={`rounded-full transition ${fEtiquetas.includes(e.id) ? "ring-2 ring-white/80" : "opacity-50 hover:opacity-100"}`}
                >
                  <ChipEtiqueta e={e} />
                </button>
              ))}
              {etiquetas.length === 0 && <p className="text-xs text-zinc-600">No hay etiquetas: usa “Gestionar”.</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {etiquetas.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-2">
                  <input
                    defaultValue={e.nombre}
                    onBlur={(ev) => renombrarEtiqueta(e, ev.target.value)}
                    className={`${inputCls} w-32 flex-1 px-3 py-1.5 text-xs`}
                  />
                  <div className="flex gap-1">
                    {Object.entries(COLORES_ETIQUETA).map(([clave, clase]) => (
                      <button
                        key={clave}
                        onClick={() => cambiarColorEtiqueta(e, clave)}
                        aria-label={`Color ${clave}`}
                        className={`h-5 w-5 rounded-full ${clase} ${e.color === clave ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
                      />
                    ))}
                  </div>
                  <button onClick={() => borrarEtiqueta(e)} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-bold text-red-400">
                    Borrar
                  </button>
                </div>
              ))}
              <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-2">
                <input
                  placeholder="Nueva etiqueta"
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  className={`${inputCls} w-32 flex-1 px-3 py-1.5 text-xs`}
                />
                <div className="flex gap-1">
                  {Object.entries(COLORES_ETIQUETA).map(([clave, clase]) => (
                    <button
                      key={clave}
                      onClick={() => setNuevoColor(clave)}
                      aria-label={`Color ${clave}`}
                      className={`h-5 w-5 rounded-full ${clase} ${nuevoColor === clave ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
                    />
                  ))}
                </div>
                <button onClick={crearEtiqueta} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                  Crear
                </button>
              </div>
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Notas</span>
          <textarea
            placeholder="Descripción, contexto, enlaces…"
            rows={6}
            value={fNotas}
            onChange={(e) => setFNotas(e.target.value)}
            className={inputCls}
          />
        </label>

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button onClick={guardarTarjeta} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
            {editando ? "Guardar cambios" : "Crear tarjeta"}
          </button>
          {editando && (
            <>
              <button onClick={() => archivarTarjeta(editando)} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-zinc-300">
                📦 Archivar
              </button>
              <button onClick={borrarTarjeta} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-red-400">
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );

  // ---------- Vista de archivo ----------
  const vistaArchivo = (
    <div className="flex flex-col gap-2">
      <p className="mb-2 text-sm text-zinc-500">
        Las tarjetas archivadas se borran automáticamente pasados {MESES_ARCHIVO} meses.
      </p>
      {archivadas.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-300">{t.titulo}</p>
            <p className="text-xs text-zinc-600">
              {t.tipo} · {nombres[t.responsable] ?? t.responsable} · archivada el{" "}
              {new Date(t.archivada_en!).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => restaurarTarjeta(t)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200">
              Restaurar
            </button>
            <button onClick={() => abrirEditar(t)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-400">
              Ver
            </button>
          </div>
        </div>
      ))}
      {archivadas.length === 0 && <p className="py-8 text-center text-sm text-zinc-600">El archivo está vacío.</p>}
    </div>
  );

  return (
    <Shell titulo="Actividades">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Actividades</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Arrastra para mover entre columnas u ordenar dentro de una. Clic en una tarjeta para abrirla.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setVerArchivo((v) => !v)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold ${verArchivo ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-300"}`}
            >
              📦 Archivo{archivadas.length > 0 ? ` (${archivadas.length})` : ""}
            </button>
            <button onClick={abrirCrear} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
              + Nueva tarjeta
            </button>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {verArchivo ? (
          vistaArchivo
        ) : (
          <DndContext
            sensors={sensores}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex snap-x items-start gap-4 overflow-x-auto pb-4">
              {columnas.map((col, iCol) => {
                const ids = orden[col.id] ?? [];
                return (
                  <div
                    key={col.id}
                    className="w-[85vw] max-w-xs shrink-0 snap-start rounded-2xl border border-zinc-800 bg-zinc-900/40 md:w-72"
                  >
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <h2 className="truncate text-sm font-black uppercase tracking-wide text-zinc-300">
                        {col.titulo}
                        {col.es_final && <span className="ml-1.5 text-emerald-500">✓</span>}
                      </h2>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">{ids.length}</span>
                        <button
                          onClick={() => (colEditando === col.id ? setColEditando(null) : abrirEditarCol(col))}
                          className="text-zinc-600 hover:text-zinc-300"
                          aria-label="Editar columna"
                        >
                          ✎
                        </button>
                      </div>
                    </div>

                    {colEditando === col.id && (
                      <div className="mx-3 mb-3 flex flex-col gap-2 rounded-xl bg-zinc-950 p-3">
                        <input value={colTitulo} onChange={(e) => setColTitulo(e.target.value)} className={inputCls} />
                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                          <input type="checkbox" checked={colFinal} onChange={(e) => setColFinal(e.target.checked)} className="accent-red-600" />
                          Las tarjetas aquí cuentan como hechas
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => moverCol(col, -1)} disabled={iCol === 0} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 disabled:opacity-20">←</button>
                          <button onClick={() => moverCol(col, 1)} disabled={iCol === columnas.length - 1} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 disabled:opacity-20">→</button>
                          <button onClick={guardarCol} className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Guardar</button>
                          <button onClick={() => borrarCol(col)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-red-400">Borrar</button>
                        </div>
                      </div>
                    )}

                    <ColumnaDrop col={col}>
                      <SortableContext items={ids.map(cardDnd)} strategy={verticalListSortingStrategy}>
                        {ids.map((id) => {
                          const t = tarjetaPorId.get(id);
                          if (!t) return null;
                          return (
                            <SortableCard
                              key={t.id}
                              t={t}
                              etiquetas={etiquetas}
                              nombres={nombres}
                              onAbrir={() => abrirEditar(t)}
                              onArchivar={() => archivarTarjeta(t)}
                            />
                          );
                        })}
                        {ids.length === 0 && <p className="py-4 text-center text-xs text-zinc-700">Suelta tarjetas aquí</p>}
                      </SortableContext>
                    </ColumnaDrop>
                  </div>
                );
              })}

              <div className="w-[85vw] max-w-xs shrink-0 snap-start md:w-72">
                {creandoCol ? (
                  <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <input
                      placeholder="Título de la columna"
                      value={nuevaColTitulo}
                      onChange={(e) => setNuevaColTitulo(e.target.value)}
                      className={inputCls}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={crearCol} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold text-white">Crear</button>
                      <button onClick={() => setCreandoCol(false)} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-zinc-300">✕</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreandoCol(true)}
                    className="w-full rounded-2xl border border-dashed border-zinc-800 py-4 text-sm font-bold text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                  >
                    + Añadir columna
                  </button>
                )}
              </div>
            </div>

            <DragOverlay>
              {tarjetaActiva ? (
                <div className="w-72 rounded-xl border border-red-500/50 bg-zinc-950 p-3 shadow-2xl">
                  <CuerpoTarjeta t={tarjetaActiva} etiquetas={etiquetas} nombres={nombres} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {modalTarjeta}
      </div>
    </Shell>
  );
}
