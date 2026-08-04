"use client";

// Compras: archivador de facturas de compra (escaneadas o descargadas).
// Organización por CARPETAS (Proveedores, Suministros, Gym…): entras en una
// carpeta, subes archivos dentro, y puedes mover archivos entre carpetas.
// Cada archivo puede vincularse a un gasto del Libro: al hacerlo, el gasto
// queda marcado como "tiene factura" (lo que revisa el Cierre de mes).

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Carpeta { id: number; nombre: string }
interface Archivo {
  id: number;
  nombre: string;
  ruta: string;
  fecha: string;
  gasto_id: number | null;
  carpeta_id: number | null;
  notas: string | null;
  gastos: { concepto: string; total: number; fecha: string } | null;
}
interface Gasto { id: number; fecha: string; concepto: string; total: number; tiene_factura: boolean }

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const hoyISO = () => new Date().toISOString().slice(0, 10);
const esImagen = (n: string) => /\.(png|jpe?g|webp|heic)$/i.test(n);

export default function ComprasPage() {
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [carpetaSel, setCarpetaSel] = useState<number | null>(null); // null = Inicio
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [fechaSubida, setFechaSubida] = useState(hoyISO());
  const [busqueda, setBusqueda] = useState("");
  const [vinculando, setVinculando] = useState<number | null>(null);
  // Carpetas: crear / renombrar
  const [creandoCarpeta, setCreandoCarpeta] = useState(false);
  const [nombreCarpeta, setNombreCarpeta] = useState("");
  const [renombrando, setRenombrando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const [ca, a, g] = await Promise.all([
      supabase.from("compras_carpetas").select("id, nombre").order("nombre"),
      supabase
        .from("compras_archivos")
        .select("id, nombre, ruta, fecha, gasto_id, carpeta_id, notas, gastos(concepto, total, fecha)")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false }),
      supabase
        .from("gastos")
        .select("id, fecha, concepto, total, tiene_factura")
        .order("fecha", { ascending: false })
        .limit(400),
    ]);
    if (a.error) return setError(a.error.message);
    setCarpetas((ca.data as Carpeta[]) ?? []);
    setArchivos((a.data as unknown as Archivo[]) ?? []);
    setGastos((g.data as Gasto[]) ?? []);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ---------- Carpetas ----------
  async function crearCarpeta() {
    const nombre = nombreCarpeta.trim();
    if (!nombre) return;
    const { error } = await supabase.from("compras_carpetas").insert({ nombre });
    if (error) return setError(error.message);
    setNombreCarpeta("");
    setCreandoCarpeta(false);
    cargar();
  }

  async function renombrarCarpeta(c: Carpeta, nombre: string) {
    setRenombrando(null);
    if (!nombre.trim() || nombre.trim() === c.nombre) return;
    const { error } = await supabase.from("compras_carpetas").update({ nombre: nombre.trim() }).eq("id", c.id);
    if (error) return setError(error.message);
    cargar();
  }

  async function borrarCarpeta(c: Carpeta) {
    const n = archivos.filter((a) => a.carpeta_id === c.id).length;
    const msg = n > 0
      ? `¿Borrar la carpeta "${c.nombre}"? Sus ${n} archivo(s) NO se borran: pasan a Inicio.`
      : `¿Borrar la carpeta vacía "${c.nombre}"?`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from("compras_carpetas").delete().eq("id", c.id);
    if (error) return setError(error.message);
    if (carpetaSel === c.id) setCarpetaSel(null);
    cargar();
  }

  async function moverArchivo(a: Archivo, carpetaId: number | null) {
    const { error } = await supabase.from("compras_archivos").update({ carpeta_id: carpetaId }).eq("id", a.id);
    if (error) return setError(error.message);
    cargar();
  }

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
      const ins = await supabase.from("compras_archivos").insert({
        nombre: file.name,
        ruta,
        fecha: fechaSubida,
        carpeta_id: carpetaSel,
      });
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

  // ---------- Vistas ----------
  const buscando = busqueda.trim() !== "";

  // Con búsqueda se mira en TODAS las carpetas; sin búsqueda, solo la carpeta actual
  const visibles = useMemo(() => {
    if (buscando) {
      const q = busqueda.trim().toLowerCase();
      return archivos.filter((a) => `${a.nombre} ${a.notas ?? ""} ${a.gastos?.concepto ?? ""}`.toLowerCase().includes(q));
    }
    return archivos.filter((a) => a.carpeta_id === carpetaSel);
  }, [archivos, busqueda, buscando, carpetaSel]);

  const conteo = useMemo(() => {
    const m = new Map<number | null, number>();
    for (const a of archivos) m.set(a.carpeta_id, (m.get(a.carpeta_id) ?? 0) + 1);
    return m;
  }, [archivos]);

  const carpetaActual = carpetas.find((c) => c.id === carpetaSel) ?? null;
  const nombreCarpetaDe = (id: number | null) => (id === null ? "Inicio" : carpetas.find((c) => c.id === id)?.nombre ?? "?");

  // Agrupar por mes (una sola cabecera, sin lío de trimestres)
  const mesDe = (f: string) =>
    new Date(f.slice(0, 7) + "-01T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const candidatos = useMemo(
    () => [...gastos].sort((a, b) => Number(a.tiene_factura) - Number(b.tiene_factura) || (a.fecha < b.fecha ? 1 : -1)),
    [gastos]
  );

  let mesAnterior = "";

  return (
    <div>
      {/* Barra: migas + búsqueda */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setCarpetaSel(null)}
            className={`rounded-lg px-2.5 py-1 font-bold ${carpetaSel === null && !buscando ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            🏠 Inicio
          </button>
          {carpetaActual && !buscando && (
            <>
              <span className="text-zinc-700">/</span>
              <span className="rounded-lg px-2 py-1 font-bold text-white">📁 {carpetaActual.nombre}</span>
            </>
          )}
          {buscando && (
            <>
              <span className="text-zinc-700">/</span>
              <span className="rounded-lg px-2 py-1 font-bold text-amber-400">Resultados de «{busqueda.trim()}»</span>
            </>
          )}
        </nav>
        <input
          placeholder="Buscar en todas las carpetas…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputCls} ml-auto min-w-52`}
        />
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Carpetas (solo en Inicio y sin búsqueda) */}
      {carpetaSel === null && !buscando && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {carpetas.map((c) => (
              <div
                key={c.id}
                className="group relative flex cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-3 hover:border-zinc-600 hover:bg-zinc-900"
                onClick={() => renombrando !== c.id && setCarpetaSel(c.id)}
              >
                <span className="text-2xl">📁</span>
                <div className="min-w-0 flex-1">
                  {renombrando === c.id ? (
                    <input
                      autoFocus
                      defaultValue={c.nombre}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => renombrarCarpeta(c, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-sm text-white outline-none focus:border-red-500"
                    />
                  ) : (
                    <p className="truncate text-sm font-bold text-zinc-200">{c.nombre}</p>
                  )}
                  <p className="text-[10px] text-zinc-600">{conteo.get(c.id) ?? 0} archivo(s)</p>
                </div>
                <div className="absolute right-1.5 top-1.5 hidden gap-0.5 group-hover:flex" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setRenombrando(c.id)} title="Renombrar" className="rounded px-1 text-xs text-zinc-500 hover:text-white">✎</button>
                  <button onClick={() => borrarCarpeta(c)} title="Borrar carpeta" className="rounded px-1 text-xs text-zinc-500 hover:text-red-400">✕</button>
                </div>
              </div>
            ))}

            {/* Nueva carpeta */}
            {creandoCarpeta ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-3.5 py-3">
                <span className="text-2xl">📁</span>
                <input
                  autoFocus
                  placeholder="Nombre…"
                  value={nombreCarpeta}
                  onChange={(e) => setNombreCarpeta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") crearCarpeta();
                    if (e.key === "Escape") setCreandoCarpeta(false);
                  }}
                  onBlur={() => (nombreCarpeta.trim() ? crearCarpeta() : setCreandoCarpeta(false))}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-sm text-white outline-none focus:border-red-500"
                />
              </div>
            ) : (
              <button
                onClick={() => setCreandoCarpeta(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 px-3.5 py-3 text-sm font-bold text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
              >
                + Nueva carpeta
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-600">
            Ejemplos: una carpeta por proveedor (HSN, Decathlon…) o por tipo (Suministros, Equipamiento, Online).
            Clic para entrar; los archivos se mueven entre carpetas con su desplegable 📁.
          </p>
        </div>
      )}

      {/* Subida (sube a la carpeta en la que estás) */}
      {!buscando && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-white ${subiendo ? "bg-zinc-700" : "bg-red-600 hover:bg-red-500"}`}>
            {subiendo ? "Subiendo…" : `⬆ Subir a ${carpetaActual ? `"${carpetaActual.nombre}"` : "Inicio"}`}
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
            PDF o foto de la factura del proveedor. Luego vincúlala a su gasto del Libro con el botón «Vincular».
          </span>
        </div>
      )}

      {/* Archivos */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {visibles.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
            {buscando
              ? "Nada coincide con la búsqueda."
              : carpetaSel === null
                ? "No hay archivos sueltos en Inicio. Sube facturas o entra en una carpeta."
                : "Esta carpeta está vacía. Sube la primera factura con el botón rojo."}
          </p>
        ) : (
          visibles.map((a) => {
            const mes = mesDe(a.fecha);
            const cabecera = mes !== mesAnterior;
            mesAnterior = mes;
            return (
              <Fragment key={a.id}>
                {cabecera && (
                  <div className="border-b border-zinc-800 bg-zinc-900/70 px-4 py-1.5 text-[11px] font-bold capitalize text-zinc-500">
                    {mes}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 px-4 py-2.5 last:border-0 hover:bg-zinc-900/40">
                  <span className="text-lg">{esImagen(a.nombre) ? "🖼" : "📄"}</span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => abrir(a)} className="block max-w-full truncate text-left text-sm font-semibold text-sky-400 hover:text-sky-300" title="Abrir el archivo">
                      {a.nombre}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-600">
                      <input
                        type="date"
                        defaultValue={a.fecha}
                        onBlur={(e) => cambiarFecha(a, e.target.value)}
                        className="rounded border border-transparent bg-transparent py-0.5 text-[10px] text-zinc-500 outline-none hover:border-zinc-700 focus:border-red-500"
                        title="Fecha de la factura"
                      />
                      {buscando && <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-bold">📁 {nombreCarpetaDe(a.carpeta_id)}</span>}
                    </div>
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

                  <select
                    value={a.carpeta_id ?? ""}
                    onChange={(e) => moverArchivo(a, e.target.value === "" ? null : Number(e.target.value))}
                    title="Mover a otra carpeta"
                    className="max-w-32 appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400 outline-none hover:border-zinc-600"
                  >
                    <option value="">📁 Inicio</option>
                    {carpetas.map((c) => (
                      <option key={c.id} value={c.id}>📁 {c.nombre}</option>
                    ))}
                  </select>

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
        Los archivos se guardan en un almacén privado (solo con sesión iniciada). <b>Vincular a gasto</b> conecta la factura
        con su apunte del Libro y lo marca como «tiene factura» — el Cierre de mes avisa de los gastos que siguen sin ella.
      </p>
    </div>
  );
}
