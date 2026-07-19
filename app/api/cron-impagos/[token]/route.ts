import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Vercel Cron (lunes 8:00): crea una nota con los impagos pendientes.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "config" }, { status: 500 });
  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supa.rpc("cron_impagos", { p_token: token });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json(data);
}
