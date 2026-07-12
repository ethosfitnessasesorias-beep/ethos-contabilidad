"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shell } from "./shell";
import {
  ATRIBUCIONES,
  METODOS,
  METODO_POR_CUENTA,
  type Atribucion,
  type Canal,
  type Categoria,
  type Cliente,
  type Cuenta,
  type MetodoPago,
} from "@/lib/tipos";

type Pestana = "ingreso" | "gasto" | "traspaso";

// Preferencias que se recuerdan entre usos (por dispositivo)
interface Prefs {
  atribucion: Atribucion;
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
              ? "bg-emerald-600 text-white"
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
        props.activo ? "bg-emerald-950 text-emerald-300" : "bg-zinc-900 text-zinc-400"
      } ${props.deshabilitado ? "opacity-40" : ""}`}
    >
      {props.etiqueta}
      <span
        className={`ml-3 inline-block h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
          props.activo ? "bg-emerald-600" : "bg-zinc-700"
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
  "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-white placeholder-zinc-600 outline-none focus:border-emerald-500";

// ---------- Página ----------

export default function EntradaRapida() {
  const router = useRouter();
  const [sesionOk, setSesionOk] = useState<boolean | null>(null);

  // Catálogos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ivaGeneral, setIvaGeneral] = useState(0.21);

  const [pestana, setPestana] = useState<Pestana>("ingreso");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Campos comunes
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const importeRef = useRef<HTMLInputElement>(null);

  // Ingreso
  const [atribucion, setAtribucion] = useState<Atribucion>("ethos");
  const [categoriaIngresoId, setCategoriaIngresoId] = useState<number | null>(null);
  const [canal, setCanal] = useState<Canal>("presencial");
  const [clienteNombre, setClienteNombre] = useState("");
  const [concepto, setConcepto] = useState("");
  const [conIva, setConIva] = useState(true);
  const [cobrado, setCobrado] = useState(true);
  const [recurrente, setRecurrente] = useState(false);
  const [cuentaCodigo, setCuentaCodigo] = useState("banco");
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");

  // Gasto
  const [categoriaGastoId, setCategoriaGastoId] = useState<number | null>(null);
  const [proveedor, setProveedor] = useState("");
  const [ivaPctGasto, setIvaPctGasto] = useState<number>(0.21);
  const [tieneFactura, setTieneFactura] = useState(true);
  const [deducible, setDeducible] = useState(true);
  const [imputadoA, setImputadoA] = useState<Atribucion>("ethos");
  const [esDevolucion, setEsDevolucion] = useState(false);

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
      const [cat, cue, cli, cfg] = await Promise.all([
        supabase.from("categorias").select("*").eq("activa", true).order("grupo").order("nombre"),
        supabase.from("cuentas").select("*").eq("activa", true).order("id"),
        supabase.from("clientes").select("id, nombre, entrenador").is("fecha_baja", null).order("nombre"),
        supabase.from("config").select("clave, valor").eq("clave", "iva_general").single(),
      ]);
      setCategorias((cat.data as Categoria[]) ?? []);
      setCuentas((cue.data as Cuenta[]) ?? []);
      setClientes((cli.data as Cliente[]) ?? []);
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
  const cuentaId = (codigo: string) => cuentas.find((c) => c.codigo === codigo)?.id;

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

    const ivaPct = conIva ? ivaGeneral : 0;
    const base = Math.round((imp / (1 + ivaPct)) * 100) / 100;
    const cliente = clientes.find(
      (c) => c.nombre.toLowerCase() === clienteNombre.trim().toLowerCase()
    );
    const nombreCat = catIngreso.find((c) => c.id === categoriaIngresoId)?.nombre ?? "Ingreso";

    setGuardando(true);
    const { data: factura, error: e1 } = await supabase
      .from("facturas")
      .insert({
        cliente_id: cliente?.id ?? null,
        categoria_id: categoriaIngresoId,
        atribucion,
        fecha_emision: fecha,
        concepto: concepto.trim() || (cliente ? `${nombreCat} — ${cliente.nombre}` : nombreCat),
        base,
        iva_pct: ivaPct,
        irpf_pct: 0,
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
    setGuardando(false);
    avisar("ok", cobrado ? `Ingreso de ${imp} € guardado ✓` : "Factura pendiente creada ✓");
    limpiarTrasGuardar();
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
      deducible: esDeducible,
      tiene_factura: tieneFactura,
    });
    setGuardando(false);
    if (error) return avisar("error", `No se guardó: ${error.message}`);
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
              pestana === id ? "bg-emerald-600 text-white" : "text-zinc-400"
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
              <Chips
                opciones={catIngreso.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
                valor={categoriaIngresoId}
                onCambio={(v) => {
                  setCategoriaIngresoId(v);
                  const cat = catIngreso.find((c) => c.id === v);
                  if (cat) setCanal(cat.es_online ? "online" : "presencial");
                  guardarPrefs({ categoriaIngresoId: v });
                }}
              />
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
              <Chips
                opciones={ATRIBUCIONES.map((a) => ({ valor: a.valor, etiqueta: a.etiqueta }))}
                valor={atribucion}
                onCambio={(v) => {
                  setAtribucion(v);
                  guardarPrefs({ atribucion: v });
                }}
              />
            </Campo>

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

            <div className="grid grid-cols-2 gap-2">
              <Toggle
                etiqueta={`IVA ${Math.round(ivaGeneral * 100)}%`}
                activo={conIva}
                onCambio={setConIva}
              />
              <Toggle etiqueta="Cobrado ya" activo={cobrado} onCambio={setCobrado} />
            </div>
            <Toggle
              etiqueta="Recurrente (cuota mensual)"
              activo={recurrente}
              onCambio={setRecurrente}
            />

            {cobrado && (
              <>
                <Campo etiqueta="¿Dónde ha entrado?">
                  <Chips opciones={opcCuentas} valor={cuentaCodigo} onCambio={elegirCuenta} />
                </Campo>
                <Campo etiqueta="Método">
                  <Chips
                    opciones={METODOS.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
                    valor={metodo}
                    onCambio={(v) => {
                      setMetodo(v);
                      if (v === "domiciliado") setRecurrente(true);
                    }}
                  />
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
                onChange={(e) => setCategoriaGastoId(Number(e.target.value) || null)}
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

            <Campo etiqueta="IVA incluido en el importe">
              <Chips
                opciones={[
                  { valor: 0.21, etiqueta: "21%" },
                  { valor: 0.1, etiqueta: "10%" },
                  { valor: 0.04, etiqueta: "4%" },
                  { valor: 0, etiqueta: "Sin IVA" },
                ]}
                valor={ivaPctGasto}
                onCambio={setIvaPctGasto}
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
                opciones={ATRIBUCIONES.map((a) => ({ valor: a.valor, etiqueta: a.etiqueta }))}
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
