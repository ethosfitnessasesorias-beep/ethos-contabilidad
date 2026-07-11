import { createClient } from "@supabase/supabase-js";

// Cliente único para toda la app (navegador).
// Las claves viven en .env.local y son públicas por diseño:
// la seguridad real la pone RLS en el servidor.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
