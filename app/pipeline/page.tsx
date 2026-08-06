"use client";

// Embudo de ventas estilo Holded: varios embudos, cada uno con sus etapas.
// El EDITOR de embudo (crear/editar) es una pantalla completa como en Holded:
// nombre arriba + columnas de etapa con nombre, descripción, probabilidad y
// aviso de estancamiento (días), y "+ Nueva etapa" a la derecha.
// En el tablero: previsión ponderada por probabilidad y ⚠ en tarjetas estancadas.
// Nada de esto toca la contabilidad hasta marcar Ganado.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import Modal from "@/components/Modal";
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
  descripcion: string | null;
  probabilidad: number;
  estancado_dias: number | null;
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
  columna_desde: string | null;
  orden?: number;
  clientes: { nombre: string } | null;
}
// Etapa en el editor (id null = nueva)
interface EtapaEd {
  id: number | null;
  titulo: string;
  descripcion: string;
  probabilidad: string;
  estancadoOn: boolean;
  estancadoDias: string;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";
const inputEtapaCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const ETAPAS_DEFECTO = ["Lead", "Contacto establecido", "Necesidades definidas", "Propuesta realizada", "Negociaciones comenzadas"];

const nuevaEtapa = (titulo = ""): EtapaEd => ({
  id: null,
  titulo,
  descripcion: "",
  probabilidad: "100",
  estancadoOn: false,
  estancadoDias: "7",
});

// ids del espacio DnD: tarjetas "c<id>", columnas "k<id>" (mismo patrón que Actividades)
const cardDnd = (id: number) => `c${id}`;
const colDnd = (id: number) => `k${id}`;
const parseCard = (dnd: string) => Number(dnd.slice(1));

// Tarjeta arrastrable: el click abre el modal, el drag mueve entre etapas
function SortableDeal({ id, onAbrir, children }: { id: number; onAbrir: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cardDnd(id) });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: "none" }}
      {...attributes}
      {...listeners}
      onClick={onAbrir}
      className={`cursor-grab rounded-xl active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      {children}
    </div>
  );
}

function ColumnaDrop({ colId, children }: { colId: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: colDnd(colId) });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-24 flex-col gap-2 rounded-xl px-3 pb-3 transition ${isOver ? "bg-zinc-800/40 ring-1 ring-red-500/40" : ""}`}
    >
      {children}
    </div>
  );
}

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
  const [ordenCols, setOrdenCols] = useState<Record<number, number[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Editor de embudo (pantalla completa, estilo Holded)
  const [modo, setModo] = useState<"tablero" | "editor">("tablero");
  const [edEmbudoId, setEdEmbudoId] = useState<number | null>(null); // null = nuevo
  const [edNombre, setEdNombre] = useState("");
  const [edEtapas, setEdEtapas] = useState<EtapaEd[]>([]);
  const [edBorradas, setEdBorradas] = useState<number[]>([]);
  const [guardandoEmbudo, setGuardandoEmbudo] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

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

  // Previsión ponderada del embudo: Σ importe × probabilidad de su etapa
  const prevision = dealsEmbudo.reduce((s, d) => {
    const col = colsEmbudo.find((c) => c.id === d.columna_id);
    return s + Number(d.importe_estimado || 0) * ((col?.probabilidad ?? 100) / 100);
  }, 0);

  const dealPorId = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);

  // Orden de trabajo del tablero: colId -> ids de tarjeta en orden (se rehace al recargar datos)
  useEffect(() => {
    const m: Record<number, number[]> = {};
    for (const c of columnas.filter((x) => x.embudo_id === embudoSel)) {
      m[c.id] = deals
        .filter((d) => d.embudo_id === embudoSel && d.columna_id === c.id)
        .sort((a, b) => (Number(a.orden ?? 0) - Number(b.orden ?? 0)) || a.id - b.id)
        .map((d) => d.id);
    }
    setOrdenCols(m);
  }, [deals, columnas, embudoSel]);

  // ---------- DnD (mismo patrón que Actividades) ----------
  function columnaDeDnd(dndId: string): number | null {
    if (dndId.startsWith("k")) return Number(dndId.slice(1));
    const cardId = parseCard(dndId);
    for (const [colId, ids] of Object.entries(ordenCols)) if (ids.includes(cardId)) return Number(colId);
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    setArrastrando(parseCard(String(e.active.id)));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = columnaDeDnd(String(active.id));
    const overCol = columnaDeDnd(String(over.id));
    if (activeCol == null || overCol == null || activeCol === overCol) return;
    setOrdenCols((prev) => {
      const activeId = parseCard(String(active.id));
      const origen = (prev[activeCol] ?? []).filter((id) => id !== activeId);
      const destino = [...(prev[overCol] ?? [])];
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
    setArrastrando(null);
    if (!over) return;
    const activeId = parseCard(String(active.id));
    const col = columnaDeDnd(String(active.id));
    if (col == null) return;

    // Reordenar dentro de la columna si soltamos sobre otra tarjeta
    let nuevoOrden = ordenCols;
    if (!String(over.id).startsWith("k")) {
      const overCol = columnaDeDnd(String(over.id));
      if (overCol === col) {
        const ids = ordenCols[col] ?? [];
        const from = ids.indexOf(activeId);
        const to = ids.indexOf(parseCard(String(over.id)));
        if (from !== to && from >= 0 && to >= 0) {
          nuevoOrden = { ...ordenCols, [col]: arrayMove(ids, from, to) };
          setOrdenCols(nuevoOrden);
        }
      }
    }

    // Persistir: cambio de etapa (con columna_desde para el aviso de estancamiento)
    const cardActual = dealPorId.get(activeId);
    if (cardActual && cardActual.columna_id !== col) {
      setDeals((prev) => prev.map((d) => (d.id === activeId ? { ...d, columna_id: col, columna_desde: new Date().toISOString() } : d)));
      const { error } = await supabase
        .from("deals")
        .update({ columna_id: col, columna_desde: new Date().toISOString() })
        .eq("id", activeId);
      if (error) {
        setError(error.message);
        cargar();
        return;
      }
    }
    // Renumerar el orden de las columnas afectadas (si la BD aún no tiene la
    // columna orden, se ignora en silencio: el arrastre entre etapas funciona igual)
    const afectadas = new Set<number>([col]);
    if (cardActual?.columna_id != null) afectadas.add(cardActual.columna_id);
    const updates: PromiseLike<unknown>[] = [];
    for (const colId of afectadas) {
      (nuevoOrden[colId] ?? []).forEach((id, i) => {
        updates.push(supabase.from("deals").update({ orden: i }).eq("id", id));
      });
    }
    await Promise.all(updates);
  }

  const esGrandSlam = (embudos.find((e) => e.id === embudoSel)?.nombre ?? "").toLowerCase().includes("grand slam");

  // Auto-sync del Grand Slam: al abrir su tablero se sincroniza solo (una vez por visita)
  const gsAutoSync = useRef(false);
  useEffect(() => {
    if (esGrandSlam && colsEmbudo.length > 0 && !gsAutoSync.current) {
      gsAutoSync.current = true;
      sincronizarGrandSlam(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esGrandSlam, embudoSel, columnas]);

  // ---------- Grand Slam: sincronizar clientes activos con sus ventanas ----------
  // Reglas del Excel: presencial 1→2 meses desde el alta · online 1→3 · online anual 3→6.
  // Crea una tarjeta por cliente activo sin tarjeta previa (en cualquier etapa,
  // Ganado/Perdido incluidos: un GS cerrado o rechazado no se vuelve a crear) y
  // avanza solas las tarjetas de "Aún no toca"/"En ventana" cuando pasan las fechas.
  async function sincronizarGrandSlam(silencioso = false) {
    if (!embudoSel || sincronizando) return;
    setSincronizando(true);
    if (!silencioso) setError(null);

    const masMeses = (iso: string, m: number) => {
      const d = new Date(iso + "T00:00:00");
      d.setMonth(d.getMonth() + m);
      return d.toISOString().slice(0, 10);
    };
    const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });

    const [cliRes, dealsRes] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nombre, apellidos, entrenador, canal, fecha_inicio, cuota_periodicidad")
        .is("fecha_baja", null)
        .eq("estado", "cliente"),
      supabase.from("deals").select("id, cliente_id, columna_id, etapa").eq("embudo_id", embudoSel),
    ]);
    if (cliRes.error) {
      setSincronizando(false);
      return setError(cliRes.error.message);
    }
    const activos = (cliRes.data as { id: number; nombre: string; apellidos: string | null; entrenador: string; canal: string | null; fecha_inicio: string | null; cuota_periodicidad: string | null }[]) ?? [];
    const existentes = (dealsRes.data as { id: number; cliente_id: number | null; columna_id: number | null; etapa: string }[]) ?? [];

    // Clientes cuya tarjeta se borró a mano: no se les vuelve a crear
    const { data: exc } = await supabase.from("grand_slam_excluidos").select("cliente_id");
    const excluidos = new Set((((exc as { cliente_id: number }[] | null) ?? [])).map((x) => x.cliente_id));

    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const colDe = (pref: string) => colsEmbudo.find((c) => norm(c.titulo).startsWith(pref))?.id ?? null;
    const colNoToca = colDe("aun no toca");
    const colVentana = colDe("en ventana");
    const colVencido = colDe("vencido");
    if (!colNoToca || !colVentana || !colVencido) {
      setSincronizando(false);
      return setError('Este embudo necesita las etapas "Aún no toca", "En ventana" y "Vencido" para sincronizar.');
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const dealDe = new Map(existentes.filter((d) => d.cliente_id).map((d) => [d.cliente_id as number, d]));
    let creadas = 0;
    let movidas = 0;

    for (const c of activos) {
      if (!c.fecha_inicio || excluidos.has(c.id)) continue;
      const online = c.canal === "online";
      const per = c.cuota_periodicidad || "mensual";
      const [mIni, mFin] = online ? (per === "anual" ? [3, 6] : [1, 3]) : [1, 2];
      const desde = masMeses(c.fecha_inicio, mIni);
      const limite = masMeses(c.fecha_inicio, mFin);
      const colObjetivo: number = hoy < desde ? colNoToca : hoy <= limite ? colVentana : colVencido;

      const existente = dealDe.get(c.id);
      if (existente) {
        // Solo avanzan solas las etapas automáticas; Ofrecido/Aplazado y cerradas no se tocan
        const esAvance =
          (existente.columna_id === colNoToca && (colObjetivo === colVentana || colObjetivo === colVencido)) ||
          (existente.columna_id === colVentana && colObjetivo === colVencido);
        if (existente.etapa !== "ganado" && existente.etapa !== "perdido" && esAvance) {
          await supabase
            .from("deals")
            .update({ columna_id: colObjetivo, columna_desde: new Date().toISOString() })
            .eq("id", existente.id);
          movidas++;
        }
        continue;
      }

      // Oferta sugerida del catálogo (precios de referencia del Excel)
      const oferta = online && per === "anual" ? { nombre: "Anual 12+3", precio: 900 } : { nombre: "Semestral 6+1", precio: 480 };
      const tipoTxt = online ? `Online ${per}` : "Presencial grupal";
      const ins = await supabase.from("deals").insert({
        titulo: `Grand Slam · ${oferta.nombre}`,
        cliente_id: c.id,
        canal: online ? "online" : "presencial",
        importe_estimado: oferta.precio,
        responsable: ["david", "luis"].includes(c.entrenador) ? c.entrenador : "ethos",
        origen: "grand-slam",
        etapa: "lead",
        embudo_id: embudoSel,
        columna_id: colObjetivo,
        seguimiento: hoy < desde ? desde : hoy,
        seguimiento_nota: `Ofrecer ${oferta.nombre} · ventana ${fmt(desde)} → ${fmt(limite)}`,
        notas: `${tipoTxt} · alta ${fmt(c.fecha_inicio)} · ventana ${fmt(desde)} → límite ${fmt(limite)}`,
      });
      if (!ins.error) creadas++;
    }

    setSincronizando(false);
    // En el auto-sync silencioso solo avisa si ha cambiado algo
    if (!silencioso || creadas + movidas > 0) {
      setAviso(`Grand Slam sincronizado: ${creadas} tarjeta(s) nueva(s) · ${movidas} avanzada(s) de etapa.`);
      setTimeout(() => setAviso(null), 6000);
    }
    if (creadas + movidas > 0 || !silencioso) cargar();
  }

  // ---------- Editor de embudo ----------
  function abrirEditorNuevo() {
    setEdEmbudoId(null);
    setEdNombre("");
    setEdEtapas(ETAPAS_DEFECTO.map((t) => nuevaEtapa(t)));
    setEdBorradas([]);
    setError(null);
    setModo("editor");
  }

  function abrirEditorActual() {
    const em = embudos.find((e) => e.id === embudoSel);
    if (!em) return;
    setEdEmbudoId(em.id);
    setEdNombre(em.nombre);
    setEdEtapas(
      colsEmbudo.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        descripcion: c.descripcion ?? "",
        probabilidad: String(c.probabilidad ?? 100),
        estancadoOn: c.estancado_dias !== null,
        estancadoDias: String(c.estancado_dias ?? 7),
      }))
    );
    setEdBorradas([]);
    setError(null);
    setModo("editor");
  }

  const setEtapa = (i: number, campo: keyof EtapaEd, valor: string | boolean) =>
    setEdEtapas((prev) => prev.map((e, k) => (k === i ? { ...e, [campo]: valor } : e)));

  function quitarEtapa(i: number) {
    const et = edEtapas[i];
    if (et.id !== null && deals.some((d) => d.columna_id === et.id)) {
      return setError(`"${et.titulo}" tiene tarjetas: muévelas a otra etapa antes de borrarla.`);
    }
    if (edEtapas.length <= 1) return setError("El embudo necesita al menos una etapa.");
    if (et.id !== null) setEdBorradas((prev) => [...prev, et.id as number]);
    setEdEtapas((prev) => prev.filter((_, k) => k !== i));
  }

  function moverEtapa(i: number, dir: -1 | 1) {
    setEdEtapas((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  async function guardarEmbudo() {
    const nombre = edNombre.trim();
    if (!nombre) return setError("Pon un nombre al embudo.");
    if (edEtapas.some((e) => !e.titulo.trim())) return setError("Todas las etapas necesitan nombre.");
    setGuardandoEmbudo(true);
    setError(null);

    let embudoId = edEmbudoId;
    if (embudoId === null) {
      const maxOrden = Math.max(0, ...embudos.map((e) => e.orden));
      const { data, error } = await supabase.from("embudos").insert({ nombre, orden: maxOrden + 1 }).select("id").single();
      if (error || !data) {
        setGuardandoEmbudo(false);
        return setError(error?.message ?? "No se pudo crear el embudo.");
      }
      embudoId = data.id;
    } else {
      const { error } = await supabase.from("embudos").update({ nombre }).eq("id", embudoId);
      if (error) {
        setGuardandoEmbudo(false);
        return setError(error.message);
      }
    }

    // Etapas borradas (sin tarjetas, ya validado al quitarlas)
    if (edBorradas.length) await supabase.from("pipeline_columnas").delete().in("id", edBorradas);

    // Actualizar existentes e insertar nuevas, en el orden del editor
    for (let i = 0; i < edEtapas.length; i++) {
      const e = edEtapas[i];
      const fila = {
        titulo: e.titulo.trim(),
        descripcion: e.descripcion.trim() || null,
        probabilidad: Math.min(100, Math.max(0, Number(e.probabilidad) || 0)),
        estancado_dias: e.estancadoOn ? Math.max(1, Number(e.estancadoDias) || 7) : null,
        orden: i + 1,
        embudo_id: embudoId,
      };
      const res = e.id !== null
        ? await supabase.from("pipeline_columnas").update(fila).eq("id", e.id)
        : await supabase.from("pipeline_columnas").insert(fila);
      if (res.error) {
        setGuardandoEmbudo(false);
        return setError(res.error.message);
      }
    }

    setGuardandoEmbudo(false);
    setModo("tablero");
    await cargar();
    setEmbudoSel(embudoId);
  }

  async function borrarEmbudo() {
    if (edEmbudoId === null) return;
    if (embudos.length <= 1) return setError("Debe quedar al menos un embudo.");
    if (deals.some((d) => d.embudo_id === edEmbudoId)) return setError("Este embudo tiene tarjetas: muévelas o ciérralas antes de borrarlo.");
    if (!window.confirm(`¿Borrar el embudo "${edNombre}" y sus etapas?`)) return;
    await supabase.from("pipeline_columnas").delete().eq("embudo_id", edEmbudoId);
    const { error } = await supabase.from("embudos").delete().eq("id", edEmbudoId);
    if (error) return setError(error.message);
    setModo("tablero");
    setEmbudoSel(null);
    cargar();
  }

  // ---------- Deals ----------
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

  async function resolverCliente(): Promise<number | null | "cancelado"> {
    const nombre = fClienteNombre.trim();
    if (!nombre) return null;
    const existente = clientes.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) return existente.id;
    // Aviso anti-duplicados: si hay un contacto con nombre parecido, confirmar antes de crear otro
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
    const nn = norm(nombre);
    const parecido = clientes.find((c) => {
      const cn = norm(c.nombre);
      return nn.length >= 4 && cn.length >= 4 && (cn.includes(nn) || nn.includes(cn));
    });
    if (parecido && !window.confirm(`Ya existe un contacto parecido: "${parecido.nombre}".\n\n¿Seguro que quieres crear OTRO contacto nuevo llamado "${nombre}"?\n(Si es la misma persona, cancela y escribe su nombre exacto.)`)) {
      return "cancelado";
    }
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
    if (clienteId === "cancelado") return; // duplicado evitado: no se guarda nada
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
    const msg = esGrandSlam && editando.cliente_id
      ? `¿Borrar la tarjeta "${editando.titulo}"?\n\nEste cliente queda EXCLUIDO del Grand Slam: la sincronización no volverá a crearle tarjeta.`
      : `¿Borrar la tarjeta "${editando.titulo}"?`;
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from("deals").delete().eq("id", editando.id);
    if (error) return setError(error.message);
    // Borrado manual en el Grand Slam = exclusión permanente del auto-sync
    if (esGrandSlam && editando.cliente_id) {
      await supabase.from("grand_slam_excluidos").upsert({ cliente_id: editando.cliente_id });
    }
    setEditando(null);
    cargar();
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

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const dias = (fecha: string) => Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 86400000));

  // ¿Lleva la tarjeta demasiado tiempo en su etapa? (aviso de estancamiento)
  const estancada = (d: DealConCliente, col: Columna | undefined) => {
    if (!col?.estancado_dias) return null;
    const desde = d.columna_desde ?? d.fecha_alta;
    const enFase = dias(desde);
    return enFase >= col.estancado_dias ? enFase : null;
  };

  // Estado del seguimiento de una tarjeta: vencido (rojo) / próximo ≤3 días (ámbar)
  const badgeSeguimiento = (d: DealConCliente) => {
    if (!d.seguimiento) return null;
    const hoy = new Date().toISOString().slice(0, 10);
    const en3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const fecha = new Date(d.seguimiento + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    if (d.seguimiento <= hoy)
      return <span className="rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-400" title={d.seguimiento_nota ?? ""}>⏰ {fecha}</span>;
    if (d.seguimiento <= en3)
      return <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-400" title={d.seguimiento_nota ?? ""}>⏰ {fecha}</span>;
    return <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-500" title={d.seguimiento_nota ?? ""}>⏰ {fecha}</span>;
  };

  // ============ EDITOR DE EMBUDO (pantalla completa, estilo Holded) ============
  if (modo === "editor") {
    return (
      <Shell titulo="Embudo de ventas">
        <div className="px-5 py-6 md:px-8">
          {/* Barra superior: nombre + acciones */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <input
              autoFocus={edEmbudoId === null}
              placeholder="Nuevo embudo"
              value={edNombre}
              onChange={(e) => setEdNombre(e.target.value)}
              className={`${inputCls} min-w-64 text-lg font-black`}
            />
            <div className="flex gap-2">
              {edEmbudoId !== null && (
                <button onClick={borrarEmbudo} className="rounded-xl border border-red-900 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-950">
                  Borrar embudo
                </button>
              )}
              <button onClick={() => { setModo("tablero"); setError(null); }} className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-zinc-700">
                Cancelar
              </button>
              <button onClick={guardarEmbudo} disabled={guardandoEmbudo} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {guardandoEmbudo ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>

          {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

          {/* Etapas en columnas + panel de añadir */}
          <div className="flex snap-x items-stretch gap-3 overflow-x-auto pb-4">
            {edEtapas.map((e, i) => (
              <div key={e.id ?? `n${i}`} className="flex w-[80vw] max-w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 md:w-72">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">Etapa {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moverEtapa(i, -1)} disabled={i === 0} title="Mover a la izquierda" className="rounded px-1.5 text-xs font-bold text-zinc-500 hover:text-white disabled:opacity-20">←</button>
                    <button onClick={() => moverEtapa(i, 1)} disabled={i === edEtapas.length - 1} title="Mover a la derecha" className="rounded px-1.5 text-xs font-bold text-zinc-500 hover:text-white disabled:opacity-20">→</button>
                    <button onClick={() => quitarEtapa(i)} title="Quitar etapa" className="rounded px-1.5 text-xs font-bold text-zinc-600 hover:text-red-400">✕</button>
                  </div>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-zinc-400">Nombre</span>
                  <input value={e.titulo} onChange={(ev) => setEtapa(i, "titulo", ev.target.value)} placeholder="Nombre de la etapa" className={inputEtapaCls} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-zinc-400">Descripción</span>
                  <input value={e.descripcion} onChange={(ev) => setEtapa(i, "descripcion", ev.target.value)} placeholder="Qué significa esta etapa" className={inputEtapaCls} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                    Probabilidad de la oportunidad
                    <span title="Se usa para la previsión ponderada del tablero: importe × probabilidad" className="cursor-help text-zinc-600">ⓘ</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      value={e.probabilidad}
                      onChange={(ev) => setEtapa(i, "probabilidad", ev.target.value)}
                      inputMode="numeric"
                      className={`${inputEtapaCls} text-right`}
                    />
                    <span className="text-sm text-zinc-500">%</span>
                  </div>
                </label>

                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                    Estancado durante (días)
                    <span title="Las tarjetas que lleven más de estos días en la etapa se marcan con ⚠ en el tablero" className="cursor-help text-zinc-600">ⓘ</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEtapa(i, "estancadoOn", !e.estancadoOn)}
                      aria-label="Activar aviso de estancamiento"
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${e.estancadoOn ? "bg-red-600" : "bg-zinc-700"}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${e.estancadoOn ? "translate-x-4" : ""}`} />
                    </button>
                    <input
                      value={e.estancadoDias}
                      onChange={(ev) => setEtapa(i, "estancadoDias", ev.target.value)}
                      disabled={!e.estancadoOn}
                      inputMode="numeric"
                      className={`${inputEtapaCls} text-right ${e.estancadoOn ? "" : "opacity-40"}`}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Panel añadir etapa */}
            <div className="flex w-[70vw] max-w-64 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 p-6 text-center md:w-64">
              <p className="text-sm font-black text-white">Añadir etapa</p>
              <p className="text-[11px] leading-snug text-zinc-500">Las etapas del embudo representan el estado de tus ventas.</p>
              <button
                onClick={() => setEdEtapas((prev) => [...prev, nuevaEtapa()])}
                className="mt-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                + Nueva etapa
              </button>
            </div>
          </div>

          <p className="text-[10px] leading-snug text-zinc-600">
            La <b>probabilidad</b> pondera la previsión del tablero (una propuesta al 75% de 1.000 € cuenta como 750 €).
            <b> Estancado</b> marca con ⚠ las tarjetas que llevan demasiados días quietas en la etapa.
          </p>
        </div>
      </Shell>
    );
  }

  // ============ TABLERO ============
  const formulario = (
    <Modal
      abierto={creando || !!editando}
      onCerrar={() => { setCreando(false); setEditando(null); }}
      titulo={editando ? "Editar tarjeta" : "Nueva tarjeta"}
      ancho="max-w-2xl"
    >
    <div className="flex flex-col gap-2">
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">
            El seguimiento avisa ese día en el Dashboard y por correo (a diario si toca, resumen los lunes).
          </p>
          <a
            href={(() => {
              const d = fSeguimiento.replace(/-/g, "");
              const fin = new Date(fSeguimiento + "T00:00:00");
              fin.setDate(fin.getDate() + 1);
              const d2 = fin.toISOString().slice(0, 10).replace(/-/g, "");
              const titulo = encodeURIComponent(`Llamada · ${fClienteNombre.trim() || fTitulo.trim() || "lead"}`);
              const detalle = encodeURIComponent(fSeguimientoNota.trim() || "Seguimiento del embudo Ethos");
              return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${d}/${d2}&details=${detalle}`;
            })()}
            target="_blank"
            rel="noopener noreferrer"
            title="Crea el evento prellenado; en el diálogo de Google elige el calendario de Llamadas y ponle hora"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
          >
            📅 Añadir a Google Calendar
          </a>
        </div>
      )}
    </div>
    </Modal>
  );

  return (
    <Shell titulo="Embudo de ventas">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Embudo de ventas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Varios embudos, cada uno con sus etapas. Nada de esto toca la contabilidad hasta marcar <b>Ganado</b>.
            </p>
          </div>
          <button onClick={abrirCrear} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">+ Nueva tarjeta</button>
        </div>

        {/* Selector de embudos + acciones */}
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
            onClick={abrirEditorNuevo}
            className="rounded-full border border-dashed border-zinc-700 px-3 py-1.5 text-sm font-bold text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            title="Crear un embudo nuevo con sus etapas"
          >
            + Nuevo embudo
          </button>
          <button
            onClick={abrirEditorActual}
            className="rounded-full border border-dashed border-zinc-700 px-3 py-1.5 text-sm font-bold text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            title="Editar el nombre y las etapas de este embudo"
          >
            ✎ Editar embudo
          </button>
          {esGrandSlam && (
            <button
              onClick={() => sincronizarGrandSlam()}
              disabled={sincronizando}
              className="rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              title="Crea una tarjeta por cada cliente activo según su ventana (presencial 1→2 meses desde el alta, online 1→3, online anual 3→6) y avanza solas las que pasan de fecha"
            >
              {sincronizando ? "Sincronizando…" : "⚡ Sincronizar clientes"}
            </button>
          )}
          {prevision > 0 && (
            <span className="ml-auto rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300" title="Suma de importes × probabilidad de su etapa">
              Previsión ponderada <span className="text-emerald-400">{eur(prevision)}</span>
            </span>
          )}
        </div>

        {esGrandSlam && (
          <p className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-[11px] leading-snug text-zinc-500">
            <b className="text-zinc-300">Cómo funciona:</b> al abrir este tablero se sincroniza solo (⚡ lo fuerza a mano):
            cada cliente activo tiene su tarjeta, colocada según su ventana (presencial <b>1→2 meses</b> desde el alta · online <b>1→3</b> · online anual <b>3→6</b>),
            con oferta sugerida del catálogo (Semestral 6+1 · 480 € / Anual 12+3 · 900 €). Cuando hagas la oferta, arrastra a
            <b> Ofrecido</b>; si pide tiempo, a <b>Aplazado</b> (ponle seguimiento). <b className="text-emerald-400">✓ Ganado</b> = aceptó
            (te lleva a apuntar el cobro) · <b>Perdido</b> = rechazado. Ajusta importe u oferta tocando la tarjeta.
          </p>
        )}
        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}
        {aviso && <p className="mb-4 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300">{aviso}</p>}
        {formulario}

        <DndContext
          sensors={sensores}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex snap-x items-start gap-4 overflow-x-auto pb-4">
            {colsEmbudo.map((col) => {
              const ids = ordenCols[col.id] ?? [];
              const lista = ids.map((id) => dealPorId.get(id)).filter(Boolean) as DealConCliente[];
              const totalCol = lista.reduce((s, d) => s + Number(d.importe_estimado || 0), 0);
              return (
                <div key={col.id} className="w-[85vw] max-w-xs shrink-0 snap-start rounded-2xl border border-zinc-800 bg-zinc-900/40 md:w-80">
                  <div className="flex items-center justify-between gap-2 px-4 py-3" title={col.descripcion ?? ""}>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-black uppercase tracking-wide text-zinc-300">{col.titulo}</h2>
                      {col.descripcion && <p className="truncate text-[10px] text-zinc-600">{col.descripcion}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {col.probabilidad < 100 && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400" title="Probabilidad de la oportunidad en esta etapa">
                          {col.probabilidad}%
                        </span>
                      )}
                      {totalCol > 0 && <span className="text-xs font-bold text-zinc-500">{eur(totalCol)}</span>}
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">{lista.length}</span>
                    </div>
                  </div>

                  <SortableContext items={ids.map(cardDnd)} strategy={verticalListSortingStrategy}>
                    <ColumnaDrop colId={col.id}>
                      {lista.map((d) => {
                        const diasEstancada = estancada(d, col);
                        return (
                          <SortableDeal key={d.id} id={d.id} onAbrir={() => abrirEditar(d)}>
                            <div className={`rounded-xl border bg-zinc-950 p-3 ${diasEstancada !== null ? "border-amber-800" : "border-zinc-800"}`}>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-white">{d.clientes?.nombre ?? d.titulo}</p>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${d.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"}`}>{d.canal === "online" ? "Online" : "Presencial"}</span>
                              </div>
                              {d.clientes?.nombre && <p className="mt-0.5 truncate text-xs text-zinc-500">{d.titulo}</p>}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <p className="text-lg font-black text-red-500">{eur(Number(d.importe_estimado || 0))}</p>
                                {badgeSeguimiento(d)}
                                {diasEstancada !== null && (
                                  <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-400" title={`Lleva ${diasEstancada} días en esta etapa (aviso a partir de ${col.estancado_dias})`}>
                                    ⚠ {diasEstancada}d parada
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500">{nombrePersona(d.responsable)} · hace {dias(d.fecha_alta)}d{d.origen ? ` · ${d.origen}` : ""}</p>
                              {d.notas && <p className="mt-1 truncate text-[11px] italic text-zinc-600" title={d.notas}>{d.notas}</p>}
                              <div className="mt-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => perder(d)} className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-500 hover:text-zinc-300">Perdido</button>
                                <button onClick={() => ganar(d)} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600">✓ Ganado</button>
                              </div>
                            </div>
                          </SortableDeal>
                        );
                      })}
                      {lista.length === 0 && <p className="py-4 text-center text-xs text-zinc-700">Arrastra tarjetas aquí</p>}
                    </ColumnaDrop>
                  </SortableContext>
                </div>
              );
            })}

            {/* Añadir etapa desde el tablero → abre el editor */}
            <div className="w-[70vw] max-w-xs shrink-0 snap-start md:w-60">
              <button onClick={abrirEditorActual} className="w-full rounded-2xl border border-dashed border-zinc-800 py-4 text-sm font-bold text-zinc-600 hover:border-zinc-600 hover:text-zinc-400">
                + Etapa (editar embudo)
              </button>
            </div>
          </div>

          {/* Sombra de la tarjeta mientras se arrastra */}
          <DragOverlay>
            {arrastrando !== null && (() => {
              const d = dealPorId.get(arrastrando);
              if (!d) return null;
              return (
                <div className="w-72 rounded-xl border border-red-500/60 bg-zinc-950 p-3 shadow-2xl">
                  <p className="text-sm font-semibold text-white">{d.clientes?.nombre ?? d.titulo}</p>
                  <p className="mt-1 text-lg font-black text-red-500">{eur(Number(d.importe_estimado || 0))}</p>
                </div>
              );
            })()}
          </DragOverlay>
        </DndContext>
      </div>
    </Shell>
  );
}
