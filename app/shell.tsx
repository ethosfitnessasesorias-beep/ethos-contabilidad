"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ItemNav {
  href: string;
  etiqueta: string;
  icono: React.ReactNode;
}

// Iconos de línea sencillos (SVG inline) para que se vea profesional
const ic = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-[18px] w-[18px]"
  >
    {d.split("|").map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

// titulo null = bloque raíz sin cabecera (siempre visible); el resto son desplegables
const GRUPOS: { titulo: string | null; items: ItemNav[] }[] = [
  {
    titulo: null,
    items: [
      { href: "/dashboard", etiqueta: "Dashboard", icono: ic("M4 13h6V4H4z|M14 20h6v-9h-6z|M14 8h6V4h-6z|M4 20h6v-4H4z") },
      { href: "/crm", etiqueta: "Contactos", icono: ic("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75") },
      { href: "/ventas", etiqueta: "Ventas", icono: ic("M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z|M3 6h18|M16 10a4 4 0 0 1-8 0") },
      { href: "/compras", etiqueta: "Compras", icono: ic("M6 6h15l-1.5 9H8z|M6 6 5 2H2|M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z|M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z") },
    ],
  },
  {
    titulo: "CRM",
    items: [
      { href: "/pipeline", etiqueta: "Embudo de ventas", icono: ic("M3 4h18l-7 8v6l-4 2v-8z") },
      { href: "/actividades", etiqueta: "Actividades", icono: ic("M20 7h-9|M14 17H5|M17 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M7 7a3 3 0 1 0 0 .01") },
    ],
  },
  {
    titulo: "Tesorería",
    items: [
      { href: "/tesoreria/cuentas", etiqueta: "Cuentas", icono: ic("M3 6h18v12H3z|M3 10h18|M7 15h2") },
      { href: "/tesoreria/cashflow", etiqueta: "Cash flow", icono: ic("M3 17l6-6 4 4 8-8|M21 7v6h-6") },
      { href: "/tesoreria/pagos-cobros", etiqueta: "Pagos y cobros", icono: ic("M4 4h16v16H4z|M4 9h16|M9 4v16") },
    ],
  },
  {
    titulo: "Contabilidad",
    items: [
      { href: "/contabilidad", etiqueta: "Libro diario", icono: ic("M4 4h16v16H4z|M8 8h8|M8 12h8|M8 16h5") },
      { href: "/contabilidad/pyg", etiqueta: "Pérdidas y ganancias", icono: ic("M4 20V10|M12 20V4|M20 20v-6") },
      { href: "/contabilidad/impuestos", etiqueta: "Impuestos", icono: ic("M9 14l6-6|M9.5 9.5h.01|M14.5 13.5h.01|M4 4h16v16H4z") },
      { href: "/contabilidad/reparto", etiqueta: "Reparto", icono: ic("M16 3h5v5|M8 3H3v5|M21 16v5h-5|M3 16v5h5|M21 3l-7 7|M3 21l7-7") },
      { href: "/contabilidad/cierre", etiqueta: "Cierre de mes", icono: ic("M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11") },
      { href: "/contabilidad/importar", etiqueta: "Importar banco", icono: ic("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3") },
      { href: "/contabilidad/ajustes", etiqueta: "Ajustes", icono: ic("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M12 2v3|M12 19v3|M2 12h3|M19 12h3|M4.9 4.9l2.1 2.1|M17 17l2.1 2.1|M19.1 4.9 17 7|M7 17l-2.1 2.1") },
    ],
  },
  {
    titulo: "Análisis",
    items: [
      { href: "/reportes", etiqueta: "Reportes", icono: ic("M4 20V10|M12 20V4|M20 20v-6") },
      { href: "/kpis", etiqueta: "KPIs", icono: ic("M3 3v18h18|M7 14l4-4 3 3 5-6") },
      { href: "/notas", etiqueta: "Notas", icono: ic("M12 20h9|M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z|M4 8h6") },
    ],
  },
  {
    titulo: "Contenido",
    items: [
      { href: "/contenido", etiqueta: "Contenido", icono: ic("M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14|M3 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z") },
      { href: "/contenido/calendario", etiqueta: "Calendario", icono: ic("M8 2v4|M16 2v4|M3 10h18|M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z") },
    ],
  },
];

export function Shell({ children, titulo }: { children: React.ReactNode; titulo?: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [plegados, setPlegados] = useState<Record<string, boolean>>({});

  // "/contabilidad" y "/contenido" tienen subrutas propias: solo se iluminan en coincidencia exacta
  const activo = (href: string) =>
    href === "/contabilidad" || href === "/contenido" ? ruta === href : ruta.startsWith(href);

  // El grupo que contiene la ruta actual se abre solo
  useEffect(() => {
    const g = GRUPOS.find((x) => x.titulo && x.items.some((it) => activo(it.href)));
    if (g?.titulo) setPlegados((p) => ({ ...p, [g.titulo as string]: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  const plegado = (t: string) => plegados[t] ?? true;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image src="/logo.png" alt="Ethos" width={32} height={32} className="h-8 w-8 rounded-lg" priority />
        <span className="font-black tracking-tight text-white">Ethos Fitness</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {GRUPOS.map((g, gi) => {
          const abiertoGrupo = g.titulo === null || !plegado(g.titulo) || g.items.some((it) => activo(it.href));
          return (
            <div key={g.titulo ?? gi} className="mb-3">
              {g.titulo !== null && (
                <button
                  onClick={() => setPlegados((p) => ({ ...p, [g.titulo as string]: !plegado(g.titulo as string) }))}
                  className="flex w-full items-center justify-between px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-400"
                >
                  {g.titulo}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3 w-3 transition-transform ${abiertoGrupo ? "rotate-90" : ""}`}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
              {abiertoGrupo &&
                g.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setAbierta(false)}
                    className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activo(it.href)
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <span className={activo(it.href) ? "text-red-500" : ""}>{it.icono}</span>
                    {it.etiqueta}
                  </Link>
                ))}
            </div>
          );
        })}
      </nav>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
        className="border-t border-zinc-800 px-5 py-4 text-left text-xs text-zinc-500 hover:text-zinc-300"
      >
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Sidebar fija en escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-zinc-800 bg-zinc-950 md:block">
        {sidebar}
      </aside>

      {/* Drawer en móvil */}
      {abierta && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setAbierta(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 border-r border-zinc-800 bg-zinc-950 md:hidden">
            {sidebar}
          </aside>
        </>
      )}

      {/* Barra superior móvil */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur md:hidden">
        <button onClick={() => setAbierta(true)} aria-label="Menú" className="text-zinc-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-black tracking-tight text-white">{titulo ?? "Ethos"}</span>
      </header>

      {/* Contenido */}
      <div className="md:pl-60">{children}</div>
    </div>
  );
}
