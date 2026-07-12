"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Movimiento {
  key: string;
  fecha: string;
  concepto: string;
  detalle: string;
  tipo: "ingreso" | "gasto";
  importe: number; // con signo
  canal?: string | null;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const mesActualISO = () => new Date().toISOString().slice(0, 7);

export default function LibroPage() {
  const [mes, setMes] = useState(mesActualISO());
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [porPedir, setPorPedir] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const desde = `${mes}-01`;
    const d = new Date(desde);
    const hasta = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);

    const [cobros, gastos, pedir] = await Promise.all([
      supabase
        .from("cobros")
        .select("id, fecha, importe, facturas(concepto, canal, clientes(nombre))")
        .gte("fecha", desde)
        .lt("fecha", hasta),
      supabase
        .from("gastos")
        .select("id, fecha, concepto, proveedor, total")
        .gte("fecha", desde)
        .lt("fecha", hasta),
      supabase
        .from("gastos")
        .select("id", { count: "exact", head: true })
        .eq("tiene_factura", false)
        .gt("base", 0),
    ]);

    const lista: Movimiento[] = [];
    for (const c of (cobros.data as unknown as Array<{
      id: number;
      fecha: string;
      importe: number;
      facturas: { concepto: string; canal: string | null; clientes: { nombre: string } | null } | null;
    }>) ?? []) {
      lista.push({
        key: `c${c.id}`,
        fecha: c.fecha,
        concepto: c.facturas?.concepto ?? "Cobro",
        detalle: c.facturas?.clientes?.nombre ?? "",
        tipo: "ingreso",
        importe: Number(c.importe),
        canal: c.facturas?.canal,
      });
    }
    for (const g of (gastos.data as Array<{
      id: number;
      fecha: string;
      concepto: string;
      proveedor: string | null;
      total: number;
    }>) ?? []) {
      lista.push({
        key: `g${g.id}`,
        fecha: g.fecha,
        concepto: g.concepto,
        detalle: g.proveedor ?? "",
        tipo: "gasto",
        importe: -Number(g.total),
      });
    }
    lista.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
    setMovs(lista);
    setPorPedir(pedir.count ?? 0);
    setCargando(false);
  }, [mes]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totales = useMemo(() => {
    let ing = 0,
      gas = 0;
    for (const m of movs) if (m.importe >= 0) ing += m.importe;
      else gas += -m.importe;
    return { ing, gas, neto: ing - gas };
  }, [movs]);

  return (
    <div>
      {porPedir > 0 && (
        <Link
          href="/gastos"
          className="mb-4 flex items-center justify-between rounded-xl bg-amber-950 px-4 py-3 text-sm"
        >
          <span className="font-semibold text-amber-300">
            {porPedir} {porPedir === 1 ? "gasto" : "gastos"} sin factura por pedir
          </span>
          <span className="text-amber-500">revisar →</span>
        </Link>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-emerald-400">
            Ingresos {eur(totales.ing)}
          </span>
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-red-400">
            Gastos {eur(totales.gas)}
          </span>
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 font-bold text-white">
            Neto {eur(totales.neto)}
          </span>
        </div>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value || mesActualISO())}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {cargando ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Cargando…</p>
        ) : movs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin movimientos este mes.</p>
        ) : (
          movs.map((m) => (
            <div
              key={m.key}
              className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm ${
                    m.importe >= 0 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                  }`}
                >
                  {m.importe >= 0 ? "↑" : "↓"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{m.concepto}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {new Date(m.fecha).toLocaleDateString("es-ES")}
                    {m.detalle ? ` · ${m.detalle}` : ""}
                    {m.canal ? ` · ${m.canal}` : ""}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 text-sm font-bold ${
                  m.importe >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {m.importe >= 0 ? "+" : ""}
                {eur(m.importe)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
