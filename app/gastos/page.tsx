"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Barra } from "../barra";
import { NavInferior } from "../nav";
import type { Categoria } from "@/lib/tipos";

interface Gasto {
  id: number;
  fecha: string;
  concepto: string;
  proveedor: string | null;
  base: number;
  iva_pct: number;
  total: number;
  tiene_factura: boolean;
  deducible: boolean;
  categoria_id: number;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-base text-white placeholder-zinc-600 outline-none focus:border-emerald-500";

const mesActualISO = () => new Date().toISOString().slice(0, 7);

export default function Gastos() {
  const sesionOk = useSesion();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sinFactura, setSinFactura] = useState<Gasto[]>([]);
  const [gastosMes, setGastosMes] = useState<Gasto[]>([]);
  const [mes, setMes] = useState(mesActualISO());
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Nueva categoría
  const [creandoCat, setCreandoCat] = useState(false);
  const [catNombre, setCatNombre] = useState("");
  const [catGrupo, setCatGrupo] = useState("Operativo");
  const [catGrupoNuevo, setCatGrupoNuevo] = useState("");
  const [catFijo, setCatFijo] = useState(false);
  const [catInversion, setCatInversion] = useState(false);

  function avisar(tipo: "ok" | "error", texto: string) {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), tipo === "ok" ? 2500 : 5000);
  }

  const cargar = useCallback(async () => {
    const desde = `${mes}-01`;
    const hasta = new Date(new Date(desde).getFullYear(), new Date(desde).getMonth() + 1, 1)
      .toISOString()
      .slice(0, 10);
    const [cat, sf, gm] = await Promise.all([
      supabase.from("categorias").select("*").order("grupo").order("nombre"),
      supabase
        .from("gastos")
        .select("*")
        .eq("tiene_factura", false)
        .gt("base", 0)
        .order("fecha", { ascending: false }),
      supabase.from("gastos").select("*").gte("fecha", desde).lt("fecha", hasta),
    ]);
    setCategorias((cat.data as Categoria[]) ?? []);
    setSinFactura((sf.data as Gasto[]) ?? []);
    setGastosMes((gm.data as Gasto[]) ?? []);
  }, [mes]);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  const nombreCat = (id: number) => categorias.find((c) => c.id === id)?.nombre ?? "—";

  // Desglose del mes por categoría
  const desglose = useMemo(() => {
    const m = new Map<number, number>();
    for (const g of gastosMes) m.set(g.categoria_id, (m.get(g.categoria_id) ?? 0) + Number(g.total));
    return [...m.entries()]
      .map(([id, total]) => ({
        id,
        total,
        nombre: nombreCat(id),
        inversion: categorias.find((c) => c.id === id)?.es_inversion ?? false,
      }))
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastosMes, categorias]);

  const totalMes = desglose.reduce((s, d) => s + d.total, 0);

  async function marcarFactura(g: Gasto) {
    const { error } = await supabase
      .from("gastos")
      .update({
        tiene_factura: true,
        deducible: true,
        iva_soportado: Math.round(Number(g.base) * Number(g.iva_pct) * 100) / 100,
      })
      .eq("id", g.id);
    if (error) return avisar("error", error.message);
    avisar("ok", "Factura registrada: ahora es deducible ✓");
    cargar();
  }

  async function crearCategoria() {
    const nombre = catNombre.trim();
    const grupo = (catGrupo === "__nuevo__" ? catGrupoNuevo : catGrupo).trim();
    if (!nombre || !grupo) return avisar("error", "Pon nombre y grupo.");
    const { error } = await supabase.from("categorias").insert({
      tipo: "gasto",
      grupo,
      nombre,
      es_fijo: catFijo,
      es_inversion: catInversion,
    });
    if (error) return avisar("error", error.message);
    avisar("ok", `Categoría "${nombre}" creada ✓`);
    setCatNombre("");
    setCatGrupoNuevo("");
    setCatFijo(false);
    setCatInversion(false);
    setCreandoCat(false);
    cargar();
  }

  if (sesionOk === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  const gruposGasto = [...new Set(categorias.filter((c) => c.tipo === "gasto").map((c) => c.grupo))];

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-zinc-950 px-4 pb-24 pt-4">
      <Barra titulo="· Gastos" />

      {/* Facturas por pedir */}
      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">
          Facturas por pedir ({sinFactura.length})
        </h2>
        {sinFactura.length === 0 ? (
          <p className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
            Todo tiene factura. 🎉
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-zinc-900">
            {sinFactura.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{g.concepto}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(g.fecha).toLocaleDateString("es-ES")} · {eur(Number(g.total))}
                    {g.proveedor ? ` · ${g.proveedor}` : ""} · {nombreCat(g.categoria_id)}
                  </p>
                </div>
                <button
                  onClick={() => marcarFactura(g)}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Ya la tengo
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Desglose mensual */}
      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-400">Desglose</h2>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value || mesActualISO())}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none"
          />
        </div>
        <div className="overflow-hidden rounded-2xl bg-zinc-900">
          {desglose.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">Sin gastos este mes.</p>
          )}
          {desglose.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-0"
            >
              <span className="text-sm text-zinc-300">
                {d.nombre}
                {d.inversion && <span className="ml-2 text-xs text-sky-500">inversión</span>}
              </span>
              <span className={`text-sm font-bold ${d.total < 0 ? "text-emerald-400" : "text-white"}`}>
                {eur(d.total)}
              </span>
            </div>
          ))}
          {desglose.length > 0 && (
            <div className="flex items-center justify-between bg-zinc-800 px-4 py-3">
              <span className="text-sm font-black text-white">TOTAL</span>
              <span className="text-sm font-black text-white">{eur(totalMes)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Categorías propias */}
      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-400">Categorías</h2>
          <button
            onClick={() => setCreandoCat(!creandoCat)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            {creandoCat ? "Cancelar" : "+ Nueva"}
          </button>
        </div>

        {creandoCat && (
          <div className="flex flex-col gap-2 rounded-2xl bg-zinc-900 p-4">
            <input
              placeholder="Nombre (ej: Vestuario staff)"
              value={catNombre}
              onChange={(e) => setCatNombre(e.target.value)}
              className={inputCls}
            />
            <select
              value={catGrupo}
              onChange={(e) => setCatGrupo(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              {gruposGasto.map((g) => (
                <option key={g} value={g}>
                  Grupo: {g}
                </option>
              ))}
              <option value="__nuevo__">— Grupo nuevo —</option>
            </select>
            {catGrupo === "__nuevo__" && (
              <input
                placeholder="Nombre del grupo nuevo"
                value={catGrupoNuevo}
                onChange={(e) => setCatGrupoNuevo(e.target.value)}
                className={inputCls}
              />
            )}
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={catFijo}
                onChange={(e) => setCatFijo(e.target.checked)}
                className="accent-emerald-600"
              />
              Gasto fijo (recurrente e ineludible: cuenta para el runway)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={catInversion}
                onChange={(e) => setCatInversion(e.target.checked)}
                className="accent-emerald-600"
              />
              Inversión
            </label>
            {catInversion && (
              <p className="rounded-lg bg-amber-950 px-3 py-2 text-xs text-amber-300">
                ⚠ Solo es inversión un activo que dura MÁS de 1 año (maquinaria, obra,
                mobiliario). El papel, las aguas o el software mensual son gasto corriente.
                Marcarlo mal contamina el reparto — pasó con el Excel.
              </p>
            )}
            <button onClick={crearCategoria} className="rounded-xl bg-emerald-600 py-2.5 font-bold text-white">
              Crear categoría
            </button>
          </div>
        )}
      </section>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg ${
            toast.tipo === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.texto}
        </div>
      )}

      <NavInferior />
    </main>
  );
}
