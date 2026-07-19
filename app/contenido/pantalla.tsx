"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import Modal from "@/components/Modal";

interface Persona {
  codigo: string;
  nombre: string;
}
interface ClienteRef {
  id: number;
  nombre: string;
}
interface Contenido {
  id: number;
  titulo: string;
  fase: string;
  plataforma: string;
  formato: string | null;
  gancho: string | null;
  copy: string | null;
  responsable: string | null;
  cliente_id: number | null;
  fecha_pub: string | null;
  url_archivo: string | null;
  orden: number;
  archivado_en: string | null;
}

const FASES = [
  { id: "idea", nombre: "Ideas" },
  { id: "guion", nombre: "Guion" },
  { id: "grabar", nombre: "Grabar" },
  { id: "editar", nombre: "Editar" },
  { id: "programado", nombre: "Programado" },
  { id: "publicado", nombre: "Publicado" },
];

const FORMATOS: { id: string; nombre: string; clase: string }[] = [
  { id: "reel", nombre: "Reel", clase: "bg-violet-600" },
  { id: "carrusel", nombre: "Carrusel", clase: "bg-sky-600" },
  { id: "story", nombre: "Story", clase: "bg-pink-600" },
  { id: "directo", nombre: "Directo", clase: "bg-red-600" },
  { id: "colaboracion", nombre: "Colaboración", clase: "bg-emerald-600" },
];
const formatoDe = (id: string | null) => FORMATOS.find((f) => f.id === id) ?? FORMATOS[0];

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

function Tarjeta({ c, nombres, onAbrir }: { c: Contenido; nombres: Record<string, string>; onAbrir: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: c.id });
  const fmt = formatoDe(c.formato);
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAbrir}
      style={{
        touchAction: "none",
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
      }}
      className={`cursor-grab rounded-xl border border-zinc-800 bg-zinc-950 p-3 active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`${fmt.clase} rounded-full px-2 py-0.5 text-[10px] font-bold text-white`}>{fmt.nombre}</span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">Instagram</span>
      </div>
      <p className="text-sm font-semibold text-white">{c.titulo}</p>
      <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>{c.responsable ? nombres[c.responsable] ?? c.responsable : "—"}</span>
        {c.fecha_pub && (
          <span className="text-zinc-400">
            {new Date(c.fecha_pub).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {hora(c.fecha_pub)}
          </span>
        )}
      </div>
    </div>
  );
}

function Columna({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`w-[80vw] max-w-xs shrink-0 snap-start rounded-2xl border bg-zinc-900/40 md:w-64 ${isOver ? "border-red-500/60" : "border-zinc-800"}`}
    >
      {children}
    </div>
  );
}

export default function ContenidoPantalla({ vista }: { vista: "tablero" | "calendario" }) {
  const sesionOk = useSesion();
  const router = useRouter();
  const [items, setItems] = useState<Contenido[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [mesCal, setMesCal] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState(false);
  const [ed, setEd] = useState<Contenido | null>(null);
  const [f, setF] = useState<Partial<Contenido>>({});
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [verSync, setVerSync] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );
  const nombres = Object.fromEntries(personas.map((p) => [p.codigo, p.nombre]));

  const cargar = useCallback(async () => {
    const [c, per, cli] = await Promise.all([
      supabase.from("contenido").select("*").is("archivado_en", null).order("orden").order("fecha_pub"),
      supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
      supabase.from("clientes").select("id, nombre").is("fecha_baja", null).order("nombre"),
    ]);
    if (c.error) {
      setError(
        c.error.message.includes("contenido")
          ? "Falta la tabla de contenido: ejecuta supabase/contenido.sql en el SQL Editor."
          : c.error.message
      );
      return;
    }
    setError(null);
    setItems((c.data as Contenido[]) ?? []);
    setPersonas((per.data as Persona[]) ?? []);
    setClientes((cli.data as ClienteRef[]) ?? []);

    // Enlace del feed para suscribir en Google Calendar
    const { data: cfg } = await supabase.from("contenido_config").select("feed_token").eq("id", 1).single();
    const token = (cfg as { feed_token: string } | null)?.feed_token;
    if (token && typeof window !== "undefined") setFeedUrl(`${window.location.origin}/api/calendario/${token}`);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  function abrirNuevo(fechaPub?: string) {
    setEd(null);
    setF({
      titulo: "", fase: "idea", plataforma: "instagram", formato: "reel",
      responsable: personas[0]?.codigo,
      ...(fechaPub ? { fecha_pub: fechaPub } : {}),
    });
    setModal(true);
  }
  function abrirEditar(c: Contenido) {
    setEd(c);
    setF({ ...c, fecha_pub: c.fecha_pub ? c.fecha_pub.slice(0, 16) : "" });
    setModal(true);
  }

  async function guardar() {
    if (!f.titulo?.trim()) return setError("Pon un título.");
    const datos = {
      titulo: f.titulo.trim(),
      fase: f.fase ?? "idea",
      plataforma: "instagram",
      formato: f.formato ?? "reel",
      gancho: f.gancho?.trim() || null,
      copy: f.copy?.trim() || null,
      responsable: f.responsable ?? null,
      cliente_id: f.cliente_id ?? null,
      fecha_pub: f.fecha_pub ? new Date(f.fecha_pub).toISOString() : null,
      url_archivo: f.url_archivo?.trim() || null,
    };
    const res = ed
      ? await supabase.from("contenido").update(datos).eq("id", ed.id)
      : await supabase.from("contenido").insert({ ...datos, orden: 0 });
    if (res.error) return setError(res.error.message);
    setModal(false);
    cargar();
  }

  async function archivar() {
    if (!ed) return;
    await supabase.from("contenido").update({ archivado_en: new Date().toISOString() }).eq("id", ed.id);
    setModal(false);
    cargar();
  }
  async function borrar() {
    if (!ed || !window.confirm(`¿Borrar "${ed.titulo}"?`)) return;
    await supabase.from("contenido").delete().eq("id", ed.id);
    setModal(false);
    cargar();
  }

  async function moverFase(id: number, fase: string) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, fase } : x)));
    const { error } = await supabase.from("contenido").update({ fase }).eq("id", id);
    if (error) {
      setError(error.message);
      cargar();
    }
  }
  function alSoltar(e: DragEndEvent) {
    const fase = String(e.over?.id ?? "");
    const id = Number(e.active.id);
    const item = items.find((x) => x.id === id);
    if (fase && item && item.fase !== fase) moverFase(id, fase);
  }

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  // Calendario
  const primerDia = new Date(mesCal.getFullYear(), mesCal.getMonth(), 1);
  const offset = (primerDia.getDay() + 6) % 7; // lunes = 0
  const diasMes = new Date(mesCal.getFullYear(), mesCal.getMonth() + 1, 0).getDate();
  const celdas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  const postsDelDia = (dia: number) =>
    items.filter((c) => {
      if (!c.fecha_pub) return false;
      const d = new Date(c.fecha_pub);
      return d.getFullYear() === mesCal.getFullYear() && d.getMonth() === mesCal.getMonth() && d.getDate() === dia;
    });

  const modalContenido = (
    <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={ed ? "Editar contenido" : "Nuevo contenido"} ancho="max-w-xl">
      <div className="flex flex-col gap-4">
        <input placeholder="Título del vídeo" value={f.titulo ?? ""} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={`${inputCls} text-base font-semibold`} autoFocus />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fase</span>
            <select value={f.fase ?? "idea"} onChange={(e) => setF({ ...f, fase: e.target.value })} className={`${inputCls} appearance-none`}>
              {FASES.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Formato</span>
            <select value={f.formato ?? "reel"} onChange={(e) => setF({ ...f, formato: e.target.value })} className={`${inputCls} appearance-none`}>
              {FORMATOS.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Publicar</span>
            <input type="datetime-local" value={(f.fecha_pub as string) ?? ""} onChange={(e) => setF({ ...f, fecha_pub: e.target.value })} className={inputCls} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Responsable</span>
          {personas.map((p) => (
            <button key={p.codigo} onClick={() => setF({ ...f, responsable: p.codigo })} className={`rounded-full px-3 py-1 text-xs font-semibold ${f.responsable === p.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
              {p.nombre}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Gancho / titular</span>
          <input placeholder="El hook que capta la atención" value={f.gancho ?? ""} onChange={(e) => setF({ ...f, gancho: e.target.value })} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Copy / pie</span>
          <textarea rows={3} placeholder="Descripción, hashtags…" value={f.copy ?? ""} onChange={(e) => setF({ ...f, copy: e.target.value })} className={inputCls} />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cliente (opcional)</span>
            <select value={f.cliente_id ?? ""} onChange={(e) => setF({ ...f, cliente_id: Number(e.target.value) || null })} className={`${inputCls} appearance-none`}>
              <option value="">Ninguno</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Enlace al vídeo</span>
            <input placeholder="Drive, carpeta…" value={f.url_archivo ?? ""} onChange={(e) => setF({ ...f, url_archivo: e.target.value })} className={inputCls} />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button onClick={guardar} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">{ed ? "Guardar" : "Crear"}</button>
          {ed && (
            <>
              <button onClick={archivar} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-zinc-300">📦 Archivar</button>
              <button onClick={borrar} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-red-400">Borrar</button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );

  return (
    <Shell titulo="Contenido">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Contenido</h1>
            <p className="mt-1 text-sm text-zinc-500">Producción y calendario de vídeos para Instagram.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-zinc-900 p-1">
              {(["tablero", "calendario"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => router.push(v === "tablero" ? "/contenido" : "/contenido/calendario")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize ${vista === v ? "bg-red-600 text-white" : "text-zinc-400"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => abrirNuevo()} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">+ Nuevo</button>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Sincronizar con Google Calendar (feed .ics) — solo en la vista calendario */}
        {vista === "calendario" && (
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <button onClick={() => setVerSync((v) => !v)} className="flex w-full items-center justify-between text-left">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-sky-950 text-sky-400">📅</span>
              Sincronizar con Google Calendar
            </span>
            <span className="text-xs text-zinc-500">{verSync ? "ocultar" : "cómo"}</span>
          </button>
          {verSync && (
            <div className="mt-3 border-t border-zinc-800 pt-3">
              <p className="mb-2 text-xs text-zinc-400">
                Las publicaciones con fecha aparecen solas en tu Google Calendar (calendario aparte,
                se actualiza cada pocas horas). Añádelo una vez:
              </p>
              <ol className="mb-3 ml-4 list-decimal space-y-1 text-xs text-zinc-400">
                <li>Copia el enlace de abajo.</li>
                <li>En Google Calendar (ordenador): <b>Otros calendarios</b> → <b>+</b> → <b>Suscribirse mediante URL</b>.</li>
                <li>Pega el enlace y listo.</li>
              </ol>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
                  {feedUrl ?? "Cargando…"}
                </code>
                <button
                  onClick={() => {
                    if (feedUrl) {
                      navigator.clipboard.writeText(feedUrl).then(() => {
                        setCopiado(true);
                        setTimeout(() => setCopiado(false), 2000);
                      });
                    }
                  }}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200"
                >
                  {copiado ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">
                Es de solo lectura (los cambios se hacen aquí, no en Google). Trátalo como privado: quien tenga el enlace ve el calendario.
              </p>
            </div>
          )}
        </div>
        )}

        {vista === "tablero" ? (
          <DndContext sensors={sensores} onDragEnd={alSoltar}>
            <div className="flex snap-x items-start gap-3 overflow-x-auto pb-4">
              {FASES.map((fase) => {
                const lista = items.filter((c) => c.fase === fase.id);
                return (
                  <Columna key={fase.id} id={fase.id}>
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <h2 className="truncate text-sm font-black uppercase tracking-wide text-zinc-300">{fase.nombre}</h2>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">{lista.length}</span>
                    </div>
                    <div className="flex min-h-24 flex-col gap-2 px-3 pb-3">
                      {lista.map((c) => <Tarjeta key={c.id} c={c} nombres={nombres} onAbrir={() => abrirEditar(c)} />)}
                      {lista.length === 0 && <p className="py-4 text-center text-xs text-zinc-700">Suelta aquí</p>}
                    </div>
                  </Columna>
                );
              })}
            </div>
          </DndContext>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button onClick={() => setMesCal(new Date(mesCal.getFullYear(), mesCal.getMonth() - 1, 1))} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-bold text-zinc-300 hover:bg-zinc-700">←</button>
                <button onClick={() => setMesCal(new Date())} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:bg-zinc-700">Hoy</button>
                <button onClick={() => setMesCal(new Date(mesCal.getFullYear(), mesCal.getMonth() + 1, 1))} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-bold text-zinc-300 hover:bg-zinc-700">→</button>
              </div>
              <span className="text-base font-black capitalize text-white">{mesCal.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</span>
              <span className="hidden text-[11px] text-zinc-600 sm:block">clic en un día para programar</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="pb-1 text-center text-[10px] font-black uppercase tracking-wider text-zinc-600">{d}</div>
              ))}
              {celdas.map((dia, i) => {
                const esHoy =
                  dia !== null &&
                  new Date().getDate() === dia &&
                  new Date().getMonth() === mesCal.getMonth() &&
                  new Date().getFullYear() === mesCal.getFullYear();
                const finde = i % 7 >= 5;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!dia) return;
                      const f2 = `${mesCal.getFullYear()}-${String(mesCal.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}T12:00`;
                      abrirNuevo(f2);
                    }}
                    className={`min-h-24 rounded-lg p-1.5 ${
                      dia ? `cursor-pointer bg-zinc-950 hover:bg-zinc-900 ${esHoy ? "ring-1 ring-red-600" : ""} ${finde ? "opacity-80" : ""}` : ""
                    }`}
                  >
                    {dia && (
                      <>
                        <p className={`mb-1 text-[11px] font-bold ${esHoy ? "text-red-400" : "text-zinc-500"}`}>{dia}</p>
                        <div className="flex flex-col gap-1">
                          {postsDelDia(dia).map((c) => {
                            const fmt = formatoDe(c.formato);
                            return (
                              <button
                                key={c.id}
                                onClick={(e) => { e.stopPropagation(); abrirEditar(c); }}
                                title={`${c.titulo}${c.responsable ? ` · ${nombres[c.responsable] ?? c.responsable}` : ""}`}
                                className={`${fmt.clase} truncate rounded px-1.5 py-1 text-left text-[10px] font-bold text-white`}
                              >
                                {c.fecha_pub ? hora(c.fecha_pub) + " " : ""}{c.titulo}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
              {FORMATOS.map((fmt) => (
                <span key={fmt.id} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${fmt.clase}`} />{fmt.nombre}</span>
              ))}
            </div>
          </div>
        )}

        {modalContenido}
      </div>
    </Shell>
  );
}
