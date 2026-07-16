"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Persona {
  codigo: string;
  nombre: string;
  tipo: "socio" | "colaborador" | "empleado" | "casa";
  pct: number;
  reparto_base: "balance" | "bruto_sin_iva" | "ninguno";
  activa: boolean;
  orden: number;
}
interface Categoria {
  id: number;
  tipo: "gasto" | "ingreso";
  grupo: string;
  nombre: string;
  es_fijo: boolean;
  es_inversion: boolean;
  es_online: boolean;
  activa: boolean;
}
interface Metodo {
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
}
interface Impuesto {
  id: number;
  nombre: string;
  clase: "iva" | "irpf";
  pct: number;
  aplica_ingreso: boolean;
  aplica_gasto: boolean;
  activo: boolean;
}

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const TIPOS_PERSONA = [
  { valor: "socio", etiqueta: "Socio (80/20 s/ balance)", base: "balance" },
  { valor: "colaborador", etiqueta: "Colaborador (70/30 s/ bruto)", base: "bruto_sin_iva" },
  { valor: "empleado", etiqueta: "Empleado (por nómina, 0%)", base: "ninguno" },
  { valor: "casa", etiqueta: "Casa / Ethos", base: "ninguno" },
] as const;

const slug = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function Ajustes() {
  const [seccion, setSeccion] = useState<"personas" | "categorias" | "metodos" | "impuestos">("personas");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metodos, setMetodos] = useState<Metodo[]>([]);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [p, c, m, i] = await Promise.all([
      supabase.from("personas").select("*").order("orden"),
      supabase.from("categorias").select("*").order("tipo").order("grupo").order("nombre"),
      supabase.from("metodos_pago").select("*").order("orden"),
      supabase.from("impuestos").select("*").order("orden"),
    ]);
    if (p.error) return setError(p.error.message);
    setPersonas((p.data as Persona[]) ?? []);
    setCategorias((c.data as Categoria[]) ?? []);
    setMetodos((m.data as Metodo[]) ?? []);
    setImpuestos((i.data as Impuesto[]) ?? []);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function avisar(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 2000);
  }

  // ---------- Personas ----------
  const [pNombre, setPNombre] = useState("");
  const [pTipo, setPTipo] = useState<Persona["tipo"]>("colaborador");
  const [pPct, setPPct] = useState("70");

  async function crearPersona() {
    if (!pNombre.trim()) return setError("Pon un nombre.");
    const base = TIPOS_PERSONA.find((t) => t.valor === pTipo)!.base;
    const codigo = slug(pNombre) || `persona_${Date.now()}`;
    const { error } = await supabase.from("personas").insert({
      codigo,
      nombre: pNombre.trim(),
      tipo: pTipo,
      pct: pTipo === "empleado" || pTipo === "casa" ? 0 : Number(pPct) / 100,
      reparto_base: base,
      orden: personas.length + 1,
    });
    if (error) return setError(error.message);
    setPNombre("");
    avisar("Persona creada ✓");
    cargar();
  }

  async function actualizarPersona(codigo: string, campos: Partial<Persona>) {
    const { error } = await supabase.from("personas").update(campos).eq("codigo", codigo);
    if (error) return setError(error.message);
    cargar();
  }

  // ---------- Categorías ----------
  const [cNombre, setCNombre] = useState("");
  const [cGrupo, setCGrupo] = useState("Operativo");
  const [cTipo, setCTipo] = useState<"gasto" | "ingreso">("gasto");
  const [cFijo, setCFijo] = useState(false);
  const [cInversion, setCInversion] = useState(false);
  const [cOnline, setCOnline] = useState(false);

  async function crearCategoria() {
    if (!cNombre.trim() || !cGrupo.trim()) return setError("Pon grupo y nombre.");
    const { error } = await supabase.from("categorias").insert({
      tipo: cTipo,
      grupo: cGrupo.trim(),
      nombre: cNombre.trim(),
      es_fijo: cFijo,
      es_inversion: cInversion,
      es_online: cOnline,
    });
    if (error) return setError(error.message);
    setCNombre("");
    avisar("Categoría creada ✓");
    cargar();
  }

  async function toggleCategoria(id: number, activa: boolean) {
    const { error } = await supabase.from("categorias").update({ activa }).eq("id", id);
    if (error) return setError(error.message);
    cargar();
  }

  // ---------- Métodos ----------
  const [mNombre, setMNombre] = useState("");
  async function crearMetodo() {
    if (!mNombre.trim()) return;
    const { error } = await supabase.from("metodos_pago").insert({
      codigo: slug(mNombre) || `m_${Date.now()}`,
      nombre: mNombre.trim(),
      orden: metodos.length + 1,
    });
    if (error) return setError(error.message);
    setMNombre("");
    avisar("Método creado ✓");
    cargar();
  }
  async function toggleMetodo(codigo: string, activo: boolean) {
    await supabase.from("metodos_pago").update({ activo }).eq("codigo", codigo);
    cargar();
  }

  // ---------- Impuestos ----------
  const [iNombre, setINombre] = useState("");
  const [iClase, setIClase] = useState<"iva" | "irpf">("iva");
  const [iPct, setIPct] = useState("21");
  async function crearImpuesto() {
    if (!iNombre.trim()) return setError("Pon un nombre.");
    const { error } = await supabase.from("impuestos").insert({
      nombre: iNombre.trim(),
      clase: iClase,
      pct: Number(iPct.replace(",", ".")) / 100,
      orden: impuestos.length + 1,
    });
    if (error) return setError(error.message);
    setINombre("");
    avisar("Impuesto creado ✓");
    cargar();
  }
  async function actualizarImpuesto(id: number, campos: Partial<Impuesto>) {
    await supabase.from("impuestos").update(campos).eq("id", id);
    cargar();
  }

  const gruposGasto = [...new Set(categorias.filter((c) => c.tipo === "gasto").map((c) => c.grupo))];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["personas", "Personas y reparto"],
            ["categorias", "Categorías"],
            ["metodos", "Métodos de pago"],
            ["impuestos", "Impuestos"],
          ] as const
        ).map(([id, et]) => (
          <button
            key={id}
            onClick={() => setSeccion(id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${
              seccion === id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {et}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

      {/* ---------- PERSONAS ---------- */}
      {seccion === "personas" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Nueva persona</p>
            <div className="flex flex-wrap gap-2">
              <input placeholder="Nombre" value={pNombre} onChange={(e) => setPNombre(e.target.value)} className={inputCls} />
              <select value={pTipo} onChange={(e) => setPTipo(e.target.value as Persona["tipo"])} className={inputCls}>
                {TIPOS_PERSONA.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
              {(pTipo === "socio" || pTipo === "colaborador") && (
                <div className="flex items-center gap-1">
                  <input
                    inputMode="decimal"
                    value={pPct}
                    onChange={(e) => setPPct(e.target.value)}
                    className={`${inputCls} w-16`}
                  />
                  <span className="text-sm text-zinc-500">% para la persona</span>
                </div>
              )}
              <button onClick={crearPersona} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
                Añadir
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              El resto del % va a la hucha (socios) o a Ethos (colaboradores). Los empleados van a 0%
              (cobran por nómina, que se apunta como gasto de Personal).
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {personas.map((p) => (
              <div key={p.codigo} className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3 last:border-0">
                <span className="min-w-24 font-semibold text-white">{p.nombre}</span>
                <select
                  value={p.tipo}
                  onChange={(e) => {
                    const base = TIPOS_PERSONA.find((t) => t.valor === e.target.value)!.base;
                    actualizarPersona(p.codigo, { tipo: e.target.value as Persona["tipo"], reparto_base: base });
                  }}
                  className={inputCls}
                >
                  {TIPOS_PERSONA.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                  ))}
                </select>
                {(p.tipo === "socio" || p.tipo === "colaborador") && (
                  <div className="flex items-center gap-1">
                    <input
                      defaultValue={Math.round(Number(p.pct) * 100)}
                      onBlur={(e) => actualizarPersona(p.codigo, { pct: Number(e.target.value) / 100 })}
                      className={`${inputCls} w-16`}
                    />
                    <span className="text-xs text-zinc-500">%</span>
                  </div>
                )}
                <button
                  onClick={() => actualizarPersona(p.codigo, { activa: !p.activa })}
                  className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
                    p.activa ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {p.activa ? "Activa" : "Inactiva"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- CATEGORÍAS ---------- */}
      {seccion === "categorias" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Nueva categoría</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Tipo</span>
                <select value={cTipo} onChange={(e) => setCTipo(e.target.value as "gasto" | "ingreso")} className={inputCls}>
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Grupo (categoría)</span>
                <input list="grupos" placeholder="Ej: Operativo" value={cGrupo} onChange={(e) => setCGrupo(e.target.value)} className={inputCls} />
                <datalist id="grupos">
                  {gruposGasto.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Nombre (subcategoría)</span>
                <input placeholder="Ej: Marketing" value={cNombre} onChange={(e) => setCNombre(e.target.value)} className={inputCls} />
              </label>

              {cTipo === "gasto" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Naturaleza</span>
                  <select
                    value={cInversion ? "inversion" : cFijo ? "fijo" : "corriente"}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCFijo(v === "fijo");
                      setCInversion(v === "inversion");
                    }}
                    className={inputCls}
                  >
                    <option value="corriente">Gasto corriente</option>
                    <option value="fijo">Gasto fijo (recurrente e ineludible)</option>
                    <option value="inversion">Inversión (activo &gt;1 año)</option>
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Negocio</span>
                <select value={cOnline ? "online" : "presencial"} onChange={(e) => setCOnline(e.target.value === "online")} className={inputCls}>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                </select>
              </label>

              <div className="flex items-end">
                <button onClick={crearCategoria} className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
                  Añadir categoría
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              La naturaleza (corriente/fijo/inversión) afecta al runway y al modelo 130; el negocio
              (online/presencial) separa los ingresos y gastos en Reportes e Impuestos.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {categorias.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2.5 last:border-0">
                <div className="min-w-0">
                  <span className="text-sm text-zinc-200">
                    <span className="text-zinc-500">{c.grupo} · </span>{c.nombre}
                  </span>
                  <span className="ml-2 text-[10px] text-zinc-600">
                    {c.tipo === "ingreso" ? "ingreso" : c.es_inversion ? "inversión" : c.es_fijo ? "fijo" : "corriente"}
                    {c.es_online ? " · online" : ""}
                  </span>
                </div>
                <button
                  onClick={() => toggleCategoria(c.id, !c.activa)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    c.activa ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {c.activa ? "Activa" : "Oculta"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- MÉTODOS ---------- */}
      {seccion === "metodos" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex flex-wrap gap-2">
              <input placeholder="Nuevo método (ej: Wallapop)" value={mNombre} onChange={(e) => setMNombre(e.target.value)} className={inputCls} />
              <button onClick={crearMetodo} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
                Añadir
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              El método de pago nunca cambia el IVA — es solo informativo y para el % en efectivo.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {metodos.map((m) => (
              <div key={m.codigo} className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 last:border-0">
                <span className="text-sm text-zinc-200">{m.nombre}</span>
                <button
                  onClick={() => toggleMetodo(m.codigo, !m.activo)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    m.activo ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {m.activo ? "Activo" : "Oculto"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- IMPUESTOS ---------- */}
      {seccion === "impuestos" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Nuevo impuesto</p>
            <div className="flex flex-wrap gap-2">
              <input placeholder="Nombre (ej: IVA 10%)" value={iNombre} onChange={(e) => setINombre(e.target.value)} className={inputCls} />
              <select value={iClase} onChange={(e) => setIClase(e.target.value as "iva" | "irpf")} className={inputCls}>
                <option value="iva">IVA (se suma)</option>
                <option value="irpf">IRPF (se retiene)</option>
              </select>
              <div className="flex items-center gap-1">
                <input inputMode="decimal" value={iPct} onChange={(e) => setIPct(e.target.value)} className={`${inputCls} w-16`} />
                <span className="text-sm text-zinc-500">%</span>
              </div>
              <button onClick={crearImpuesto} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Añadir</button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              El IVA se suma al importe; el IRPF se retiene (lo debes a Hacienda). Elige en qué se
              puede usar cada uno con las etiquetas Ingreso/Gasto.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {impuestos.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-2.5 last:border-0">
                <span className="min-w-32 text-sm font-semibold text-white">{i.nombre}</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">{i.clase}</span>
                <div className="flex items-center gap-1">
                  <input
                    defaultValue={Math.round(Number(i.pct) * 10000) / 100}
                    onBlur={(e) => actualizarImpuesto(i.id, { pct: Number(e.target.value) / 100 })}
                    className={`${inputCls} w-16`}
                  />
                  <span className="text-xs text-zinc-500">%</span>
                </div>
                <button onClick={() => actualizarImpuesto(i.id, { aplica_ingreso: !i.aplica_ingreso })} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${i.aplica_ingreso ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>Ingreso</button>
                <button onClick={() => actualizarImpuesto(i.id, { aplica_gasto: !i.aplica_gasto })} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${i.aplica_gasto ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>Gasto</button>
                <button onClick={() => actualizarImpuesto(i.id, { activo: !i.activo })} className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${i.activo ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>{i.activo ? "Activo" : "Oculto"}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
