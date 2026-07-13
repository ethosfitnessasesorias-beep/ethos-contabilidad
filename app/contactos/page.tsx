"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { ATRIBUCIONES, type Atribucion, type Canal, type Cliente } from "@/lib/tipos";

interface Contacto extends Cliente {
  canal?: Canal | null;
  origen?: string | null;
  estado?: string;
}

type Filtro = "todos" | "lead" | "cliente" | "baja";

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

export default function Contactos() {
  const sesionOk = useSesion();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [error, setError] = useState<string | null>(null);

  // Alta rápida
  const [creando, setCreando] = useState(false);
  const [fNombre, setFNombre] = useState("");
  const [fTelefono, setFTelefono] = useState("");
  const [fCanal, setFCanal] = useState<Canal>("presencial");
  const [fResponsable, setFResponsable] = useState<Atribucion>("ethos");
  const [fOrigen, setFOrigen] = useState("");
  const [fEstado, setFEstado] = useState<"lead" | "cliente">("lead");

  async function cargar() {
    const { data, error } = await supabase.from("clientes").select("*").order("nombre");
    if (error) return setError(error.message);
    setContactos((data as Contacto[]) ?? []);
  }

  useEffect(() => {
    if (sesionOk) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionOk]);

  async function crear() {
    if (!fNombre.trim()) return setError("Pon un nombre.");
    setError(null);
    const { error } = await supabase.from("clientes").insert({
      nombre: fNombre.trim(),
      entrenador: fResponsable,
      telefono: fTelefono.trim() || null,
      canal: fCanal,
      origen: fOrigen.trim() || null,
      estado: fEstado,
    });
    if (error) return setError(error.message);
    setFNombre("");
    setFTelefono("");
    setFOrigen("");
    setCreando(false);
    cargar();
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return contactos
      .filter((c) => {
        if (filtro === "baja") return !!c.fecha_baja;
        if (c.fecha_baja) return false;
        if (filtro === "lead") return c.estado === "lead";
        if (filtro === "cliente") return c.estado !== "lead";
        return true;
      })
      .filter((c) => !q || c.nombre.toLowerCase().includes(q));
  }, [contactos, busqueda, filtro]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const nLeads = contactos.filter((c) => c.estado === "lead" && !c.fecha_baja).length;
  const nClientes = contactos.filter((c) => c.estado !== "lead" && !c.fecha_baja).length;

  return (
    <Shell titulo="Contactos">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Contactos</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {nClientes} clientes · {nLeads} leads
            </p>
          </div>
          <button
            onClick={() => setCreando(!creando)}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            + Nuevo contacto
          </button>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {creando && (
          <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nuevo contacto</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input placeholder="Nombre" value={fNombre} onChange={(e) => setFNombre(e.target.value)} className={inputCls} />
              <input placeholder="Teléfono" inputMode="tel" value={fTelefono} onChange={(e) => setFTelefono(e.target.value)} className={inputCls} />
            </div>
            <input placeholder="Origen (Instagram, referido, feria…)" value={fOrigen} onChange={(e) => setFOrigen(e.target.value)} className={inputCls} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Es:</span>
              {(["lead", "cliente"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setFEstado(e)}
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    fEstado === e ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {e}
                </button>
              ))}
              <span className="ml-2 text-xs text-zinc-500">Canal:</span>
              {(["presencial", "online"] as Canal[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setFCanal(c)}
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    fCanal === c ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {c}
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
            <button onClick={crear} className="rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
              Crear contacto
            </button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            placeholder="Buscar…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputCls} flex-1 sm:max-w-xs`}
          />
          {(
            [
              ["todos", "Todos"],
              ["cliente", "Clientes"],
              ["lead", "Leads"],
              ["baja", "Bajas"],
            ] as [Filtro, string][]
          ).map(([id, etiqueta]) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                filtro === id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          {visibles.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-600">Sin resultados.</p>
          )}
          {visibles.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0 hover:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className={`truncate font-semibold ${c.fecha_baja ? "text-zinc-600 line-through" : "text-white"}`}>
                  {c.nombre}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {NOMBRES[c.entrenador]}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                  {c.origen ? ` · ${c.origen}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {c.canal && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      c.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"
                    }`}
                  >
                    {c.canal === "online" ? "Online" : "Presencial"}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                    c.estado === "lead" ? "bg-amber-950 text-amber-400" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {c.estado === "lead" ? "Lead" : "Cliente"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
