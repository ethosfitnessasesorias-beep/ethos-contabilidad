"use client";

import { useCallback, useEffect, useState } from "react";
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
import { eur, iniciales } from "@/lib/formato";

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
  canal?: Canal | null;
  estado?: string;
  origen?: string | null;
}

interface Actividad {
  id: number;
  titulo: string;
  tipo: string;
  cuando: string;
  hecha: boolean;
  responsable: string;
}

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-base text-white placeholder-zinc-600 outline-none focus:border-red-500";

// Convierte un teléfono español a formato wa.me (solo dígitos, con 34 delante)
function telefonoWa(tel: string): string | null {
  const digitos = tel.replace(/\D/g, "");
  if (digitos.length === 9) return `34${digitos}`;
  if (digitos.length >= 11) return digitos;
  return null;
}

const nombreDe = (codigo: string) =>
  ATRIBUCIONES.find((a) => a.valor === codigo)?.etiqueta ?? codigo;

const ICONO_TIPO: Record<string, string> = {
  llamada: "📞",
  visita: "🏢",
  email: "✉️",
  whatsapp: "💬",
  tarea: "✅",
  nota: "📝",
};

export default function FichaCliente() {
  const sesionOk = useSesion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clienteId = Number(params.id);

  const [cliente, setCliente] = useState<ClienteFicha | null>(null);
  const [facturas, setFacturas] = useState<FacturaSaldo[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [otrosClientes, setOtrosClientes] = useState<Cliente[]>([]);
  const [fusionId, setFusionId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Edición de datos
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [entrenador, setEntrenador] = useState<Atribucion>("ethos");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [nif, setNif] = useState("");
  const [direccion, setDireccion] = useState("");

  // Mini-formulario cobrar/devolver sobre una factura
  const [accion, setAccion] = useState<{
    facturaId: number;
    modo: "cobrar" | "devolver" | "perdonar";
  } | null>(null);
  const [accionImporte, setAccionImporte] = useState("");
  const [accionCuenta, setAccionCuenta] = useState("banco");

  function avisar(tipo: "ok" | "error", texto: string) {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), tipo === "ok" ? 2500 : 5000);
  }

  const cargar = useCallback(async () => {
    const [cli, fac, cue, otros, act] = await Promise.all([
      supabase.from("clientes").select("*").eq("id", clienteId).single(),
      supabase
        .from("v_facturas_saldo")
        .select("id, fecha_emision, concepto, total, cobrado, pendiente, condonado")
        .eq("cliente_id", clienteId)
        .order("fecha_emision", { ascending: false }),
      supabase.from("cuentas").select("*").eq("activa", true).order("id"),
      supabase.from("clientes").select("id, nombre, entrenador").neq("id", clienteId).order("nombre"),
      supabase
        .from("actividades")
        .select("id, titulo, tipo, cuando, hecha, responsable")
        .eq("cliente_id", clienteId)
        .order("cuando", { ascending: false })
        .limit(25),
    ]);
    if (cli.data) {
      const c = cli.data as ClienteFicha;
      setCliente(c);
      setNombre(c.nombre);
      setEntrenador(c.entrenador);
      setTelefono(c.telefono ?? "");
      setEmail(c.email ?? "");
      setNotas(c.notas ?? "");
      setNif(c.nif ?? "");
      setDireccion(c.direccion ?? "");
    }
    setFacturas((fac.data as FacturaSaldo[]) ?? []);
    setCuentas((cue.data as Cuenta[]) ?? []);
    setOtrosClientes((otros.data as Cliente[]) ?? []);
    setActividades((act.data as Actividad[]) ?? []);
  }, [clienteId]);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  async function guardarDatos() {
    const { error } = await supabase
      .from("clientes")
      .update({
        nombre: nombre.trim(),
        entrenador,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        notas: notas.trim() || null,
        nif: nif.trim() || null,
        direccion: direccion.trim() || null,
      })
      .eq("id", clienteId);
    if (error) return avisar("error", error.message);
    setEditando(false);
    avisar("ok", "Datos guardados ✓");
    cargar();
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

  // Fusiona ESTE cliente dentro de otro: sus facturas se mueven y este se borra
  async function fusionar() {
    if (!fusionId || !cliente) return;
    const destino = otrosClientes.find((c) => c.id === fusionId);
    if (!destino) return;
    if (
      !window.confirm(
        `"${cliente.nombre}" desaparecerá y todas sus facturas pasarán a "${destino.nombre}". ¿Seguro?`
      )
    )
      return;
    const mov = await supabase.from("facturas").update({ cliente_id: fusionId }).eq("cliente_id", clienteId);
    if (mov.error) return avisar("error", mov.error.message);
    const del = await supabase.from("clientes").delete().eq("id", clienteId);
    if (del.error) return avisar("error", del.error.message);
    router.push(`/clientes/${fusionId}`);
  }

  async function ejecutarAccion() {
    if (!accion) return;
    const n = Number(accionImporte.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return avisar("error", "Importe no válido.");

    if (accion.modo === "perdonar") {
      // Perdonar deuda: no entra dinero en ninguna cuenta, solo se apaga
      // el pendiente (facturas.condonado). La caja no se toca.
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

  if (sesionOk === null || !cliente) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-500">
        Cargando…
      </main>
    );
  }

  const deudaTotal = facturas.reduce((s, f) => s + Math.max(0, Number(f.pendiente)), 0);
  const pagadas = facturas.filter((f) => Number(f.pendiente) <= 0.01);
  const pendientesFac = facturas.filter((f) => Number(f.pendiente) > 0.01);
  const totalCobrado = facturas.reduce((s, f) => s + Number(f.cobrado), 0);
  const wa = cliente.telefono ? telefonoWa(cliente.telefono) : null;
  const msgRecordatorio = encodeURIComponent(
    `¡Hola ${cliente.nombre}! Te escribimos de Ethos 💪 Tienes ${deudaTotal.toFixed(2).replace(".", ",")} € pendientes de pago. ¿Puedes revisarlo cuando tengas un momento? ¡Gracias!`
  );

  const campos: [string, string | null | undefined][] = [
    ["Email", cliente.email],
    ["Teléfono", cliente.telefono],
    ["NIF/DNI", cliente.nif],
    ["Dirección", cliente.direccion],
    ["Entrenador", nombreDe(cliente.entrenador)],
    ["Origen", cliente.origen],
    ["Alta", cliente.fecha_alta ? new Date(cliente.fecha_alta).toLocaleDateString("es-ES") : null],
    ["Baja", cliente.fecha_baja ? new Date(cliente.fecha_baja).toLocaleDateString("es-ES") : null],
  ];

  return (
    <Shell titulo="Cliente">
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <button onClick={() => router.back()} className="mb-3 text-sm text-zinc-500 hover:text-zinc-300">
          ← Volver
        </button>

        <div className="grid items-start gap-4 md:grid-cols-[340px_1fr]">
          {/* ---------- Columna izquierda: ficha ---------- */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex flex-col items-center text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-red-950 text-xl font-black text-red-300">
                  {iniciales(cliente.nombre)}
                </span>
                <h2
                  className={`mt-3 text-xl font-black ${
                    cliente.fecha_baja ? "text-zinc-500 line-through" : "text-white"
                  }`}
                >
                  {cliente.nombre}
                </h2>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                      cliente.fecha_baja
                        ? "bg-zinc-800 text-zinc-500"
                        : cliente.estado === "lead"
                          ? "bg-amber-950 text-amber-400"
                          : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {cliente.fecha_baja ? "Baja" : cliente.estado === "lead" ? "Lead" : "Cliente"}
                  </span>
                  {cliente.canal && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        cliente.canal === "online" ? "bg-blue-950 text-blue-400" : "bg-red-950 text-red-400"
                      }`}
                    >
                      {cliente.canal === "online" ? "Online" : "Presencial"}
                    </span>
                  )}
                </div>
              </div>

              {!editando && (
                <>
                  <dl className="mt-4 flex flex-col">
                    {campos
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-3 border-b border-zinc-800/70 py-2 last:border-0">
                          <dt className="text-xs text-zinc-500">{k}</dt>
                          <dd className="truncate text-right text-sm font-semibold text-zinc-200">{v}</dd>
                        </div>
                      ))}
                  </dl>
                  {cliente.notas && (
                    <p className="mt-3 rounded-xl bg-zinc-950 px-3 py-2 text-xs text-zinc-400">{cliente.notas}</p>
                  )}
                </>
              )}

              <button
                onClick={() => setEditando(!editando)}
                className="mt-4 w-full rounded-xl bg-zinc-800 py-2 text-sm font-bold text-zinc-300"
              >
                {editando ? "Cancelar" : "Editar datos"}
              </button>

              {editando && (
                <div className="mt-3 flex flex-col gap-2">
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className={inputCls} />
                  <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" inputMode="tel" className={inputCls} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" inputMode="email" className={inputCls} />
                  <input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="NIF/DNI (para factura completa)" className={inputCls} />
                  <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección (para factura completa)" className={inputCls} />
                  <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas" rows={2} className={inputCls} />
                  <div className="flex flex-wrap gap-2">
                    {ATRIBUCIONES.map((a) => (
                      <button
                        key={a.valor}
                        onClick={() => setEntrenador(a.valor)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          entrenador === a.valor ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {a.etiqueta}
                      </button>
                    ))}
                  </div>
                  <button onClick={guardarDatos} className="rounded-xl bg-red-600 py-2.5 font-bold text-white">
                    Guardar datos
                  </button>
                  <button onClick={cambiarBaja} className="rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-zinc-300">
                    {cliente.fecha_baja ? "Reactivar cliente" : "Dar de baja"}
                  </button>

                  {/* Fusión de duplicados */}
                  <div className="mt-2 rounded-xl bg-zinc-950 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      ¿Es un duplicado? Fusionar con…
                    </p>
                    <select
                      value={fusionId ?? ""}
                      onChange={(e) => setFusionId(Number(e.target.value) || null)}
                      className={`${inputCls} w-full appearance-none`}
                    >
                      <option value="">Elegir el cliente bueno…</option>
                      {otrosClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {fusionId && (
                      <button
                        onClick={fusionar}
                        className="mt-2 w-full rounded-xl bg-red-900 py-2.5 text-sm font-bold text-red-200"
                      >
                        Fusionar (este cliente desaparece)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Deuda + WhatsApp */}
            {deudaTotal > 0.01 && (
              <div className="flex items-center justify-between rounded-2xl bg-amber-950 px-4 py-3">
                <span className="font-bold text-amber-300">Debe {eur(deudaTotal)}</span>
                {wa ? (
                  <a
                    href={`https://wa.me/${wa}?text=${msgRecordatorio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                  >
                    Recordar por WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-amber-500">añade teléfono para avisar</span>
                )}
              </div>
            )}
          </div>

          {/* ---------- Columna derecha: facturación + actividad ---------- */}
          <div className="flex flex-col gap-4">
            {/* Resumen de facturas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Pagadas</p>
                <p className="mt-1 text-lg font-black text-emerald-400">{pagadas.length}</p>
                <p className="text-[11px] text-zinc-600">{eur(totalCobrado)} cobrados</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Pendientes</p>
                <p className={`mt-1 text-lg font-black ${pendientesFac.length ? "text-amber-400" : "text-white"}`}>
                  {pendientesFac.length}
                </p>
                <p className="text-[11px] text-zinc-600">{eur(deudaTotal)} por cobrar</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Facturas</p>
                <p className="mt-1 text-lg font-black text-white">{facturas.length}</p>
                <p className="text-[11px] text-zinc-600">en total</p>
              </div>
            </div>

            {/* Historial de facturas */}
            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">
                Facturas ({facturas.length})
              </h3>
              <div className="overflow-hidden rounded-2xl bg-zinc-900">
                {facturas.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-zinc-500">Sin facturas todavía.</p>
                )}
                {facturas.map((f) => {
                  const pendiente = Number(f.pendiente);
                  return (
                    <div key={f.id} className="border-b border-zinc-800 px-4 py-3 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{f.concepto}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(f.fecha_emision).toLocaleDateString("es-ES")} · total {eur(Number(f.total))} · cobrado {eur(Number(f.cobrado))}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {pendiente > 0.01 && (
                            <>
                              <button
                                onClick={() => {
                                  setAccion({ facturaId: f.id, modo: "cobrar" });
                                  setAccionImporte(String(pendiente));
                                }}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                              >
                                Cobrar
                              </button>
                              <button
                                onClick={() => {
                                  setAccion({ facturaId: f.id, modo: "perdonar" });
                                  setAccionImporte(String(pendiente));
                                }}
                                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-amber-300"
                              >
                                Perdonar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setAccion({ facturaId: f.id, modo: "devolver" });
                              setAccionImporte("");
                            }}
                            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300"
                          >
                            Devolver
                          </button>
                          <button
                            onClick={() => router.push(`/facturas/${f.id}`)}
                            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-sky-300"
                          >
                            Factura
                          </button>
                        </div>
                      </div>
                      {pendiente > 0.01 && (
                        <p className="mt-1 text-xs font-bold text-amber-400">pendiente {eur(pendiente)}</p>
                      )}
                      {Number(f.condonado) > 0 && (
                        <p className="mt-1 text-xs text-zinc-500">perdonado {eur(Number(f.condonado))}</p>
                      )}

                      {accion?.facturaId === f.id && (
                        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-950 p-3">
                          <p className="text-xs font-semibold uppercase text-zinc-500">
                            {accion.modo === "cobrar"
                              ? "Apuntar cobro"
                              : accion.modo === "devolver"
                                ? "Apuntar devolución al cliente"
                                : "Perdonar deuda (no entra dinero en caja)"}
                          </p>
                          <input
                            inputMode="decimal"
                            placeholder="Importe"
                            value={accionImporte}
                            onChange={(e) => setAccionImporte(e.target.value)}
                            className={inputCls}
                          />
                          {accion.modo !== "perdonar" && (
                            <div className="flex flex-wrap gap-2">
                              {cuentas.map((c) => (
                                <button
                                  key={c.codigo}
                                  onClick={() => setAccionCuenta(c.codigo)}
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    accionCuenta === c.codigo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"
                                  }`}
                                >
                                  {c.nombre.split(" (")[0]}
                                </button>
                              ))}
                            </div>
                          )}
                          <button onClick={ejecutarAccion} className="rounded-xl bg-red-600 py-2 text-sm font-bold text-white">
                            Confirmar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline de actividad */}
            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">
                Actividad ({actividades.length})
              </h3>
              <div className="rounded-2xl bg-zinc-900 p-4">
                {actividades.length === 0 && (
                  <p className="py-2 text-center text-sm text-zinc-500">
                    Sin actividades vinculadas a este contacto.
                  </p>
                )}
                <div className="relative flex flex-col gap-4 pl-5">
                  {actividades.length > 0 && (
                    <span className="absolute bottom-1 left-[7px] top-1 w-px bg-zinc-800" aria-hidden />
                  )}
                  {actividades.map((a) => (
                    <div key={a.id} className="relative">
                      <span
                        className={`absolute -left-5 top-1 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-zinc-900 ${
                          a.hecha ? "bg-emerald-600" : "bg-zinc-600"
                        }`}
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="text-xs">{ICONO_TIPO[a.tipo] ?? "•"}</span>
                        <p className={`text-sm font-semibold ${a.hecha ? "text-zinc-400" : "text-white"}`}>
                          {a.titulo}
                        </p>
                        <span className="text-[11px] text-zinc-600">
                          {new Date(a.cuando).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        {a.tipo} · {nombreDe(a.responsable)} {a.hecha ? "· hecha ✓" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
