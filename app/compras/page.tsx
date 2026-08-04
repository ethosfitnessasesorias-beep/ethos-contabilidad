"use client";

// Compras: archivo de facturas de compra (escaneadas o descargadas), ordenadas
// año → trimestre → mes. Cada archivo se guarda en Storage (bucket privado
// "compras") y se puede vincular a un gasto del Libro: al vincular, el gasto
// queda marcado como "tiene factura" (lo que vigila el Cierre de mes).

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Archivo {
  id: number;
  nombre: string;
  ruta: string;
  fecha: string;
  gasto_id: number | null;
  notas: string | null;
  gastos: { concepto: string; total: number; fecha: string } | null;
}
interface Gasto { id: number; fecha: string; concepto: string; total: number; tiene_factura: boolean }

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function ComprasPage() {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [fechaSubida, setFechaSubida] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState("");
  const [vinculando, setVinculando] = useState<number | null>(null); // archivo.id con selector abierto

  const cargar = useCallback(async () => {
    const [a, g] = await Promise.all([
      supabase
        .from("compras_archivos")
        .select("id, nombre, ruta, fecha, gasto_id, notas, gastos(concepto, total, fecha)")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false }),
      supabase
        .from("gastos")
        .select("id, fecha, concepto, total, tiene_factura")
        .order("fecha", { ascending: false })
        .limit(400),
    ]);
    if (a.error) return setError(a.error.message);
    setArchivos((a.data as unknown as Archivo[]) ?? []);
    setGastos((g.data as Gasto[]) ?? []);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function subir(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    setError(null);
    for (const file of Array.from(files)) {
      const limpio = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const ruta = `${fechaSubida.slice(0, 7)}/${Date.now()}_${limpio}`;
      const up = await supabase.storage.from("compras").upload(ruta, file);
      if (up.error) {
        setError(`${file.name}: ${up.error.message}`);
        continue;
      }
      const ins = await supabase.from("compras_archivos").insert({ nombre: file.name, ruta, fecha: fechaSubida });
      if (ins.error) setError(`${file.name}: ${ins.error.message}`);
    }
    setSubiendo(false);
    cargar();
  }

  async function abrir(a: Archivo) {
    const { data, error } = await supabase.storage.from("compras").createSignedUrl(a.ruta, 300);
    if (error || !data) return setError(error?.message ?? "No se pudo abrir.");
    window.open(data.signedUrl, "_blank");
  }

  async function borrar(a: Archivo) {
    if (!confirm(`¿Borrar "${a.nombre}"? Se elimina el archivo del almacén.`)) return;
    await supabase.storage.from("compras").remove([a.ruta]);
    const { error } = await supabase.from("compras_archivos").delete().eq("id", a.id);
    if (error) return setError(error.message);
    cargar();
  }

  async function vincular(a: Archivo, gastoId: number | null) {
    const { error } = await supabase.from("compras_archivos").update({ gasto_id: gastoId }).eq("id", a.id);
    if (error) return setError(error.message);
    if (gastoId) await supabase.from("gastos").update({ tiene_factura: true }).eq("id", gastoId);
    setVinculando(null);
    cargar();
  }

  async function guardarNotas(a: Archivo, notas: string) {
    if ((a.notas ?? "") === notas.trim()) return;
    await supabase.from("compras_archivos").update({ notas: notas.trim() || null }).eq("id", a.id);
  }

  async function cambiarFecha(a: Archivo, fecha: string) {
    if (!fecha || fecha === a.fecha) return;
    const { error } = await supabase.from("compras_archivos").update({ fecha }).eq("id", a.id);
    if (error) return setError(error.message);
    cargar();
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return archivos;
    return archivos.filter((a) => `${a.nombre} ${a.notas ?? ""} ${a.gastos?.concepto ?? ""}`.toLowerCase().includes(q));
  }, [archivos, busqueda]);

  // Cabeceras año → trimestre → mes intercaladas (estilo Holded)
  const filas = useMemo(() => {
    const nodosMeta: { tipo: "a" | "t" | "m" | "fila"; clave: string; archivo?: Archivo }[] = [];
    let pa = "", pt = "", pm = "";
    for (const a of visibles) {
      const anio = a.fecha.slice(0, 4);
      const tri = `${anio}·T${Math.floor((Number(a.fecha.slice(5, 7)) - 1) / 3) + 1}`;
      const mes = a.fecha.slice(0, 7);
      if (anio !== pa) { nodosMeta.push({ tipo: "a", clave: anio }); pa = anio; pt = ""; pm = ""; }
      if (tri !== pt) { nodosMeta.push({ tipo: "t", clave: tri }); pt = tri; pm = ""; }
      if (mes !== pm) { nodosMeta.push({ tipo: "m", clave: mes }); pm = mes; }
      nodosMeta.push({ tipo: "fila", clave: `f${a.id}`, archivo: a });
    }
    return nodosMeta;
  }, [visibles]);

  const nombreMes = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("es-ES", { month: "long" });

  // Gastos candidatos para vincular: sin factura primero, más recientes primero
  const candidatos = useMemo(
    () => [...gastos].sort((a, b) => Number(a.tiene_factura) - Number(b.tiene_factura) || (a.fecha < b.fecha ? 1 : -1)),
    [gastos]
  );

  return (
    <div>
      {/* Subida */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          Fecha de la factura
          <input type="date" value={fechaSubida} onChange={(e) => setFechaSubida(e.target.value || hoyISO())} className={inputCls} />
        </label>
        <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-white ${subiendo ? "bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}>
          {subiendo ? "Subiendo…" : "+ Subir archivos"}
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => { subir(e.target.files); e.target.value = ""; }}
          />
        </label>
        <span className="text-[10px] text-zinc-600">PDF o foto. Se guardan en el archivo privado y luego puedes vincularlos a su gasto del Libro.</span>
        <input placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} ml-auto min-w-40`} />
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Listado */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {filas.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
            {archivos.length === 0 ? "Aún no hay facturas de compra archivadas. Sube la primera con el botón rojo." : "Nada coincide con la búsqueda."}
          </p>
        ) : (
          filas.map((n) => {
            if (n.tipo === "a")
              return (
                <div key={`a-${n.clave}`} className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-black text-white">{n.clave}</div>
              );
            if (n.tipo === "t")
              return (
                <div key={`t-${n.clave}`} className="border-b border-zinc-800 bg-zinc-900/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {n.clave.split("·")[1]}
                </div>
              );
            if (n.tipo === "m")
              return (
                <div key={`m-${n.clave}`} className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-1 text-[11px] font-bold capitalize text-zinc-500">
                  {nombreMes(n.clave)}
                </div>
              );
            const a = n.archivo as Archivo;
            return (
              <Fragment key={a.id}>
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 px-4 py-2 last:border-0 hover:bg-zinc-900/40">
                  <button onClick={() => abrir(a)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-sky-400 hover:text-sky-300" title="Abrir el archivo">
                    {a.nombre}
                  </button>
                  <input
                    type="date"
                    defaultValue={a.fecha}
                    onBlur={(e) => cambiarFecha(a, e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400 outline-none focus:border-red-500"
                  />
                  {a.gasto_id && a.gastos ? (
                    <button
                      onClick={() => vincular(a, null)}
                      title="Clic para desvincular"
                      className="max-w-56 truncate rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-900"
                    >
                      ✓ {a.gastos.concepto} · {eur(Number(a.gastos.total))}
                    </button>
                  ) : (
                    <button
                      onClick={() => setVinculando(vinculando === a.id ? null : a.id)}
                      className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    >
                      Vincular a gasto
                    </button>
                  )}
                  <input
                    placeholder="Notas…"
                    defaultValue={a.notas ?? ""}
                    onBlur={(e) => guardarNotas(a, e.target.value)}
                    className="w-40 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs text-zinc-500 outline-none placeholder:text-zinc-700 focus:border-zinc-700 focus:bg-zinc-950"
                  />
                  <button onClick={() => borrar(a)} title="Borrar archivo" className="px-1 font-bold text-zinc-700 hover:text-red-400">✕</button>
                </div>
                {vinculando === a.id && (
                  <div className="border-b border-zinc-800/60 bg-zinc-950/60 px-4 py-2">
                    <p className="mb-1 text-[10px] font-bold uppercase text-zinc-600">Elige el gasto del Libro (primero los que aún no tienen factura)</p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800">
                      {candidatos.slice(0, 120).map((g) => (
                        <button
                          key={g.id}
                          onClick={() => vincular(a, g.id)}
                          className="flex w-full items-center gap-2 border-b border-zinc-800/50 px-3 py-1.5 text-left text-xs last:border-0 hover:bg-zinc-900"
                        >
                          <span className="text-zinc-600">{new Date(g.fecha).toLocaleDateString("es-ES")}</span>
                          <span className="min-w-0 flex-1 truncate text-zinc-300">{g.concepto}</span>
                          <span className="font-bold tabular-nums text-zinc-200">{eur(Number(g.total))}</span>
                          {!g.tiene_factura && <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">sin factura</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })
        )}
      </div>

      <p className="mt-3 text-[10px] leading-snug text-zinc-600">
        Los archivos se guardan en un almacén privado (solo visibles con sesión iniciada). Al vincular un archivo a un gasto,
        el gasto queda marcado como «tiene factura», que es lo que revisa el Cierre de mes.
      </p>
    </div>
  );
}
