"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";

interface Aviso {
  id: string;
  nivel: "alto" | "medio" | "bajo";
  titulo: string;
  detalle: string;
  href: string;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const NIVELES = {
  alto: { punto: "bg-red-500", titulo: "Urgente" },
  medio: { punto: "bg-amber-500", titulo: "Pendiente" },
  bajo: { punto: "bg-sky-500", titulo: "Para revisar" },
} as const;

export default function Inbox() {
  const sesionOk = useSesion();
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesionOk) return;
    (async () => {
      const ahora = new Date().toISOString();
      const hace14dias = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

      const [morosos, sinFactura, vencidas, estancados] = await Promise.all([
        supabase.from("v_morosos").select("id, cliente_id, cliente, concepto, pendiente, fecha_emision").limit(50),
        supabase.from("gastos").select("id, concepto, total, fecha").eq("tiene_factura", false).gt("base", 0).limit(50),
        supabase
          .from("actividades")
          .select("id, titulo, cuando")
          .eq("hecha", false)
          .is("archivada_en", null)
          .lt("cuando", ahora)
          .limit(50),
        supabase
          .from("deals")
          .select("id, titulo, fecha_alta, clientes(nombre)")
          .in("etapa", ["lead", "contactado", "agendado"])
          .lt("fecha_alta", hace14dias)
          .limit(50),
      ]);

      const fallo = morosos.error ?? sinFactura.error ?? vencidas.error ?? estancados.error;
      if (fallo) return setError(fallo.message);

      const lista: Aviso[] = [];

      for (const m of morosos.data ?? []) {
        lista.push({
          id: `moroso-${m.id}`,
          nivel: "alto",
          titulo: `${m.cliente ?? m.concepto} debe ${eur(Number(m.pendiente))}`,
          detalle: `${m.concepto} · desde ${new Date(m.fecha_emision).toLocaleDateString("es-ES")}`,
          href: m.cliente_id ? `/clientes/${m.cliente_id}` : "/contabilidad/clientes",
        });
      }

      for (const a of vencidas.data ?? []) {
        lista.push({
          id: `actividad-${a.id}`,
          nivel: "medio",
          titulo: `Actividad vencida: ${a.titulo}`,
          detalle: `Era para el ${new Date(a.cuando).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
          href: "/actividades",
        });
      }

      for (const d of (estancados.data ?? []) as unknown as { id: number; titulo: string; fecha_alta: string; clientes: { nombre: string } | null }[]) {
        const dias = Math.round((Date.now() - new Date(d.fecha_alta).getTime()) / 86400000);
        lista.push({
          id: `deal-${d.id}`,
          nivel: "medio",
          titulo: `Deal parado ${dias} días: ${d.clientes?.nombre ?? d.titulo}`,
          detalle: d.titulo,
          href: "/pipeline",
        });
      }

      for (const g of sinFactura.data ?? []) {
        lista.push({
          id: `factura-${g.id}`,
          nivel: "bajo",
          titulo: `Falta factura: ${g.concepto}`,
          detalle: `${eur(Number(g.total))} · ${new Date(g.fecha).toLocaleDateString("es-ES")}`,
          href: "/gastos",
        });
      }

      setAvisos(lista);
    })();
  }, [sesionOk]);

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  return (
    <Shell titulo="Inbox">
      <div className="px-5 py-6 md:px-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Inbox</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lo que necesita tu atención, generado en vivo desde los datos. Se limpia solo al resolverlo.
        </p>

        {error && <p className="mt-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {avisos === null && !error && <p className="mt-6 text-sm text-zinc-600">Cargando avisos…</p>}

        {avisos !== null && avisos.length === 0 && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-bold text-white">Bandeja limpia</p>
            <p className="mt-1 text-sm text-zinc-500">Nadie debe nada, no falta ninguna factura y no hay tareas vencidas.</p>
          </div>
        )}

        {avisos !== null &&
          (["alto", "medio", "bajo"] as const).map((nivel) => {
            const grupo = avisos.filter((a) => a.nivel === nivel);
            if (grupo.length === 0) return null;
            return (
              <section key={nivel} className="mt-6">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-400">
                  <span className={`h-2 w-2 rounded-full ${NIVELES[nivel].punto}`} />
                  {NIVELES[nivel].titulo} ({grupo.length})
                </h2>
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  {grupo.map((a) => (
                    <Link
                      key={a.id}
                      href={a.href}
                      className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0 hover:bg-zinc-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{a.titulo}</p>
                        <p className="truncate text-xs text-zinc-500">{a.detalle}</p>
                      </div>
                      <span className="shrink-0 text-zinc-600">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </Shell>
  );
}
