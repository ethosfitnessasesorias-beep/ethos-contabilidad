"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Barra } from "../barra";
import { NavInferior } from "../nav";
import { ATRIBUCIONES, type Atribucion, type Cliente } from "@/lib/tipos";

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function Clientes() {
  const sesionOk = useSesion();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [deudas, setDeudas] = useState<Map<number, number>>(new Map());
  const [busqueda, setBusqueda] = useState("");
  const [verBajas, setVerBajas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alta de cliente nuevo
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [entrenador, setEntrenador] = useState<Atribucion>("ethos");
  const [telefono, setTelefono] = useState("");

  async function cargar() {
    const [cli, saldos] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre"),
      supabase.from("v_facturas_saldo").select("cliente_id, pendiente").gt("pendiente", 0.01),
    ]);
    if (cli.error) return setError(cli.error.message);
    setClientes((cli.data as Cliente[]) ?? []);
    const m = new Map<number, number>();
    for (const s of saldos.data ?? []) {
      if (s.cliente_id) m.set(s.cliente_id, (m.get(s.cliente_id) ?? 0) + Number(s.pendiente));
    }
    setDeudas(m);
  }

  useEffect(() => {
    if (sesionOk) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionOk]);

  async function crearCliente() {
    if (!nombre.trim()) return;
    const { error } = await supabase.from("clientes").insert({
      nombre: nombre.trim(),
      entrenador,
      telefono: telefono.trim() || null,
    });
    if (error) return setError(`No se pudo crear: ${error.message}`);
    setNombre("");
    setTelefono("");
    setCreando(false);
    cargar();
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return clientes
      .filter((c) => (verBajas ? true : !c.fecha_baja))
      .filter((c) => !q || c.nombre.toLowerCase().includes(q));
  }, [clientes, busqueda, verBajas]);

  if (sesionOk === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-zinc-950 px-4 pb-24 pt-4">
      <Barra titulo="· Clientes" />

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mb-3 flex gap-2">
        <input
          placeholder="Buscar…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-base text-white placeholder-zinc-600 outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => setCreando(!creando)}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 text-2xl font-black text-white"
        >
          +
        </button>
      </div>

      {creando && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Nuevo cliente
          </p>
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500"
          />
          <input
            placeholder="Teléfono (para avisos WhatsApp)"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500"
          />
          <div className="flex flex-wrap gap-2">
            {ATRIBUCIONES.map((a) => (
              <button
                key={a.valor}
                onClick={() => setEntrenador(a.valor)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  entrenador === a.valor ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
          <button
            onClick={crearCliente}
            className="mt-1 rounded-xl bg-emerald-600 py-2.5 font-bold text-white"
          >
            Crear cliente
          </button>
        </div>
      )}

      <label className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
        <input
          type="checkbox"
          checked={verBajas}
          onChange={(e) => setVerBajas(e.target.checked)}
          className="accent-emerald-600"
        />
        Mostrar también los de baja
      </label>

      <div className="overflow-hidden rounded-2xl bg-zinc-900">
        {visibles.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">Sin resultados.</p>
        )}
        {visibles.map((c) => {
          const deuda = deudas.get(c.id) ?? 0;
          return (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0 active:bg-zinc-800"
            >
              <div className="min-w-0">
                <p className={`truncate font-semibold ${c.fecha_baja ? "text-zinc-500 line-through" : "text-white"}`}>
                  {c.nombre}
                </p>
                <p className="text-xs text-zinc-500">
                  {ATRIBUCIONES.find((a) => a.valor === c.entrenador)?.etiqueta}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                </p>
              </div>
              {deuda > 0 && (
                <span className="shrink-0 rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-400">
                  debe {eur(deuda)}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <NavInferior />
    </main>
  );
}
