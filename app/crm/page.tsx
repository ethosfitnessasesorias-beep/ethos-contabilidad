"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { ATRIBUCIONES } from "@/lib/tipos";

interface Cli {
  id: number;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
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

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const stat = (et: string, v: string, c: string, sub?: string) => (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{et}</p>
      <p className={`mt-1 text-2xl font-black ${c}`}>{v}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
    </div>
  );
  const chip = (activo: boolean, etiqueta: string, onClick: () => void, key?: string) => (
    <button key={key ?? etiqueta} onClick={onClick} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${activo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{etiqueta}</button>
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

        {/* Métricas */}
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {stat("Clientes activos", String(metricas.activos), "text-white")}
          {stat("Leads", String(metricas.leads), "text-amber-400")}
          {stat("Conversión", `${metricas.conversion}%`, "text-emerald-400", "leads → clientes")}
          {stat("Media con nosotros", humano(metricas.mediaTiempo), "text-white")}
          {stat("Media hasta comprar", humano(metricas.mediaCompra), "text-white", "1er contacto → compra")}
        </div>
        {metricas.porPrep.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {metricas.porPrep.map((p) => (
              <div key={p.prep} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs">
                <span className="font-black text-white">{NOMBRE[p.prep] ?? p.prep}</span>
                <span className="text-zinc-500"> · {p.n} activos · media {humano(p.mediaTiempo)} · compra {humano(p.mediaCompra)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input placeholder="Buscar por nombre, email o teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-56 flex-1 sm:max-w-xs`} />
          {chip(filtroEstado === "todos", "Todos", () => setFiltroEstado("todos"), "todos")}
          {chip(filtroEstado === "cliente", "Clientes", () => setFiltroEstado("cliente"), "cliente")}
          {chip(filtroEstado === "lead", "Leads", () => setFiltroEstado("lead"), "lead")}
          {chip(filtroEstado === "baja", "Bajas", () => setFiltroEstado("baja"), "baja")}
          <span className="mx-1 hidden h-4 w-px bg-zinc-800 sm:block" />
          {ATRIBUCIONES.map((a) => chip(filtroPrep === a.valor, a.etiqueta, () => setFiltroPrep(filtroPrep === a.valor ? "todos" : a.valor), a.valor))}
          <span className="mx-1 hidden h-4 w-px bg-zinc-800 sm:block" />
          {chip(filtroCanal === "online", "Online", () => setFiltroCanal(filtroCanal === "online" ? "todos" : "online"), "on")}
          {chip(filtroCanal === "presencial", "GYM", () => setFiltroCanal(filtroCanal === "presencial" ? "todos" : "presencial"), "gym")}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5">Prep.</th>
                <th className="px-3 py-2.5">Canal</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5">Con nosotros</th>
                <th className="px-3 py-2.5">Compra</th>
                {SEG.map((s) => <th key={String(s.campo)} className="px-2 py-2.5 text-center">{s.corto}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => {
                const tiempo = esCliente(c) && c.fecha_inicio ? humano(diasEntre(c.fecha_inicio, c.fecha_baja ?? hoy)) : "—";
                const compra = c.fecha_compra && c.primer_contacto ? humano(diasEntre(c.primer_contacto, c.fecha_compra)) : "—";
                return (
                  <tr key={c.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/clientes/${c.id}`} className="font-semibold text-white hover:text-red-400">
                        {c.nombre} {c.apellidos ?? ""}
                      </Link>
                      <p className="text-[11px] text-zinc-600">{c.email ?? c.telefono ?? "—"}</p>
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
      </div>
    </Shell>
  );
}
