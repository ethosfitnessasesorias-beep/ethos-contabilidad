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
  type Cliente,
  type Cuenta,
  type MetodoPago,
} from "@/lib/tipos";

interface FacturaSaldo {
  id: number;
  fecha_emision: string;
  concepto: string;
  total: number;
  cobrado: number;
  pendiente: number;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-base text-white placeholder-zinc-600 outline-none focus:border-emerald-500";

// Convierte un teléfono español a formato wa.me (solo dígitos, con 34 delante)
function telefonoWa(tel: string): string | null {
  const digitos = tel.replace(/\D/g, "");
  if (digitos.length === 9) return `34${digitos}`;
  if (digitos.length >= 11) return digitos;
  return null;
}

export default function FichaCliente() {
  const sesionOk = useSesion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clienteId = Number(params.id);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [facturas, setFacturas] = useState<FacturaSaldo[]>([]);
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
  const [accion, setAccion] = useState<{ facturaId: number; modo: "cobrar" | "devolver" } | null>(null);
  const [accionImporte, setAccionImporte] = useState("");
  const [accionCuenta, setAccionCuenta] = useState("banco");

  function avisar(tipo: "ok" | "error", texto: string) {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), tipo === "ok" ? 2500 : 5000);
  }

  const cargar = useCallback(async () => {
    const [cli, fac, cue, otros] = await Promise.all([
      supabase.from("clientes").select("*").eq("id", clienteId).single(),
      supabase
        .from("v_facturas_saldo")
        .select("id, fecha_emision, concepto, total, cobrado, pendiente")
        .eq("cliente_id", clienteId)
        .order("fecha_emision", { ascending: false }),
      supabase.from("cuentas").select("*").eq("activa", true).order("id"),
      supabase.from("clientes").select("id, nombre, entrenador").neq("id", clienteId).order("nombre"),
    ]);
    if (cli.data) {
      const c = cli.data as Cliente;
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
  const wa = cliente.telefono ? telefonoWa(cliente.telefono) : null;
  const msgRecordatorio = encodeURIComponent(
    `¡Hola ${cliente.nombre}! Te escribimos de Ethos 💪 Tienes ${deudaTotal.toFixed(2).replace(".", ",")} € pendientes de pago. ¿Puedes revisarlo cuando tengas un momento? ¡Gracias!`
  );

  return (
    <Shell titulo="Cliente">
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <button onClick={() => router.push("/contabilidad/clientes")} className="mb-3 text-sm text-zinc-500">
        ← Volver a clientes
      </button>

      {/* Datos */}
      <div className="rounded-2xl bg-zinc-900 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className={`text-xl font-black ${cliente.fecha_baja ? "text-zinc-500 line-through" : "text-white"}`}>
              {cliente.nombre}
            </h2>
            <p className="text-sm text-zinc-500">
              {ATRIBUCIONES.find((a) => a.valor === cliente.entrenador)?.etiqueta}
              {cliente.telefono ? ` · ${cliente.telefono}` : ""}
              {cliente.fecha_baja ? ` · de baja desde ${new Date(cliente.fecha_baja).toLocaleDateString("es-ES")}` : ""}
            </p>
            {cliente.notas && <p className="mt-1 text-xs text-zinc-500">{cliente.notas}</p>}
          </div>
          <button
            onClick={() => setEditando(!editando)}
            className="shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300"
          >
            {editando ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editando && (
          <div className="mt-3 flex flex-col gap-2">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className={inputCls} />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" inputMode="tel" className={inputCls} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" inputMode="email" className={inputCls} />
            <input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="NIF (para factura completa)" className={inputCls} />
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección (para factura completa)" className={inputCls} />
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas" rows={2} className={inputCls} />
            <div className="flex flex-wrap gap-2">
              {ATRIBUCIONES.map((a) => (
                <button
                  key={a.valor}
                  onClick={() => setEntrenador(a.valor)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    entrenador === a.valor ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {a.etiqueta}
                </button>
              ))}
            </div>
            <button onClick={guardarDatos} className="rounded-xl bg-emerald-600 py-2.5 font-bold text-white">
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
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-amber-950 px-4 py-3">
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

      {/* Historial */}
      <h3 className="mb-2 mt-6 text-sm font-black uppercase tracking-wide text-zinc-400">
        Historial ({facturas.length})
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
                    <button
                      onClick={() => {
                        setAccion({ facturaId: f.id, modo: "cobrar" });
                        setAccionImporte(String(pendiente));
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Cobrar
                    </button>
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

              {accion?.facturaId === f.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-950 p-3">
                  <p className="text-xs font-semibold uppercase text-zinc-500">
                    {accion.modo === "cobrar" ? "Apuntar cobro" : "Apuntar devolución al cliente"}
                  </p>
                  <input
                    inputMode="decimal"
                    placeholder="Importe"
                    value={accionImporte}
                    onChange={(e) => setAccionImporte(e.target.value)}
                    className={inputCls}
                  />
                  <div className="flex flex-wrap gap-2">
                    {cuentas.map((c) => (
                      <button
                        key={c.codigo}
                        onClick={() => setAccionCuenta(c.codigo)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          accionCuenta === c.codigo ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {c.nombre.split(" (")[0]}
                      </button>
                    ))}
                  </div>
                  <button onClick={ejecutarAccion} className="rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white">
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
