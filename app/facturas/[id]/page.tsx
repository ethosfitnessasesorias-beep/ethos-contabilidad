"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";

interface FacturaCompleta {
  id: number;
  numero: string | null;
  cliente_id: number | null;
  fecha_emision: string;
  concepto: string;
  base: number;
  iva_pct: number;
  irpf_pct: number;
  iva_importe: number;
  irpf_importe: number;
  total: number;
  clientes: {
    nombre: string;
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

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function PaginaFactura() {
  const sesionOk = useSesion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const facturaId = Number(params.id);

  const [factura, setFactura] = useState<FacturaCompleta | null>(null);
  const [config, setConfig] = useState<ConfigFacturacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emitiendo, setEmitiendo] = useState(false);

  // Edición del borrador (solo antes de emitir)
  const [editando, setEditando] = useState(false);
  const [eConcepto, setEConcepto] = useState("");
  const [eBase, setEBase] = useState("");
  const [eIva, setEIva] = useState(0.21);
  const [eIrpf, setEIrpf] = useState(0);
  const [eCliNombre, setECliNombre] = useState("");
  const [eCliNif, setECliNif] = useState("");
  const [eCliDireccion, setECliDireccion] = useState("");

  const cargar = useCallback(async () => {
    const [f, c] = await Promise.all([
      supabase
        .from("facturas")
        .select("id, numero, cliente_id, fecha_emision, concepto, base, iva_pct, irpf_pct, iva_importe, irpf_importe, total, clientes(nombre, nif, direccion)")
        .eq("id", facturaId)
        .single(),
      supabase.from("facturacion_config").select("*").eq("id", 1).single(),
    ]);
    if (f.error) return setError(f.error.message);
    if (c.error)
      return setError(
        "Falta la configuración de facturación: ejecuta supabase/facturacion.sql en el SQL Editor."
      );
    setFactura(f.data as unknown as FacturaCompleta);
    setConfig(c.data as ConfigFacturacion);
  }, [facturaId]);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  function abrirEdicion() {
    if (!factura) return;
    setEConcepto(factura.concepto);
    setEBase(String(factura.base));
    setEIva(Number(factura.iva_pct));
    setEIrpf(Number(factura.irpf_pct));
    setECliNombre(factura.clientes?.nombre ?? "");
    setECliNif(factura.clientes?.nif ?? "");
    setECliDireccion(factura.clientes?.direccion ?? "");
    setEditando(true);
  }

  async function guardarEdicion() {
    if (!factura) return;
    const base = Number(eBase.replace(",", "."));
    if (!Number.isFinite(base)) return setError("Base no válida.");
    const f = await supabase
      .from("facturas")
      .update({ concepto: eConcepto.trim() || factura.concepto, base: Math.round(base * 100) / 100, iva_pct: eIva, irpf_pct: eIrpf })
      .eq("id", facturaId);
    if (f.error) return setError(f.error.message);
    if (factura.cliente_id) {
      const c = await supabase
        .from("clientes")
        .update({
          nombre: eCliNombre.trim() || (factura.clientes?.nombre ?? ""),
          nif: eCliNif.trim() || null,
          direccion: eCliDireccion.trim() || null,
        })
        .eq("id", factura.cliente_id);
      if (c.error) return setError(c.error.message);
    }
    setError(null);
    setEditando(false);
    cargar();
  }

  // Asigna el siguiente número de la serie (una sola vez por factura)
  async function emitir() {
    if (!config || !factura) return;
    setEmitiendo(true);
    const numero = `${config.serie}${String(config.proximo_numero).padStart(4, "0")}`;

    // Consumir el número de forma segura: solo si nadie lo usó entre medias
    const consumo = await supabase
      .from("facturacion_config")
      .update({ proximo_numero: config.proximo_numero + 1 })
      .eq("id", 1)
      .eq("proximo_numero", config.proximo_numero)
      .select();
    if (consumo.error || !consumo.data?.length) {
      setEmitiendo(false);
      await cargar(); // otro usuario emitió a la vez: recargar y reintentar
      return setError("El número ya fue usado, vuelve a intentarlo.");
    }

    const upd = await supabase
      .from("facturas")
      .update({ numero })
      .eq("id", facturaId)
      .is("numero", null)
      .select();
    setEmitiendo(false);
    if (upd.error || !upd.data?.length) {
      return setError("Esta factura ya tenía número asignado.");
    }
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

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-zinc-950 px-4 pb-16 pt-4 print:max-w-none print:bg-white print:p-0">
      {/* Controles (no salen en el PDF) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button onClick={() => router.back()} className="text-sm text-zinc-500">
          ← Volver
        </button>
        <div className="flex gap-2">
          {factura?.numero ? (
            <button
              onClick={() => window.print()}
              className="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white"
            >
              Imprimir / Guardar PDF
            </button>
          ) : (
            config &&
            factura && (
              <>
                <button
                  onClick={editando ? guardarEdicion : abrirEdicion}
                  className="rounded-xl bg-zinc-800 px-4 py-2.5 font-bold text-zinc-200"
                >
                  {editando ? "Guardar cambios" : "Editar"}
                </button>
                {!editando && (
                  <button
                    onClick={emitir}
                    disabled={emitiendo}
                    className="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white disabled:opacity-50"
                  >
                    {emitiendo
                      ? "Emitiendo…"
                      : `Emitir como ${config.serie}${String(config.proximo_numero).padStart(4, "0")}`}
                  </button>
                )}
              </>
            )
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300 print:hidden">
          {error}
        </p>
      )}

      {factura && !factura.numero && (
        <p className="mb-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300 print:hidden">
          Esta factura aún no tiene número legal. Puedes editarla antes de emitirla. Al pulsar
          &quot;Emitir&quot; se le asigna el siguiente de la serie y ya no se puede cambiar
          (la numeración debe ser correlativa).
        </p>
      )}

      {/* Edición del borrador */}
      {editando && factura && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-zinc-900 p-4 print:hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Editar borrador
          </p>
          <input
            value={eConcepto}
            onChange={(e) => setEConcepto(e.target.value)}
            placeholder="Concepto que verá el cliente"
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
          />
          <div className="flex gap-2">
            <input
              value={eBase}
              onChange={(e) => setEBase(e.target.value)}
              inputMode="decimal"
              placeholder="Base sin IVA"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
            />
            <select
              value={eIva}
              onChange={(e) => setEIva(Number(e.target.value))}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white outline-none"
            >
              <option value={0.21}>IVA 21%</option>
              <option value={0.1}>IVA 10%</option>
              <option value={0.04}>IVA 4%</option>
              <option value={0}>Sin IVA</option>
            </select>
            <select
              value={eIrpf}
              onChange={(e) => setEIrpf(Number(e.target.value))}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white outline-none"
            >
              <option value={0}>Sin IRPF</option>
              <option value={0.07}>IRPF 7%</option>
              <option value={0.15}>IRPF 15%</option>
              <option value={0.19}>IRPF 19%</option>
            </select>
          </div>
          <p className="text-xs text-zinc-500">
            Puedes combinar IVA + IRPF (p. ej. una factura de servicios profesionales lleva ambos).
          </p>
          {factura.cliente_id ? (
            <>
              <input
                value={eCliNombre}
                onChange={(e) => setECliNombre(e.target.value)}
                placeholder="Nombre del cliente"
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
              />
              <input
                value={eCliNif}
                onChange={(e) => setECliNif(e.target.value)}
                placeholder="NIF del cliente"
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
              />
              <input
                value={eCliDireccion}
                onChange={(e) => setECliDireccion(e.target.value)}
                placeholder="Dirección del cliente"
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-red-500"
              />
              <p className="text-xs text-zinc-500">
                Los datos del cliente se guardan en su ficha (valen para futuras facturas).
              </p>
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              Esta factura no tiene cliente asociado: saldrá como venta a particular.
            </p>
          )}
        </div>
      )}

      {/* La factura en sí */}
      {factura && config && (
        <div className="rounded-2xl bg-white p-8 text-zinc-900 shadow print:rounded-none print:p-10 print:shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight">FACTURA</h1>
              <p className="mt-1 text-sm font-semibold">
                Nº {factura.numero ?? "(sin emitir — borrador)"}
              </p>
              <p className="text-sm">
                Fecha: {new Date(factura.fecha_emision).toLocaleDateString("es-ES")}
              </p>
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
            <p className="font-semibold">{factura.clientes?.nombre ?? "Cliente particular"}</p>
            {factura.clientes?.nif && <p>NIF {factura.clientes.nif}</p>}
            {factura.clientes?.direccion && <p>{factura.clientes.direccion}</p>}
            {!factura.clientes?.nif && (
              <p className="mt-1 text-xs text-zinc-400 print:hidden">
                (sin NIF: factura simplificada — añádelo en su ficha si pide factura completa)
              </p>
            )}
          </div>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-left">
                <th className="py-2">Concepto</th>
                <th className="py-2 text-right">Base</th>
                <th className="py-2 text-right">IVA</th>
                {Number(factura.irpf_pct) > 0 && <th className="py-2 text-right">IRPF</th>}
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-3">{factura.concepto}</td>
                <td className="py-3 text-right">{eur(Number(factura.base))}</td>
                <td className="py-3 text-right">
                  {eur(Number(factura.iva_importe))}
                  <span className="block text-xs text-zinc-500">
                    ({Math.round(Number(factura.iva_pct) * 100)}%)
                  </span>
                </td>
                {Number(factura.irpf_pct) > 0 && (
                  <td className="py-3 text-right">
                    −{eur(Number(factura.irpf_importe))}
                    <span className="block text-xs text-zinc-500">
                      ({Math.round(Number(factura.irpf_pct) * 100)}%)
                    </span>
                  </td>
                )}
                <td className="py-3 text-right font-bold">{eur(Number(factura.total))}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="rounded-lg bg-zinc-900 px-6 py-3 text-white print:bg-zinc-900">
              <span className="mr-4 text-sm">TOTAL</span>
              <span className="text-xl font-black">{eur(Number(factura.total))}</span>
            </div>
          </div>

          <p className="mt-10 text-xs text-zinc-400">
            Factura emitida por {config.emisor_nombre}, NIF {config.emisor_nif}.
            {Number(factura.iva_pct) === 0 && " Operación sin IVA."}
          </p>
        </div>
      )}
    </main>
  );
}
