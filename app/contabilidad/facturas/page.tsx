"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Factura {
  id: number;
  numero: string | null;
  fecha_emision: string;
  concepto: string;
  total: number;
  canal: string | null;
  clientes: { nombre: string } | null;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

type Filtro = "todas" | "borrador" | "emitidas" | "pendientes";

export default function FacturasPage() {
  const router = useRouter();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pendientes, setPendientes] = useState<Map<number, number>>(new Map());
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const [f, saldos] = await Promise.all([
        supabase
          .from("facturas")
          .select("id, numero, fecha_emision, concepto, total, canal, clientes(nombre)")
          .order("fecha_emision", { ascending: false })
          .limit(200),
        supabase.from("v_facturas_saldo").select("id, pendiente").gt("pendiente", 0.01),
      ]);
      setFacturas((f.data as unknown as Factura[]) ?? []);
      const m = new Map<number, number>();
      for (const s of saldos.data ?? []) m.set(s.id as number, Number(s.pendiente));
      setPendientes(m);
      setCargando(false);
    })();
  }, []);

  const visibles = useMemo(() => {
    return facturas.filter((f) => {
      if (filtro === "borrador") return !f.numero;
      if (filtro === "emitidas") return !!f.numero;
      if (filtro === "pendientes") return pendientes.has(f.id);
      return true;
    });
  }, [facturas, filtro, pendientes]);

  const chip = (v: Filtro, etiqueta: string) => (
    <button
      onClick={() => setFiltro(v)}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        filtro === v ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("todas", "Todas")}
        {chip("borrador", "Borradores")}
        {chip("emitidas", "Emitidas")}
        {chip("pendientes", "Pendientes de cobro")}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {cargando ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Sin facturas.</p>
        ) : (
          visibles.map((f) => {
            const pendiente = pendientes.get(f.id);
            return (
              <button
                key={f.id}
                onClick={() => router.push(`/facturas/${f.id}`)}
                className="flex w-full items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 text-left last:border-0 hover:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {f.clientes?.nombre ?? f.concepto}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {f.numero ? (
                      <span className="text-sky-400">{f.numero}</span>
                    ) : (
                      <span className="text-zinc-600">borrador</span>
                    )}
                    {" · "}
                    {new Date(f.fecha_emision).toLocaleDateString("es-ES")}
                    {f.canal ? ` · ${f.canal}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-white">{eur(Number(f.total))}</p>
                  {pendiente ? (
                    <p className="text-xs font-bold text-amber-400">debe {eur(pendiente)}</p>
                  ) : (
                    <p className="text-xs text-emerald-500">cobrada</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
