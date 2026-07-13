"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shell } from "./shell";
import {
  METODO_POR_CUENTA,
  type Canal,
  type Categoria,
  type Cliente,
  type Cuenta,
  type MetodoPago,
} from "@/lib/tipos";

interface Persona {
  codigo: string;
  nombre: string;
}
interface Metodo {
  codigo: string;
  nombre: string;
}
interface Impuesto {
  id: number;
  nombre: string;
  clase: "iva" | "irpf";
  pct: number;
  aplica_ingreso: boolean;
  aplica_gasto: boolean;
}
type Unidad = "dia" | "semana" | "mes";

type Pestana = "ingreso" | "gasto" | "traspaso";

// Preferencias que se recuerdan entre usos (por dispositivo)
interface Prefs {
  atribucion: string;
  categoriaIngresoId: number | null;
  cuentaCodigo: string;
}
const PREFS_KEY = "ethos_prefs";

const hoy = () => new Date().toISOString().slice(0, 10);

function parseImporte(texto: string): number | null {
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

// ---------- UI básicos ----------

function Chips<T extends string | number>(props: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T | null;
  onCambio: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          onClick={() => props.onCambio(o.valor)}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
            props.valor === o.valor
              ? "bg-red-600 text-white"
              : "bg-zinc-800 text-zinc-300 active:bg-zinc-700"
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

function Campo(props: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {props.etiqueta}
      </span>
      {props.children}
    </div>
  );
}

function Toggle(props: {
  etiqueta: string;
  activo: boolean;
  onCambio: (v: boolean) => void;
  deshabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={props.deshabilitado}
      onClick={() => props.onCambio(!props.activo)}
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${
        props.activo ? "bg-red-950 text-red-300" : "bg-zinc-900 text-zinc-400"
      } ${props.deshabilitado ? "opacity-40" : ""}`}
    >
      {props.etiqueta}
      <span
        className={`ml-3 inline-block h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
          props.activo ? "bg-red-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition-transform ${
            props.activo ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-white placeholder-zinc-600 outline-none focus:border-red-500";

// Selector de recurrencia: cada N días / semanas / meses
function RecurrenciaCampo(props: {
  cada: string;
  setCada: (v: string) => void;
  unidad: Unidad;
  setUnidad: (v: Unidad) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3">
      <span className="text-sm text-zinc-400">Cada</span>
      <input
        inputMode="numeric"
        value={props.cada}
        onChange={(e) => props.setCada(e.target.value)}
        className="w-14 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-center text-white outline-none focus:border-red-500"
      />
      <select
        value={props.unidad}
        onChange={(e) => props.setUnidad(e.target.value as Unidad)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white outline-none"
      >
        <option value="dia">día(s)</option>
        <option value="semana">semana(s)</option>
        <option value="mes">mes(es)</option>
      </select>
    </div>
  );
}

// ---------- Página ----------

export default function EntradaRapida() {
  const router = useRouter();
  const [sesionOk, setSesionOk] = useState<boolean | null>(null);

  // Catálogos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [metodosPago, setMetodosPago] = useState<Metodo[]>([]);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [ivaGeneral, setIvaGeneral] = useState(0.21);

  const [pestana, setPestana] = useState<Pestana>("ingreso");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Campos comunes
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const importeRef = useRef<HTMLInputElement>(null);

  // Ingreso
  const [atribucion, setAtribucion] = useState<string>("ethos");
  const [categoriaIngresoId, setCategoriaIngresoId] = useState<number | null>(null);
  const [canal, setCanal] = useState<Canal>("presencial");
  const [clienteNombre, setClienteNombre] = useState("");
  const [concepto, setConcepto] = useState("");
  const [ivaPctIngreso, setIvaPctIngreso] = useState<number>(0.21);
  const [irpfPctIngreso, setIrpfPctIngreso] = useState<number>(0);
  const [cobrado, setCobrado] = useState(true);
  const [recurrente, setRecurrente] = useState(false);
  const [recurCada, setRecurCada] = useState("1");
  const [recurUnidad, setRecurUnidad] = useState<Unidad>("mes");
  const [cuentaCodigo, setCuentaCodigo] = useState("banco");
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");

  // Gasto
  const [categoriaGastoId, setCategoriaGastoId] = useState<number | null>(null);
  const [proveedor, setProveedor] = useState("");
  const [ivaPctGasto, setIvaPctGasto] = useState<number>(0.21);
  const [irpfPctGasto, setIrpfPctGasto] = useState<number>(0);
  const [canalGasto, setCanalGasto] = useState<Canal>("presencial");
  const [gastoFijo, setGastoFijo] = useState(false);
  const [tieneFactura, setTieneFactura] = useState(true);
  const [deducible, setDeducible] = useState(true);
  const [imputadoA, setImputadoA] = useState<string>("ethos");
  const [esDevolucion, setEsDevolucion] = useState(false);

  // Alta rápida de categoría de ingreso desde el propio formulario
  const [creandoCat, setCreandoCat] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");

  // Traspaso
  const [origenCodigo, setOrigenCodigo] = useState("caja");
  const [destinoCodigo, setDestinoCodigo] = useState("banco");
  const [motivo, setMotivo] = useState("");

  // --- Sesión + catálogos ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setSesionOk(true);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const [cat, cue, cli, cfg, per, met, imp] = await Promise.all([
        supabase.from("categorias").select("*").eq("activa", true).order("grupo").order("nombre"),
        supabase.from("cuentas").select("*").eq("activa", true).order("id"),
        supabase.from("clientes").select("id, nombre, entrenador").is("fecha_baja", null).order("nombre"),
        supabase.from("config").select("clave, valor").eq("clave", "iva_general").single(),
        supabase.from("personas").select("codigo, nombre").eq("activa", true).order("orden"),
        supabase.from("metodos_pago").select("codigo, nombre").eq("activo", true).order("orden"),
        supabase.from("impuestos").select("*").eq("activo", true).order("orden"),
      ]);
      setCategorias((cat.data as Categoria[]) ?? []);
      setCuentas((cue.data as Cuenta[]) ?? []);
      setClientes((cli.data as Cliente[]) ?? []);
      setPersonas((per.data as Persona[]) ?? []);
      setMetodosPago((met.data as Metodo[]) ?? []);
      setImpuestos((imp.data as Impuesto[]) ?? []);
      if (cfg.data) setIvaGeneral(Number(cfg.data.valor));

      // Preferencias recordadas
      try {
        const p: Prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
        if (p.atribucion) setAtribucion(p.atribucion);
        if (p.categoriaIngresoId) setCategoriaIngresoId(p.categoriaIngresoId);
        if (p.cuentaCodigo) {
          setCuentaCodigo(p.cuentaCodigo);
          setMetodo(METODO_POR_CUENTA[p.cuentaCodigo] ?? "transferencia");
        }
      } catch {}

      // Deal ganado en el Pipeline: llega con la primera factura pre-rellenada
      try {
        const crudo = sessionStorage.getItem("prefill_ingreso");
        if (crudo) {
          sessionStorage.removeItem("prefill_ingreso");
          const pre = JSON.parse(crudo);
          setPestana("ingreso");
          if (pre.importe) setImporte(String(pre.importe));
          if (pre.clienteNombre) setClienteNombre(pre.clienteNombre);
          if (pre.concepto) setConcepto(pre.concepto);
          if (pre.canal) setCanal(pre.canal);
          if (pre.atribucion) setAtribucion(pre.atribucion);
          setToast({ tipo: "ok", texto: "Deal ganado 🎉 Revisa y guarda su primera factura" });
          setTimeout(() => setToast(null), 4000);
        }
      } catch {}
    })();
  }, [sesionOk]);

  const guardarPrefs = useCallback((p: Partial<Prefs>) => {
    try {
      const actual = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...actual, ...p }));
    } catch {}
  }, []);

  const catIngreso = useMemo(() => categorias.filter((c) => c.tipo === "ingreso"), [categorias]);
  const catGasto = useMemo(() => categorias.filter((c) => c.tipo === "gasto"), [categorias]);
  const gruposGasto = useMemo(() => {
    const g = new Map<string, Categoria[]>();
    for (const c of catGasto) g.set(c.grupo, [...(g.get(c.grupo) ?? []), c]);
    return [...g.entries()];
  }, [catGasto]);
  const ivaIngreso = impuestos.filter((i) => i.clase === "iva" && i.aplica_ingreso);
  const irpfIngreso = impuestos.filter((i) => i.clase === "irpf" && i.aplica_ingreso);
  const ivaGasto = impuestos.filter((i) => i.clase === "iva" && i.aplica_gasto);
  const irpfGasto = impuestos.filter((i) => i.clase === "irpf" && i.aplica_gasto);
  const cuentaId = (codigo: string) => cuentas.find((c) => c.codigo === codigo)?.id;

  async function crearCategoriaRapida() {
    const nombre = nuevaCatNombre.trim();
    if (!nombre) return;
    const { data, error } = await supabase
      .from("categorias")
      .insert({ tipo: "ingreso", grupo: "Ingreso", nombre })
      .select("*")
      .single();
    if (error || !data) return avisar("error", error?.message ?? "No se pudo crear");
    setCategorias((prev) => [...prev, data as Categoria]);
    setCategoriaIngresoId((data as Categoria).id);
    setNuevaCatNombre("");
    setCreandoCat(false);
  }

  function elegirCuenta(codigo: string) {
    setCuentaCodigo(codigo);
    setMetodo(METODO_POR_CUENTA[codigo] ?? "transferencia");
    guardarPrefs({ cuentaCodigo: codigo });
  }

  function avisar(tipo: "ok" | "error", texto: string) {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), tipo === "ok" ? 2000 : 5000);
  }

  function limpiarTrasGuardar() {
    setImporte("");
    setConcepto("");
    setClienteNombre("");
    setProveedor("");
    setMotivo("");
    setFecha(hoy());
    importeRef.current?.focus();
  }

  // --- Guardado ---

  async function guardarIngreso() {
    const imp = parseImporte(importe);
    if (!imp) return avisar("error", "Pon un importe válido.");
    if (!categoriaIngresoId) return avisar("error", "Elige una categoría.");

    const ivaPct = ivaPctIngreso;
    const irpfPct = irpfPctIngreso;
    const base = Math.round((imp / (1 + ivaPct - irpfPct)) * 100) / 100;
    const cliente = clientes.find(
      (c) => c.nombre.toLowerCase() === clienteNombre.trim().toLowerCase()
    );
    const nombreCat = catIngreso.find((c) => c.id === categoriaIngresoId)?.nombre ?? "Ingreso";
    const conceptoFinal = concepto.trim() || (cliente ? `${nombreCat} — ${cliente.nombre}` : nombreCat);

    setGuardando(true);
    const { data: factura, error: e1 } = await supabase
      .from("facturas")
      .insert({
        cliente_id: cliente?.id ?? null,
        categoria_id: categoriaIngresoId,
        atribucion,
        fecha_emision: fecha,
        concepto: conceptoFinal,
        base,
        iva_pct: ivaPct,
        irpf_pct: irpfPct,
        es_recurrente: recurrente,
        canal,
      })
      .select("id")
      .single();

    if (e1 || !factura) {
      setGuardando(false);
      return avisar("error", `No se guardó la factura: ${e1?.message}`);
    }

    if (cobrado) {
      const { error: e2 } = await supabase.from("cobros").insert({
        factura_id: factura.id,
        fecha,
        importe: imp,
        cuenta_id: cuentaId(cuentaCodigo),
        metodo,
      });
      if (e2) {
        setGuardando(false);
        return avisar("error", `Factura creada, pero el cobro falló: ${e2.message}`);
      }
    }
    if (recurrente) await registrarRecurrente("ingreso", conceptoFinal, imp);
    setGuardando(false);
    avisar("ok", cobrado ? `Ingreso de ${imp} € guardado ✓` : "Factura pendiente creada ✓");
    limpiarTrasGuardar();
  }

  // Crea/actualiza una línea de tesorería para lo recurrente (sin duplicar)
  async function registrarRecurrente(tipo: "ingreso" | "gasto", conceptoR: string, importeR: number) {
    const { data } = await supabase
      .from("tesoreria_recurrentes")
      .select("id")
      .eq("concepto", conceptoR)
      .eq("tipo", tipo)
      .limit(1);
    const fila = {
      concepto: conceptoR,
      tipo,
      importe: importeR,
      cada: Math.max(1, Number(recurCada) || 1),
      unidad: recurUnidad,
      cada_meses: recurUnidad === "mes" ? Math.max(1, Number(recurCada) || 1) : 1,
    };
    if (data && data.length) await supabase.from("tesoreria_recurrentes").update(fila).eq("id", data[0].id);
    else await supabase.from("tesoreria_recurrentes").insert(fila);
  }

  async function guardarGasto() {
    const imp = parseImporte(importe);
    if (!imp) return avisar("error", "Pon un importe válido.");
    if (!categoriaGastoId) return avisar("error", "Elige una categoría.");
    if (!concepto.trim()) return avisar("error", "Escribe el concepto.");

    // Una devolución de compra es el mismo gasto pero en negativo
    const signo = esDevolucion ? -1 : 1;
    const base = (signo * Math.round((imp / (1 + ivaPctGasto)) * 100)) / 100;
    const esDeducible = deducible && tieneFactura;

    setGuardando(true);
    const { error } = await supabase.from("gastos").insert({
      fecha,
      concepto: concepto.trim(),
      proveedor: proveedor.trim() || null,
      categoria_id: categoriaGastoId,
      cuenta_id: cuentaId(cuentaCodigo),
      imputado_a: imputadoA,
      base,
      iva_pct: ivaPctGasto,
      iva_soportado: esDeducible ? Math.round(base * ivaPctGasto * 100) / 100 : 0,
      irpf_pct: irpfPctGasto,
      canal: canalGasto,
      es_fijo: gastoFijo,
      deducible: esDeducible,
      tiene_factura: tieneFactura,
    });
    if (error) {
      setGuardando(false);
      return avisar("error", `No se guardó: ${error.message}`);
    }
    if (recurrente && !esDevolucion) await registrarRecurrente("gasto", concepto.trim(), imp);
    setGuardando(false);
    avisar("ok", esDevolucion ? `Devolución de ${imp} € guardada ✓` : `Gasto de ${imp} € guardado ✓`);
    setEsDevolucion(false);
    limpiarTrasGuardar();
  }

  async function guardarTraspaso() {
    const imp = parseImporte(importe);
    if (!imp) return avisar("error", "Pon un importe válido.");
    if (origenCodigo === destinoCodigo)
      return avisar("error", "Origen y destino no pueden ser la misma cuenta.");

    setGuardando(true);
    const { error } = await supabase.from("traspasos").insert({
      fecha,
      cuenta_origen_id: cuentaId(origenCodigo),
      cuenta_destino_id: cuentaId(destinoCodigo),
      importe: imp,
      motivo: motivo.trim() || null,
    });
    setGuardando(false);
    if (error) return avisar("error", `No se guardó: ${error.message}`);
    avisar("ok", `Traspaso de ${imp} € guardado ✓`);
    limpiarTrasGuardar();
  }

  const guardar =
    pestana === "ingreso" ? guardarIngreso : pestana === "gasto" ? guardarGasto : guardarTraspaso;

  if (sesionOk === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  const opcCuentas = cuentas.map((c) => ({ valor: c.codigo, etiqueta: c.nombre.split(" (")[0] }));

  return (
    <Shell titulo="Apuntar">
      <main className="mx-auto flex max-w-md flex-col px-4 pb-48 pt-6">

      {/* Pestañas */}
      <div className="mb-5 grid grid-cols-3 rounded-xl bg-zinc-900 p-1">
        {(
          [
            ["ingreso", "Ingreso"],
            ["gasto", "Gasto"],
            ["traspaso", "Traspaso"],
          ] as [Pestana, string][]
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            onClick={() => setPestana(id)}
            className={`rounded-lg py-2.5 text-sm font-bold ${
              pestana === id ? "bg-red-600 text-white" : "text-zinc-400"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {/* Importe */}
      <div className="mb-5">
        <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5">
          <input
            ref={importeRef}
            inputMode="decimal"
            placeholder="0,00"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            className="w-full bg-transparent py-4 text-4xl font-black text-white placeholder-zinc-700 outline-none"
          />
          <span className="text-3xl font-black text-zinc-600">€</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* ---------- INGRESO ---------- */}
        {pestana === "ingreso" && (
          <>
            <Campo etiqueta="¿Qué es?">
              <div className="flex gap-2">
                <select
                  value={categoriaIngresoId ?? ""}
                  onChange={(e) => {
                    const v = Number(e.target.value) || null;
                    setCategoriaIngresoId(v);
                    const cat = catIngreso.find((c) => c.id === v);
                    if (cat) setCanal(cat.es_online ? "online" : "presencial");
                    guardarPrefs({ categoriaIngresoId: v });
                  }}
                  className={`${inputCls} flex-1 appearance-none`}
                >
                  <option value="">Elegir…</option>
                  {catIngreso.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreandoCat(!creandoCat)}
                  className="shrink-0 rounded-xl bg-zinc-800 px-4 text-lg font-black text-zinc-300"
                >
                  {creandoCat ? "×" : "+"}
                </button>
              </div>
              {creandoCat && (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    placeholder="Nombre de la categoría nueva"
                    value={nuevaCatNombre}
                    onChange={(e) => setNuevaCatNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && crearCategoriaRapida()}
                    className={inputCls}
                  />
                  <button type="button" onClick={crearCategoriaRapida} className="shrink-0 rounded-xl bg-red-600 px-4 text-sm font-bold text-white">
                    Crear
                  </button>
                </div>
              )}
            </Campo>

            <Campo etiqueta="Negocio">
              <Chips
                opciones={[
                  { valor: "presencial" as Canal, etiqueta: "Presencial" },
                  { valor: "online" as Canal, etiqueta: "Online" },
                ]}
                valor={canal}
                onCambio={setCanal}
              />
            </Campo>

            <Campo etiqueta="¿De quién?">
              <select
                value={atribucion}
                onChange={(e) => {
                  setAtribucion(e.target.value);
                  guardarPrefs({ atribucion: e.target.value });
                }}
                className={`${inputCls} appearance-none`}
              >
                {personas.map((p) => (
                  <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                ))}
              </select>
            </Campo>

            <div className="grid grid-cols-2 gap-2">
              <Campo etiqueta="IVA">
                <select value={ivaPctIngreso} onChange={(e) => setIvaPctIngreso(Number(e.target.value))} className={`${inputCls} appearance-none`}>
                  {ivaIngreso.map((i) => (
                    <option key={i.id} value={i.pct}>{i.nombre} ({Math.round(i.pct * 100)}%)</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="IRPF">
                <select value={irpfPctIngreso} onChange={(e) => setIrpfPctIngreso(Number(e.target.value))} className={`${inputCls} appearance-none`}>
                  {irpfIngreso.map((i) => (
                    <option key={i.id} value={i.pct}>{i.nombre}</option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo etiqueta="Cliente (opcional)">
              <input
                list="lista-clientes"
                placeholder="Buscar cliente…"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className={inputCls}
              />
              <datalist id="lista-clientes">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nombre} />
                ))}
              </datalist>
            </Campo>

            <Campo etiqueta="Concepto (opcional)">
              <input
                placeholder="Ej: Trimestre entreno"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className={inputCls}
              />
            </Campo>

            <Toggle etiqueta="Cobrado ya" activo={cobrado} onCambio={setCobrado} />
            <Toggle etiqueta="Recurrente (se suma a la tesorería)" activo={recurrente} onCambio={setRecurrente} />
            {recurrente && <RecurrenciaCampo cada={recurCada} setCada={setRecurCada} unidad={recurUnidad} setUnidad={setRecurUnidad} />}

            {cobrado && (
              <>
                <Campo etiqueta="¿Dónde ha entrado?">
                  <Chips opciones={opcCuentas} valor={cuentaCodigo} onCambio={elegirCuenta} />
                </Campo>
                <Campo etiqueta="Método">
                  <select
                    value={metodo}
                    onChange={(e) => {
                      setMetodo(e.target.value as MetodoPago);
                      if (e.target.value === "domiciliado") setRecurrente(true);
                    }}
                    className={`${inputCls} appearance-none`}
                  >
                    {metodosPago.map((m) => (
                      <option key={m.codigo} value={m.codigo}>{m.nombre}</option>
                    ))}
                  </select>
                </Campo>
              </>
            )}
          </>
        )}

        {/* ---------- GASTO ---------- */}
        {pestana === "gasto" && (
          <>
            <Campo etiqueta="Categoría">
              <select
                value={categoriaGastoId ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value) || null;
                  setCategoriaGastoId(v);
                  const cat = catGasto.find((c) => c.id === v);
                  if (cat) setGastoFijo(cat.es_fijo);
                }}
                className={`${inputCls} appearance-none`}
              >
                <option value="">Elegir categoría…</option>
                {gruposGasto.map(([grupo, cats]) => (
                  <optgroup key={grupo} label={grupo}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Concepto">
              <input
                placeholder="Ej: Bombillas sala"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className={inputCls}
              />
            </Campo>

            <Campo etiqueta="Proveedor (opcional)">
              <input
                placeholder="Ej: Leroy Merlin"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className={inputCls}
              />
            </Campo>

            <div className="grid grid-cols-2 gap-2">
              <Campo etiqueta="IVA incluido">
                <select value={ivaPctGasto} onChange={(e) => setIvaPctGasto(Number(e.target.value))} className={`${inputCls} appearance-none`}>
                  {ivaGasto.map((i) => (
                    <option key={i.id} value={i.pct}>{i.nombre} ({Math.round(i.pct * 100)}%)</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="IRPF retenido">
                <select value={irpfPctGasto} onChange={(e) => setIrpfPctGasto(Number(e.target.value))} className={`${inputCls} appearance-none`}>
                  {irpfGasto.map((i) => (
                    <option key={i.id} value={i.pct}>{i.nombre}</option>
                  ))}
                </select>
              </Campo>
            </div>
            {irpfPctGasto > 0 && (
              <p className="rounded-lg bg-amber-950 px-3 py-2 text-xs text-amber-300">
                Retienes este IRPF y se lo debes a Hacienda (modelo 111/115). Sale de tu cuenta
                el importe menos la retención; el resto queda apartado como impuesto pendiente.
              </p>
            )}

            <Campo etiqueta="Negocio">
              <Chips
                opciones={[
                  { valor: "presencial" as Canal, etiqueta: "Presencial" },
                  { valor: "online" as Canal, etiqueta: "Online" },
                ]}
                valor={canalGasto}
                onCambio={setCanalGasto}
              />
            </Campo>

            <div className="grid grid-cols-2 gap-2">
              <Toggle
                etiqueta="Tengo factura"
                activo={tieneFactura}
                onCambio={(v) => {
                  setTieneFactura(v);
                  if (!v) setDeducible(false);
                }}
              />
              <Toggle
                etiqueta="Deducible"
                activo={deducible && tieneFactura}
                onCambio={setDeducible}
                deshabilitado={!tieneFactura}
              />
            </div>
            <Campo etiqueta="Tipo de gasto">
              <Chips
                opciones={[
                  { valor: "variable", etiqueta: "Variable" },
                  { valor: "fijo", etiqueta: "Fijo (recurrente e ineludible)" },
                ]}
                valor={gastoFijo ? "fijo" : "variable"}
                onCambio={(v) => setGastoFijo(v === "fijo")}
              />
            </Campo>
            <Toggle etiqueta="Recurrente (se suma a la tesorería)" activo={recurrente} onCambio={setRecurrente} />
            {recurrente && <RecurrenciaCampo cada={recurCada} setCada={setRecurCada} unidad={recurUnidad} setUnidad={setRecurUnidad} />}
            <Toggle
              etiqueta="Es una devolución (te devuelven dinero)"
              activo={esDevolucion}
              onCambio={setEsDevolucion}
            />
            {esDevolucion && (
              <p className="rounded-lg bg-sky-950 px-3 py-2 text-xs text-sky-300">
                Se apuntará en negativo en la categoría elegida: resta del gasto y el dinero
                vuelve a la cuenta. Usa la misma categoría que el gasto original.
              </p>
            )}

            <Campo etiqueta="¿De dónde ha salido?">
              <Chips opciones={opcCuentas} valor={cuentaCodigo} onCambio={elegirCuenta} />
            </Campo>

            <Campo etiqueta="Imputado a">
              <Chips
                opciones={personas.map((p) => ({ valor: p.codigo, etiqueta: p.nombre }))}
                valor={imputadoA}
                onCambio={setImputadoA}
              />
            </Campo>
          </>
        )}

        {/* ---------- TRASPASO ---------- */}
        {pestana === "traspaso" && (
          <>
            <Campo etiqueta="Desde">
              <Chips opciones={opcCuentas} valor={origenCodigo} onCambio={setOrigenCodigo} />
            </Campo>
            <Campo etiqueta="Hacia">
              <Chips opciones={opcCuentas} valor={destinoCodigo} onCambio={setDestinoCodigo} />
            </Campo>
            <Campo etiqueta="Motivo (opcional)">
              <input
                placeholder="Ej: Liquidación TPV"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className={inputCls}
              />
            </Campo>
          </>
        )}

        {/* Fecha (común) */}
        <Campo etiqueta="Fecha">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputCls}
          />
        </Campo>
      </div>

      {/* Botón fijo de guardar */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent px-4 pb-5 pt-8 md:left-60">
        <div className="mx-auto max-w-md">
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full rounded-2xl bg-red-600 py-4 text-lg font-black text-white active:bg-red-700 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "GUARDAR"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg ${
            toast.tipo === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.texto}
        </div>
      )}

      </main>
    </Shell>
  );
}
