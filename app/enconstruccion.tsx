"use client";

import { useSesion } from "@/lib/useSesion";
import { Shell } from "./shell";

export function EnConstruccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  const sesionOk = useSesion();
  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }
  return (
    <Shell titulo={titulo}>
      <div className="px-5 py-6 md:px-8">
        <h1 className="text-3xl font-black tracking-tight text-white">{titulo}</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-sm text-zinc-400">{descripcion}</p>
          <p className="mt-2 text-xs text-zinc-600">Lo construimos en el siguiente paso.</p>
        </div>
      </div>
    </Shell>
  );
}
