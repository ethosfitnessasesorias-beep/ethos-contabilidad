"use client";

import { useEffect } from "react";

// Modal centrado reutilizable (overlay + tarjeta). Cierra con ✕, clic fuera o Escape.
export default function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = "max-w-lg",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-10 backdrop-blur-md md:pt-16"
      onClick={onCerrar}
    >
      <div
        className={`w-full ${ancho} rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl ring-1 ring-black/40`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <h2 className="truncate text-base font-black tracking-tight text-white">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg px-2 py-0.5 text-lg leading-none text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
