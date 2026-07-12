"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de navegación inferior (estilo app móvil)
export function NavInferior() {
  const ruta = usePathname();

  const item = (href: string, icono: string, etiqueta: string) => {
    const activo = href === "/" ? ruta === "/" : ruta.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-bold ${
          activo ? "text-emerald-400" : "text-zinc-500"
        }`}
      >
        <span className="text-xl leading-none">{icono}</span>
        {etiqueta}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {item("/", "✏️", "Apuntar")}
        {item("/panel", "📊", "Panel")}
        {item("/clientes", "👥", "Clientes")}
        {item("/gastos", "🧾", "Gastos")}
      </div>
    </nav>
  );
}
