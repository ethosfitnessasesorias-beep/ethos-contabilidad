"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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

const GRUPOS: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: "Workspace",
    items: [
      { href: "/dashboard", etiqueta: "Dashboard", icono: ic("M4 13h6V4H4z|M14 20h6v-9h-6z|M14 8h6V4h-6z|M4 20h6v-4H4z") },
      { href: "/contactos", etiqueta: "Contactos", icono: ic("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75") },
      { href: "/crm", etiqueta: "CRM", icono: ic("M3 3v18h18|M18 9l-5 5-3-3-4 4") },
      { href: "/pipeline", etiqueta: "Pipeline", icono: ic("M3 6h18|M7 12h10|M11 18h6") },
      { href: "/actividades", etiqueta: "Actividades", icono: ic("M20 7h-9|M14 17H5|M17 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M7 7a3 3 0 1 0 0 .01") },
      { href: "/contenido", etiqueta: "Contenido", icono: ic("M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14|M3 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z") },
    ],
  },
  {
    titulo: "Contabilidad",
    items: [
      { href: "/", etiqueta: "Apuntar", icono: ic("M12 20h9|M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z") },
      { href: "/contabilidad", etiqueta: "Contabilidad", icono: ic("M4 4h16v16H4z|M8 8h8|M8 12h8|M8 16h5") },
    ],
  },
  {
    titulo: "Análisis",
    items: [
      { href: "/reportes", etiqueta: "Reportes", icono: ic("M4 20V10|M12 20V4|M20 20v-6") },
      { href: "/inbox", etiqueta: "Inbox", icono: ic("M22 12h-6l-2 3h-4l-2-3H2|M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z") },
    ],
  },
];

export function Shell({ children, titulo }: { children: React.ReactNode; titulo?: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);

  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-sm font-black text-white">
          E
        </span>
        <span className="font-black tracking-tight text-white">Ethos Fitness</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {g.titulo}
            </p>
            {g.items.map((it) => (
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
        ))}
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
