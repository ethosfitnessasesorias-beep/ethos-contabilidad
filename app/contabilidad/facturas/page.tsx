"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Factura {
  id: number;
  numero: string | null;
  fecha_emision: string;
  concepto: string;
  total: number;
  canal: string | null;
  clientes: { nombre: string } | null;
}

interface Cliente {
  id: number;
  nombre: string;
}
interface Categoria {
  id: number;
  nombre: string;
}
interface Persona {
  codigo: string;
  nombre: string;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

type Filtro = "todas" | "borrador" | "emitidas" | "pendientes";

export default function FacturasPage() {
  const router = useRouter();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pendientes, setPendientes] = useState<Map<number, number>>(new Map());
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [cargando, setCargando] = useState(true);

  // Catálogos para crear
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  // Nueva factura
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nClienteNombre, setNClienteNombre] = useState("");
  const [nConcepto, setNConcepto] = useState("");
  const [nBase, setNBase] = useState("");
  const [nIva, setNIva] = useState(0.21);
  const [nIrpf, setNIrpf] = useState(0);
  const [nCanal, setNCanal] = useState<"presencial" | "online">("presencial");
  const [nCategoria, setNCategoria] = useState<number | null>(null);
  const [nPersona, setNPersona] = useState("ethos");

  const cargar = useCallback(async () => {
    const [f, saldos, cli, cat, per] = await Promise.all([
      supabase
        .from("facturas")
        .select("id, numero, fecha_emision, concepto, total, canal, clientes(nombre)")
        .order("fecha_emision", { ascending: false })
        .limit(200),
      supabase.from("v_facturas_saldo").select("id, pendiente").gt("pendiente", 0.01),
      supabase.from("clientes").select("id, nombre").is("fecha_baja", null).order("nombre"),
      supabase.from("categorias").select("id, nombre").eq("tipo", "ingreso").eq("activa", true).order("nombre"),
      supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
    ]);
    setFacturas((f.data as unknown as Factura[]) ?? []);
    const m = new Map<number, number>();
    for (const s of saldos.data ?? []) m.set(s.id as number, Number(s.pendiente));
    setPendientes(m);
    setClientes((cli.data as Cliente[]) ?? []);
    setCategorias((cat.data as Categoria[]) ?? []);
    setPersonas((per.data as Persona[]) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crearFactura() {
    const base = Number(nBase.replace(",", "."));
    if (!nConcepto.trim()) return setError("Escribe el concepto.");
    if (!Number.isFinite(base) || base <= 0) return setError("Pon una base válida.");
    const categoriaId = nCategoria ?? categorias.find((c) => c.nombre === "Otros")?.id ?? categorias[0]?.id;
    if (!categoriaId) return setError("No hay categorías de ingreso.");
    const cliente = clientes.find((c) => c.nombre.toLowerCase() === nClienteNombre.trim().toLowerCase());
    const { data, error } = await supabase
      .from("facturas")
      .insert({
        cliente_id: cliente?.id ?? null,
        categoria_id: categoriaId,
        atribucion: nPersona,
        fecha_emision: new Date().toISOString().slice(0, 10),
        concepto: nConcepto.trim(),
        base: Math.round(base * 100) / 100,
        iva_pct: nIva,
        irpf_pct: nIrpf,
        canal: nCanal,
      })
      .select("id")
      .single();
    if (error || !data) return setError(error?.message ?? "No se pudo crear");
    router.push(`/facturas/${data.id}`);
  }

  const visibles = useMemo(() => {
    return facturas.filter((f) => {
      if (filtro === "borrador") return !f.numero;
      if (filtro === "emitidas") return !!f.numero;
      if (filtro === "pendientes") return pendientes.has(f.id);
      return true;
    });
  }, [facturas, filtro, pendientes]);

  const chip = (v: Filtro, etiqueta: string) => (
    <button
      onClick={() => setFiltro(v)}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        filtro === v ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chip("todas", "Todas")}
        {chip("borrador", "Borradores")}
        {chip("emitidas", "Emitidas")}
        {chip("pendientes", "Pendientes de cobro")}
        <button
          onClick={() => {
            setCreando(!creando);
            setError(null);
          }}
          className="ml-auto rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white"
        >
          {creando ? "Cancelar" : "+ Nueva factura"}
        </button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {creando && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nueva factura (borrador)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input list="fact-clientes" placeholder="Cliente (opcional)" value={nClienteNombre} onChange={(e) => setNClienteNombre(e.target.value)} className={inputCls} />
            <datalist id="fact-clientes">
              {clientes.map((c) => (
                <option key={c.id} value={c.nombre} />
              ))}
            </datalist>
            <input placeholder="Concepto" value={nConcepto} onChange={(e) => setNConcepto(e.target.value)} className={inputCls} />
            <input placeholder="Base sin impuestos €" inputMode="decimal" value={nBase} onChange={(e) => setNBase(e.target.value)} className={inputCls} />
            <select value={nCategoria ?? ""} onChange={(e) => setNCategoria(Number(e.target.value) || null)} className={inputCls}>
              <option value="">Categoría…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>IVA:</span>
            {[0.21, 0.1, 0].map((v) => (
              <button key={v} onClick={() => setNIva(v)} className={`rounded-full px-2.5 py-1 font-bold ${nIva === v ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{Math.round(v * 100)}%</button>
            ))}
            <span className="ml-2">IRPF:</span>
            {[0, 0.07, 0.15].map((v) => (
              <button key={v} onClick={() => setNIrpf(v)} className={`rounded-full px-2.5 py-1 font-bold ${nIrpf === v ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{Math.round(v * 100)}%</button>
            ))}
            <span className="ml-2">Negocio:</span>
            {(["presencial", "online"] as const).map((c) => (
              <button key={c} onClick={() => setNCanal(c)} className={`rounded-full px-2.5 py-1 font-bold capitalize ${nCanal === c ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{c}</button>
            ))}
            <span className="ml-2">De:</span>
            {personas.map((p) => (
              <button key={p.codigo} onClick={() => setNPersona(p.codigo)} className={`rounded-full px-2.5 py-1 font-bold ${nPersona === p.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{p.nombre}</button>
            ))}
          </div>
          <button onClick={crearFactura} className="mt-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">
            Crear y abrir factura
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {cargando ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin facturas.</p>
        ) : (
          visibles.map((f) => {
            const pendiente = pendientes.get(f.id);
            return (
              <button
                key={f.id}
                onClick={() => router.push(`/facturas/${f.id}`)}
                className="flex w-full items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 text-left last:border-0 hover:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {f.clientes?.nombre ?? f.concepto}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {f.numero ? (
                      <span className="text-sky-400">{f.numero}</span>
                    ) : (
                      <span className="text-zinc-600">borrador</span>
                    )}
                    {" · "}
                    {new Date(f.fecha_emision).toLocaleDateString("es-ES")}
                    {f.canal ? ` · ${f.canal}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-white">{eur(Number(f.total))}</p>
                  {pendiente ? (
                    <p className="text-xs font-bold text-amber-400">debe {eur(pendiente)}</p>
                  ) : (
                    <p className="text-xs text-emerald-500">cobrada</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
