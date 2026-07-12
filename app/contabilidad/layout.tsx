"use client";

import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import { ContaTabs } from "./tabs";

export default function ContabilidadLayout({ children }: { children: React.ReactNode }) {
  const sesionOk = useSesion();
  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }
  return (
    <Shell titulo="Contabilidad">
      <div className="px-5 py-6 md:px-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Contabilidad</h1>
        <ContaTabs />
        <div className="mt-6">{children}</div>
      </div>
    </Shell>
  );
}
