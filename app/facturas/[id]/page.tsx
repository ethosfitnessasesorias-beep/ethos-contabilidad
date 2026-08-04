"use client";

// Editor de factura estilo Holded: contacto, fechas, líneas de concepto
// (descripción, cantidad, precio), impuestos, totales en vivo, categorización,
// guardar como borrador y Aprobar (asigna el número legal de la serie).
// Una vez aprobada, se muestra el documento imprimible.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";

interface FacturaCompleta {
  id: number;
  numero: string | null;
  cliente_id: number | null;
  categoria_id: number | null;
  canal: string | null;
  atribucion: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  concepto: string;
  base: number;
  iva_pct: number;
  irpf_pct: number;
  iva_importe: number;
  irpf_importe: number;
  total: number;
  clientes: {
    nombre: string;
    apellidos: string | null;
    nif: string | null;
    direccion: string | null;
  } | null;
}

interface ConfigFacturacion {
  emisor_nombre: string;
  emisor_nif: string;
  emisor_direccion: string;
  serie: string;
  proximo_numero: number;
}

interface LineaBD { id: number; orden: number; concepto: string; descripcion: string | null; cantidad: number; precio: number }
interface Linea { concepto: string; descripcion: string; cantidad: string; precio: string }
interface CliMin { id: number; nombre: string; apellidos: string | null; nif: string | null; direccion: string | null }
interface CatMin { id: number; nombre: string }
interface PerMin { codigo: string; nombre: string }

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";
const etiquetaCls = "text-[10px] font-bold uppercase tracking-wider text-zinc-500";

export default function PaginaFactura() {
  const sesionOk = useSesion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const facturaId = Number(params.id);

  const [factura, setFactura] = useState<FacturaCompleta | null>(null);
  const [lineasBD, setLineasBD] = useState<LineaBD[]>([]);
  const [config, setConfig] = useState<ConfigFacturacion | null>(null);
  const [clientes, setClientes] = useState<CliMin[]>([]);
  const [categorias, setCategorias] = useState<CatMin[]>([]);
  const [personas, setPersonas] = useState<PerMin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [avisoOk, setAvisoOk] = useState<string | null>(null);

  // Estado editable del borrador
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [fCliente, setFCliente] = useState<number | "">("");
  const [fFecha, setFFecha] = useState("");
  const [fVence, setFVence] = useState("");
  const [fIva, setFIva] = useState(0.21);
  const [fIrpf, setFIrpf] = useState(0);
  const [fCategoria, setFCategoria] = useState<number | "">("");
  const [fCanal, setFCanal] = useState("presencial");
  const [fAtribucion, setFAtribucion] = useState("ethos");
  const [fNif, setFNif] = useState("");
  const [fDireccion, setFDireccion] = useState("");
  const [inicializado, setInicializado] = useState(false);

  const cargar = useCallback(async () => {
    const [f, l, c, cli, cat, per] = await Promise.all([
      supabase
        .from("facturas")
        .select("id, numero, cliente_id, categoria_id, canal, atribucion, fecha_emision, fecha_vencimiento, concepto, base, iva_pct, irpf_pct, iva_importe, irpf_importe, total, clientes(nombre, apellidos, nif, direccion)")
        .eq("id", facturaId)
        .single(),
      supabase.from("factura_lineas").select("*").eq("factura_id", facturaId).order("orden").order("id"),
      supabase.from("facturacion_config").select("*").eq("id", 1).single(),
      supabase.from("clientes").select("id, nombre, apellidos, nif, direccion").order("nombre"),
      supabase.from("categorias").select("id, nombre").eq("tipo", "ingreso").eq("activa", true).order("nombre"),
      supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
    ]);
    if (f.error) return setError(f.error.message);
    if (c.error)
      return setError("Falta la configuración de facturación: ejecuta supabase/facturacion.sql en el SQL Editor.");
    const fac = f.data as unknown as FacturaCompleta;
    setFactura(fac);
    setLineasBD((l.data as LineaBD[]) ?? []);
    setConfig(c.data as ConfigFacturacion);
    setClientes((cli.data as CliMin[]) ?? []);
    setCategorias((cat.data as CatMin[]) ?? []);
    setPersonas((per.data as PerMin[]) ?? []);
  }, [facturaId]);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  // Volcar la factura al formulario (solo la primera vez que llega)
  useEffect(() => {
    if (!factura || inicializado) return;
    setFCliente(factura.cliente_id ?? "");
    setFFecha(factura.fecha_emision);
    setFVence(factura.fecha_vencimiento ?? "");
    setFIva(Number(factura.iva_pct));
    setFIrpf(Number(factura.irpf_pct));
    setFCategoria(factura.categoria_id ?? "");
    setFCanal(factura.canal ?? "presencial");
    setFAtribucion(factura.atribucion);
    setFNif(factura.clientes?.nif ?? "");
    setFDireccion(factura.clientes?.direccion ?? "");
    setLineas(
      lineasBD.length > 0
        ? lineasBD.map((x) => ({
            concepto: x.concepto,
            descripcion: x.descripcion ?? "",
            cantidad: String(x.cantidad),
            precio: String(x.precio),
          }))
        : [{
            concepto: factura.concepto,
            descripcion: "",
            cantidad: "1",
            // El precio de línea es final (IVA incluido); la base guardada se reconstruye
            precio: String(r2(Number(factura.base) * (1 + Number(factura.iva_pct)))),
          }]
    );
    setInicializado(true);
  }, [factura, lineasBD, inicializado]);

  // Al elegir contacto, traer su NIF y dirección a los campos
  function elegirCliente(v: string) {
    const id = v === "" ? "" : Number(v);
    setFCliente(id);
    const c = clientes.find((x) => x.id === id);
    setFNif(c?.nif ?? "");
    setFDireccion(c?.direccion ?? "");
  }

  // Los precios de las líneas son FINALES (IVA incluido): la base sale hacia atrás.
  // Ej: precio 100 con IVA 21% → base 82,64 + IVA 17,36 = total 100.
  const totales = useMemo(() => {
    const conIva = r2(lineas.reduce((s, l) => s + r2(num(l.cantidad) * num(l.precio)), 0));
    const base = fIva > 0 ? r2(conIva / (1 + fIva)) : conIva;
    const iva = r2(conIva - base);
    const irpf = r2(base * fIrpf);
    return { conIva, base, iva, irpf, total: r2(conIva - irpf) };
  }, [lineas, fIva, fIrpf]);

  const setLinea = (i: number, campo: keyof Linea, valor: string) =>
    setLineas((prev) => prev.map((l, k) => (k === i ? { ...l, [campo]: valor } : l)));

  // Concepto agregado para listados y matriz (la 1ª línea manda)
  const conceptoAgregado = () => {
    const cs = lineas.map((l) => l.concepto.trim()).filter(Boolean);
    if (cs.length === 0) return factura?.concepto ?? "Factura";
    return cs.length === 1 ? cs[0] : `${cs[0]} · +${cs.length - 1}`.slice(0, 180);
  };

  async function guardar(silencioso = false): Promise<boolean> {
    if (!factura) return false;
    if (lineas.every((l) => !l.concepto.trim())) {
      setError("Pon al menos un concepto.");
      return false;
    }
    setGuardando(true);
    setError(null);
    const upd = await supabase
      .from("facturas")
      .update({
        cliente_id: fCliente === "" ? null : fCliente,
        categoria_id: fCategoria === "" ? null : fCategoria,
        canal: fCanal,
        atribucion: fAtribucion,
        fecha_emision: fFecha,
        fecha_vencimiento: fVence || null,
        concepto: conceptoAgregado(),
        base: totales.base,
        iva_pct: fIva,
        irpf_pct: fIrpf,
      })
      .eq("id", facturaId);
    if (upd.error) {
      setGuardando(false);
      setError(upd.error.message);
      return false;
    }
    // Reescribir las líneas
    await supabase.from("factura_lineas").delete().eq("factura_id", facturaId);
    const filas = lineas
      .filter((l) => l.concepto.trim() || num(l.precio) !== 0)
      .map((l, i) => ({
        factura_id: facturaId,
        orden: i,
        concepto: l.concepto.trim(),
        descripcion: l.descripcion.trim() || null,
        cantidad: num(l.cantidad) || 1,
        precio: r2(num(l.precio)),
      }));
    if (filas.length) {
      const ins = await supabase.from("factura_lineas").insert(filas);
      if (ins.error) {
        setGuardando(false);
        setError(ins.error.message);
        return false;
      }
    }
    // Ficha del cliente: NIF y dirección valen para futuras facturas
    if (fCliente !== "") {
      await supabase.from("clientes").update({ nif: fNif.trim() || null, direccion: fDireccion.trim() || null }).eq("id", fCliente);
    }
    setGuardando(false);
    if (!silencioso) {
      setAvisoOk("Borrador guardado ✓");
      setTimeout(() => setAvisoOk(null), 2500);
    }
    await cargar();
    return true;
  }

  // Aprobar = guardar + asignar el siguiente número de la serie (una sola vez)
  async function aprobar() {
    if (!config || !factura) return;
    const ok = await guardar(true);
    if (!ok) return;
    setEmitiendo(true);
    const numero = `${config.serie}${String(config.proximo_numero).padStart(4, "0")}`;
    const consumo = await supabase
      .from("facturacion_config")
      .update({ proximo_numero: config.proximo_numero + 1 })
      .eq("id", 1)
      .eq("proximo_numero", config.proximo_numero)
      .select();
    if (consumo.error || !consumo.data?.length) {
      setEmitiendo(false);
      await cargar();
      return setError("El número ya fue usado, vuelve a intentarlo.");
    }
    const upd = await supabase.from("facturas").update({ numero }).eq("id", facturaId).is("numero", null).select();
    setEmitiendo(false);
    if (upd.error || !upd.data?.length) return setError("Esta factura ya tenía número asignado.");
    setError(null);
    cargar();
  }

  if (sesionOk === null || (!factura && !error)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  const emitida = !!factura?.numero;
  const clienteSel = clientes.find((c) => c.id === fCliente);
  const nombreCliente = clienteSel ? `${clienteSel.nombre} ${clienteSel.apellidos ?? ""}`.trim() : factura?.clientes?.nombre ?? "";

  // Líneas para el documento: las del editor (borrador) o las guardadas (emitida)
  const lineasDoc: { concepto: string; descripcion: string | null; cantidad: number; precio: number }[] = emitida
    ? lineasBD.length
      ? lineasBD.map((x) => ({ concepto: x.concepto, descripcion: x.descripcion, cantidad: Number(x.cantidad), precio: Number(x.precio) }))
      : factura
        ? [{ concepto: factura.concepto, descripcion: null, cantidad: 1, precio: r2(Number(factura.base) * (1 + Number(factura.iva_pct))) }]
        : []
    : lineas
        .filter((l) => l.concepto.trim() || num(l.precio) !== 0)
        .map((l) => ({ concepto: l.concepto, descripcion: l.descripcion || null, cantidad: num(l.cantidad) || 1, precio: num(l.precio) }));

  const docBase = emitida && factura ? Number(factura.base) : totales.base;
  const docIva = emitida && factura ? Number(factura.iva_importe) : totales.iva;
  const docIrpf = emitida && factura ? Number(factura.irpf_importe) : totales.irpf;
  const docTotal = emitida && factura ? Number(factura.total) : totales.total;
  const docIvaPct = emitida && factura ? Number(factura.iva_pct) : fIva;
  const docIrpfPct = emitida && factura ? Number(factura.irpf_pct) : fIrpf;

  const documento = factura && config && (
    <div className="rounded-2xl bg-white p-8 text-zinc-900 shadow print:rounded-none print:p-10 print:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">FACTURA</h1>
          <p className="mt-1 text-sm font-semibold">
            Nº {factura.numero ?? `(borrador — saldrá como ${config.serie}${String(config.proximo_numero).padStart(4, "0")})`}
          </p>
          <p className="text-sm">Fecha: {new Date(emitida ? factura.fecha_emision : fFecha || factura.fecha_emision).toLocaleDateString("es-ES")}</p>
          {(emitida ? factura.fecha_vencimiento : fVence) && (
            <p className="text-sm">Vencimiento: {new Date((emitida ? factura.fecha_vencimiento : fVence) as string).toLocaleDateString("es-ES")}</p>
          )}
        </div>
        <div className="text-right text-sm">
          <p className="text-lg font-black">ETHOS</p>
          <p className="font-semibold">{config.emisor_nombre}</p>
          <p>NIF {config.emisor_nif}</p>
          <p className="max-w-52">{config.emisor_direccion}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-zinc-100 p-4 text-sm print:bg-zinc-100">
        <p className="text-xs font-bold uppercase text-zinc-500">Cliente</p>
        <p className="font-semibold">{nombreCliente || "Cliente particular"}</p>
        {(emitida ? factura.clientes?.nif : fNif) && <p>NIF {emitida ? factura.clientes?.nif : fNif}</p>}
        {(emitida ? factura.clientes?.direccion : fDireccion) && <p>{emitida ? factura.clientes?.direccion : fDireccion}</p>}
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-900 text-left">
            <th className="py-2">Concepto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Precio (IVA incl.)</th>
            <th className="py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {lineasDoc.map((l, i) => (
            <tr key={i} className="border-b border-zinc-200">
              <td className="py-3">
                {l.concepto}
                {l.descripcion && <span className="block text-xs text-zinc-500">{l.descripcion}</span>}
              </td>
              <td className="py-3 text-right">{l.cantidad}</td>
              <td className="py-3 text-right">{eur(l.precio)}</td>
              <td className="py-3 text-right font-semibold">{eur(r2(l.cantidad * l.precio))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 text-sm">
          <div className="flex justify-between py-1"><span>Base imponible</span><span>{eur(docBase)}</span></div>
          <div className="flex justify-between py-1">
            <span>IVA ({Math.round(docIvaPct * 100)}%)</span><span>{eur(docIva)}</span>
          </div>
          {docIrpfPct > 0 && (
            <div className="flex justify-between py-1">
              <span>IRPF ({Math.round(docIrpfPct * 100)}%)</span><span>−{eur(docIrpf)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-2.5 text-white print:bg-zinc-900">
            <span className="text-sm">TOTAL</span>
            <span className="text-xl font-black">{eur(docTotal)}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-zinc-400">
        Factura emitida por {config.emisor_nombre}, NIF {config.emisor_nif}.
        {docIvaPct === 0 && " Operación sin IVA."}
      </p>
    </div>
  );

  return (
    <main className="mx-auto min-h-dvh max-w-4xl bg-zinc-950 px-4 pb-16 pt-4 print:max-w-none print:bg-white print:p-0">
      {/* Barra superior (no sale en el PDF) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-lg text-zinc-500 hover:text-zinc-300" aria-label="Volver">←</button>
          <h1 className="text-xl font-black tracking-tight text-white">
            {emitida ? `Factura ${factura?.numero}` : "Nueva factura"}
          </h1>
          {!emitida && <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">borrador</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {emitida ? (
            <button onClick={() => window.print()} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white">
              Imprimir / Guardar PDF
            </button>
          ) : (
            <>
              <button
                onClick={() => setVistaPrevia(!vistaPrevia)}
                className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-zinc-700"
              >
                {vistaPrevia ? "← Seguir editando" : "👁 Vista previa"}
              </button>
              <button
                onClick={() => guardar()}
                disabled={guardando}
                className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar como borrador"}
              </button>
              <button
                onClick={aprobar}
                disabled={emitiendo || guardando}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {emitiendo ? "Aprobando…" : `Aprobar como ${config?.serie}${String(config?.proximo_numero ?? 0).padStart(4, "0")}`}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300 print:hidden">{error}</p>}
      {avisoOk && <p className="mb-4 rounded-xl bg-emerald-950 px-4 py-3 text-sm text-emerald-300 print:hidden">{avisoOk}</p>}

      {/* EDITOR (borrador) o DOCUMENTO (vista previa / emitida) */}
      {emitida || vistaPrevia ? (
        documento
      ) : (
        factura && (
          <div className="flex flex-col gap-4 print:hidden">
            {/* Cabecera: contacto, número, fechas */}
            <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span className={etiquetaCls}>Contacto</span>
                <select value={fCliente} onChange={(e) => elegirCliente(e.target.value)} className={`${inputCls} appearance-none`}>
                  <option value="">— Sin contacto (venta particular) —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ""}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={etiquetaCls}>Número de documento</span>
                <input value={`${config?.serie ?? ""}${String(config?.proximo_numero ?? 0).padStart(4, "0")}`} disabled className={`${inputCls} opacity-60`} title="Se asigna al aprobar (numeración correlativa)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className={etiquetaCls}>Fecha</span>
                <input type="date" value={fFecha} onChange={(e) => setFFecha(e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={etiquetaCls}>Vencimiento</span>
                <input type="date" value={fVence} onChange={(e) => setFVence(e.target.value)} className={inputCls} />
              </label>
              {fCliente !== "" && (
                <>
                  <label className="flex flex-col gap-1 sm:col-span-1">
                    <span className={etiquetaCls}>NIF del cliente</span>
                    <input value={fNif} onChange={(e) => setFNif(e.target.value)} placeholder="Para factura completa" className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-3">
                    <span className={etiquetaCls}>Dirección del cliente</span>
                    <input value={fDireccion} onChange={(e) => setFDireccion(e.target.value)} placeholder="Se guarda en su ficha" className={inputCls} />
                  </label>
                </>
              )}
            </div>

            {/* Líneas */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2.5 text-left">Concepto</th>
                    <th className="px-3 py-2.5 text-left">Descripción</th>
                    <th className="w-20 px-2 py-2.5 text-right">Cantidad</th>
                    <th className="w-24 px-2 py-2.5 text-right">Precio (IVA incl.)</th>
                    <th className="w-24 px-2 py-2.5 text-center">Impuestos</th>
                    <th className="w-24 px-3 py-2.5 text-right">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l, i) => (
                    <tr key={i} className="border-b border-zinc-800/60 last:border-0">
                      <td className="px-2 py-1.5">
                        <input
                          value={l.concepto}
                          onChange={(e) => setLinea(i, "concepto", e.target.value)}
                          placeholder="Escribe el concepto"
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500 focus:bg-zinc-950"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={l.descripcion}
                          onChange={(e) => setLinea(i, "descripcion", e.target.value)}
                          placeholder="Desc"
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-zinc-400 outline-none placeholder:text-zinc-700 focus:border-red-500 focus:bg-zinc-950"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={l.cantidad}
                          onChange={(e) => setLinea(i, "cantidad", e.target.value)}
                          inputMode="decimal"
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-white outline-none focus:border-red-500 focus:bg-zinc-950"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={l.precio}
                          onChange={(e) => setLinea(i, "precio", e.target.value)}
                          inputMode="decimal"
                          placeholder="0"
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-white outline-none focus:border-red-500 focus:bg-zinc-950"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                          {fIva > 0 ? `IVA ${Math.round(fIva * 100)}%` : "Sin IVA"}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-sm font-bold tabular-nums text-white">
                        {eur(r2(num(l.cantidad) * num(l.precio)))}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          onClick={() => setLineas((prev) => (prev.length > 1 ? prev.filter((_, k) => k !== i) : prev))}
                          title="Quitar línea"
                          className="font-bold text-zinc-700 hover:text-red-400"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-zinc-800 px-3 py-2">
                <button
                  onClick={() => setLineas((prev) => [...prev, { concepto: "", descripcion: "", cantidad: "1", precio: "" }])}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  + Añadir línea
                </button>
              </div>
            </div>

            {/* Impuestos + totales y categorización */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-sm font-black text-white">Categorización</p>
                <label className="flex flex-col gap-1">
                  <span className={etiquetaCls}>Categoría de ingreso</span>
                  <select value={fCategoria} onChange={(e) => setFCategoria(e.target.value === "" ? "" : Number(e.target.value))} className={`${inputCls} appearance-none`}>
                    <option value="">— Elegir —</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </label>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500">Negocio:</span>
                  {["presencial", "online"].map((c) => (
                    <button key={c} onClick={() => setFCanal(c)} className={`rounded-full px-3 py-1 font-bold capitalize ${fCanal === c ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{c}</button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500">De:</span>
                  {personas.map((p) => (
                    <button key={p.codigo} onClick={() => setFAtribucion(p.codigo)} className={`rounded-full px-3 py-1 font-bold ${fAtribucion === p.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>{p.nombre}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Base imponible <span className="text-[10px] text-zinc-600">(calculada)</span></span>
                  <span className="font-bold tabular-nums text-white">{eur(totales.base)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <select value={fIva} onChange={(e) => setFIva(Number(e.target.value))} className={`${inputCls} appearance-none py-1`}>
                    <option value={0.21}>IVA 21%</option>
                    <option value={0.1}>IVA 10%</option>
                    <option value={0.04}>IVA 4%</option>
                    <option value={0}>Sin IVA</option>
                  </select>
                  <span className="tabular-nums text-zinc-300">{eur(totales.iva)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <select value={fIrpf} onChange={(e) => setFIrpf(Number(e.target.value))} className={`${inputCls} appearance-none py-1`}>
                    <option value={0}>Sin IRPF</option>
                    <option value={0.07}>IRPF 7%</option>
                    <option value={0.15}>IRPF 15%</option>
                    <option value={0.19}>IRPF 19%</option>
                  </select>
                  <span className="tabular-nums text-zinc-300">{totales.irpf > 0 ? `−${eur(totales.irpf)}` : eur(0)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-zinc-800 pt-2">
                  <span className="text-sm font-black text-white">Total</span>
                  <span className="text-2xl font-black tabular-nums text-white">{eur(totales.total)}</span>
                </div>
                <p className="text-[10px] leading-snug text-zinc-600">
                  Los precios de las líneas son <b>finales (IVA incluido)</b>: si pones 100 €, el total es 100 € y la base
                  imponible se calcula sola. El IVA y el IRPF se aplican a toda la factura. Al aprobar se asigna el número{" "}
                  {config?.serie}{String(config?.proximo_numero ?? 0).padStart(4, "0")} y ya no se puede cambiar.
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </main>
  );
}
