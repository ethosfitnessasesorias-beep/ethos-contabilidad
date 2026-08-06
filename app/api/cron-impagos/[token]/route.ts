import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Seguimiento { titulo: string; cliente: string; fecha: string; nota: string }
interface Impago { cliente: string; pendiente: number }

const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Vercel Cron (lunes 8:00): crea la nota de impagos y manda el correo semanal
// con impagos + seguimientos del embudo de los próximos 7 días.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "config" }, { status: 500 });
  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supa.rpc("cron_impagos", { p_token: token });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // Sincronizar el embudo Grand Slam (altas nuevas + avance de etapas por fechas).
  // Si la función aún no existe en la BD, no rompe el cron.
  let grandSlam: unknown = "no disponible";
  try {
    const gs = await supa.rpc("cron_grand_slam", { p_token: token });
    grandSlam = gs.error ? { error: gs.error.message } : gs.data;
  } catch (e) {
    grandSlam = { error: String(e) };
  }

  // Correo del lunes (si falla, no rompe el cron: la nota ya está creada)
  let email: string | { error: string } = "sin datos";
  try {
    const { data: av } = await supa.rpc("cron_avisos_lunes", { p_token: token });
    const info = av as { ok: boolean; resend_key: string | null; email: string; seguimientos: Seguimiento[]; impagos: Impago[] } | null;
    if (info?.ok && info.resend_key && (info.seguimientos.length > 0 || info.impagos.length > 0)) {
      const hoy = new Date().toISOString().slice(0, 10);
      const fFecha = (s: string) =>
        new Date(s + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
      const bloqueSeg = info.seguimientos.length
        ? `<h3 style="margin:16px 0 6px">⏰ Seguimientos del embudo (7 días)</h3><ul>` +
          info.seguimientos
            .map(
              (s) =>
                `<li><b>${esc(s.cliente || s.titulo)}</b> · ${fFecha(s.fecha)}${s.fecha <= hoy ? " <b style=\"color:#dc2626\">(vencido)</b>" : ""}${s.nota ? ` — ${esc(s.nota)}` : ""}</li>`
            )
            .join("") +
          `</ul>`
        : "";
      const totalImp = info.impagos.reduce((s, x) => s + Number(x.pendiente), 0);
      const bloqueImp = info.impagos.length
        ? `<h3 style="margin:16px 0 6px">💰 Impagos pendientes (${eur(totalImp)})</h3><ul>` +
          info.impagos.map((i) => `<li>${esc(i.cliente)} — <b>${eur(Number(i.pendiente))}</b></li>`).join("") +
          `</ul>`
        : "";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${info.resend_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Ethos App <avisos@ethosfitnessasesorias.es>",
          to: [info.email],
          subject: `Lunes Ethos · ${info.seguimientos.length} seguimientos · ${info.impagos.length} impagos`,
          html:
            `<div style="font-family:sans-serif;font-size:14px;color:#18181b">` +
            `<h2 style="margin:0 0 4px">Avisos de la semana</h2>` +
            `<p style="margin:0;color:#71717a">Resumen automático del lunes.</p>` +
            bloqueSeg +
            bloqueImp +
            `</div>`,
        }),
      });
      email = res.ok ? "enviado" : { error: `resend ${res.status}` };
    }
  } catch (e) {
    email = { error: String(e) };
  }

  return Response.json({ nota: data, email, grandSlam });
}
