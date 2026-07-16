"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ATRIBUCIONES, type Atribucion, type Cliente } from "@/lib/tipos";
import { eur } from "@/lib/formato";

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function ClientesConta() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [deudas, setDeudas] = useState<Map<number, number>>(new Map());
  const [pagados, setPagados] = useState<Map<number, number>>(new Map());
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [entrenador, setEntrenador] = useState<Atribucion>("ethos");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [nif, setNif] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const [cli, saldos] = await Promise.all([
      supabase.from("clientes").select("*").is("fecha_baja", null).order("nombre"),
      supabase.from("v_facturas_saldo").select("cliente_id, cobrado, pendiente"),
    ]);
    setClientes((cli.data as Cliente[]) ?? []);
    const deuda = new Map<number, number>();
    const pagado = new Map<number, number>();
    for (const s of saldos.data ?? []) {
      if (!s.cliente_id) continue;
      if (Number(s.pendiente) > 0.01)
        deuda.set(s.cliente_id, (deuda.get(s.cliente_id) ?? 0) + Number(s.pendiente));
      pagado.set(s.cliente_id, (pagado.get(s.cliente_id) ?? 0) + Number(s.cobrado));
    }
    setDeudas(deuda);
    setPagados(pagado);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!nombre.trim()) return;
    const { error } = await supabase.from("clientes").insert({
      nombre: nombre.trim(),
      entrenador,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      nif: nif.trim() || null,
    });
    if (error) return setError(error.message);
    setError(null);
    setNombre("");
    setTelefono("");
    setEmail("");
    setNif("");
    setCreando(false);
    cargar();
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.telefono, c.email, c.nif]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clientes, busqueda]);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          placeholder="Buscar por nombre, teléfono, email o NIF…"
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

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {creando && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              placeholder="Teléfono"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={inputCls}
            />
            <input
              placeholder="Email (opcional)"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
            <input
              placeholder="NIF/DNI (opcional)"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              className={inputCls}
            />
          </div>
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
        <div className="hidden grid-cols-[2fr_1.3fr_1.5fr_1fr_1fr_1fr] gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5 md:grid">
          {["Nombre", "NIF/DNI", "Email", "Teléfono", "Pagado", "Pendiente"].map((h, i) => (
            <span key={i} className={`text-[11px] font-black uppercase tracking-wider text-zinc-500 ${i >= 4 ? "text-right" : ""}`}>
              {h}
            </span>
          ))}
        </div>
        {visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin resultados.</p>
        ) : (
          visibles.map((c) => {
            const deuda = deudas.get(c.id) ?? 0;
            const pagado = pagados.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="grid grid-cols-1 gap-1 border-b border-zinc-800 px-4 py-3 last:border-0 hover:bg-zinc-900 md:grid-cols-[2fr_1.3fr_1.5fr_1fr_1fr_1fr] md:items-center md:gap-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{c.nombre}</p>
                  <p className="text-xs text-zinc-500 md:hidden">
                    {[c.nif, c.email, c.telefono].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {ATRIBUCIONES.find((a) => a.valor === c.entrenador)?.etiqueta ?? c.entrenador}
                    <span className="md:hidden">
                      {" · "}pagado {eur(pagado)}
                      {deuda > 0 ? ` · debe ${eur(deuda)}` : ""}
                    </span>
                  </p>
                </div>
                <span className="hidden truncate text-sm text-zinc-400 md:block">{c.nif || "—"}</span>
                <span className="hidden truncate text-sm text-zinc-400 md:block">{c.email || "—"}</span>
                <span className="hidden truncate text-sm text-zinc-400 md:block">{c.telefono || "—"}</span>
                <span className="hidden text-right text-sm font-semibold text-emerald-400 md:block">
                  {pagado > 0 ? eur(pagado) : "—"}
                </span>
                <span className="hidden text-right md:block">
                  {deuda > 0 ? (
                    <span className="inline-block rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-400">
                      {eur(deuda)}
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-600">—</span>
                  )}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
