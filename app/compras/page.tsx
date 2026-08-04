"use client";

// Compras: archivador de facturas de compra (escaneadas o descargadas).
// Filtros por año / trimestre / mes, subida múltiple (importación) y descarga
// en ZIP de lo filtrado para mandárselo al gestor. Cada archivo puede
// vincularse a un gasto del Libro: al hacerlo, el gasto queda marcado como
// "tiene factura" (lo que revisa el Cierre de mes).

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
const esImagen = (n: string) => /\.(png|jpe?g|webp|heic)$/i.test(n);
const triDe = (fecha: string) => Math.floor((Number(fecha.slice(5, 7)) - 1) / 3) + 1;

export default function ComprasPage() {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [fechaSubida, setFechaSubida] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState("");
  const [vinculando, setVinculando] = useState<number | null>(null);
  // Filtros de tiempo
  const [fAnyo, setFAnyo] = useState<string>("todos");
  const [fTri, setFTri] = useState<string>("todos");
  const [fMes, setFMes] = useState<string>("todos");
  // Exportación
  const [descargando, setDescargando] = useState<string | null>(null);

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

  // ---------- Archivos ----------
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

  async function cambiarFecha(a: Archivo, fecha: string) {
    if (!fecha || fecha === a.fecha) return;
    const { error } = await supabase.from("compras_archivos").update({ fecha }).eq("id", a.id);
    if (error) return setError(error.message);
    cargar();
  }

  // ---------- Filtros ----------
  const anyos = useMemo(
    () => [...new Set(archivos.map((a) => a.fecha.slice(0, 4)))].sort().reverse(),
    [archivos]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return archivos.filter((a) => {
      if (fAnyo !== "todos" && a.fecha.slice(0, 4) !== fAnyo) return false;
      if (fTri !== "todos" && String(triDe(a.fecha)) !== fTri) return false;
      if (fMes !== "todos" && a.fecha.slice(5, 7) !== fMes) return false;
      if (q && !`${a.nombre} ${a.notas ?? ""} ${a.gastos?.concepto ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [archivos, busqueda, fAnyo, fTri, fMes]);

  const etiquetaPeriodo = () => {
    const partes: string[] = [];
    if (fAnyo !== "todos") partes.push(fAnyo);
    if (fTri !== "todos") partes.push(`T${fTri}`);
    if (fMes !== "todos") partes.push(`mes${fMes}`);
    return partes.length ? partes.join("_") : "todo";
  };

  // ---------- Exportación ZIP para el gestor ----------
  async function descargarZip() {
    if (visibles.length === 0) return setError("No hay archivos con estos filtros.");
    setError(null);
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    let hechos = 0;
    for (const a of visibles) {
      setDescargando(`Preparando ${++hechos}/${visibles.length}…`);
      const { data, error } = await supabase.storage.from("compras").download(a.ruta);
      if (error || !data) continue;
      zip.file(`${a.fecha}_${a.nombre.replace(/[\\/:*?"<>|]+/g, "_")}`, data);
    }
    setDescargando("Comprimiendo…");
    const blob = await zip.generateAsync({ type: "blob" });
    const el = document.createElement("a");
    el.href = URL.createObjectURL(blob);
    el.download = `compras_${etiquetaPeriodo()}.zip`;
    el.click();
    URL.revokeObjectURL(el.href);
    setDescargando(null);
  }

  const mesDe = (f: string) =>
    new Date(f.slice(0, 7) + "-01T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const candidatos = useMemo(
    () => [...gastos].sort((a, b) => Number(a.tiene_factura) - Number(b.tiene_factura) || (a.fecha < b.fecha ? 1 : -1)),
    [gastos]
  );

  let mesAnterior = "";

  return (
    <div>
      {/* Subida (importación) */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-white ${subiendo ? "bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}>
          {subiendo ? "Subiendo…" : "⬆ Subir facturas"}
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => { subir(e.target.files); e.target.value = ""; }}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          con fecha
          <input type="date" value={fechaSubida} onChange={(e) => setFechaSubida(e.target.value || hoyISO())} className={inputCls} />
        </label>
        <span className="text-[10px] leading-snug text-zinc-600">
          PDF o foto, varias a la vez. Luego vincula cada una a su gasto del Libro.
        </span>
      </div>

      {/* Filtros de tiempo + búsqueda + exportación */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={fAnyo} onChange={(e) => setFAnyo(e.target.value)} className={`${inputCls} appearance-none`}>
          <option value="todos">Año: todos</option>
          {anyos.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={fTri} onChange={(e) => { setFTri(e.target.value); if (e.target.value !== "todos") setFMes("todos"); }} className={`${inputCls} appearance-none`}>
          <option value="todos">Trimestre: todos</option>
          {[1, 2, 3, 4].map((t) => <option key={t} value={t}>T{t}</option>)}
        </select>
        <select value={fMes} onChange={(e) => { setFMes(e.target.value); if (e.target.value !== "todos") setFTri("todos"); }} className={`${inputCls} appearance-none`}>
          <option value="todos">Mes: todos</option>
          {Array.from({ length: 12 }, (_, i) => {
            const v = String(i + 1).padStart(2, "0");
            const n = new Date(2026, i, 1).toLocaleDateString("es-ES", { month: "long" });
            return <option key={v} value={v}>{n}</option>;
          })}
        </select>
        <input placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-40 flex-1 sm:max-w-56`} />
        <button
          onClick={descargarZip}
          disabled={!!descargando || visibles.length === 0}
          title="Descarga en un ZIP todos los archivos filtrados, con la fecha delante del nombre, para mandárselo al gestor"
          className="ml-auto rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
        >
          {descargando ?? `⬇ Descargar ZIP (${visibles.length}) para el gestor`}
        </button>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Archivos */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {visibles.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
            {archivos.length === 0
              ? "Aún no hay facturas de compra archivadas. Sube la primera con el botón rojo."
              : "Nada coincide con los filtros."}
          </p>
        ) : (
          visibles.map((a) => {
            const mes = mesDe(a.fecha);
            const cabecera = mes !== mesAnterior;
            mesAnterior = mes;
            return (
              <Fragment key={a.id}>
                {cabecera && (
                  <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-4 py-1.5">
                    <span className="text-[11px] font-bold capitalize text-zinc-500">{mes}</span>
                    <span className="text-[10px] text-zinc-600">{visibles.filter((x) => mesDe(x.fecha) === mes).length} archivo(s)</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 px-4 py-2.5 last:border-0 hover:bg-zinc-900/40">
                  <span className="text-lg">{esImagen(a.nombre) ? "🖼" : "📄"}</span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => abrir(a)} className="block max-w-full truncate text-left text-sm font-semibold text-sky-400 hover:text-sky-300" title="Abrir el archivo">
                      {a.nombre}
                    </button>
                    <input
                      type="date"
                      defaultValue={a.fecha}
                      onBlur={(e) => cambiarFecha(a, e.target.value)}
                      className="rounded border border-transparent bg-transparent py-0.5 text-[10px] text-zinc-500 outline-none hover:border-zinc-700 focus:border-red-500"
                      title="Fecha de la factura (ordena y filtra por ella)"
                    />
                  </div>

                  {a.gasto_id && a.gastos ? (
                    <button
                      onClick={() => vincular(a, null)}
                      title="Vinculado a este gasto del Libro. Clic para desvincular."
                      className="max-w-52 truncate rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-900"
                    >
                      ✓ {a.gastos.concepto} · {eur(Number(a.gastos.total))}
                    </button>
                  ) : (
                    <button
                      onClick={() => setVinculando(vinculando === a.id ? null : a.id)}
                      title="Conectar este archivo con su gasto del Libro"
                      className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    >
                      Vincular a gasto
                    </button>
                  )}

                  <button onClick={() => borrar(a)} title="Borrar archivo" className="px-1 font-bold text-zinc-700 hover:text-red-400">✕</button>
                </div>

                {vinculando === a.id && (
                  <div className="border-b border-zinc-800/60 bg-zinc-950/60 px-4 py-2">
                    <p className="mb-1 text-[10px] font-bold uppercase text-zinc-600">
                      Elige el gasto del Libro al que pertenece esta factura (primero los que aún no tienen)
                    </p>
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
        Los archivos se guardan en un almacén privado (solo con sesión iniciada). <b>⬇ Descargar ZIP</b> baja lo que
        estés viendo (filtros aplicados) con la fecha delante de cada nombre, listo para el gestor.
        <b> Vincular a gasto</b> conecta la factura con su apunte del Libro y lo marca como «tiene factura».
      </p>
    </div>
  );
}
