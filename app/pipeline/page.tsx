"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { ATRIBUCIONES, type Atribucion, type Canal, type Cliente, type Deal, type EtapaDeal } from "@/lib/tipos";

const ETAPAS_TABLERO: { id: EtapaDeal; titulo: string }[] = [
  { id: "lead", titulo: "Lead" },
  { id: "contactado", titulo: "Contactado" },
  { id: "agendado", titulo: "Agendado" },
];

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

interface DealConCliente extends Deal {
  clientes: { nombre: string } | null;
}

export default function Pipeline() {
  const sesionOk = useSesion();
  const router = useRouter();
  const [deals, setDeals] = useState<DealConCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Formulario de deal (alta y edición)
  const [editando, setEditando] = useState<DealConCliente | null>(null);
  const [creando, setCreando] = useState(false);
  const [fTitulo, setFTitulo] = useState("");
  const [fClienteNombre, setFClienteNombre] = useState("");
  const [fCanal, setFCanal] = useState<Canal>("presencial");
  const [fImporte, setFImporte] = useState("");
  const [fResponsable, setFResponsable] = useState<Atribucion>("ethos");
  const [fOrigen, setFOrigen] = useState("");
  const [fNotas, setFNotas] = useState("");

  const cargar = useCallback(async () => {
    const [d, c] = await Promise.all([
      supabase
        .from("deals")
        .select("*, clientes(nombre)")
        .in("etapa", ["lead", "contactado", "agendado"])
        .order("creado_en", { ascending: false }),
      supabase.from("clientes").select("id, nombre, entrenador").is("fecha_baja", null).order("nombre"),
    ]);
    if (d.error) {
      setError(d.error.message.includes("deals") ? "Falta ejecutar supabase/crm.sql" : d.error.message);
      return;
    }
    setDeals((d.data as unknown as DealConCliente[]) ?? []);
    setClientes((c.data as Cliente[]) ?? []);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  function abrirCrear() {
    setEditando(null);
    setFTitulo("");
    setFClienteNombre("");
    setFCanal("presencial");
    setFImporte("");
    setFResponsable("ethos");
    setFOrigen("");
    setFNotas("");
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
  }

  // Devuelve el id del cliente escrito; si no existe, lo crea como lead
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

  async function guardarDeal() {
    if (!fTitulo.trim()) return setError("Pon un título al deal.");
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
    };
    const res = editando
      ? await supabase.from("deals").update(datos).eq("id", editando.id)
      : await supabase.from("deals").insert(datos);
    if (res.error) return setError(res.error.message);
    setCreando(false);
    setEditando(null);
    cargar();
  }

  async function borrarDeal() {
    if (!editando) return;
    if (!window.confirm(`¿Borrar el deal "${editando.titulo}"?`)) return;
    const { error } = await supabase.from("deals").delete().eq("id", editando.id);
    if (error) return setError(error.message);
    setEditando(null);
    cargar();
  }

  async function mover(id: number, etapa: EtapaDeal) {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    if (etapa === "ganado") {
      // 1. Cerrar el deal (cuenta en la tasa de cierre del dashboard)
      const r1 = await supabase
        .from("deals")
        .update({ etapa: "ganado", fecha_cierre: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (r1.error) return setError(r1.error.message);
      // 2. El contacto pasa a ser cliente
      if (deal.cliente_id) {
        await supabase.from("clientes").update({ estado: "cliente" }).eq("id", deal.cliente_id);
      }
      // 3. Pre-rellenar Apuntar con la primera factura (al guardarla TÚ,
      //    suma a facturación y cash collected de verdad)
      sessionStorage.setItem(
        "prefill_ingreso",
        JSON.stringify({
          clienteNombre: deal.clientes?.nombre ?? "",
          importe: deal.importe_estimado || "",
          canal: deal.canal,
          atribucion: deal.responsable,
          concepto: deal.titulo,
        })
      );
      router.push("/");
      return;
    }

    if (etapa === "perdido") {
      const { error } = await supabase
        .from("deals")
        .update({ etapa: "perdido", fecha_cierre: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) return setError(error.message);
      setAviso(`"${deal.titulo}" marcado como perdido.`);
      setTimeout(() => setAviso(null), 3000);
      cargar();
      return;
    }

    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, etapa } : d)));
    const { error } = await supabase.from("deals").update({ etapa }).eq("id", id);
    if (error) {
      setError(error.message);
      cargar();
    }
  }

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const dias = (fecha: string) =>
    Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 86400000));

  const formulario = (creando || editando) && (
    <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {editando ? "Editar deal" : "Nuevo deal"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input placeholder="Título (ej: Trimestre entreno + nutri)" value={fTitulo} onChange={(e) => setFTitulo(e.target.value)} className={inputCls} />
        <input
          list="lista-contactos"
          placeholder="Contacto (si no existe, se crea)"
          value={fClienteNombre}
          onChange={(e) => setFClienteNombre(e.target.value)}
          className={inputCls}
        />
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
        <span className="ml-2 text-xs text-zinc-500">Responsable:</span>
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
        <button onClick={guardarDeal} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
          {editando ? "Guardar cambios" : "Crear deal"}
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
          <button onClick={borrarDeal} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-red-400">
            Borrar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Shell titulo="Pipeline">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Pipeline</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Arrastra las tarjetas para mover de fase. Al ganar, el contacto pasa a cliente y te
              lleva a apuntar su primera factura.
            </p>
          </div>
          <button onClick={abrirCrear} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
            + Nuevo Deal
          </button>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}
        {aviso && <p className="mb-4 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300">{aviso}</p>}
        {formulario}

        <div className="flex snap-x items-start gap-4 overflow-x-auto pb-4">
          {ETAPAS_TABLERO.map((col, iCol) => {
            const lista = deals.filter((d) => d.etapa === col.id);
            const totalCol = lista.reduce((s, d) => s + Number(d.importe_estimado || 0), 0);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastrando !== null) mover(arrastrando, col.id);
                  setArrastrando(null);
                }}
                className="w-[85vw] max-w-xs shrink-0 snap-start rounded-2xl border border-zinc-800 bg-zinc-900/40 md:w-80"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">{col.titulo}</h2>
                  <div className="flex items-center gap-2">
                    {totalCol > 0 && <span className="text-xs font-bold text-zinc-500">{eur(totalCol)}</span>}
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">
                      {lista.length}
                    </span>
                  </div>
                </div>
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
                        <p className="text-sm font-semibold text-white">
                          {d.clientes?.nombre ?? d.titulo}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            d.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"
                          }`}
                        >
                          {d.canal === "online" ? "Online" : "Presencial"}
                        </span>
                      </div>
                      {d.clientes?.nombre && <p className="mt-0.5 truncate text-xs text-zinc-500">{d.titulo}</p>}
                      <p className="mt-1.5 text-lg font-black text-red-500">
                        {eur(Number(d.importe_estimado || 0))}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {NOMBRES[d.responsable]} · hace {dias(d.fecha_alta)}d
                        {d.origen ? ` · ${d.origen}` : ""}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={iCol === 0}
                          onClick={() => mover(d.id, ETAPAS_TABLERO[iCol - 1].id)}
                          className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400 disabled:opacity-20"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => mover(d.id, "perdido")}
                          className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-500"
                        >
                          Perdido
                        </button>
                        <button
                          onClick={() => mover(d.id, "ganado")}
                          className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white"
                        >
                          ✓ Ganado
                        </button>
                        <button
                          disabled={iCol === ETAPAS_TABLERO.length - 1}
                          onClick={() => mover(d.id, ETAPAS_TABLERO[iCol + 1].id)}
                          className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400 disabled:opacity-20"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                  {lista.length === 0 && (
                    <p className="py-4 text-center text-xs text-zinc-700">Suelta deals aquí</p>
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
