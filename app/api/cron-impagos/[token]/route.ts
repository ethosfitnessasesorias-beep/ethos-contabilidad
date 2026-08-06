import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Seguimiento { titulo: string; cliente: string; fecha: string; nota: string }
interface Impago { cliente: string; pendiente: number }

const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Vercel Cron (todos los días ~9:00 Madrid):
//  · Lunes: nota de impagos + correo semanal completo (impagos + seguimientos 7 días).
//  · Resto de días: correo corto SOLO si hay seguimientos vencidos o de hoy
//    ("hoy toca escribir a..."). Sin nota, sin ruido.
//  · Cada día sincroniza el embudo Grand Slam (altas nuevas y avance de etapas).
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "config" }, { status: 500 });
  const supa = createClient(url, key, { auth: { persistSession: false } });

  const ahoraMadrid = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const esLunes = ahoraMadrid.getDay() === 1;

  // Nota de impagos: solo los lunes (como siempre)
  let nota: unknown = "solo lunes";
  if (esLunes) {
    const { data, error } = await supa.rpc("cron_impagos", { p_token: token });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    nota = data;
  }

  // Sincronizar el embudo Grand Slam a diario (si la RPC aún no existe, no rompe)
  let grandSlam: unknown = "no disponible";
  try {
    const gs = await supa.rpc("cron_grand_slam", { p_token: token });
    grandSlam = gs.error ? { error: gs.error.message } : gs.data;
  } catch (e) {
    grandSlam = { error: String(e) };
  }

  // Correo de avisos
  let email: string | { error: string } = "sin datos";
  try {
    const { data: av } = await supa.rpc("cron_avisos_lunes", { p_token: token });
    const info = av as { ok: boolean; resend_key: string | null; email: string; seguimientos: Seguimiento[]; impagos: Impago[] } | null;
    if (info?.ok && info.resend_key) {
      const hoy = new Date().toISOString().slice(0, 10);
      const fFecha = (s: string) =>
        new Date(s + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
      const filaSeg = (s: Seguimiento) =>
        `<li><b>${esc(s.cliente || s.titulo)}</b> · ${fFecha(s.fecha)}${s.fecha <= hoy ? " <b style=\"color:#dc2626\">(toca hoy)</b>" : ""}${s.nota ? ` — ${esc(s.nota)}` : ""}</li>`;

      if (esLunes) {
        // Lunes: resumen completo de la semana
        if (info.seguimientos.length > 0 || info.impagos.length > 0) {
          const bloqueSeg = info.seguimientos.length
            ? `<h3 style="margin:16px 0 6px">⏰ Seguimientos de la semana</h3><ul>` + info.seguimientos.map(filaSeg).join("") + `</ul>`
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
              html: `<div style="font-family:sans-serif;font-size:14px;color:#18181b"><h2 style="margin:0 0 4px">Avisos de la semana</h2><p style="margin:0;color:#71717a">Resumen automático del lunes.</p>${bloqueSeg}${bloqueImp}</div>`,
            }),
          });
          email = res.ok ? "enviado (semanal)" : { error: `resend ${res.status}` };
        }
      } else {
        // Resto de días: solo "hoy toca escribir a..." si hay algo vencido o de hoy
        const deHoy = info.seguimientos.filter((s) => s.fecha <= hoy);
        if (deHoy.length > 0) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${info.resend_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Ethos App <avisos@ethosfitnessasesorias.es>",
              to: [info.email],
              subject: `Hoy toca escribir a ${deHoy.length} persona(s)`,
              html: `<div style="font-family:sans-serif;font-size:14px;color:#18181b"><h2 style="margin:0 0 4px">⏰ Seguimientos de hoy</h2><ul>${deHoy.map(filaSeg).join("")}</ul><p style="margin:8px 0 0;color:#71717a;font-size:12px">Abre el embudo y despacha estos primero.</p></div>`,
            }),
          });
          email = res.ok ? `enviado (diario, ${deHoy.length})` : { error: `resend ${res.status}` };
        } else {
          email = "nada para hoy";
        }
      }
    }
  } catch (e) {
    email = { error: String(e) };
  }

  return Response.json({ nota, email, grandSlam });
}
