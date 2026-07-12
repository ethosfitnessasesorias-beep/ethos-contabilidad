"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ATRIBUCIONES, type Atribucion, type Cliente } from "@/lib/tipos";

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function ClientesConta() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [deudas, setDeudas] = useState<Map<number, number>>(new Map());
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [entrenador, setEntrenador] = useState<Atribucion>("ethos");
  const [telefono, setTelefono] = useState("");

  async function cargar() {
    const [cli, saldos] = await Promise.all([
      supabase.from("clientes").select("*").is("fecha_baja", null).order("nombre"),
      supabase.from("v_facturas_saldo").select("cliente_id, pendiente").gt("pendiente", 0.01),
    ]);
    setClientes((cli.data as Cliente[]) ?? []);
    const m = new Map<number, number>();
    for (const s of saldos.data ?? [])
      if (s.cliente_id) m.set(s.cliente_id, (m.get(s.cliente_id) ?? 0) + Number(s.pendiente));
    setDeudas(m);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!nombre.trim()) return;
    await supabase.from("clientes").insert({ nombre: nombre.trim(), entrenador, telefono: telefono.trim() || null });
    setNombre("");
    setTelefono("");
    setCreando(false);
    cargar();
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return clientes.filter((c) => !q || c.nombre.toLowerCase().includes(q));
  }, [clientes, busqueda]);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          placeholder="Buscar cliente…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-red-500"
        />
        <button
          onClick={() => setCreando(!creando)}
          className="shrink-0 rounded-xl bg-red-600 px-4 text-2xl font-black text-white"
        >
          +
        </button>
      </div>

      {creando && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
          />
          <input
            placeholder="Teléfono"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
          />
          <div className="flex flex-wrap gap-2">
            {ATRIBUCIONES.map((a) => (
              <button
                key={a.valor}
                onClick={() => setEntrenador(a.valor)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  entrenador === a.valor ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
          <button onClick={crear} className="rounded-xl bg-red-600 py-2.5 font-bold text-white">
            Crear cliente
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin resultados.</p>
        ) : (
          visibles.map((c) => {
            const deuda = deudas.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0 hover:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{c.nombre}</p>
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
          })
        )}
      </div>
    </div>
  );
}
