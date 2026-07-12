"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Devuelve true cuando hay sesión; mientras tanto null.
// Si no hay sesión, redirige a /login.
export function useSesion(): boolean | null {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setOk(true);
    });
  }, [router]);

  return ok;
}
