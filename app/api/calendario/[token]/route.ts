import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Evento {
  id: number;
  titulo: string;
  formato: string | null;
  gancho: string | null;
  copy: string | null;
  fecha_pub: string;
  creado_en: string;
}

const FORMATO: Record<string, string> = {
  reel: "Reel",
  carrusel: "Carrusel",
  story: "Story",
  directo: "Directo",
  colaboracion: "Colaboración",
};

// Fecha ISO -> formato ICS UTC (20260715T180000Z)
function icsFecha(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string): string {
  return (s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response("Config faltante", { status: 500 });

  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supa.rpc("eventos_contenido", { p_token: token });
  if (error) return new Response(`Error: ${error.message}`, { status: 500 });

  const eventos = (data as Evento[]) ?? [];
  const stamp = icsFecha(new Date().toISOString());
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ethos Fitness//Contenido//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Ethos · Contenido RRSS",
    "X-WR-TIMEZONE:Europe/Madrid",
  ];
  for (const e of eventos) {
    const ini = new Date(e.fecha_pub);
    const fin = new Date(ini.getTime() + 30 * 60000);
    const etFmt = FORMATO[e.formato ?? ""] ?? "Publicación";
    const desc = [e.gancho ? `Gancho: ${e.gancho}` : "", e.copy ?? ""].filter(Boolean).join("\\n\\n");
    lineas.push(
      "BEGIN:VEVENT",
      `UID:contenido-${e.id}@ethos-fitness`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsFecha(e.fecha_pub)}`,
      `DTEND:${icsFecha(fin.toISOString())}`,
      `SUMMARY:${esc(`[${etFmt}] ${e.titulo}`)}`,
      desc ? `DESCRIPTION:${esc(desc)}` : "DESCRIPTION:",
      "END:VEVENT"
    );
  }
  lineas.push("END:VCALENDAR");

  return new Response(lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ethos-contenido.ics"',
      "Cache-Control": "public, max-age=1800",
    },
  });
}
