import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Recibe una respuesta del Google Form (vía Apps Script) y crea/actualiza el cliente.
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "config" }, { status: 500 });

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return Response.json({ ok: false, error: "json invalido" }, { status: 400 });
  }

  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { data: res, error } = await supa.rpc("crm_intake", { p_token: token, p_data: data });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json(res);
}

// Ping de comprobación
export async function GET() {
  return Response.json({ ok: true, info: "Webhook de entrada del CRM. Envía POST con JSON." });
}
