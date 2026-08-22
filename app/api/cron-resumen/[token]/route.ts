import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Convierte las filas JSON de una tabla a CSV (cabecera = unión de claves)
function aCSV(filas: Record<string, unknown>[]): string {
  if (!filas.length) return "";
  const claves: string[] = [];
  for (const f of filas) for (const k of Object.keys(f)) if (!claves.includes(k)) claves.push(k);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [claves.join(","), ...filas.map((f) => claves.map((k) => esc(f[k])).join(","))].join("\r\n");
}

const TABLAS = [
  "clientes", "facturas", "factura_lineas", "cobros", "gastos", "traspasos", "cuentas",
  "categorias", "cuotas", "remesas", "remesa_lineas", "deals", "embudos", "pipeline_columnas",
  "reparto_pagos", "pagos_cobros_filas", "personas", "arqueos", "config", "config_texto",
];

// Vercel Cron (día 1, 7:00): nota de cierre del mes anterior, remesa del mes
// nuevo y COPIA DE SEGURIDAD completa por email (CSV por tabla).
// ?solo=backup ejecuta únicamente la copia (para probar o forzarla a mano).
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "config" }, { status: 500 });
  const supa = createClient(url, key, { auth: { persistSession: false } });
  const soloBackup = new URL(req.url).searchParams.get("solo") === "backup";

  let resumen: unknown = "omitido";
  let remesa: unknown = "omitido";
  if (!soloBackup) {
    const [r1, r2] = await Promise.all([
      supa.rpc("cron_resumen_mensual", { p_token: token }),
      supa.rpc("cron_remesa", { p_token: token }),
    ]);
    if (r1.error) return Response.json({ ok: false, error: r1.error.message }, { status: 500 });
    resumen = r1.data;
    remesa = r2.error ? { ok: false, error: r2.error.message } : r2.data;
  }

  // Copia de seguridad: todos los datos en CSV, al correo (el email ES el backup)
  let backup: string | { error: string } = "sin datos";
  try {
    const { data, error } = await supa.rpc("backup_datos", { p_token: token });
    if (error) throw new Error(error.message);
    const d = data as Record<string, unknown> & { ok: boolean; resend_key: string | null; email: string };
    if (d?.ok && d.resend_key) {
      const hoy = new Date().toISOString().slice(0, 10);
      const attachments: { filename: string; content: string }[] = [];
      let totalFilas = 0;
      for (const t of TABLAS) {
        const filas = (d[t] as Record<string, unknown>[]) ?? [];
        totalFilas += filas.length;
        if (filas.length) {
          attachments.push({
            filename: `${t}.csv`,
            content: Buffer.from("﻿" + aCSV(filas), "utf8").toString("base64"),
          });
        }
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${d.resend_key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Ethos App <avisos@ethosfitnessasesorias.es>",
          to: [d.email],
          subject: `📦 Copia de seguridad Ethos · ${hoy}`,
          html:
            `<div style="font-family:sans-serif;font-size:14px;color:#18181b">` +
            `<h2 style="margin:0 0 6px">Copia de seguridad completa</h2>` +
            `<p style="margin:0 0 10px;color:#71717a">${attachments.length} tablas · ${totalFilas} filas · ${hoy}. Guarda este correo: es tu plan B.</p>` +
            `<h3 style="margin:12px 0 4px;font-size:14px">Cómo recuperar los datos si algún día hace falta</h3>` +
            `<ol style="margin:0;padding-left:18px;color:#3f3f46;font-size:13px;line-height:1.5">` +
            `<li><b>Lo más fácil:</b> pásale los CSV de este correo a Claude y dile «restaura la base de datos de Ethos con estos archivos». Con el repositorio de GitHub (ethos-contabilidad) recrea la estructura y carga los datos.</li>` +
            `<li><b>A mano:</b> en Supabase crea un proyecto nuevo → ejecuta los .sql de la carpeta /supabase del repositorio (estructura) → en Table Editor importa cada CSV en su tabla, en este orden: categorias, cuentas, personas, embudos, pipeline_columnas, cuotas, clientes, facturas, factura_lineas, cobros, gastos, traspasos, remesas, remesa_lineas, deals, reparto_pagos, pagos_cobros_filas, arqueos, config, config_texto.</li>` +
            `<li>Reconecta la app cambiando NEXT_PUBLIC_SUPABASE_URL y ANON_KEY en Vercel.</li>` +
            `</ol>` +
            `<p style="margin:10px 0 0;color:#a1a1aa;font-size:12px">Este correo se envía automáticamente el día 1 de cada mes. También puedes descargar una copia al momento desde Ajustes → Copia de seguridad.</p>` +
            `</div>`,
          attachments,
        }),
      });
      backup = res.ok ? `enviado (${attachments.length} tablas, ${totalFilas} filas)` : { error: `resend ${res.status}` };
    }
  } catch (e) {
    backup = { error: String(e) };
  }

  return Response.json({ resumen, remesa, backup });
}
