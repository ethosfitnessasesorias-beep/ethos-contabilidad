"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : `No se pudo iniciar sesión: ${error.message}`
      );
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-3xl font-black tracking-tight text-white">
          ETHOS
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-400">Contabilidad</p>

        <form onSubmit={entrar} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-base text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-base text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
          />
          {error && (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={cargando}
            className="mt-2 rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
