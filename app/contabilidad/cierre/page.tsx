"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Reparto {
  socio: string;
  beneficio: number;
}

const NOMBRE: Record<string, string> = { luis: "Luis", david: "David" };
const mesActualISO = () => new Date().toISOString().slice(0, 7);

// ---------- Checklist del cierre (los ticks se guardan por mes) ----------
const TAREAS_SEMANA: { clave: string; texto: string; href?: string }[] = [
  { clave: "sobres", texto: "Contar sobres y comparar con el Efectivo del Dashboard" },
  { clave: "apuntar", texto: "Apuntar gastos e ingresos de la semana (mirar: grupo de efectivo, Caixabank, facturas del carpesano, mail de tickets y BemadBox)" },
  { clave: "pagosycobros", texto: "Actualizar Pagos y cobros: grupales, fisio, merchan, aguas, HSN, multas y los Alex", href: "/tesoreria/pagos-cobros" },
  { clave: "impagos", texto: "Revisar impagos (nota del lunes) y reclamar por WhatsApp" },
];
const TAREAS_MES: { clave: string; texto: string; href?: string }[] = [
  { clave: "remesa", texto: "Aprobar la remesa de cuotas contra el banco", href: "/ventas" },
  { clave: "fijos", texto: "Apuntar los gastos fijos de golpe (solo cuando estén pagados)", href: "/tesoreria/cashflow" },
  { clave: "comisiones", texto: "Apuntar comisiones de fin de mes (Caixa, Stripe, BemadBox)" },
  { clave: "cuadrar_clientes", texto: "Cuadrar Pagos y cobros con Google Calendar y los avisos de pago de BemadBox", href: "/tesoreria/pagos-cobros" },
  { clave: "cuadre_total", texto: "Revisar que todo cuadra: P&G, Cash flow y Reparto (🔍 auditar el mes)", href: "/contabilidad/reparto" },
  { clave: "salud", texto: "Leer la nota «Cierre del mes» y la Salud financiera", href: "/tesoreria/cuentas" },
  { clave: "nominas", texto: "Transferir nóminas y marcar PAGADO con el importe real en Reparto", href: "/contabilidad/reparto" },
  { clave: "kpis", texto: "Evaluar el mes y rellenar KPIs (tráfico, funnel, objetivos)", href: "/kpis" },
  { clave: "escanear", texto: "Escanear facturas del mes, subirlas a Compras y ordenar carpesano", href: "/compras" },
];
const TAREAS_TRIMESTRE: { clave: string; texto: string; href?: string }[] = [
  { clave: "xavi", texto: "Impuestos: revisar el trimestre y enviárselo a Xavi", href: "/contabilidad/impuestos" },
  { clave: "pagado_real", texto: "Apuntar el «pagado real» cuando liquide Hacienda", href: "/contabilidad/impuestos" },
  { clave: "bemadbox", texto: "Cuadrar facturas BEMADBOX / smetik" },
  { clave: "facturas_propias", texto: "Cuadrar nuestras facturas emitidas (serie F y R) con la contabilidad", href: "/ventas" },
];
// Sábados que caen dentro de un mes (para las columnas semanales)
function sabadosDelMes(mesISO: string): number {
  const [y, m] = mesISO.split("-").map(Number);
  let n = 0;
  const dias = new Date(y, m, 0).getDate();
  for (let d = 1; d <= dias; d++) if (new Date(y, m - 1, d).getDay() === 6) n++;
  return n;
}

export default function CierrePage() {
  const [mes, setMes] = useState(mesActualISO());
  const [reparto, setReparto] = useState<Reparto[]>([]);
  const [ingresos, setIngresos] = useState(0);
  const [gastosOper, setGastosOper] = useState(0);
  const [inversion, setInversion] = useState(0);
  const [morososN, setMorososN] = useState(0);
  const [morososTotal, setMorososTotal] = useState(0);
  const [porFacturar, setPorFacturar] = useState(0);
  const [fijosPend, setFijosPend] = useState(0);
  const [ivaTrim, setIvaTrim] = useState(0);
  const [nominaCatId, setNominaCatId] = useState<number | null>(null);
  const [cuentaBanco, setCuentaBanco] = useState<number | null>(null);
  const [nominaPuesta, setNominaPuesta] = useState<Set<string>>(new Set());
  const [hechas, setHechas] = useState<Set<string>>(new Set()); // ticks del checklist (por mes)
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const desde = `${mes}-01`;
    // Rangos por aritmética de cadena, sin Date/UTC (que se comía el último día
    // del mes en horario de verano). mes = "YYYY-MM".
    const [y, mm] = mes.split("-").map(Number); // mm: 1-12
    const pad = (n: number) => String(n).padStart(2, "0");
    const hasta = mm === 12 ? `${y + 1}-01-01` : `${y}-${pad(mm + 1)}-01`;
    const iniMesPasado = mm === 1 ? `${y - 1}-12-01` : `${y}-${pad(mm - 1)}-01`;
    const trim = Math.floor((mm - 1) / 3) + 1;
    const anyo = y;

    const [rep, cob, gas, mor, sinFac, cue, cat, decl, gPasado] = await Promise.all([
      supabase.from("v_reparto_beneficios").select("socio, beneficio").eq("mes", desde),
      supabase.from("cobros").select("importe").gte("fecha", desde).lt("fecha", hasta),
      supabase.from("gastos").select("total, categorias!inner(es_inversion, es_fijo, nombre)").gte("fecha", desde).lt("fecha", hasta),
      supabase.from("v_morosos").select("pendiente"),
      supabase.from("gastos").select("id", { count: "exact", head: true }).eq("tiene_factura", false).gt("base", 0),
      supabase.from("cuentas").select("id, codigo").eq("activa", true),
      supabase.from("categorias").select("id, nombre").ilike("nombre", "%mina%").limit(1),
      supabase.from("v_impuestos_declaracion").select("trim, iva_resultado").eq("anyo", anyo).eq("trim", trim),
      supabase.from("gastos").select("concepto, categorias!inner(es_fijo, nombre)").gte("fecha", iniMesPasado).lt("fecha", desde),
    ]);

    setReparto((rep.data as Reparto[]) ?? []);
    setIngresos(((cob.data as { importe: number }[]) ?? []).reduce((s, x) => s + Number(x.importe), 0));

    let oper = 0, inv = 0;
    const gastosRows = (gas.data as unknown as { total: number; categorias: { es_inversion: boolean; es_fijo: boolean; nombre: string } }[]) ?? [];
    for (const g of gastosRows) {
      if (g.categorias.es_inversion) inv += Number(g.total);
      else if (!/mina/i.test(g.categorias.nombre)) oper += Number(g.total);
    }
    setGastosOper(oper);
    setInversion(inv);

    const mrows = (mor.data as { pendiente: number }[]) ?? [];
    setMorososN(mrows.length);
    setMorososTotal(mrows.reduce((s, x) => s + Number(x.pendiente), 0));
    setPorFacturar(sinFac.count ?? 0);

    // IVA del trimestre a reservar (si sale a pagar)
    const drows = (decl.data as { iva_resultado: number }[]) ?? [];
    setIvaTrim(Math.max(0, drows.reduce((s, x) => s + Number(x.iva_resultado), 0)));

    const banco = (cue.data as { id: number; codigo: string }[])?.find((x) => x.codigo === "banco");
    setCuentaBanco(banco?.id ?? (cue.data as { id: number }[])?.[0]?.id ?? null);
    const nomCat = (cat.data as { id: number }[])?.[0]?.id ?? null;
    setNominaCatId(nomCat);

    // Gastos fijos del mes pasado que aún no están este mes
    const gEste = await supabase.from("gastos").select("concepto").gte("fecha", desde).lt("fecha", hasta);
    const yaEste = new Set(((gEste.data as { concepto: string }[]) ?? []).map((g) => g.concepto.trim().toLowerCase()));
    const conceptos = new Set<string>();
    for (const g of (gPasado.data as unknown as { concepto: string; categorias: { es_fijo: boolean; nombre: string } }[]) ?? []) {
      if (!g.categorias.es_fijo || /mina/i.test(g.categorias.nombre)) continue;
      const k = g.concepto.trim().toLowerCase();
      if (!yaEste.has(k)) conceptos.add(k);
    }
    setFijosPend(conceptos.size);

    // Nóminas ya registradas este mes
    // Nóminas: ahora se marcan con el tick PAGADO del Reparto
    const { data: rp } = await supabase.from("reparto_pagos").select("persona").eq("mes", desde);
    setNominaPuesta(new Set(((rp as { persona: string }[]) ?? []).map((x) => x.persona)));

    // Ticks del checklist de este mes
    const { data: ck } = await supabase.from("cierre_checklist").select("clave").eq("mes", desde);
    setHechas(new Set(((ck as { clave: string }[]) ?? []).map((x) => x.clave)));
  }, [mes]);

  async function toggleTarea(clave: string) {
    const mesISO = `${mes}-01`;
    if (hechas.has(clave)) {
      await supabase.from("cierre_checklist").delete().eq("mes", mesISO).eq("clave", clave);
      setHechas((prev) => { const s = new Set(prev); s.delete(clave); return s; });
    } else {
      const { error } = await supabase.from("cierre_checklist").insert({ mes: mesISO, clave });
      if (error) return setError(error.message);
      setHechas((prev) => new Set(prev).add(clave));
    }
  }

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nominaDe = (socio: string) => Math.max(0, Number(reparto.find((r) => r.socio === socio)?.beneficio ?? 0) * 0.8);
  const beneficioTotal = reparto.reduce((s, r) => s + Math.max(0, Number(r.beneficio)), 0);
  const nominaTotal = reparto.reduce((s, r) => s + Math.max(0, Number(r.beneficio) * 0.8), 0);
  const huchaTotal = reparto.reduce((s, r) => s + Math.max(0, Number(r.beneficio) * 0.2), 0);

  // Estado de cada paso (semáforos automáticos)
  const nominasPendientes = reparto.filter((r) => nominaDe(r.socio) > 0 && !nominaPuesta.has(r.socio));
  const pasos = [
    { hecho: morososN === 0, titulo: morososN === 0 ? "Sin cobros pendientes" : `${morososN} clientes deben ${eur(morososTotal)}`, href: "/crm", accion: "Revisar" },
    { hecho: porFacturar === 0, titulo: porFacturar === 0 ? "Todas las facturas pedidas" : `${porFacturar} gastos sin factura por pedir`, href: "/gastos", accion: "Ver" },
    { hecho: fijosPend === 0, titulo: fijosPend === 0 ? "Gastos fijos del mes apuntados" : `${fijosPend} gastos fijos por apuntar`, href: "/tesoreria/cashflow", accion: "Apuntar" },
    { hecho: nominasPendientes.length === 0, titulo: nominasPendientes.length === 0 ? "Nóminas pagadas (tick en Reparto)" : `Nóminas sin marcar PAGADO: ${nominasPendientes.map((r) => NOMBRE[r.socio]).join(" y ")} (${eur(nominasPendientes.reduce((s, r) => s + nominaDe(r.socio), 0))})`, href: "/contabilidad/reparto", accion: "Reparto" },
    { hecho: false, info: true, titulo: ivaTrim > 0 ? `Reservar ${eur(ivaTrim)} de IVA del trimestre` : "IVA del trimestre: nada a pagar (a compensar)", href: "/contabilidad/impuestos", accion: "Impuestos" },
  ];
  const completados = pasos.filter((p) => p.hecho).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Cierre de mes</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">Repasa todo lo del mes en una pantalla, en orden.</p>
        </div>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value || mesActualISO())}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none"
        />
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

      {/* Resumen del mes */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Ingresos (cobrado)", eur(ingresos), "text-emerald-400"],
          ["Gastos operativos", eur(gastosOper), "text-red-400"],
          ["Beneficio", eur(beneficioTotal), "text-white"],
          ["Nómina total", eur(nominaTotal), "text-emerald-400"],
          ["A hucha", eur(huchaTotal), "text-sky-400"],
        ].map(([et, v, c]) => (
          <div key={et} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{et}</p>
            <p className={`mt-1 text-lg font-black ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Checklist de tareas con ticks (se guardan por mes) */}
      {(() => {
        const nSabados = sabadosDelMes(mes);
        const clavesSemana = TAREAS_SEMANA.flatMap((t) => Array.from({ length: nSabados }, (_, w) => `sem:${t.clave}:${w + 1}`));
        const clavesMes = TAREAS_MES.map((t) => `mes:${t.clave}`);
        const esFinTrimestre = [3, 6, 9, 12].includes(Number(mes.split("-")[1]));
        // Las trimestrales cuentan para el progreso solo cuando toca cerrarlas,
        // pero se muestran siempre para tenerlas presentes
        const clavesTri = esFinTrimestre ? TAREAS_TRIMESTRE.map((t) => `tri:${t.clave}`) : [];
        const todas = [...clavesSemana, ...clavesMes, ...clavesTri];
        const hechasN = todas.filter((k) => hechas.has(k)).length;
        const check = (clave: string, texto: React.ReactNode, href?: string) => (
          <div key={clave} className="flex items-center gap-2.5 border-b border-zinc-800/50 px-4 py-2 last:border-0">
            <input
              type="checkbox"
              checked={hechas.has(clave)}
              onChange={() => toggleTarea(clave)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
            />
            <span className={`min-w-0 flex-1 text-[13px] ${hechas.has(clave) ? "text-zinc-600 line-through" : "text-zinc-200"}`}>{texto}</span>
            {href && (
              <Link href={href} className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 hover:text-white">ir →</Link>
            )}
          </div>
        );
        return (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-zinc-400">Tareas del mes</h3>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${todas.length ? (hechasN / todas.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-zinc-500">{hechasN}/{todas.length}</span>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {/* Sábados */}
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <p className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Cada sábado <span className="normal-case text-zinc-600">({nSabados} este mes)</span>
                </p>
                <div className="px-4 pt-2">
                  <div className="grid" style={{ gridTemplateColumns: `1fr repeat(${nSabados}, 2rem)` }}>
                    <span />
                    {Array.from({ length: nSabados }, (_, w) => (
                      <span key={w} className="pb-1 text-center text-[9px] font-bold text-zinc-600">S{w + 1}</span>
                    ))}
                    {TAREAS_SEMANA.map((t) => (
                      <Fragment key={t.clave}>
                        <span className="border-t border-zinc-800/50 py-1.5 pr-2 text-[12px] leading-snug text-zinc-300">{t.texto}</span>
                        {Array.from({ length: nSabados }, (_, w) => {
                          const k = `sem:${t.clave}:${w + 1}`;
                          return (
                            <span key={w} className="grid place-items-center border-t border-zinc-800/50">
                              <input type="checkbox" checked={hechas.has(k)} onChange={() => toggleTarea(k)} className="h-3.5 w-3.5 cursor-pointer accent-emerald-600" />
                            </span>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                  <div className="h-2" />
                </div>
              </div>
              {/* Día 1 + trimestre */}
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <p className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">Día 1 · cierre del mes anterior</p>
                {TAREAS_MES.map((t) => check(`mes:${t.clave}`, t.texto, t.href))}
                <p className="border-y border-zinc-800 bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Trimestre {esFinTrimestre ? <span className="ml-1 rounded-full bg-amber-950 px-2 py-0.5 text-amber-400">toca este mes</span> : <span className="normal-case text-zinc-600">(solo mar · jun · sep · dic)</span>}
                </p>
                {TAREAS_TRIMESTRE.map((t) => check(`tri:${t.clave}`, t.texto, t.href))}
                {!esFinTrimestre && (
                  <p className="px-4 py-1.5 text-[10px] text-zinc-600">
                    Este mes no cierra trimestre: quedan a la vista para tenerlas presentes (no cuentan en el progreso).
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Semáforos automáticos */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-400">Semáforos automáticos</h3>
        <span className="text-xs text-zinc-500">{completados}/{pasos.filter((p) => !p.info).length} listos</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {pasos.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3.5 last:border-0">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${
                  p.info ? "bg-sky-950 text-sky-400" : p.hecho ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                }`}
              >
                {p.info ? "i" : p.hecho ? "✓" : "!"}
              </span>
              <p className={`truncate text-sm font-semibold ${p.hecho ? "text-zinc-400" : "text-white"}`}>{p.titulo}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {p.href && !p.hecho && (
                <Link href={p.href} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700">
                  {p.accion} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-xl bg-zinc-900/40 px-4 py-3 text-xs text-zinc-500">
        Orden recomendado: cobra lo pendiente → pide las facturas que faltan → apunta los gastos
        fijos → registra las nóminas → reserva el IVA del trimestre. Cuando todo esté en verde, el
        mes está cerrado.
      </p>
    </div>
  );
}
