import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Vercel Cron (día 1, 7:00): crea la nota con el cierre del mes anterior
// y genera la remesa de cuotas domiciliadas del mes nuevo.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "config" }, { status: 500 });
  const supa = createClient(url, key, { auth: { persistSession: false } });
  const [resumen, remesa] = await Promise.all([
    supa.rpc("cron_resumen_mensual", { p_token: token }),
    supa.rpc("cron_remesa", { p_token: token }),
  ]);
  if (resumen.error) return Response.json({ ok: false, error: resumen.error.message }, { status: 500 });
  return Response.json({ resumen: resumen.data, remesa: remesa.error ? { ok: false, error: remesa.error.message } : remesa.data });
}
