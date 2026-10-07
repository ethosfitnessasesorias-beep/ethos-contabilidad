"use client";

// Editor del menú lateral: reordenar ítems, moverlos de categoría, renombrar,
// crear categorías y ocultar lo que no se use. Se guarda en config_texto
// (clave nav_config) y el Shell lo aplica al cargar.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell, CATALOGO, DEFAULT_GRUPOS, type GrupoCfg, type NavConfig } from "../shell";
import { supabase } from "@/lib/supabase";

export default function AjustesMenuPage() {
  const [grupos, setGrupos] = useState<GrupoCfg[]>([]);
  const [etiquetas, setEtiquetas] = useState<Record<string, string>>({});
  const [ocultos, setOcultos] = useState<string[]>([]);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parte de la config guardada (o del menú por defecto) y asegura que TODAS
  // las páginas del catálogo aparezcan en algún sitio (para poder moverlas).
  const montar = useCallback((cfg: NavConfig | null) => {
    const base: GrupoCfg[] = (cfg?.grupos?.length ? cfg.grupos : DEFAULT_GRUPOS).map((g) => ({ titulo: g.titulo, hrefs: [...g.hrefs] }));
    const och = cfg?.ocultos ?? [];
    const colocados = new Set<string>([...base.flatMap((g) => g.hrefs), ...och]);
    const sueltos = Object.keys(CATALOGO).filter((h) => !colocados.has(h));
    if (sueltos.length) {
      const idx = base.length - 1;
      if (idx >= 0) base[idx].hrefs.push(...sueltos);
      else base.push({ titulo: "Menú", hrefs: sueltos });
    }
    setGrupos(base);
    setEtiquetas(cfg?.etiquetas ?? {});
    setOcultos(och);
  }, []);

  useEffect(() => {
    supabase.from("config_texto").select("valor").eq("clave", "nav_config").maybeSingle().then(({ data }) => {
      let cfg: NavConfig | null = null;
      if (data?.valor) { try { cfg = JSON.parse(data.valor); } catch {} }
      montar(cfg);
    });
  }, [montar]);

  const nombre = (h: string) => etiquetas[h] || CATALOGO[h]?.etiqueta || h;

  function moverItem(gi: number, idx: number, dir: -1 | 1) {
    setGrupos((prev) => {
      const g = prev.map((x) => ({ ...x, hrefs: [...x.hrefs] }));
      const j = idx + dir;
      if (j < 0 || j >= g[gi].hrefs.length) return prev;
      [g[gi].hrefs[idx], g[gi].hrefs[j]] = [g[gi].hrefs[j], g[gi].hrefs[idx]];
      return g;
    });
  }
  function moverAGrupo(hrefActual: string, giDestino: number) {
    setGrupos((prev) => {
      const g = prev.map((x) => ({ ...x, hrefs: x.hrefs.filter((h) => h !== hrefActual) }));
      g[giDestino].hrefs.push(hrefActual);
      return g;
    });
  }
  function ocultar(href: string) {
    setGrupos((prev) => prev.map((x) => ({ ...x, hrefs: x.hrefs.filter((h) => h !== href) })));
    setOcultos((prev) => [...new Set([...prev, href])]);
  }
  function mostrar(href: string) {
    setOcultos((prev) => prev.filter((h) => h !== href));
    setGrupos((prev) => {
      const g = prev.map((x) => ({ ...x, hrefs: [...x.hrefs] }));
      (g[0] ?? g[g.length - 1]).hrefs.push(href);
      return g;
    });
  }
  function moverGrupo(gi: number, dir: -1 | 1) {
    setGrupos((prev) => {
      const j = gi + dir;
      if (j < 0 || j >= prev.length) return prev;
      const g = [...prev];
      [g[gi], g[j]] = [g[j], g[gi]];
      return g;
    });
  }
  function renombrarGrupo(gi: number, titulo: string) {
    setGrupos((prev) => prev.map((x, i) => (i === gi ? { ...x, titulo: titulo || null } : x)));
  }
  function borrarGrupo(gi: number) {
    setGrupos((prev) => {
      if (prev.length <= 1) return prev;
      const g = prev.map((x) => ({ ...x, hrefs: [...x.hrefs] }));
      const movidos = g[gi].hrefs;
      g.splice(gi, 1);
      if (movidos.length) g[0].hrefs.push(...movidos); // sus ítems no se pierden
      return g;
    });
  }
  function anadirGrupo() {
    setGrupos((prev) => [...prev, { titulo: "Nueva categoría", hrefs: [] }]);
  }

  async function guardar() {
    const cfg: NavConfig = { grupos: grupos.map((g) => ({ titulo: g.titulo, hrefs: g.hrefs })), etiquetas, ocultos };
    const { error } = await supabase.from("config_texto").upsert({ clave: "nav_config", valor: JSON.stringify(cfg), descripcion: "Menú lateral personalizado" });
    if (error) return setError(error.message);
    setOk("Menú guardado ✓ (recarga para verlo en la barra)");
    setTimeout(() => setOk(null), 4000);
  }
  async function restablecer() {
    if (!confirm("¿Volver al menú por defecto?")) return;
    await supabase.from("config_texto").delete().eq("clave", "nav_config");
    montar(null);
    setOk("Menú restablecido ✓ (recarga para verlo)");
    setTimeout(() => setOk(null), 4000);
  }

  const ocultosCat = useMemo(() => ocultos.filter((h) => CATALOGO[h]), [ocultos]);

  return (
    <Shell titulo="Personalizar menú">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Personalizar menú</h1>
            <p className="mt-1 text-sm text-zinc-500">Reordena, mueve entre categorías, renombra, crea y oculta. Guarda y recarga para verlo.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={restablecer} className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-700">Restablecer</button>
            <button onClick={guardar} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white">Guardar</button>
          </div>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
        {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

        <div className="flex flex-col gap-3">
          {grupos.map((g, gi) => (
            <div key={gi} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex flex-col">
                  <button onClick={() => moverGrupo(gi, -1)} disabled={gi === 0} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30">▲</button>
                  <button onClick={() => moverGrupo(gi, 1)} disabled={gi === grupos.length - 1} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30">▼</button>
                </div>
                <input
                  value={g.titulo ?? ""}
                  onChange={(e) => renombrarGrupo(gi, e.target.value)}
                  placeholder="(sin cabecera — siempre visible)"
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-red-500"
                />
                <button onClick={() => borrarGrupo(gi)} disabled={grupos.length <= 1} title="Borrar categoría (sus ítems van a la primera)" className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-400 hover:text-red-400 disabled:opacity-30">Borrar</button>
              </div>
              <div className="flex flex-col gap-1.5">
                {g.hrefs.filter((h) => CATALOGO[h]).map((h, idx) => (
                  <div key={h} className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-950/60 px-2 py-1.5">
                    <span className="text-zinc-500">{CATALOGO[h].icono}</span>
                    <input
                      value={nombre(h)}
                      onChange={(e) => setEtiquetas((p) => ({ ...p, [h]: e.target.value }))}
                      className="min-w-32 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-200 outline-none hover:border-zinc-800 focus:border-red-500"
                    />
                    <span className="text-[10px] text-zinc-600">{h}</span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moverItem(gi, idx, -1)} disabled={idx === 0} className="px-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30">↑</button>
                      <button onClick={() => moverItem(gi, idx, 1)} disabled={idx === g.hrefs.filter((x) => CATALOGO[x]).length - 1} className="px-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30">↓</button>
                    </div>
                    <select value={gi} onChange={(e) => moverAGrupo(h, Number(e.target.value))} title="Mover a otra categoría" className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-[11px] text-zinc-300 outline-none">
                      {grupos.map((gg, j) => <option key={j} value={j}>{gg.titulo || "General"}</option>)}
                    </select>
                    <button onClick={() => ocultar(h)} title="Ocultar del menú" className="rounded bg-zinc-800 px-2 py-1 text-[11px] font-bold text-zinc-400 hover:text-amber-400">Ocultar</button>
                  </div>
                ))}
                {g.hrefs.filter((h) => CATALOGO[h]).length === 0 && <p className="px-2 py-1 text-[11px] text-zinc-600">Vacía — mueve ítems aquí con el desplegable de cada uno.</p>}
              </div>
            </div>
          ))}
          <button onClick={anadirGrupo} className="self-start rounded-xl border border-dashed border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-500 hover:border-zinc-500 hover:text-zinc-300">+ Añadir categoría</button>
        </div>

        {ocultosCat.length > 0 && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-500">Ocultos</p>
            <div className="flex flex-wrap gap-2">
              {ocultosCat.map((h) => (
                <button key={h} onClick={() => mostrar(h)} className="flex items-center gap-1.5 rounded-lg bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-emerald-400">
                  {nombre(h)} <span className="text-[10px] text-zinc-600">mostrar +</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
