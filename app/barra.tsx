"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Cabecera común: logo y salir (la navegación vive en la barra inferior)
export function Barra(props: { titulo?: string }) {
  const router = useRouter();

  return (
    <header className="mb-4 flex items-center justify-between">
      <h1 className="text-lg font-black tracking-tight text-white">
        ETHOS
        {props.titulo && <span className="ml-2 font-semibold text-zinc-500">{props.titulo}</span>}
      </h1>
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
