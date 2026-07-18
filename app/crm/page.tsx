"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import Modal from "@/components/Modal";
import { ATRIBUCIONES } from "@/lib/tipos";

interface Cli {
  id: number;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  nif: string | null;
  fecha_registro: string | null;
  entrenador: string;
  estado: string | null;
  canal: string | null;
  origen: string | null;
  tipo_plan: string | null;
  primer_contacto: string | null;
  fecha_compra: string | null;
  fecha_inicio: string | null;
  fecha_baja: string | null;
  objetivo: string | null;
  seg_cambio_fisico: boolean;
  seg_satisfaccion: boolean;
  seg_marcha: boolean;
  seg_google_maps: boolean;
  seg_trustpilot: boolean;
}

const NOMBRE: Record<string, string> = {
  ethos: "Ethos", luis: "Luis", david: "David", alex_esteban: "Alex E.", alex_guerrero: "Alex G.",
};
const SEG: { campo: keyof Cli; corto: string }[] = [
  { campo: "seg_cambio_fisico", corto: "Cambio físico" },
  { campo: "seg_satisfaccion", corto: "Enc. satisf." },
  { campo: "seg_marcha", corto: "Enc. marcha" },
  { campo: "seg_google_maps", corto: "Maps" },
  { campo: "seg_trustpilot", corto: "Trustpilot" },
];

const diasEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
function humano(dias: number): string {
  if (dias < 0) return "—";
  const m = Math.floor(dias / 30.44);
  const d = Math.round(dias - m * 30.44);
  if (m <= 0) return `${d} d`;
  return `${m} mes${m === 1 ? "" : "es"}${d ? ` ${d} d` : ""}`;
}
const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function CrmPage() {
  const sesionOk = useSesion();
  const [cli, setCli] = useState<Cli[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "cliente" | "lead" | "baja">("todos");
  const [filtroPrep, setFiltroPrep] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "online" | "presencial">("todos");
  const [sortKey, setSortKey] = useState<string>("inicio");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [ed, setEd] = useState<Cli | null>(null);
  const [f, setF] = useState<Partial<Cli>>({});
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [verWebhook, setVerWebhook] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from("clientes").select("*").order("fecha_inicio", { ascending: false, nullsFirst: false });
    if (error) {
      setError(error.message.includes("primer_contacto") || error.message.includes("seg_") ? "Falta la migración crm_clientes.sql." : error.message);
      return;
    }
    setCli((data as Cli[]) ?? []);
    const { data: cfg } = await supabase.from("crm_config").select("intake_token").eq("id", 1).single();
    const token = (cfg as { intake_token: string } | null)?.intake_token;
    if (token && typeof window !== "undefined") setFeedUrl(`${window.location.origin}/api/intake/${token}`);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  function abrirEditar(c: Cli) {
    setEd(c);
    setF({ ...c });
  }
  async function guardarEditar() {
    if (!ed) return;
    const campos = [
      "nombre", "apellidos", "email", "telefono", "nif", "entrenador", "canal", "tipo_plan", "objetivo",
      "fecha_registro", "primer_contacto", "fecha_compra", "fecha_inicio", "fecha_baja",
    ] as const;
    const datos: Record<string, unknown> = {};
    const src = f as Record<string, unknown>;
    for (const k of campos) { const v = src[k]; datos[k] = v === "" ? null : v ?? null; }
    datos.estado = f.fecha_baja ? "baja" : (ed.estado === "lead" && !f.fecha_compra ? "lead" : "cliente");
    const { error } = await supabase.from("clientes").update(datos).eq("id", ed.id);
    if (error) return setError(error.message);
    setEd(null);
    cargar();
  }

  async function setCanal(c: Cli, canal: string | null) {
    setCli((prev) => prev.map((x) => (x.id === c.id ? { ...x, canal } : x)));
    const { error } = await supabase.from("clientes").update({ canal }).eq("id", c.id);
    if (error) { setError(error.message); cargar(); }
  }

  async function toggleSeg(c: Cli, campo: keyof Cli) {
    const nuevo = !c[campo];
    setCli((prev) => prev.map((x) => (x.id === c.id ? { ...x, [campo]: nuevo } : x)));
    const { error } = await supabase.from("clientes").update({ [campo]: nuevo }).eq("id", c.id);
    if (error) { setError(error.message); cargar(); }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const esBaja = (c: Cli) => !!c.fecha_baja;
  const esCliente = (c: Cli) => !esBaja(c) && c.estado !== "lead";
  const esLead = (c: Cli) => !esBaja(c) && c.estado === "lead";

  // Métricas
  const metricas = useMemo(() => {
    const activos = cli.filter(esCliente);
    const leads = cli.filter(esLead);
    const tiempos: number[] = [], compras: number[] = [];
    const porPrep = new Map<string, { tiempo: number[]; compra: number[]; n: number }>();
    for (const c of cli) {
      const acc = porPrep.get(c.entrenador) ?? { tiempo: [], compra: [], n: 0 };
      if (esCliente(c) && c.fecha_inicio) {
        const t = diasEntre(c.fecha_inicio, c.fecha_baja ?? hoy);
        tiempos.push(t); acc.tiempo.push(t); acc.n++;
      }
      if (c.fecha_compra && c.primer_contacto) {
        const t = diasEntre(c.primer_contacto, c.fecha_compra);
        if (t >= 0) { compras.push(t); acc.compra.push(t); }
      }
      porPrep.set(c.entrenador, acc);
    }
    const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
    return {
      activos: activos.length,
      leads: leads.length,
      conversion: activos.length + leads.length > 0 ? Math.round((activos.length / (activos.length + leads.length)) * 100) : 0,
      mediaTiempo: media(tiempos),
      mediaCompra: media(compras),
      porPrep: [...porPrep.entries()]
        .filter(([, v]) => v.tiempo.length || v.compra.length)
        .map(([k, v]) => ({ prep: k, n: v.n, mediaTiempo: media(v.tiempo), mediaCompra: media(v.compra) }))
        .sort((a, b) => b.n - a.n),
    };
  }, [cli, hoy]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cli.filter((c) => {
      if (filtroEstado === "baja" && !esBaja(c)) return false;
      if (filtroEstado === "cliente" && !esCliente(c)) return false;
      if (filtroEstado === "lead" && !esLead(c)) return false;
      if (filtroPrep !== "todos" && c.entrenador !== filtroPrep) return false;
      if (filtroCanal !== "todos" && c.canal !== filtroCanal) return false;
      if (q && ![c.nombre, c.apellidos, c.email, c.telefono].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))) return false;
      return true;
    });
  }, [cli, busqueda, filtroEstado, filtroPrep, filtroCanal]);

  const valorOrden = (c: Cli, k: string): string | number => {
    switch (k) {
      case "nombre": return `${c.nombre} ${c.apellidos ?? ""}`.toLowerCase();
      case "estado": return esBaja(c) ? 2 : esLead(c) ? 0 : 1;
      case "entrenador": return c.entrenador;
      case "canal": return c.canal ?? "zzz";
      case "plan": return (c.tipo_plan ?? "zzz").toLowerCase();
      case "inicio": return c.fecha_inicio ? new Date(c.fecha_inicio).getTime() : 0;
      case "compra": return c.fecha_compra && c.primer_contacto ? diasEntre(c.primer_contacto, c.fecha_compra) : -1;
      default: return 0;
    }
  };
  const ordenados = useMemo(() => {
    return [...visibles].sort((a, b) => {
      const va = valorOrden(a, sortKey), vb = valorOrden(b, sortKey);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibles, sortKey, sortDir]);
  const clicOrden = (k: string) => { if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setSortDir(1); } };
  const fEd = (k: keyof Cli) => (f[k] as string) ?? "";

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const mini = (v: string, et: string, c = "text-zinc-200") => (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-base font-black ${c}`}>{v}</span>
      <span className="text-[11px] text-zinc-500">{et}</span>
    </span>
  );

  return (
    <Shell titulo="CRM">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5">
          <h1 className="text-3xl font-black tracking-tight text-white">CRM</h1>
          <p className="mt-1 text-sm text-zinc-500">Ciclo de vida, métricas y seguimiento de clientes. Se rellena solo desde el formulario.</p>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Webhook del formulario */}
        <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <button onClick={() => setVerWebhook((v) => !v)} className="flex w-full items-center justify-between text-left">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-950 text-emerald-400">⚡</span>
              Conectar el Google Form (entrada automática)
            </span>
            <span className="text-xs text-zinc-500">{verWebhook ? "ocultar" : "cómo"}</span>
          </button>
          {verWebhook && (
            <div className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
              <p className="mb-2">Cada respuesta del formulario entra sola como cliente. Se configura una vez con un Apps Script en la hoja de respuestas. Tu enlace de entrada (privado):</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-zinc-950 px-3 py-2 text-zinc-300">{feedUrl ?? "Cargando…"}</code>
                <button onClick={() => { if (feedUrl) navigator.clipboard.writeText(feedUrl).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); }} className="rounded-lg bg-zinc-800 px-3 py-2 font-bold text-zinc-200">{copiado ? "✓" : "Copiar"}</button>
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">El script para pegar en Google está en <code>docs/apps-script-formulario.md</code> del repo. Trata el enlace como privado.</p>
            </div>
          )}
        </div>

        {/* Resumen compacto */}
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
          {mini(String(metricas.activos), "activos", "text-white")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(String(metricas.leads), "leads", "text-amber-400")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(`${metricas.conversion}%`, "conversión", "text-emerald-400")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(humano(metricas.mediaTiempo), "media con nosotros")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(humano(metricas.mediaCompra), "media hasta comprar")}
        </div>
        {metricas.porPrep.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-zinc-500">
            {metricas.porPrep.map((p) => (
              <span key={p.prep}>
                <span className="font-bold text-zinc-300">{NOMBRE[p.prep] ?? p.prep}</span> · {p.n} activos · media {humano(p.mediaTiempo)} · compra {humano(p.mediaCompra)}
              </span>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input placeholder="Buscar por nombre, email o teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-56 flex-1 sm:max-w-xs`} />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)} className={`${inputCls} appearance-none`}>
            <option value="todos">Estado: todos</option>
            <option value="cliente">Clientes</option>
            <option value="lead">Leads</option>
            <option value="baja">Bajas</option>
          </select>
          <select value={filtroPrep} onChange={(e) => setFiltroPrep(e.target.value)} className={`${inputCls} appearance-none`}>
            <option value="todos">Preparador: todos</option>
            {ATRIBUCIONES.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
          </select>
          <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value as typeof filtroCanal)} className={`${inputCls} appearance-none`}>
            <option value="todos">Canal: todos</option>
            <option value="online">Online</option>
            <option value="presencial">GYM</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500">
                {([["nombre", "Cliente"], ["estado", "Estado"], ["entrenador", "Prep."], ["canal", "Canal"], ["plan", "Plan"], ["inicio", "Con nosotros"], ["compra", "Compra"]] as [string, string][]).map(([k, et]) => (
                  <th key={k} onClick={() => clicOrden(k)} className="cursor-pointer whitespace-nowrap px-3 py-2.5 hover:text-zinc-300">
                    {et}{sortKey === k ? (sortDir === 1 ? " ↑" : " ↓") : ""}
                  </th>
                ))}
                {SEG.map((s) => <th key={String(s.campo)} className="px-2 py-2.5 text-center">{s.corto}</th>)}
              </tr>
            </thead>
            <tbody>
              {ordenados.map((c) => {
                const tiempo = esCliente(c) && c.fecha_inicio ? humano(diasEntre(c.fecha_inicio, c.fecha_baja ?? hoy)) : "—";
                const compra = c.fecha_compra && c.primer_contacto ? humano(diasEntre(c.primer_contacto, c.fecha_compra)) : "—";
                return (
                  <tr key={c.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => abrirEditar(c)} aria-label="Editar" title="Editar cliente" className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white">✎</button>
                        <Link href={`/clientes/${c.id}`} className="font-semibold text-white hover:text-red-400">
                          {c.nombre} {c.apellidos ?? ""}
                        </Link>
                      </div>
                      <p className="pl-8 text-[11px] text-zinc-600">{c.email ?? c.telefono ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${esBaja(c) ? "bg-zinc-800 text-zinc-500" : esLead(c) ? "bg-amber-950 text-amber-400" : "bg-emerald-950 text-emerald-400"}`}>
                        {esBaja(c) ? "Baja" : esLead(c) ? "Lead" : "Cliente"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">{NOMBRE[c.entrenador] ?? c.entrenador}</td>
                    <td className="px-3 py-2.5">
                      <select
                        value={c.canal ?? ""}
                        onChange={(e) => setCanal(c, e.target.value || null)}
                        className={`rounded-md border-0 px-2 py-1 text-xs font-bold outline-none ${c.canal === "online" ? "bg-blue-950 text-blue-400" : c.canal === "presencial" ? "bg-red-950 text-red-400" : "bg-zinc-800 text-zinc-500"}`}
                      >
                        <option value="">—</option>
                        <option value="online">Online</option>
                        <option value="presencial">GYM</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">{c.tipo_plan ?? "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-300">{tiempo}</td>
                    <td className="px-3 py-2.5 text-zinc-300">{compra}</td>
                    {SEG.map((s) => (
                      <td key={String(s.campo)} className="px-2 py-2.5 text-center">
                        <button
                          onClick={() => toggleSeg(c, s.campo)}
                          aria-label={s.corto}
                          className={`grid h-6 w-6 place-items-center rounded-md text-xs font-black ${c[s.campo] ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-600"}`}
                        >
                          {c[s.campo] ? "✓" : ""}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr><td colSpan={7 + SEG.length} className="px-4 py-8 text-center text-sm text-zinc-500">Sin clientes con esos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal abierto={!!ed} onCerrar={() => setEd(null)} titulo={ed ? `${ed.nombre} ${ed.apellidos ?? ""}` : ""} ancho="max-w-2xl">
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Nombre</span><input value={fEd("nombre")} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Apellidos</span><input value={fEd("apellidos")} onChange={(e) => setF({ ...f, apellidos: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Email</span><input value={fEd("email")} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Teléfono</span><input value={fEd("telefono")} onChange={(e) => setF({ ...f, telefono: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">DNI/NIE</span><input value={fEd("nif")} onChange={(e) => setF({ ...f, nif: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Plan</span><input value={fEd("tipo_plan")} onChange={(e) => setF({ ...f, tipo_plan: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Preparador</span>
                <select value={fEd("entrenador")} onChange={(e) => setF({ ...f, entrenador: e.target.value })} className={`${inputCls} appearance-none`}>
                  {ATRIBUCIONES.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Canal</span>
                <select value={fEd("canal")} onChange={(e) => setF({ ...f, canal: e.target.value })} className={`${inputCls} appearance-none`}>
                  <option value="">—</option><option value="online">Online</option><option value="presencial">GYM</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">1er contacto</span><input type="date" value={fEd("primer_contacto")} onChange={(e) => setF({ ...f, primer_contacto: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Compra</span><input type="date" value={fEd("fecha_compra")} onChange={(e) => setF({ ...f, fecha_compra: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Inicio</span><input type="date" value={fEd("fecha_inicio")} onChange={(e) => setF({ ...f, fecha_inicio: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Registro form</span><input type="date" value={fEd("fecha_registro")} onChange={(e) => setF({ ...f, fecha_registro: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-red-400">Fecha de baja</span><input type="date" value={fEd("fecha_baja")} onChange={(e) => setF({ ...f, fecha_baja: e.target.value })} className={inputCls} /></label>
            </div>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Objetivo</span><textarea rows={2} value={fEd("objetivo")} onChange={(e) => setF({ ...f, objetivo: e.target.value })} className={inputCls} /></label>
            <div className="flex gap-2 border-t border-zinc-800 pt-3">
              <button onClick={guardarEditar} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Guardar</button>
              {f.fecha_baja ? null : (
                <button onClick={() => setF({ ...f, fecha_baja: new Date().toISOString().slice(0, 10) })} className="rounded-xl bg-zinc-800 px-4 text-sm font-bold text-red-400">Dar de baja hoy</button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </Shell>
  );
}
