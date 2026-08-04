"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/tesoreria/cuentas", etiqueta: "Cuentas" },
  { href: "/tesoreria/cashflow", etiqueta: "Cash flow" },
  { href: "/tesoreria/pagos-cobros", etiqueta: "Pagos y cobros" },
];

export function TesoTabs() {
  const ruta = usePathname();
  return (
    <div className="mt-4 flex gap-1 overflow-x-auto border-b border-zinc-800">
      {TABS.map((t) => {
        const activo = ruta === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              activo
                ? "border-red-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.etiqueta}
          </Link>
        );
      })}
    </div>
  );
}
