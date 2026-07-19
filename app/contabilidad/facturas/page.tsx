"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";
import Modal from "@/components/Modal";

interface Factura {
  id: number;
  numero: string | null;
  fecha_emision: string;
  concepto: string;
  total: number;
  canal: string | null;
  atribucion: string | null;
  clientes: { nombre: string } | null;
}

// Edición completa de una factura
interface EdFactura {
  id: number;
  numero: string | null;
  concepto: string;
  clienteNombre: string;
  fecha_emision: string;
  base: string;
  iva_pct: string;
  irpf_pct: string;
  categoria_id: number | "";
  canal: string;
  atribucion: string;
  es_recurrente: boolean;
  computa_impuestos: boolean;
  computa_reparto: boolean;
  notas: string;
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
interface Saldo {
  pendiente: number;
  fecha_ultimo_cobro: string | null;
}

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

type Filtro = "todas" | "borrador" | "emitidas" | "pendientes" | "cobradas";

function fechaCorta(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("es-ES") : "—";
}

export default function FacturasPage() {
  const router = useRouter();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [saldos, setSaldos] = useState<Map<number, Saldo>>(new Map());
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fPersona, setFPersona] = useState("todas");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ed, setEd] = useState<EdFactura | null>(null);

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
    // fecha_ultimo_cobro requiere la migración mejoras_kanban_canal.sql;
    // si aún no está, se recae en la consulta antigua.
    let s = await supabase.from("v_facturas_saldo").select("id, pendiente, fecha_ultimo_cobro");
    if (s.error) s = await supabase.from("v_facturas_saldo").select("id, pendiente");
    const [f, cli, cat, per] = await Promise.all([
      supabase
        .from("facturas")
        .select("id, numero, fecha_emision, concepto, total, canal, atribucion, clientes(nombre)")
        .order("fecha_emision", { ascending: false })
        .limit(500),
      supabase.from("clientes").select("id, nombre").is("fecha_baja", null).order("nombre"),
      supabase.from("categorias").select("id, nombre").eq("tipo", "ingreso").eq("activa", true).order("nombre"),
      supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
    ]);
    setFacturas((f.data as unknown as Factura[]) ?? []);
    const m = new Map<number, Saldo>();
    for (const row of s.data ?? [])
      m.set(row.id as number, {
        pendiente: Number(row.pendiente),
        fecha_ultimo_cobro: (row as Partial<Saldo>).fecha_ultimo_cobro ?? null,
      });
    setSaldos(m);
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

  // ---------- Edición completa ----------
  async function abrirEditar(id: number) {
    setError(null);
    const { data, error } = await supabase
      .from("facturas")
      .select("id, numero, concepto, fecha_emision, base, iva_pct, irpf_pct, categoria_id, canal, atribucion, es_recurrente, computa_impuestos, computa_reparto, notas, clientes(nombre)")
      .eq("id", id)
      .single();
    if (error || !data) return setError(error?.message ?? "No encontrada");
    const f = data as unknown as { id: number; numero: string | null; concepto: string; fecha_emision: string; base: number; iva_pct: number; irpf_pct: number; categoria_id: number; canal: string | null; atribucion: string; es_recurrente: boolean | null; computa_impuestos: boolean | null; computa_reparto: boolean | null; notas: string | null; clientes: { nombre: string } | null };
    setEd({
      id: f.id, numero: f.numero, concepto: f.concepto,
      clienteNombre: f.clientes?.nombre ?? "",
      fecha_emision: f.fecha_emision,
      base: String(f.base), iva_pct: String(f.iva_pct), irpf_pct: String(f.irpf_pct),
      categoria_id: f.categoria_id, canal: f.canal ?? "", atribucion: f.atribucion,
      es_recurrente: f.es_recurrente ?? false,
      computa_impuestos: f.computa_impuestos ?? true,
      computa_reparto: f.computa_reparto ?? true,
      notas: f.notas ?? "",
    });
  }

  async function guardarEditar() {
    if (!ed) return;
    const base = Number(ed.base.replace(",", "."));
    if (!Number.isFinite(base) || base < 0) return setError("Base no válida.");
    const cliente = clientes.find((c) => c.nombre.toLowerCase() === ed.clienteNombre.trim().toLowerCase());
    const { error } = await supabase
      .from("facturas")
      .update({
        concepto: ed.concepto.trim(),
        cliente_id: cliente?.id ?? (ed.clienteNombre.trim() === "" ? null : undefined),
        fecha_emision: ed.fecha_emision,
        base: Math.round(base * 100) / 100,
        iva_pct: Number(ed.iva_pct),
        irpf_pct: Number(ed.irpf_pct),
        ...(ed.categoria_id ? { categoria_id: ed.categoria_id } : {}),
        canal: ed.canal || null,
        atribucion: ed.atribucion,
        es_recurrente: ed.es_recurrente,
        computa_impuestos: ed.computa_impuestos,
        computa_reparto: ed.computa_reparto,
        notas: ed.notas.trim() || null,
      })
      .eq("id", ed.id);
    if (error) return setError(error.message);
    setEd(null);
    cargar();
  }

  async function borrarFactura() {
    if (!ed) return;
    if (!confirm(`¿Borrar esta factura${ed.numero ? ` (${ed.numero})` : ""} de forma permanente?`)) return;
    const { error } = await supabase.from("facturas").delete().eq("id", ed.id);
    if (error) {
      setError(/foreign key|violates|referenced/i.test(error.message)
        ? "No se puede borrar: tiene cobros apuntados. Borra antes sus cobros desde el Libro."
        : error.message);
      return;
    }
    setEd(null);
    cargar();
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const min = fMin.trim() === "" ? null : Number(fMin.replace(",", "."));
    const max = fMax.trim() === "" ? null : Number(fMax.replace(",", "."));
    return facturas.filter((f) => {
      const saldo = saldos.get(f.id);
      const debe = (saldo?.pendiente ?? 0) > 0.01;
      if (filtro === "borrador" && f.numero) return false;
      if (filtro === "emitidas" && !f.numero) return false;
      if (filtro === "pendientes" && !debe) return false;
      if (filtro === "cobradas" && (debe || !f.numero)) return false;
      if (fDesde && f.fecha_emision < fDesde) return false;
      if (fHasta && f.fecha_emision > fHasta) return false;
      if (fPersona !== "todas" && f.atribucion !== fPersona) return false;
      const t = Number(f.total);
      if (min !== null && Number.isFinite(min) && t < min) return false;
      if (max !== null && Number.isFinite(max) && t > max) return false;
      if (q) {
        const texto = `${f.numero ?? ""} ${f.clientes?.nombre ?? ""} ${f.concepto}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [facturas, filtro, saldos, busqueda, fDesde, fHasta, fPersona, fMin, fMax]);

  function estadoDe(f: Factura): { etiqueta: string; clase: string } {
    const saldo = saldos.get(f.id);
    if (!f.numero) return { etiqueta: "Borrador", clase: "bg-zinc-800 text-zinc-400" };
    if ((saldo?.pendiente ?? 0) > 0.01)
      return { etiqueta: `Debe ${eur(saldo!.pendiente)}`, clase: "bg-amber-950 text-amber-400" };
    return { etiqueta: "Cobrada", clase: "bg-emerald-950 text-emerald-400" };
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          placeholder="Buscar por nº, cliente o concepto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputCls} min-w-52 flex-1`}
        />
        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-600">
          desde <input type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} className={inputCls} />
        </label>
        <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-600">
          hasta <input type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} className={inputCls} />
        </label>
        {(fDesde || fHasta) && (
          <button onClick={() => { setFDesde(""); setFHasta(""); }} className="rounded-lg bg-zinc-800 px-2.5 py-2 text-xs font-bold text-zinc-400">
            ✕ fechas
          </button>
        )}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} className={`${inputCls} appearance-none`}>
          <option value="todas">Estado: todas</option>
          <option value="borrador">Borradores</option>
          <option value="emitidas">Emitidas</option>
          <option value="pendientes">Pendientes de cobro</option>
          <option value="cobradas">Cobradas</option>
        </select>
        <select value={fPersona} onChange={(e) => setFPersona(e.target.value)} className={`${inputCls} appearance-none`}>
          <option value="todas">De: todos</option>
          {personas.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
        </select>
        <input placeholder="Mín €" inputMode="decimal" value={fMin} onChange={(e) => setFMin(e.target.value)} className={`${inputCls} w-20`} />
        <input placeholder="Máx €" inputMode="decimal" value={fMax} onChange={(e) => setFMax(e.target.value)} className={`${inputCls} w-20`} />
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
        <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_1fr_1.2fr] gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5 md:grid">
          {["Nº / Serie", "Cliente", "F. emisión", "F. cobro", "Importe", "Estado"].map((h) => (
            <span key={h} className="text-[11px] font-black uppercase tracking-wider text-zinc-500 last:text-right">
              {h}
            </span>
          ))}
        </div>
        {cargando ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin facturas con esos filtros.</p>
        ) : (
          visibles.map((f) => {
            const saldo = saldos.get(f.id);
            const estado = estadoDe(f);
            return (
              <div
                key={f.id}
                onClick={() => router.push(`/facturas/${f.id}`)}
                className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-2 border-b border-zinc-800 px-4 py-3 text-left last:border-0 hover:bg-zinc-900 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_1.2fr]"
              >
                <span className="hidden items-center gap-2 text-sm font-semibold text-sky-400 md:flex">
                  <button
                    onClick={(e) => { e.stopPropagation(); abrirEditar(f.id); }}
                    aria-label="Editar"
                    title="Editar factura"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    ✎
                  </button>
                  {f.numero ?? <span className="text-zinc-600">borrador</span>}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">
                    {f.clientes?.nombre ?? f.concepto}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 md:hidden">
                    {f.numero ?? "borrador"} · {fechaCorta(f.fecha_emision)}
                    {f.canal ? ` · ${f.canal}` : ""}
                  </span>
                  <span className="hidden truncate text-xs text-zinc-600 md:block">{f.concepto}</span>
                </span>
                <span className="hidden text-sm text-zinc-400 md:block">{fechaCorta(f.fecha_emision)}</span>
                <span className="hidden text-sm text-zinc-400 md:block">
                  {saldo?.fecha_ultimo_cobro ? fechaCorta(saldo.fecha_ultimo_cobro) : "—"}
                </span>
                <span className="hidden text-sm font-bold text-white md:block">{eur(Number(f.total))}</span>
                <span className="text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
                    {estado.etiqueta}
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-white md:hidden">{eur(Number(f.total))}</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de edición completa */}
      <Modal abierto={!!ed} onCerrar={() => setEd(null)} titulo={ed ? (ed.numero ? `Editar ${ed.numero}` : "Editar borrador") : ""} ancho="max-w-2xl">
        {ed && (
          <div className="flex flex-col gap-3">
            {ed.numero && (
              <p className="rounded-lg bg-amber-950/60 px-3 py-1.5 text-[11px] text-amber-300">
                Esta factura ya está emitida con número: cambiar importes puede descuadrarla con la que enviaste al cliente.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Concepto</span>
                <input value={ed.concepto} onChange={(e) => setEd({ ...ed, concepto: e.target.value })} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Cliente</span>
                <input list="fact-clientes" value={ed.clienteNombre} onChange={(e) => setEd({ ...ed, clienteNombre: e.target.value })} placeholder="Sin cliente" className={inputCls} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">F. emisión</span>
                <input type="date" value={ed.fecha_emision} onChange={(e) => setEd({ ...ed, fecha_emision: e.target.value })} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Base €</span>
                <input inputMode="decimal" value={ed.base} onChange={(e) => setEd({ ...ed, base: e.target.value })} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">IVA</span>
                <select value={ed.iva_pct} onChange={(e) => setEd({ ...ed, iva_pct: e.target.value })} className={`${inputCls} appearance-none`}>
                  <option value="0">0%</option><option value="0.1">10%</option><option value="0.21">21%</option>
                </select>
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">IRPF</span>
                <select value={ed.irpf_pct} onChange={(e) => setEd({ ...ed, irpf_pct: e.target.value })} className={`${inputCls} appearance-none`}>
                  <option value="0">0%</option><option value="0.07">7%</option><option value="0.15">15%</option>
                </select>
              </label>
            </div>
            <p className="-mt-1 text-[11px] text-zinc-600">
              Total: <b className="text-zinc-300">{eur((Number(ed.base.replace(",", ".")) || 0) * (1 + Number(ed.iva_pct)) - (Number(ed.base.replace(",", ".")) || 0) * Number(ed.irpf_pct))}</b>
              <span className="ml-2">(base {eur(Number(ed.base.replace(",", ".")) || 0)} + IVA − retención IRPF)</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Emisor / de quién</span>
                <select value={ed.atribucion} onChange={(e) => setEd({ ...ed, atribucion: e.target.value })} className={`${inputCls} appearance-none`}>
                  {personas.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Categoría</span>
                <select value={ed.categoria_id} onChange={(e) => setEd({ ...ed, categoria_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Negocio</span>
                <select value={ed.canal} onChange={(e) => setEd({ ...ed, canal: e.target.value })} className={`${inputCls} appearance-none`}>
                  <option value="">—</option><option value="online">Online</option><option value="presencial">GYM</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={ed.es_recurrente} onChange={(e) => setEd({ ...ed, es_recurrente: e.target.checked })} className="h-4 w-4 accent-red-600" />
                Recurrente (suscripción)
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={ed.computa_impuestos} onChange={(e) => setEd({ ...ed, computa_impuestos: e.target.checked })} className="h-4 w-4 accent-red-600" />
                Computa impuestos
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={ed.computa_reparto} onChange={(e) => setEd({ ...ed, computa_reparto: e.target.checked })} className="h-4 w-4 accent-red-600" />
                Cuenta para el reparto
              </label>
            </div>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Notas</span>
              <textarea rows={2} value={ed.notas} onChange={(e) => setEd({ ...ed, notas: e.target.value })} className={inputCls} />
            </label>
            <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
              <button onClick={guardarEditar} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Guardar</button>
              <button onClick={() => router.push(`/facturas/${ed.id}`)} className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200">Ver factura</button>
              <button onClick={borrarFactura} title="Borrar permanentemente" className="rounded-xl border border-red-900 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-950">Borrar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
