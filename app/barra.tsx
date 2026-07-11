"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Cabecera común: logo, pestañas de navegación y salir
export function Barra() {
  const ruta = usePathname();
  const router = useRouter();

  const tab = (href: string, etiqueta: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
        ruta === href ? "bg-emerald-600 text-white" : "text-zinc-400"
      }`}
    >
      {etiqueta}
    </Link>
  );

  return (
    <header className="mb-4 flex items-center justify-between">
      <h1 className="text-lg font-black tracking-tight text-white">ETHOS</h1>
      <nav className="flex items-center gap-1 rounded-xl bg-zinc-900 p-1">
        {tab("/", "Apuntar")}
        {tab("/panel", "Panel")}
      </nav>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
        className="text-xs text-zinc-500 underline"
      >
        salir
      </button>
    </header>
  );
}
