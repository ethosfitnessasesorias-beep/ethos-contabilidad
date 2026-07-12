"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { ATRIBUCIONES, type Atribucion } from "@/lib/tipos";

type Estado = "por_hacer" | "en_curso" | "hecha";
type Prioridad = "alta" | "media" | "baja";

interface Tarjeta {
  id: number;
  titulo: string;
  tipo: string;
  estado: Estado;
  prioridad: Prioridad;
  responsable: Atribucion;
  cuando: string;
  notas: string | null;
  cliente_id: number | null;
}

const COLUMNAS: { id: Estado; titulo: string }[] = [
  { id: "por_hacer", titulo: "Por hacer" },
  { id: "en_curso", titulo: "En curso" },
  { id: "hecha", titulo: "Hecho" },
];

const TIPOS = ["tarea", "llamada", "visita", "email", "whatsapp", "nota"];

const PRIORIDADES: { valor: Prioridad; etiqueta: string; clase: string }[] = [
  { valor: "alta", etiqueta: "Alta", clase: "bg-red-950 text-red-400 ring-red-800" },
  { valor: "media", etiqueta: "Media", clase: "bg-amber-950 text-amber-400 ring-amber-800" },
  { valor: "baja", etiqueta: "Baja", clase: "bg-sky-950 text-sky-400 ring-sky-800" },
];

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function Actividades() {
  const sesionOk = useSesion();
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [editando, setEditando] = useState<Tarjeta | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario (alta y edición comparten estado)
  const [fTitulo, setFTitulo] = useState("");
  const [fTipo, setFTipo] = useState("tarea");
  const [fPrioridad, setFPrioridad] = useState<Prioridad>("media");
  const [fResponsable, setFResponsable] = useState<Atribucion>("ethos");
  const [fCuando, setFCuando] = useState("");
  const [fNotas, setFNotas] = useState("");

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("actividades")
      .select("id, titulo, tipo, estado, prioridad, responsable, cuando, notas, cliente_id")
      .order("prioridad")
      .order("cuando");
    if (error) {
      setError(
        error.message.includes("estado")
          ? "Falta la migración del tablero: ejecuta supabase/actividades_tablero.sql"
          : error.message
      );
      return;
    }
    setTarjetas((data as Tarjeta[]) ?? []);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  function abrirCrear() {
    setEditando(null);
    setFTitulo("");
    setFTipo("tarea");
    setFPrioridad("media");
    setFResponsable("ethos");
    setFCuando(new Date().toISOString().slice(0, 16));
    setFNotas("");
    setCreando(true);
  }

  function abrirEditar(t: Tarjeta) {
    setCreando(false);
    setEditando(t);
    setFTitulo(t.titulo);
    setFTipo(t.tipo);
    setFPrioridad(t.prioridad);
    setFResponsable(t.responsable);
    setFCuando(t.cuando.slice(0, 16));
    setFNotas(t.notas ?? "");
  }

  async function guardar() {
    if (!fTitulo.trim()) return setError("Pon un título.");
    setError(null);
    const datos = {
      titulo: fTitulo.trim(),
      tipo: fTipo,
      prioridad: fPrioridad,
      responsable: fResponsable,
      cuando: new Date(fCuando).toISOString(),
      notas: fNotas.trim() || null,
    };
    const res = editando
      ? await supabase.from("actividades").update(datos).eq("id", editando.id)
      : await supabase.from("actividades").insert(datos);
    if (res.error) return setError(res.error.message);
    setCreando(false);
    setEditando(null);
    cargar();
  }

  async function borrar() {
    if (!editando) return;
    if (!window.confirm(`¿Borrar "${editando.titulo}"?`)) return;
    const { error } = await supabase.from("actividades").delete().eq("id", editando.id);
    if (error) return setError(error.message);
    setEditando(null);
    cargar();
  }

  async function mover(id: number, estado: Estado) {
    // Optimista: la tarjeta se mueve al instante y la BD va detrás
    setTarjetas((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
    const { error } = await supabase
      .from("actividades")
      .update({ estado, hecha: estado === "hecha" })
      .eq("id", id);
    if (error) {
      setError(error.message);
      cargar();
    }
  }

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const formulario = (creando || editando) && (
    <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {editando ? "Editar tarjeta" : "Nueva tarjeta"}
      </p>
      <input placeholder="Título" value={fTitulo} onChange={(e) => setFTitulo(e.target.value)} className={inputCls} />
      <div className="flex flex-wrap gap-2">
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} className={`${inputCls} appearance-none`}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={fCuando}
          onChange={(e) => setFCuando(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Prioridad:</span>
        {PRIORIDADES.map((p) => (
          <button
            key={p.valor}
            onClick={() => setFPrioridad(p.valor)}
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
              fPrioridad === p.valor ? p.clase : "bg-zinc-900 text-zinc-500 ring-zinc-800"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Responsable:</span>
        {ATRIBUCIONES.map((a) => (
          <button
            key={a.valor}
            onClick={() => setFResponsable(a.valor)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              fResponsable === a.valor ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {a.etiqueta}
          </button>
        ))}
      </div>
      <textarea placeholder="Notas (opcional)" rows={2} value={fNotas} onChange={(e) => setFNotas(e.target.value)} className={inputCls} />
      <div className="flex gap-2">
        <button onClick={guardar} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
          {editando ? "Guardar cambios" : "Crear tarjeta"}
        </button>
        <button
          onClick={() => {
            setCreando(false);
            setEditando(null);
          }}
          className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-zinc-300"
        >
          Cancelar
        </button>
        {editando && (
          <button onClick={borrar} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-red-400">
            Borrar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Shell titulo="Actividades">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Actividades</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Arrastra las tarjetas entre columnas, o usa las flechas en el móvil.
            </p>
          </div>
          <button onClick={abrirCrear} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
            + Nueva tarjeta
          </button>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}
        {formulario}

        <div className="flex snap-x gap-4 overflow-x-auto pb-4">
          {COLUMNAS.map((col, iCol) => {
            const lista = tarjetas.filter((t) => t.estado === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastrando !== null) mover(arrastrando, col.id);
                  setArrastrando(null);
                }}
                className="w-[85vw] max-w-xs shrink-0 snap-start rounded-2xl border border-zinc-800 bg-zinc-900/40 md:w-auto md:max-w-none md:flex-1"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">{col.titulo}</h2>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">
                    {lista.length}
                  </span>
                </div>
                <div className="flex min-h-24 flex-col gap-2 px-3 pb-3">
                  {lista.map((t) => {
                    const pri = PRIORIDADES.find((p) => p.valor === t.prioridad)!;
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setArrastrando(t.id)}
                        onClick={() => abrirEditar(t)}
                        className="cursor-grab rounded-xl border border-zinc-800 bg-zinc-950 p-3 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{t.titulo}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${pri.clase}`}>
                            {pri.etiqueta}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-500">
                          {t.tipo} · {NOMBRES[t.responsable]} ·{" "}
                          {new Date(t.cuando).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {t.notas && <p className="mt-1 truncate text-xs text-zinc-600">{t.notas}</p>}
                        <div className="mt-2 flex justify-between" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={iCol === 0}
                            onClick={() => mover(t.id, COLUMNAS[iCol - 1].id)}
                            className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400 disabled:opacity-20"
                          >
                            ←
                          </button>
                          <button
                            disabled={iCol === COLUMNAS.length - 1}
                            onClick={() => mover(t.id, COLUMNAS[iCol + 1].id)}
                            className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400 disabled:opacity-20"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {lista.length === 0 && (
                    <p className="py-4 text-center text-xs text-zinc-700">Suelta tarjetas aquí</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
