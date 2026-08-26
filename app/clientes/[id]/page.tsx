"use client";

// Ficha de cliente estilo BemadBox: cabecera compacta arriba (datos + métricas
// + tarifa contratada editable) y pestañas: Facturas · Promos · Actividad ·
// Notas · Ficha (edición y fusión de duplicados con vista previa del destino).

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../../shell";
import {
  ATRIBUCIONES,
  METODO_POR_CUENTA,
  type Atribucion,
  type Canal,
  type Cliente,
  type Cuenta,
  type MetodoPago,
} from "@/lib/tipos";
import { eur } from "@/lib/formato";

interface FacturaSaldo {
  id: number;
  fecha_emision: string;
  concepto: string;
  total: number;
  cobrado: number;
  pendiente: number;
  condonado: number;
}

interface ClienteFicha extends Cliente {
  apellidos?: string | null;
  canal?: Canal | null;
  estado?: string;
  origen?: string | null;
  tipo_plan?: string | null;
  fecha_inicio?: string | null;
  cuota_id?: number | null;
  cuota_periodicidad?: string;
  cuota_desde?: string | null;
  descuento_pct?: number;
  descuento_eur?: number;
  domiciliado?: boolean;
}

interface Actividad {
  id: number;
  titulo: string;
  tipo: string;
  cuando: string;
  hecha: boolean;
  responsable: string;
}

interface DealCli {
  id: number;
  titulo: string;
  etapa: string;
  importe_estimado: number;
  seguimiento: string | null;
  seguimiento_nota: string | null;
  fecha_alta: string;
  embudos: { nombre: string } | null;
  pipeline_columnas: { titulo: string } | null;
}

interface OtroCli {
  id: number;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  tipo_plan: string | null;
  fecha_inicio: string | null;
}

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const normNombre = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

function telefonoWa(tel: string): string | null {
  const digitos = tel.replace(/\D/g, "");
  if (digitos.length === 9) return `34${digitos}`;
  if (digitos.length >= 11) return digitos;
  return null;
}

const nombreDe = (codigo: string) =>
  ATRIBUCIONES.find((a) => a.valor === codigo)?.etiqueta ?? codigo;

const ICONO_TIPO: Record<string, string> = {
  llamada: "📞", visita: "🏢", email: "✉️", whatsapp: "💬", tarea: "✅", nota: "📝",
};

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

type Pestana = "facturas" | "promos" | "actividad" | "notas" | "ficha";

export default function FichaCliente() {
  const sesionOk = useSesion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clienteId = Number(params.id);

  const [cliente, setCliente] = useState<ClienteFicha | null>(null);
  const [facturas, setFacturas] = useState<FacturaSaldo[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [deals, setDeals] = useState<DealCli[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [otrosClientes, setOtrosClientes] = useState<OtroCli[]>([]);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [pestana, setPestana] = useState<Pestana>("facturas");

  // Fusión con vista previa del destino y elección de quién sobrevive
  const [fusionId, setFusionId] = useState<number | null>(null);
  const [fusionInfo, setFusionInfo] = useState<{ facturado: number; cobrado: number; n: number } | null>(null);
  const [fusionQuedo, setFusionQuedo] = useState(false); // false = se queda el otro · true = se queda este

  // Edición de datos (pestaña Ficha)
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [entrenador, setEntrenador] = useState<Atribucion>("ethos");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [nif, setNif] = useState("");
  const [direccion, setDireccion] = useState("");

  // Mini-formulario cobrar/devolver/perdonar sobre una factura
  const [accion, setAccion] = useState<{ facturaId: number; modo: "cobrar" | "devolver" | "perdonar" } | null>(null);
  const [accionImporte, setAccionImporte] = useState("");
  const [accionCuenta, setAccionCuenta] = useState("banco");

  function avisar(tipo: "ok" | "error", texto: string) {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), tipo === "ok" ? 2500 : 5000);
  }

  const cargar = useCallback(async () => {
    const [cli, fac, cue, otros, act, dl] = await Promise.all([
      supabase.from("clientes").select("*").eq("id", clienteId).single(),
      supabase
        .from("v_facturas_saldo")
        .select("id, fecha_emision, concepto, total, cobrado, pendiente, condonado")
        .eq("cliente_id", clienteId)
        .order("fecha_emision", { ascending: false }),
      supabase.from("cuentas").select("*").eq("activa", true).order("id"),
      supabase.from("clientes").select("id, nombre, apellidos, email, telefono, tipo_plan, fecha_inicio").neq("id", clienteId).order("nombre"),
      supabase
        .from("actividades")
        .select("id, titulo, tipo, cuando, hecha, responsable")
        .eq("cliente_id", clienteId)
        .order("cuando", { ascending: false })
        .limit(25),
      supabase
        .from("deals")
        .select("id, titulo, etapa, importe_estimado, seguimiento, seguimiento_nota, fecha_alta, embudos(nombre), pipeline_columnas(titulo)")
        .eq("cliente_id", clienteId)
        .order("creado_en", { ascending: false }),
    ]);
    if (cli.data) {
      const c = cli.data as ClienteFicha;
      setCliente(c);
      setNombre(c.nombre);
      setApellidos(c.apellidos ?? "");
      setEntrenador(c.entrenador);
      setTelefono(c.telefono ?? "");
      setEmail(c.email ?? "");
      setNotas(c.notas ?? "");
      setNif(c.nif ?? "");
      setDireccion(c.direccion ?? "");
    }
    setFacturas((fac.data as FacturaSaldo[]) ?? []);
    setCuentas((cue.data as Cuenta[]) ?? []);
    setOtrosClientes((otros.data as OtroCli[]) ?? []);
    setActividades((act.data as Actividad[]) ?? []);
    setDeals((dl.data as unknown as DealCli[]) ?? []);
  }, [clienteId]);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  // Vista previa del destino de fusión: sus números, para no fusionar al Javi equivocado
  useEffect(() => {
    if (!fusionId) return setFusionInfo(null);
    (async () => {
      const { data } = await supabase.from("v_facturas_saldo").select("total, cobrado").eq("cliente_id", fusionId);
      const filas = (data as { total: number; cobrado: number }[]) ?? [];
      setFusionInfo({
        facturado: filas.reduce((s, x) => s + Number(x.total), 0),
        cobrado: filas.reduce((s, x) => s + Number(x.cobrado), 0),
        n: filas.length,
      });
    })();
  }, [fusionId]);

  async function guardarDatos() {
    const { error } = await supabase
      .from("clientes")
      .update({
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || null,
        entrenador,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        nif: nif.trim() || null,
        direccion: direccion.trim() || null,
      })
      .eq("id", clienteId);
    if (error) return avisar("error", error.message);
    avisar("ok", "Datos guardados ✓");
    cargar();
  }

  async function guardarNotas() {
    const { error } = await supabase.from("clientes").update({ notas: notas.trim() || null }).eq("id", clienteId);
    if (error) return avisar("error", error.message);
    avisar("ok", "Notas guardadas ✓");
  }

  async function cambiarBaja() {
    if (!cliente) return;
    const { error } = await supabase
      .from("clientes")
      .update({ fecha_baja: cliente.fecha_baja ? null : new Date().toISOString().slice(0, 10) })
      .eq("id", clienteId);
    if (error) return avisar("error", error.message);
    avisar("ok", cliente.fecha_baja ? "Cliente reactivado ✓" : "Cliente dado de baja ✓");
    cargar();
  }

  // Fusiona en la dirección elegida: el perdedor desaparece y TODO su historial
  // (facturas, remesas, oportunidades, actividades, contenido, fila de la matriz)
  // pasa al superviviente; los datos de contacto que falten se completan.
  async function fusionar() {
    if (!fusionId || !cliente) return;
    const otro = otrosClientes.find((c) => c.id === fusionId);
    if (!otro) return;
    const nombreEste = `${cliente.nombre} ${cliente.apellidos ?? ""}`.trim();
    const nombreOtro = `${otro.nombre} ${otro.apellidos ?? ""}`.trim();
    const [pierde, queda] = fusionQuedo ? [nombreOtro, nombreEste] : [nombreEste, nombreOtro];
    if (!window.confirm(`"${pierde}" desaparecerá y todo su historial pasará a "${queda}". ¿Seguro?`)) return;
    const { data, error } = await supabase.rpc("merge_cliente", {
      p_perdedor: fusionQuedo ? fusionId : clienteId,
      p_superviviente: fusionQuedo ? clienteId : fusionId,
    });
    if (error) return avisar("error", error.message);
    const res = data as { ok: boolean; error?: string } | null;
    if (!res?.ok) return avisar("error", res?.error ?? "No se pudo fusionar.");
    if (fusionQuedo) {
      setFusionId(null);
      avisar("ok", `"${pierde}" fusionado aquí ✓`);
      cargar();
    } else {
      router.push(`/clientes/${fusionId}`);
    }
  }

  async function ejecutarAccion() {
    if (!accion) return;
    const n = Number(accionImporte.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return avisar("error", "Importe no válido.");

    if (accion.modo === "perdonar") {
      const f = facturas.find((x) => x.id === accion.facturaId);
      if (!f) return;
      if (n > Number(f.pendiente) + 0.005)
        return avisar("error", `Solo quedan ${eur(Number(f.pendiente))} pendientes.`);
      const { error } = await supabase
        .from("facturas")
        .update({ condonado: Math.round((Number(f.condonado) + n) * 100) / 100 })
        .eq("id", accion.facturaId);
      if (error) return avisar("error", error.message);
      avisar("ok", `Deuda de ${n} € perdonada ✓`);
      setAccion(null);
      setAccionImporte("");
      cargar();
      return;
    }

    const importe = accion.modo === "devolver" ? -n : n;
    const cuenta = cuentas.find((c) => c.codigo === accionCuenta);
    const { error } = await supabase.from("cobros").insert({
      factura_id: accion.facturaId,
      fecha: new Date().toISOString().slice(0, 10),
      importe: Math.round(importe * 100) / 100,
      cuenta_id: cuenta?.id,
      metodo: (METODO_POR_CUENTA[accionCuenta] ?? "transferencia") as MetodoPago,
    });
    if (error) return avisar("error", error.message);
    avisar("ok", accion.modo === "devolver" ? `Devolución de ${n} € apuntada ✓` : `Cobro de ${n} € apuntado ✓`);
    setAccion(null);
    setAccionImporte("");
    cargar();
  }

  // Nueva oportunidad en el embudo de ventas (primera etapa)
  async function nuevaOportunidad() {
    if (!cliente) return;
    const { data: em } = await supabase.from("embudos").select("id, nombre, orden").eq("activo", true).order("orden");
    const embudo = ((em as { id: number; nombre: string }[]) ?? []).find((e) => !e.nombre.toLowerCase().includes("grand slam"));
    if (!embudo) return avisar("error", "No hay embudo de ventas.");
    const { data: cols } = await supabase.from("pipeline_columnas").select("id").eq("embudo_id", embudo.id).order("orden").limit(1);
    const colId = (cols as { id: number }[] | null)?.[0]?.id ?? null;
    const { error } = await supabase.from("deals").insert({
      titulo: `Oportunidad · ${cliente.nombre}`,
      cliente_id: clienteId,
      canal: cliente.canal ?? "presencial",
      importe_estimado: 0,
      responsable: ["david", "luis"].includes(cliente.entrenador) ? cliente.entrenador : "ethos",
      origen: "ficha",
      etapa: "lead",
      embudo_id: embudo.id,
      columna_id: colId,
    });
    if (error) return avisar("error", error.message);
    avisar("ok", "Oportunidad creada en el embudo ✓");
    cargar();
  }

  if (sesionOk === null || !cliente) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  const deudaTotal = facturas.reduce((s, f) => s + Math.max(0, Number(f.pendiente)), 0);
  const totalFacturado = facturas.reduce((s, f) => s + Number(f.total), 0);
  const totalCobrado = facturas.reduce((s, f) => s + Number(f.cobrado), 0);
  const wa = cliente.telefono ? telefonoWa(cliente.telefono) : null;
  const msgRecordatorio = encodeURIComponent(
    `¡Hola ${cliente.nombre}! Te escribimos de Ethos 💪 Tienes ${deudaTotal.toFixed(2).replace(".", ",")} € pendientes de pago. ¿Puedes revisarlo cuando tengas un momento? ¡Gracias!`
  );

  const estadoChip = cliente.fecha_baja
    ? { t: "Baja", c: "bg-zinc-800 text-zinc-500" }
    : cliente.estado === "lead"
      ? { t: "Lead", c: "bg-amber-950 text-amber-400" }
      : { t: "Cliente", c: "bg-emerald-950 text-emerald-400" };

  const infoInline: string[] = [
    cliente.fecha_inicio ? `Miembro desde ${fechaCorta(cliente.fecha_inicio)}` : null,
    cliente.email ?? null,
    cliente.telefono ?? null,
    `Entrenador: ${nombreDe(cliente.entrenador)}`,
    cliente.origen ? `Origen: ${cliente.origen}` : null,
    cliente.nif ? `NIF: ${cliente.nif}` : null,
    cliente.fecha_baja ? `Baja: ${fechaCorta(cliente.fecha_baja)}` : null,
  ].filter(Boolean) as string[];

  const TABS: { id: Pestana; etiqueta: string }[] = [
    { id: "facturas", etiqueta: `Facturas (${facturas.length})` },
    { id: "promos", etiqueta: `Promos (${deals.length})` },
    { id: "actividad", etiqueta: `Actividad (${actividades.length})` },
    { id: "notas", etiqueta: "Notas" },
    { id: "ficha", etiqueta: "Ficha" },
  ];

  const estadoFactura = (f: FacturaSaldo) => {
    const p = Number(f.pendiente);
    if (Number(f.total) < 0) return <span className="rounded-full bg-violet-950 px-2.5 py-0.5 text-[10px] font-bold text-violet-400">Rectificativa</span>;
    if (p > 0.01) return <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">Debe {eur(p)}</span>;
    return <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">Cobrada</span>;
  };

  return (
    <Shell titulo="Cliente">
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5">
        {/* ============ CABECERA COMPACTA ============ */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => router.back()} className="text-lg text-zinc-500 hover:text-zinc-300" aria-label="Volver">←</button>
            <h1 className={`text-2xl font-black tracking-tight ${cliente.fecha_baja ? "text-zinc-500 line-through" : "text-white"}`}>
              {cliente.nombre} {cliente.apellidos ?? ""}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${estadoChip.c}`}>{estadoChip.t}</span>
            {cliente.canal && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cliente.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"}`}>
                {cliente.canal === "online" ? "Online" : "Presencial"}
              </span>
            )}
            {cliente.tipo_plan && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300">{cliente.tipo_plan}</span>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                >
                  💬 WhatsApp
                </a>
              )}
              <button onClick={cambiarBaja} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700">
                {cliente.fecha_baja ? "Reactivar" : "Dar de baja"}
              </button>
            </div>
          </div>

          <p className="mt-1.5 text-xs text-zinc-500">
            {infoInline.map((x, i) => (
              <span key={i}>{i > 0 && <span className="mx-1.5 text-zinc-700">·</span>}{x}</span>
            ))}
          </p>

          {/* Métricas */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Facturado</p>
              <p className="text-base font-black tabular-nums text-white">{eur(totalFacturado)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Cash collected</p>
              <p className="text-base font-black tabular-nums text-emerald-400">{eur(totalCobrado)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Pendiente</p>
              <p className={`text-base font-black tabular-nums ${deudaTotal > 0.01 ? "text-amber-400" : "text-zinc-400"}`}>{eur(deudaTotal)}</p>
              {deudaTotal > 0.01 && wa && (
                <a href={`https://wa.me/${wa}?text=${msgRecordatorio}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400">
                  Recordar por WhatsApp →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ============ PESTAÑAS ============ */}
        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setPestana(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                pestana === t.id ? "border-red-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {/* ---------- FACTURAS ---------- */}
          {pestana === "facturas" && (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="hidden grid-cols-[110px_1fr_110px_130px_110px_auto] items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2 md:grid">
                {["Fecha", "Concepto", "Cobrado", "Estado", "Total", ""].map((h, i) => (
                  <span key={i} className={`text-[10px] font-black uppercase tracking-wider text-zinc-500 ${i >= 2 && i <= 4 ? "text-right" : ""}`}>{h}</span>
                ))}
              </div>
              {facturas.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin facturas todavía.</p>}
              {facturas.map((f) => {
                const pendiente = Number(f.pendiente);
                return (
                  <div key={f.id} className="border-b border-zinc-800/60 px-4 py-2 last:border-0 hover:bg-zinc-900/40">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2 md:grid-cols-[110px_1fr_110px_130px_110px_auto]">
                      <span className="hidden text-xs tabular-nums text-zinc-400 md:block">{fechaCorta(f.fecha_emision)}</span>
                      <button onClick={() => router.push(`/facturas/${f.id}`)} className="min-w-0 truncate text-left text-sm font-semibold text-white hover:text-sky-300" title="Abrir factura">
                        {f.concepto}
                        <span className="block text-[10px] font-normal text-zinc-600 md:hidden">{fechaCorta(f.fecha_emision)} · cobrado {eur(Number(f.cobrado))}</span>
                      </button>
                      <span className="hidden text-right text-xs tabular-nums text-zinc-400 md:block">{eur(Number(f.cobrado))}</span>
                      <span className="hidden text-right md:block">{estadoFactura(f)}</span>
                      <span className="text-right text-sm font-bold tabular-nums text-white">{eur(Number(f.total))}</span>
                      <div className="hidden shrink-0 gap-1 md:flex">
                        {pendiente > 0.01 && (
                          <>
                            <button onClick={() => { setAccion({ facturaId: f.id, modo: "cobrar" }); setAccionImporte(String(pendiente)); }} className="rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white">Cobrar</button>
                            <button onClick={() => { setAccion({ facturaId: f.id, modo: "perdonar" }); setAccionImporte(String(pendiente)); }} className="rounded bg-zinc-800 px-2 py-1 text-[10px] font-bold text-amber-300">Perdonar</button>
                          </>
                        )}
                        <button onClick={() => { setAccion({ facturaId: f.id, modo: "devolver" }); setAccionImporte(""); }} className="rounded bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-400">Devolver</button>
                      </div>
                    </div>
                    <div className="mt-1 flex gap-1 md:hidden">
                      {estadoFactura(f)}
                      {pendiente > 0.01 && (
                        <button onClick={() => { setAccion({ facturaId: f.id, modo: "cobrar" }); setAccionImporte(String(pendiente)); }} className="rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">Cobrar</button>
                      )}
                    </div>
                    {Number(f.condonado) > 0 && <p className="mt-0.5 text-[10px] text-zinc-600">perdonado {eur(Number(f.condonado))}</p>}

                    {accion?.facturaId === f.id && (
                      <div className="mt-2 flex flex-wrap items-end gap-2 rounded-xl bg-zinc-950 p-3">
                        <p className="w-full text-[10px] font-bold uppercase text-zinc-500">
                          {accion.modo === "cobrar" ? "Apuntar cobro" : accion.modo === "devolver" ? "Apuntar devolución al cliente" : "Perdonar deuda (no toca caja)"}
                        </p>
                        <input inputMode="decimal" placeholder="Importe" value={accionImporte} onChange={(e) => setAccionImporte(e.target.value)} className={`${inputCls} w-28 text-right`} autoFocus />
                        {accion.modo !== "perdonar" &&
                          cuentas.map((c) => (
                            <button key={c.codigo} onClick={() => setAccionCuenta(c.codigo)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${accionCuenta === c.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                              {c.nombre.split(" (")[0]}
                            </button>
                          ))}
                        <button onClick={ejecutarAccion} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Confirmar</button>
                        <button onClick={() => setAccion(null)} className="rounded-xl bg-zinc-800 px-3 py-2 text-sm font-bold text-zinc-400">✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------- PROMOS / OPORTUNIDADES ---------- */}
          {pestana === "promos" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  Oportunidades del embudo y Grand Slams de este contacto. Los descuentos de su tarifa se editan arriba (✎ Tarifa).
                </p>
                <button onClick={nuevaOportunidad} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">+ Nueva oportunidad</button>
              </div>
              {deals.length === 0 ? (
                <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
                  Sin oportunidades todavía. Crea una o sincroniza el Grand Slam.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  {deals.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => router.push("/pipeline")}
                      className="flex w-full flex-wrap items-center gap-2 border-b border-zinc-800/60 px-4 py-2.5 text-left last:border-0 hover:bg-zinc-900/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{d.titulo}</p>
                        <p className="text-[11px] text-zinc-500">
                          {d.embudos?.nombre ?? "Embudo"} · {d.etapa === "ganado" ? "—" : d.pipeline_columnas?.titulo ?? "—"} · desde {fechaCorta(d.fecha_alta)}
                          {d.seguimiento && ` · ⏰ ${fechaCorta(d.seguimiento)}${d.seguimiento_nota ? ` (${d.seguimiento_nota})` : ""}`}
                        </p>
                      </div>
                      {Number(d.importe_estimado) > 0 && <span className="text-sm font-bold tabular-nums text-zinc-300">{eur(Number(d.importe_estimado))}</span>}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          d.etapa === "ganado" ? "bg-emerald-950 text-emerald-400" : d.etapa === "perdido" ? "bg-red-950 text-red-400" : "bg-sky-950 text-sky-400"
                        }`}
                      >
                        {d.etapa === "ganado" ? "✓ Ganada" : d.etapa === "perdido" ? "✕ Perdida" : "Abierta"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------- ACTIVIDAD ---------- */}
          {pestana === "actividad" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              {actividades.length === 0 && <p className="py-2 text-center text-sm text-zinc-500">Sin actividades vinculadas a este contacto.</p>}
              <div className="relative flex flex-col gap-4 pl-5">
                {actividades.length > 0 && <span className="absolute bottom-1 left-[7px] top-1 w-px bg-zinc-800" aria-hidden />}
                {actividades.map((a) => (
                  <div key={a.id} className="relative">
                    <span className={`absolute -left-5 top-1 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-zinc-900 ${a.hecha ? "bg-emerald-600" : "bg-zinc-600"}`} aria-hidden />
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="text-xs">{ICONO_TIPO[a.tipo] ?? "•"}</span>
                      <p className={`text-sm font-semibold ${a.hecha ? "text-zinc-400" : "text-white"}`}>{a.titulo}</p>
                      <span className="text-[11px] text-zinc-600">
                        {new Date(a.cuando).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">{a.tipo} · {nombreDe(a.responsable)} {a.hecha ? "· hecha ✓" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- NOTAS ---------- */}
          {pestana === "notas" && (
            <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={6} placeholder="Notas del cliente: lesiones, preferencias, contexto, acuerdos…" className={inputCls} />
              <button onClick={guardarNotas} className="self-start rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Guardar notas</button>
            </div>
          )}

          {/* ---------- FICHA (edición + fusión) ---------- */}
          {pestana === "ficha" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Datos del contacto</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className={inputCls} />
                  <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Apellidos" className={inputCls} />
                  <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" inputMode="tel" className={inputCls} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" inputMode="email" className={inputCls} />
                  <input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="NIF/DNI (para factura completa)" className={inputCls} />
                  <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className={inputCls} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {ATRIBUCIONES.map((a) => (
                    <button key={a.valor} onClick={() => setEntrenador(a.valor)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${entrenador === a.valor ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                      {a.etiqueta}
                    </button>
                  ))}
                </div>
                <button onClick={guardarDatos} className="rounded-xl bg-red-600 py-2.5 font-bold text-white">Guardar datos</button>
              </div>

              {/* Fusión con vista previa: para no fusionar al Javi equivocado */}
              <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-500">¿Es un duplicado? Fusionar con…</p>
                <select value={fusionId ?? ""} onChange={(e) => setFusionId(Number(e.target.value) || null)} className={`${inputCls} appearance-none`}>
                  <option value="">Elegir el cliente bueno…</option>
                  {(() => {
                    const yo = normNombre(`${cliente.nombre} ${cliente.apellidos ?? ""}`);
                    const etiqueta = (c: OtroCli) =>
                      `${c.nombre} ${c.apellidos ?? ""}`.trim() + (c.email ? ` · ${c.email}` : c.telefono ? ` · ${c.telefono}` : "");
                    const similar = (c: OtroCli) => {
                      const cn = normNombre(`${c.nombre} ${c.apellidos ?? ""}`);
                      return cn === yo || (yo.length >= 5 && cn.length >= 5 && (cn.includes(yo) || yo.includes(cn)));
                    };
                    const parecidos = otrosClientes.filter(similar);
                    const resto = otrosClientes.filter((c) => !similar(c));
                    return [
                      ...parecidos.map((c) => <option key={c.id} value={c.id}>≈ {etiqueta(c)} (parecido)</option>),
                      ...resto.map((c) => <option key={c.id} value={c.id}>{etiqueta(c)}</option>),
                    ];
                  })()}
                </select>

                {fusionId && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-zinc-400">¿Quién se queda con todo?</span>
                    <button
                      onClick={() => setFusionQuedo(true)}
                      className={`rounded-full px-3 py-1 font-bold ${fusionQuedo ? "bg-emerald-700 text-white" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      Este ({cliente.nombre})
                    </button>
                    <button
                      onClick={() => setFusionQuedo(false)}
                      className={`rounded-full px-3 py-1 font-bold ${!fusionQuedo ? "bg-emerald-700 text-white" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      El otro
                    </button>
                  </div>
                )}

                {fusionId && (() => {
                  const destino = otrosClientes.find((c) => c.id === fusionId);
                  if (!destino) return null;
                  const cartaEste = {
                    nombre: `${cliente.nombre} ${cliente.apellidos ?? ""}`,
                    email: cliente.email, telefono: cliente.telefono, plan: cliente.tipo_plan,
                    alta: cliente.fecha_inicio, n: facturas.length, facturado: totalFacturado, cobrado: totalCobrado,
                  };
                  const cartaOtro = {
                    nombre: `${destino.nombre} ${destino.apellidos ?? ""}`,
                    email: destino.email, telefono: destino.telefono, plan: destino.tipo_plan,
                    alta: destino.fecha_inicio, n: fusionInfo?.n, facturado: fusionInfo?.facturado, cobrado: fusionInfo?.cobrado,
                  };
                  const carta = (c: typeof cartaEste | typeof cartaOtro, seQueda: boolean) => (
                    <div className={`rounded-xl border p-3 ${seQueda ? "border-emerald-900/50 bg-emerald-950/20" : "border-red-900/50 bg-red-950/20"}`}>
                      <p className={`mb-1 text-[9px] font-black uppercase ${seQueda ? "text-emerald-400" : "text-red-400"}`}>
                        {seQueda ? "✓ Se queda con todo" : "✕ Desaparece"}
                      </p>
                      <p className="font-bold text-white">{c.nombre}</p>
                      <p className="text-zinc-500">{c.email ?? "sin email"}</p>
                      <p className="text-zinc-500">{c.telefono ?? "sin teléfono"}</p>
                      <p className="text-zinc-500">{c.plan ?? "sin plan"} · alta {c.alta ? fechaCorta(c.alta) : "—"}</p>
                      {c.n !== undefined ? (
                        <>
                          <p className="mt-1 font-bold text-zinc-300">{c.n} facturas · {eur(Number(c.facturado ?? 0))}</p>
                          <p className="text-zinc-500">cobrado {eur(Number(c.cobrado ?? 0))}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-zinc-600">cargando…</p>
                      )}
                    </div>
                  );
                  return (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {carta(cartaEste, fusionQuedo)}
                      {carta(cartaOtro, !fusionQuedo)}
                    </div>
                  );
                })()}

                {fusionId && (
                  <button onClick={fusionar} disabled={!fusionInfo} className="rounded-xl bg-red-900 py-2.5 text-sm font-bold text-red-200 disabled:opacity-50">
                    {fusionQuedo
                      ? `Fusionar: el otro desaparece y todo pasa a ${cliente.nombre}`
                      : "Fusionar: este cliente desaparece"}
                  </button>
                )}
                <p className="text-[10px] leading-snug text-zinc-600">
                  Elige quién sobrevive y revisa las dos tarjetas antes de confirmar. El que desaparece pasa TODO su
                  historial al otro (facturas, remesas, oportunidades, actividades, contenido y su fila de Pagos y
                  cobros), y los datos de contacto que le falten al superviviente se completan solos.
                </p>
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg ${toast.tipo === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {toast.texto}
          </div>
        )}
      </main>
    </Shell>
  );
}
