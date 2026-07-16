"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { ATRIBUCIONES, type Atribucion, type Canal, type Cliente } from "@/lib/tipos";
import { eur, iniciales } from "@/lib/formato";

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

// Color de avatar estable por contacto
const AVATAR_COLORES = [
  "bg-red-900 text-red-300",
  "bg-sky-900 text-sky-300",
  "bg-emerald-900 text-emerald-300",
  "bg-amber-900 text-amber-300",
  "bg-violet-900 text-violet-300",
  "bg-pink-900 text-pink-300",
];

export default function Contactos() {
  const sesionOk = useSesion();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [deudas, setDeudas] = useState<Map<number, number>>(new Map());
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [filtroCanal, setFiltroCanal] = useState<"todos" | Canal>("todos");
  const [filtroEntrenador, setFiltroEntrenador] = useState<string>("todos");
  const [error, setError] = useState<string | null>(null);

  // Alta rápida
  const [creando, setCreando] = useState(false);
  const [fNombre, setFNombre] = useState("");
  const [fTelefono, setFTelefono] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fCanal, setFCanal] = useState<Canal>("presencial");
  const [fResponsable, setFResponsable] = useState<Atribucion>("ethos");
  const [fOrigen, setFOrigen] = useState("");
  const [fEstado, setFEstado] = useState<"lead" | "cliente">("lead");

  async function cargar() {
    const [cli, saldos] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre"),
      supabase.from("v_facturas_saldo").select("cliente_id, pendiente").gt("pendiente", 0.01),
    ]);
    if (cli.error) return setError(cli.error.message);
    setContactos((cli.data as Contacto[]) ?? []);
    const m = new Map<number, number>();
    for (const s of saldos.data ?? [])
      if (s.cliente_id) m.set(s.cliente_id, (m.get(s.cliente_id) ?? 0) + Number(s.pendiente));
    setDeudas(m);
  }

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk]);

  async function crear() {
    if (!fNombre.trim()) return setError("Pon un nombre.");
    setError(null);
    const { error } = await supabase.from("clientes").insert({
      nombre: fNombre.trim(),
      entrenador: fResponsable,
      telefono: fTelefono.trim() || null,
      email: fEmail.trim() || null,
      canal: fCanal,
      origen: fOrigen.trim() || null,
      estado: fEstado,
    });
    if (error) return setError(error.message);
    setFNombre("");
    setFTelefono("");
    setFEmail("");
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
      .filter((c) => filtroCanal === "todos" || c.canal === filtroCanal)
      .filter((c) => filtroEntrenador === "todos" || c.entrenador === filtroEntrenador)
      .filter(
        (c) =>
          !q ||
          [c.nombre, c.telefono, c.email]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
      );
  }, [contactos, busqueda, filtro, filtroCanal, filtroEntrenador]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const nLeads = contactos.filter((c) => c.estado === "lead" && !c.fecha_baja).length;
  const nClientes = contactos.filter((c) => c.estado !== "lead" && !c.fecha_baja).length;

  const chip = (activo: boolean, etiqueta: string, onClick: () => void, key?: string) => (
    <button
      key={key ?? etiqueta}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
        activo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {etiqueta}
    </button>
  );

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
              <input placeholder="Email (opcional)" inputMode="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} className={inputCls} />
              <input placeholder="Origen (Instagram, referido, feria…)" value={fOrigen} onChange={(e) => setFOrigen(e.target.value)} className={inputCls} />
            </div>
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

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            placeholder="Buscar por nombre, teléfono o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputCls} min-w-56 flex-1 sm:max-w-xs`}
          />
          {(
            [
              ["todos", "Todos"],
              ["cliente", "Clientes"],
              ["lead", "Leads"],
              ["baja", "Bajas"],
            ] as [Filtro, string][]
          ).map(([id, etiqueta]) => chip(filtro === id, etiqueta, () => setFiltro(id), id))}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chip(filtroCanal === "online", "Online", () => setFiltroCanal(filtroCanal === "online" ? "todos" : "online"))}
          {chip(
            filtroCanal === "presencial",
            "Presencial",
            () => setFiltroCanal(filtroCanal === "presencial" ? "todos" : "presencial")
          )}
          <span className="mx-1 hidden h-4 w-px bg-zinc-800 sm:block" />
          {ATRIBUCIONES.map((a) =>
            chip(
              filtroEntrenador === a.valor,
              a.etiqueta,
              () => setFiltroEntrenador(filtroEntrenador === a.valor ? "todos" : a.valor),
              a.valor
            )
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="hidden grid-cols-[2.2fr_1.2fr_0.9fr_0.9fr_0.9fr_1fr] gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5 md:grid">
            {["Contacto", "Teléfono", "Estado", "Canal", "Entrenador", "Deuda"].map((h) => (
              <span key={h} className="text-[11px] font-black uppercase tracking-wider text-zinc-500 last:text-right">
                {h}
              </span>
            ))}
          </div>
          {visibles.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-600">Sin resultados.</p>
          )}
          {visibles.map((c) => {
            const deuda = deudas.get(c.id) ?? 0;
            const badgeEstado = (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                  c.fecha_baja
                    ? "bg-zinc-900 text-zinc-600"
                    : c.estado === "lead"
                      ? "bg-amber-950 text-amber-400"
                      : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {c.fecha_baja ? "Baja" : c.estado === "lead" ? "Lead" : "Cliente"}
              </span>
            );
            const badgeCanal = c.canal && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  c.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"
                }`}
              >
                {c.canal === "online" ? "Online" : "Presencial"}
              </span>
            );
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-zinc-800 px-4 py-3 last:border-0 hover:bg-zinc-900 md:grid-cols-[2.2fr_1.2fr_0.9fr_0.9fr_0.9fr_1fr]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${
                      AVATAR_COLORES[c.id % AVATAR_COLORES.length]
                    }`}
                  >
                    {iniciales(c.nombre)}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate font-semibold ${c.fecha_baja ? "text-zinc-600 line-through" : "text-white"}`}>
                      {c.nombre}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {c.email || c.origen || NOMBRES[c.entrenador] || "—"}
                    </p>
                  </div>
                </div>
                <span className="hidden truncate text-sm text-zinc-400 md:block">{c.telefono || "—"}</span>
                <span className="hidden md:block">{badgeEstado}</span>
                <span className="hidden md:block">{badgeCanal ?? <span className="text-xs text-zinc-700">—</span>}</span>
                <span className="hidden truncate text-sm text-zinc-400 md:block">
                  {NOMBRES[c.entrenador] ?? c.entrenador}
                </span>
                <span className="flex items-center justify-end gap-2">
                  <span className="md:hidden">{badgeCanal}</span>
                  <span className="md:hidden">{badgeEstado}</span>
                  {deuda > 0 && (
                    <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                      debe {eur(deuda)}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
