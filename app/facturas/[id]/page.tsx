"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";

interface FacturaCompleta {
  id: number;
  numero: string | null;
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

  const cargar = useCallback(async () => {
    const [f, c] = await Promise.all([
      supabase
        .from("facturas")
        .select("id, numero, fecha_emision, concepto, base, iva_pct, irpf_pct, iva_importe, irpf_importe, total, clientes(nombre, nif, direccion)")
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

  // Asigna el siguiente número de la serie (una sola vez por factura)
  async function emitir() {
    if (!config || !factura) return;
    setEmitiendo(true);
    const numero = `${config.serie}${String(config.proximo_numero).padStart(6, "0")}`;

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
        {factura?.numero ? (
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white"
          >
            Imprimir / Guardar PDF
          </button>
        ) : (
          config &&
          factura && (
            <button
              onClick={emitir}
              disabled={emitiendo}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white disabled:opacity-50"
            >
              {emitiendo
                ? "Emitiendo…"
                : `Emitir como ${config.serie}${String(config.proximo_numero).padStart(6, "0")}`}
            </button>
          )
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300 print:hidden">
          {error}
        </p>
      )}

      {factura && !factura.numero && (
        <p className="mb-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300 print:hidden">
          Esta factura aún no tiene número legal. Al pulsar &quot;Emitir&quot; se le asigna el
          siguiente de la serie y ya no se puede cambiar (la numeración debe ser correlativa).
        </p>
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
