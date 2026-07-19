"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import Modal from "@/components/Modal";

interface Nota {
  id: number;
  titulo: string;
  contenido: string;
  color: string;
  fijada: boolean;
  actualizado_en: string;
}

const COLORES: Record<string, { borde: string; punto: string }> = {
  zinc: { borde: "border-zinc-800", punto: "bg-zinc-500" },
  red: { borde: "border-red-900", punto: "bg-red-500" },
  amber: { borde: "border-amber-900", punto: "bg-amber-500" },
  emerald: { borde: "border-emerald-900", punto: "bg-emerald-500" },
  sky: { borde: "border-sky-900", punto: "bg-sky-500" },
  violet: { borde: "border-violet-900", punto: "bg-violet-500" },
};

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function NotasPage() {
  const sesionOk = useSesion();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [ed, setEd] = useState<Partial<Nota> | null>(null); // sin id = nueva
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("notas")
      .select("*")
      .order("fijada", { ascending: false })
      .order("actualizado_en", { ascending: false });
    if (error) return setError(error.message.includes("notas") ? "Falta la migración kpis_notas.sql." : error.message);
    setNotas((data as Nota[]) ?? []);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  async function guardar() {
    if (!ed) return;
    if (!(ed.titulo ?? "").trim() && !(ed.contenido ?? "").trim()) return setEd(null);
    const datos = {
      titulo: (ed.titulo ?? "").trim(),
      contenido: ed.contenido ?? "",
      color: ed.color ?? "zinc",
      actualizado_en: new Date().toISOString(),
    };
    const r = ed.id
      ? await supabase.from("notas").update(datos).eq("id", ed.id)
      : await supabase.from("notas").insert(datos);
    if (r.error) return setError(r.error.message);
    setEd(null);
    cargar();
  }

  async function fijar(n: Nota) {
    await supabase.from("notas").update({ fijada: !n.fijada }).eq("id", n.id);
    cargar();
  }

  async function borrar() {
    if (!ed?.id) return setEd(null);
    if (!confirm("¿Borrar esta nota?")) return;
    await supabase.from("notas").delete().eq("id", ed.id);
    setEd(null);
    cargar();
  }

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const q = busqueda.trim().toLowerCase();
  const visibles = notas.filter((n) => !q || `${n.titulo} ${n.contenido}`.toLowerCase().includes(q));

  return (
    <Shell titulo="Notas">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Notas</h1>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500">Ideas, recordatorios y apuntes rápidos del negocio.</p>
          </div>
          <button onClick={() => setEd({ color: "zinc" })} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
            + Nueva nota
          </button>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        <input
          placeholder="Buscar en las notas…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputCls} mb-4 w-full sm:max-w-xs`}
        />

        {visibles.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-600">
            {q ? "Nada con esa búsqueda." : "Sin notas todavía. Crea la primera."}
          </p>
        ) : (
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
            {visibles.map((n) => {
              const c = COLORES[n.color] ?? COLORES.zinc;
              return (
                <button
                  key={n.id}
                  onClick={() => setEd({ ...n })}
                  className={`mb-3 block w-full break-inside-avoid rounded-xl border ${c.borde} bg-zinc-900/40 p-3.5 text-left hover:bg-zinc-900`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${c.punto}`} />
                    {n.titulo && <span className="truncate text-sm font-bold text-white">{n.titulo}</span>}
                    {n.fijada && <span className="ml-auto shrink-0 text-[10px] text-amber-400">📌</span>}
                  </div>
                  {n.contenido && (
                    <p className="whitespace-pre-wrap text-[13px] leading-snug text-zinc-400" style={{ display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {n.contenido}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] text-zinc-600">
                    {new Date(n.actualizado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <Modal abierto={!!ed} onCerrar={guardar} titulo={ed?.id ? "Editar nota" : "Nueva nota"} ancho="max-w-lg">
          {ed && (
            <div className="flex flex-col gap-3">
              <input
                placeholder="Título"
                value={ed.titulo ?? ""}
                onChange={(e) => setEd({ ...ed, titulo: e.target.value })}
                className={inputCls}
                autoFocus
              />
              <textarea
                placeholder="Escribe aquí…"
                rows={8}
                value={ed.contenido ?? ""}
                onChange={(e) => setEd({ ...ed, contenido: e.target.value })}
                className={inputCls}
              />
              <div className="flex items-center gap-2">
                {Object.entries(COLORES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setEd({ ...ed, color: k })}
                    aria-label={`Color ${k}`}
                    className={`h-6 w-6 rounded-full ${v.punto} ${ed.color === k ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"}`}
                  />
                ))}
                {ed.id && (
                  <button
                    onClick={() => { const n = notas.find((x) => x.id === ed.id); if (n) { fijar(n); setEd({ ...ed, fijada: !ed.fijada }); } }}
                    className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold ${ed.fijada ? "bg-amber-950 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}
                  >
                    📌 {ed.fijada ? "Fijada" : "Fijar"}
                  </button>
                )}
              </div>
              <div className="flex gap-2 border-t border-zinc-800 pt-3">
                <button onClick={guardar} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Guardar</button>
                {ed.id && (
                  <button onClick={borrar} className="rounded-xl border border-red-900 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-950">Borrar</button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
