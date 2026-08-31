"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur, eurEntero } from "@/lib/formato";
import Modal from "@/components/Modal";

// ---------- Auditoría del mes: cada línea que entra en el reparto ----------
interface AudCobro {
  fecha: string;
  importe: number;
  facturas: {
    atribucion: string; computa_reparto: boolean | null; base: number; total: number;
    concepto: string; clientes: { nombre: string } | null;
  } | null;
}
interface AudGasto {
  fecha: string; concepto: string; total: number; iva_soportado: number; irpf_soportado: number;
  deducible: boolean | null; imputado_a: string; categorias: { nombre: string; es_inversion: boolean } | null;
}
interface AudFactura {
  fecha_emision: string; concepto: string; iva_importe: number; atribucion: string;
  clientes: { nombre: string } | null;
}

interface FilaReparto {
  mes: string;
  socio: string;
  cobrado_propio: number;
  cobrado_ethos: number;
  iva_propio: number;
  iva_ethos: number;
  irpf_propio: number;
  irpf_ethos: number;
  gasto_propio: number;
  gasto_ethos: number;
  beneficio: number;
}
interface FilaInversion {
  mes: string;
  inversion: number;
}
interface FilaColab {
  mes: string;
  colaborador: string;
  nombre: string;
  pct: number;
  base_cobrada: number;
  a_pagar: number;
  a_ethos: number;
}

const NOMBRE: Record<string, string> = { luis: "Luis", david: "David" };
const MESCORTO = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { month: "short" });
const MESLARGO = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const inic = (n: string) => n.slice(0, 2).toUpperCase();

export default function RepartoPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [filas, setFilas] = useState<FilaReparto[]>([]);
  const [inversiones, setInversiones] = useState<FilaInversion[]>([]);
  const [colab, setColab] = useState<FilaColab[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  // "YYYY-MM-persona" -> importe realmente cobrado (null = usar el teórico)
  const [pagados, setPagados] = useState<Map<string, number | null>>(new Map());
  const [huchaDesde, setHuchaDesde] = useState("2026-03-01"); // la hucha empezó tras la obra del local
  const [huchaAjuste, setHuchaAjuste] = useState(0); // cuadre manual con la hucha real (Ajustes → Negocio)

  // Auditoría del mes: todas las líneas que componen el reparto
  const [audMes, setAudMes] = useState<string | null>(null);
  const [audCobros, setAudCobros] = useState<AudCobro[]>([]);
  const [audGastos, setAudGastos] = useState<AudGasto[]>([]);
  const [audFacturas, setAudFacturas] = useState<AudFactura[]>([]);
  const [audCargando, setAudCargando] = useState(false);
  const [verGuia, setVerGuia] = useState(false);

  const cargar = useCallback(async () => {
    const [r, inv, c, rp] = await Promise.all([
      supabase.from("v_reparto_beneficios").select("*").order("mes"),
      supabase.from("v_inversion_mensual").select("*").order("mes"),
      supabase.from("v_pagos_colaboradores").select("*").order("mes"),
      supabase.from("reparto_pagos").select("mes, persona, importe"),
    ]);
    if (r.error) {
      setDisponible(false);
      setError("Falta la migración mejoras_v6.sql (reparto de beneficios).");
      return;
    }
    setDisponible(true);
    setFilas((r.data as FilaReparto[]) ?? []);
    setInversiones((inv.data as FilaInversion[]) ?? []);
    setColab((c.data as FilaColab[]) ?? []);
    const map = new Map<string, number | null>();
    for (const x of (rp.data as { mes: string; persona: string; importe: number | null }[]) ?? [])
      map.set(`${x.mes.slice(0, 7)}-${x.persona}`, x.importe === null ? null : Number(x.importe));
    setPagados(map);
    // Fecha de inicio de la hucha y ajuste manual (Ajustes → Negocio)
    const [hd, ha] = await Promise.all([
      supabase.from("config_texto").select("valor").eq("clave", "hucha_desde").maybeSingle(),
      supabase.from("config").select("valor").eq("clave", "hucha_ajuste").maybeSingle(),
    ]);
    if ((hd.data as { valor: string } | null)?.valor) setHuchaDesde((hd.data as { valor: string }).valor);
    setHuchaAjuste(Number((ha.data as { valor: number } | null)?.valor ?? 0));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si no hay beneficio, no hay nómina ni hucha: nunca en negativo.
  const nomina = (b: number) => Math.max(0, b * 0.8);
  const aHucha = (b: number) => Math.max(0, b * 0.2);

  // Tick de PAGADO por mes y persona. NO escribe nada en el libro:
  // guarda además el importe REALMENTE cobrado (editable; por defecto el teórico).
  async function togglePagado(mes: string, persona: string, teorico?: number) {
    const k = `${mes.slice(0, 7)}-${persona}`;
    const mesISO = `${mes.slice(0, 7)}-01`;
    if (pagados.has(k)) {
      const { error } = await supabase.from("reparto_pagos").delete().eq("mes", mesISO).eq("persona", persona);
      if (error) return setError(error.message);
      setPagados((prev) => { const m = new Map(prev); m.delete(k); return m; });
    } else {
      const imp = teorico !== undefined ? Math.round(teorico * 100) / 100 : null;
      const { error } = await supabase.from("reparto_pagos").insert({ mes: mesISO, persona, importe: imp });
      if (error) return setError(error.message);
      setPagados((prev) => new Map(prev).set(k, imp));
    }
  }

  // Importe real cobrado (puede diferir del 80% teórico: se retira lo que hay)
  async function guardarImporte(mes: string, persona: string, texto: string) {
    const n = Number(texto.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return;
    const k = `${mes.slice(0, 7)}-${persona}`;
    const imp = Math.round(n * 100) / 100;
    const { error } = await supabase.from("reparto_pagos").update({ importe: imp }).eq("mes", `${mes.slice(0, 7)}-01`).eq("persona", persona);
    if (error) return setError(error.message);
    setPagados((prev) => new Map(prev).set(k, imp));
    setOk("Importe real guardado ✓");
    setTimeout(() => setOk(null), 2000);
  }

  // Carga todas las líneas del mes para auditar el reparto (misma lógica que la vista)
  async function abrirAuditoria(mes: string) {
    setAudMes(mes);
    setAudCargando(true);
    const desde = mes.slice(0, 7) + "-01";
    // Primer día del mes siguiente por aritmética de cadena (sin Date/UTC, que
    // se comía el último día del mes en horario de verano)
    const [y, mm] = mes.slice(0, 7).split("-").map(Number);
    const hasta = mm === 12 ? `${y + 1}-01-01` : `${y}-${String(mm + 1).padStart(2, "0")}-01`;
    const [co, ga, fa] = await Promise.all([
      supabase
        .from("cobros")
        .select("fecha, importe, facturas!inner(atribucion, computa_reparto, base, total, concepto, clientes(nombre))")
        .gte("fecha", desde).lt("fecha", hasta)
        .eq("facturas.computa_reparto", true),
      supabase
        .from("gastos")
        .select("fecha, concepto, total, iva_soportado, irpf_soportado, deducible, imputado_a, categorias(nombre, es_inversion)")
        .gte("fecha", desde).lt("fecha", hasta),
      supabase
        .from("facturas")
        .select("fecha_emision, concepto, iva_importe, atribucion, clientes(nombre)")
        .gte("fecha_emision", desde).lt("fecha_emision", hasta)
        .eq("computa_impuestos", true),
    ]);
    setAudCobros((co.data as unknown as AudCobro[]) ?? []);
    setAudGastos((ga.data as unknown as AudGasto[]) ?? []);
    setAudFacturas((fa.data as unknown as AudFactura[]) ?? []);
    setAudCargando(false);
  }

  // Réplica exacta de la fórmula de la vista, calculada aquí línea a línea
  const auditoria = useMemo(() => {
    if (!audMes) return null;
    const esNomina = (g: AudGasto) => /mina/i.test(g.categorias?.nombre ?? "");
    // cobros: cuánto computa cada línea y a qué cubo va
    const lineasCobro = audCobros.map((c) => {
      const f = c.facturas!;
      const at = f.atribucion;
      let computa = Number(c.importe);
      let cubo: "luis" | "david" | "centro" = "centro";
      if (at === "luis" || at === "david") cubo = at;
      else if (at === "alex_esteban" || at === "alex_guerrero") {
        computa = Number(f.total) ? 0.3 * Number(c.importe) * Number(f.base) / Number(f.total) : 0;
      }
      return { ...c, computa, cubo, at };
    });
    const cobrado = { luis: 0, david: 0, centro: 0 };
    for (const l of lineasCobro) cobrado[l.cubo] += l.computa;

    const lineasGasto = audGastos.map((g) => {
      const excluido = g.categorias?.es_inversion ? "inversión" : esNomina(g) ? "nómina" : null;
      const cubo = g.imputado_a === "luis" || g.imputado_a === "david" ? g.imputado_a : "centro";
      return { ...g, excluido, cubo: cubo as "luis" | "david" | "centro" };
    });
    const gasto = { luis: 0, david: 0, centro: 0 };
    const ivaSop = { luis: 0, david: 0, centro: 0 };
    const irpf = { luis: 0, david: 0, centro: 0 };
    for (const g of lineasGasto) {
      if (!g.excluido) gasto[g.cubo] += Number(g.total);
      if (g.deducible) ivaSop[g.cubo] += Number(g.iva_soportado);
      irpf[g.cubo] += Number(g.irpf_soportado);
    }
    const ivaRep = { luis: 0, david: 0, centro: 0 };
    for (const f of audFacturas) {
      const cubo = f.atribucion === "luis" || f.atribucion === "david" ? f.atribucion : f.atribucion === "ethos" ? "centro" : null;
      if (cubo) ivaRep[cubo] += Number(f.iva_importe);
    }
    const ivaNeto = {
      luis: Math.max(0, ivaRep.luis - ivaSop.luis),
      david: Math.max(0, ivaRep.david - ivaSop.david),
      centro: Math.max(0, ivaRep.centro - ivaSop.centro),
    };
    const beneficio = (s: "luis" | "david") =>
      cobrado[s] + cobrado.centro / 2 - (ivaNeto[s] + irpf[s] + gasto[s]) - (ivaNeto.centro + irpf.centro + gasto.centro) / 2;
    return { lineasCobro, lineasGasto, cobrado, gasto, ivaRep, ivaSop, ivaNeto, irpf, beneficio };
  }, [audMes, audCobros, audGastos, audFacturas]);

  // Hucha: empezó tras la obra del local (huchaDesde). La obra de antes es
  // inversión del local (se ve en el Dashboard), no sale de la hucha.
  const aporte20Total = filas
    .filter((f) => f.mes >= huchaDesde)
    .reduce((s, f) => s + Math.max(0, Number(f.beneficio)) * 0.2, 0);
  const inversionTotal = inversiones
    .filter((i) => i.mes >= huchaDesde)
    .reduce((s, i) => s + Number(i.inversion), 0);
  const huchaSaldo = aporte20Total - inversionTotal + huchaAjuste;

  // Meses del año con las dos filas
  const meses = useMemo(() => {
    const set = new Map<string, { luis?: FilaReparto; david?: FilaReparto }>();
    for (const f of filas) {
      if (new Date(f.mes).getFullYear() !== anyo) continue;
      const acc = set.get(f.mes) ?? {};
      acc[f.socio as "luis" | "david"] = f;
      set.set(f.mes, acc);
    }
    return [...set.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [filas, anyo]);

  const invDe = (mes: string) => Number(inversiones.find((i) => i.mes === mes)?.inversion ?? 0);

  // Totales del año
  const totalAnyo = useMemo(() => {
    let nomLuis = 0, nomDavid = 0;
    for (const [, par] of meses) {
      nomLuis += Math.max(0, nomina(Number(par.luis?.beneficio ?? 0)));
      nomDavid += Math.max(0, nomina(Number(par.david?.beneficio ?? 0)));
    }
    return { nomLuis, nomDavid };
  }, [meses]);

  // Colaboradores del año: total a pagar por colaborador + a Ethos
  const colabAnyo = useMemo(() => {
    const m = new Map<string, { codigo: string; nombre: string; pct: number; aPagar: number; aEthos: number; base: number; pagado: number; meses: FilaColab[] }>();
    for (const c of colab) {
      if (new Date(c.mes).getFullYear() !== anyo) continue;
      const acc = m.get(c.colaborador) ?? { codigo: c.colaborador, nombre: c.nombre, pct: Number(c.pct), aPagar: 0, aEthos: 0, base: 0, pagado: 0, meses: [] };
      acc.aPagar += Number(c.a_pagar);
      acc.aEthos += Number(c.a_ethos);
      acc.base += Number(c.base_cobrada);
      const kPag = `${c.mes.slice(0, 7)}-${c.colaborador}`;
      acc.pagado += pagados.has(kPag) ? Number(pagados.get(kPag) ?? c.a_pagar) : 0;
      acc.meses.push(c);
      m.set(c.colaborador, acc);
    }
    return [...m.values()].sort((a, b) => b.aPagar - a.aPagar);
  }, [colab, anyo, pagados]);
  const totalColab = colabAnyo.reduce((s, c) => s + Math.max(0, c.aPagar - c.pagado), 0);

  const stat = (etiqueta: string, valor: string, color: string, sub?: string) => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{etiqueta}</p>
      <p className={`text-base font-black ${color}`}>{valor}</p>
      {sub && <p className="text-[10px] leading-tight text-zinc-600">{sub}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Reparto de beneficios</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
            Nómina = 80% del beneficio · 20% a la hucha. Sobre lo cobrado, sin contar nóminas ni inversión.
            {" "}
            <button onClick={() => setVerGuia(!verGuia)} className="font-bold text-sky-400 hover:text-sky-300">
              {verGuia ? "cerrar guía" : "¿cómo se cierra el mes? →"}
            </button>
          </p>
        </div>
        <select
          value={anyo}
          onChange={(e) => setAnyo(Number(e.target.value))}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white outline-none"
        >
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {verGuia && (
        <div className="mb-4 rounded-xl border border-sky-900 bg-sky-950/20 p-4 text-xs leading-relaxed text-zinc-300">
          <p className="mb-2 text-sm font-black text-white">Flujo mensual del reparto y las nóminas</p>
          <ol className="list-decimal space-y-1.5 pl-4">
            <li><b>Durante el mes</b>: cada ingreso se apunta con su <b>«De:»</b> correcto (Luis / David / Ethos — lo del centro va a medias) y cada gasto con su <b>imputado</b>. Esa etiqueta es la que decide de qué nómina sale cada euro.</li>
            <li><b>Día 1</b>: aprobar la remesa en Ventas contra el recibo del banco y apuntar los fijos <b>cuando estén pagados</b> (el botón de Cash flow copia los del mes anterior: no lo pulses antes de tiempo).</li>
            <li><b>Cierre (día 1-5)</b>: pulsa <b>🔍 Auditar mes</b> aquí. Verás TODAS las líneas: cada cobro y a qué cubo va, cada gasto y si resta o no (inversión y nóminas no restan), y el IVA del mes. Si algo está mal, se corrige <b>en el Libro o en Ventas</b> (nunca aquí) y el reparto se recalcula solo.</li>
            <li><b>Cuando la auditoría te cuadre</b>: retiráis las nóminas y marcáis <b>✓ pagado</b> escribiendo el <b>importe real</b> retirado (puede diferir del 80% teórico: se guarda el tuyo).</li>
            <li><b>Hucha</b>: se alimenta sola con el 20%. El «Ajuste manual» de Ajustes es solo para cuadrarla con la realidad física (sobres/cuenta), no para corregir meses.</li>
          </ol>
          <p className="mt-2 text-[11px] text-zinc-500">
            Regla de oro: el Reparto no se edita — se audita. Si un número no te cuadra, la auditoría te dice exactamente qué línea lo causa.
          </p>
        </div>
      )}

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}
      {!disponible && (
        <p className="mb-3 rounded-xl bg-amber-950 px-4 py-2 text-xs text-amber-300">
          Ejecuta <b>supabase/mejoras_v6.sql</b> para ver el reparto.
        </p>
      )}

      {/* Resumen del año */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Nómina Luis · " + anyo, eurEntero(totalAnyo.nomLuis), "text-emerald-400")}
        {stat("Nómina David · " + anyo, eurEntero(totalAnyo.nomDavid), "text-emerald-400")}
        {stat("Pendiente a colaboradores", eurEntero(totalColab), totalColab <= 0 ? "text-emerald-400" : "text-sky-400", "Alex y empleados · descuenta lo pagado")}
        {stat("Hucha (saldo)", eurEntero(huchaSaldo), huchaSaldo < 0 ? "text-red-400" : "text-white", "20% acum. − inversión")}
      </div>

      {/* Detalle por mes (tabla compacta) */}
      {meses.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          Sin datos de reparto en {anyo}.
        </p>
      ) : (
        <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[9px] font-black uppercase tracking-widest text-zinc-600">
                <th className="px-4 py-2">Socio</th>
                <th className="px-4 py-2 text-right">Nómina (80%)</th>
                <th className="px-4 py-2 text-right">A hucha (20%)</th>
                <th className="px-4 py-2 text-center">Pagado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {[...meses].reverse().flatMap(([mes, par]) => {
                const cabecera = (
                  <tr key={`${mes}-h`} className="border-y border-zinc-800/70 bg-gradient-to-r from-zinc-900 to-zinc-900/30">
                    <td colSpan={5} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
                      <span className="flex items-center justify-between gap-2">
                        <span className="capitalize">{MESLARGO(mes)}</span>
                        <button
                          onClick={() => abrirAuditoria(mes)}
                          title="Ver TODAS las líneas (cobros, gastos, IVA) que componen el reparto de este mes"
                          className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        >
                          🔍 Auditar mes
                        </button>
                      </span>
                    </td>
                  </tr>
                );
                const filasSocios = (["luis", "david"] as const).flatMap((socio) => {
                  const f = par[socio];
                  if (!f) return [];
                  const ben = Number(f.beneficio);
                  const nom = nomina(ben);
                  const huc = aHucha(ben);
                  const clave = `${mes}-${socio}`;
                  const pagadoTick = pagados.has(`${mes.slice(0, 7)}-${socio}`);
                  const filas = [
                    <tr key={clave} className="border-b border-zinc-800/30 last:border-0 hover:bg-zinc-900/40">
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2">
                          <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-black ${socio === "luis" ? "bg-emerald-950 text-emerald-300" : "bg-sky-950 text-sky-300"}`}>
                            {NOMBRE[socio][0]}
                          </span>
                          <span className="text-[13px] font-semibold text-zinc-200">{NOMBRE[socio]}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-[13px] font-bold tabular-nums text-emerald-400">
                        {eur(nom)}
                        {ben <= 0 && <span className="ml-1.5 text-[9px] font-normal text-zinc-600">sin beneficio</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-[12px] tabular-nums text-sky-400/90">{eur(huc)}</td>
                      <td className="px-4 py-2 text-center">
                        {nom <= 0 ? (
                          <span className="text-zinc-700">—</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => togglePagado(mes, socio, nom)}
                              title={pagadoTick ? "Quitar el pagado" : "Marcar como pagado"}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                pagadoTick
                                  ? "bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-800/60"
                                  : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {pagadoTick ? "✓ pagado" : "pendiente"}
                            </button>
                            {pagadoTick && (
                              <input
                                key={`${clave}-${pagados.get(`${mes.slice(0, 7)}-${socio}`) ?? "t"}`}
                                defaultValue={(pagados.get(`${mes.slice(0, 7)}-${socio}`) ?? nom).toFixed(2)}
                                onBlur={(e) => guardarImporte(mes, socio, e.target.value)}
                                inputMode="decimal"
                                title="Importe realmente cobrado (edítalo si difiere del 80% teórico)"
                                className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-right text-[11px] tabular-nums text-white outline-none focus:border-red-500"
                              />
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => setAbierto(abierto === clave ? null : clave)} className="text-[10px] font-semibold text-zinc-600 hover:text-white">
                          {abierto === clave ? "cerrar" : "cálculo"}
                        </button>
                      </td>
                    </tr>,
                  ];
                  if (abierto === clave) {
                    filas.push(
                      <tr key={`${clave}-det`} className="border-b border-zinc-800/30 bg-zinc-950/60">
                        <td colSpan={5} className="px-4 py-2">
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
                            <span className="text-zinc-500">Cobrado propio <b className="text-zinc-300">{eur(Number(f.cobrado_propio))}</b></span>
                            <span className="text-zinc-500">Cobrado centro ÷2 <b className="text-zinc-300">{eur(Number(f.cobrado_ethos))}</b></span>
                            <span className="text-zinc-500">− IVA a reservar <b className="text-zinc-400">{eur(Number(f.iva_propio) + Number(f.iva_ethos))}</b></span>
                            <span className="text-zinc-500">− Gasto (sin inversión ni nóminas) <b className="text-zinc-400">{eur(Number(f.gasto_propio) + Number(f.gasto_ethos))}</b></span>
                            <span className="text-zinc-400">= Beneficio <b className="text-white">{eur(Math.max(0, ben))}</b></span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return filas;
                });
                return [cabecera, ...filasSocios];
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagos a colaboradores / empleados */}
      <div className="mb-5">
        <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">
          Pagos a colaboradores y empleados · {anyo}
        </h3>
        {colabAnyo.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
            Sin colaboradores con cobros este año. Añade empleados en Ajustes → Personas.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {colabAnyo.map((c) => {
              const pendiente = Math.max(0, c.aPagar - c.pagado);
              return (
                <div key={c.nombre} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-950 text-xs font-black text-violet-300">
                        {inic(c.nombre)}
                      </span>
                      <div>
                        <p className="font-black text-white">{c.nombre}</p>
                        <p className="text-xs text-zinc-500">se lleva el {Math.round(c.pct * 100)}% de su base</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-zinc-500">A pagarle</p>
                      <p className={`text-xl font-black ${pendiente <= 0.01 ? "text-emerald-400" : "text-violet-300"}`}>
                        {pendiente <= 0.01 ? "0 € ✓" : eur(pendiente)}
                      </p>
                      {c.pagado > 0 && pendiente > 0.01 && (
                        <p className="text-[10px] text-zinc-500">de {eur(c.aPagar)} · pagado {eur(c.pagado)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between rounded-lg bg-zinc-950/60 px-3 py-2 text-xs">
                    <span className="text-zinc-500">Base cobrada {eur(c.base)}</span>
                    <span className="text-zinc-400">Para Ethos {eur(c.aEthos)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.meses
                      .slice()
                      .sort((a, b) => (a.mes < b.mes ? -1 : 1))
                      .map((m) => {
                        const kCh = `${m.mes.slice(0, 7)}-${c.codigo}`;
                        const hecho = pagados.has(kCh);
                        const real = hecho ? (pagados.get(kCh) ?? Number(m.a_pagar)) : Number(m.a_pagar);
                        return (
                          <span key={m.mes} className="inline-flex overflow-hidden rounded-md">
                            <button
                              onClick={() => togglePagado(m.mes, c.codigo, Number(m.a_pagar))}
                              title={hecho ? "Quitar el pagado" : "Marcar como pagado"}
                              className={`px-2 py-1 text-[11px] font-bold ${
                                hecho ? "bg-emerald-600/20 text-emerald-400 ring-1 ring-inset ring-emerald-800" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              <span className="capitalize">{MESCORTO(m.mes)}</span> {eur(real)}{hecho ? " ✓" : ""}
                            </button>
                            {hecho && (
                              <button
                                onClick={() => {
                                  const v = window.prompt(`Importe realmente pagado a ${c.nombre} (${MESCORTO(m.mes)}):`, real.toFixed(2));
                                  if (v !== null && v.trim() !== "") guardarImporte(m.mes, c.codigo, v);
                                }}
                                title="Editar el importe real cobrado"
                                className="bg-emerald-950 px-1.5 text-[10px] text-emerald-500 hover:text-white"
                              >
                                ✎
                              </button>
                            )}
                          </span>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hucha */}
      <div className="rounded-2xl border border-sky-900 bg-sky-950/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-white">Hucha de la empresa</h3>
          <span className={`text-xl font-black ${huchaSaldo < 0 ? "text-red-400" : "text-white"}`}>{eur(huchaSaldo)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">20% acumulado</p>
            <p className="font-bold text-sky-400">{eur(aporte20Total)}</p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Invertido / reinvertido</p>
            <p className="font-bold text-red-400">−{eur(inversionTotal)}</p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Ajuste manual</p>
            <p className={`font-bold ${huchaAjuste < 0 ? "text-red-400" : huchaAjuste > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
              {huchaAjuste === 0 ? "—" : eur(huchaAjuste)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Saldo</p>
            <p className={`font-bold ${huchaSaldo < 0 ? "text-red-400" : "text-emerald-400"}`}>{eur(huchaSaldo)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          La hucha cuenta desde {new Date(huchaDesde + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" })}:
          la obra del local de antes es inversión inicial (se sigue en el Dashboard), no sale de la hucha.
          Si tu hucha real no cuadra con esta, pon la diferencia en <b>Ajustes → Negocio → Ajuste de la hucha</b>.
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300">
        Estimación sobre lo cobrado. El IVA solo resta si hay que pagarlo (si sale a compensar, no
        resta). Cuadra los definitivos con el gestor.
      </div>

      {/* ============ AUDITORÍA DEL MES: cada línea del reparto ============ */}
      <Modal
        abierto={!!audMes}
        onCerrar={() => setAudMes(null)}
        titulo={audMes ? `Auditoría del reparto · ${MESLARGO(audMes)}` : ""}
        ancho="max-w-4xl"
      >
        {audCargando || !auditoria ? (
          <p className="py-8 text-center text-sm text-zinc-500">Cargando líneas…</p>
        ) : (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            {/* Resumen: la cuenta completa, de las líneas al beneficio */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                    <th className="px-3 py-1.5 text-left">La cuenta</th>
                    <th className="px-3 py-1.5 text-right">Luis</th>
                    <th className="px-3 py-1.5 text-right">David</th>
                    <th className="px-3 py-1.5 text-right">Centro (÷2)</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["+ Cobrado", auditoria.cobrado.luis, auditoria.cobrado.david, auditoria.cobrado.centro, "text-emerald-400"],
                    ["− IVA neto a reservar", auditoria.ivaNeto.luis, auditoria.ivaNeto.david, auditoria.ivaNeto.centro, "text-zinc-400"],
                    ["− IRPF soportado", auditoria.irpf.luis, auditoria.irpf.david, auditoria.irpf.centro, "text-zinc-400"],
                    ["− Gastos (sin inversión ni nóminas)", auditoria.gasto.luis, auditoria.gasto.david, auditoria.gasto.centro, "text-red-400"],
                  ] as [string, number, number, number, string][]).map(([n, l, d, c, cls]) => (
                    <tr key={n} className="border-b border-zinc-800/50">
                      <td className="px-3 py-1.5 font-semibold text-zinc-300">{n}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${cls}`}>{eur(l)}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${cls}`}>{eur(d)}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${cls}`}>{eur(c)}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-900/70 font-black">
                    <td className="px-3 py-2 text-white">= Beneficio (propio + centro÷2)</td>
                    <td className="px-3 py-2 text-right tabular-nums text-white">{eur(auditoria.beneficio("luis"))}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-white">{eur(auditoria.beneficio("david"))}</td>
                    <td className="px-3 py-2 text-right text-[10px] font-normal text-zinc-600">la mitad a cada uno</td>
                  </tr>
                  <tr className="bg-emerald-950/30 font-bold">
                    <td className="px-3 py-1.5 text-emerald-400">→ Nómina (80%) · Hucha (20%)</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-emerald-400">
                      {eur(Math.max(0, auditoria.beneficio("luis")) * 0.8)} · {eur(Math.max(0, auditoria.beneficio("luis")) * 0.2)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-emerald-400">
                      {eur(Math.max(0, auditoria.beneficio("david")) * 0.8)} · {eur(Math.max(0, auditoria.beneficio("david")) * 0.2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cobros línea a línea */}
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Cobros del mes ({auditoria.lineasCobro.length}) — por fecha de cobro
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-800">
                {auditoria.lineasCobro
                  .slice()
                  .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
                  .map((l, i) => (
                    <div key={i} className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-1 text-[11px] last:border-0">
                      <span className="w-14 shrink-0 text-zinc-600">{l.fecha.slice(5)}</span>
                      <span className={`w-14 shrink-0 rounded px-1 text-center text-[9px] font-bold ${
                        l.cubo === "luis" ? "bg-emerald-950 text-emerald-400" : l.cubo === "david" ? "bg-sky-950 text-sky-400" : "bg-zinc-800 text-zinc-400"
                      }`}>{l.cubo === "centro" ? (l.at.startsWith("alex") ? "alex→30%" : "centro") : l.cubo}</span>
                      <span className="min-w-0 flex-1 truncate text-zinc-300">
                        {l.facturas?.clientes?.nombre ? `${l.facturas.clientes.nombre} · ` : ""}{l.facturas?.concepto}
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-500">{eur(Number(l.importe))}</span>
                      <span className="w-20 shrink-0 text-right font-bold tabular-nums text-zinc-200">{eur(l.computa)}</span>
                    </div>
                  ))}
              </div>
              <p className="mt-1 text-[10px] text-zinc-600">
                Última columna = lo que computa. En los Alex solo entra el 30% de su base (el resto es suyo).
              </p>
            </div>

            {/* Gastos línea a línea */}
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-red-400">
                Gastos del mes ({auditoria.lineasGasto.length})
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-800">
                {auditoria.lineasGasto
                  .slice()
                  .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
                  .map((g, i) => (
                    <div key={i} className={`flex items-center gap-2 border-b border-zinc-800/50 px-3 py-1 text-[11px] last:border-0 ${g.excluido ? "opacity-50" : ""}`}>
                      <span className="w-14 shrink-0 text-zinc-600">{g.fecha.slice(5)}</span>
                      <span className={`w-14 shrink-0 rounded px-1 text-center text-[9px] font-bold ${
                        g.cubo === "luis" ? "bg-emerald-950 text-emerald-400" : g.cubo === "david" ? "bg-sky-950 text-sky-400" : "bg-zinc-800 text-zinc-400"
                      }`}>{g.cubo}</span>
                      <span className="min-w-0 flex-1 truncate text-zinc-300">{g.concepto} <span className="text-zinc-600">· {g.categorias?.nombre}</span></span>
                      {g.excluido && (
                        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500" title={g.excluido === "inversión" ? "La inversión sale de la hucha, no del beneficio del mes" : "Las nóminas son el propio reparto: no restan como gasto"}>
                          {g.excluido} · no resta
                        </span>
                      )}
                      <span className={`w-20 shrink-0 text-right font-bold tabular-nums ${g.excluido ? "text-zinc-600 line-through" : "text-zinc-200"}`}>{eur(Number(g.total))}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* IVA del mes */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-[11px] text-zinc-400">
              <p className="mb-1 font-black uppercase tracking-wider text-zinc-500">IVA del mes</p>
              <p>
                Repercutido (facturas emitidas): Luis {eur(auditoria.ivaRep.luis)} · David {eur(auditoria.ivaRep.david)} · Centro {eur(auditoria.ivaRep.centro)}
                <br />
                − Soportado (gastos deducibles): Luis {eur(auditoria.ivaSop.luis)} · David {eur(auditoria.ivaSop.david)} · Centro {eur(auditoria.ivaSop.centro)}
                <br />
                = <b className="text-zinc-200">A reservar (nunca negativo): Luis {eur(auditoria.ivaNeto.luis)} · David {eur(auditoria.ivaNeto.david)} · Centro {eur(auditoria.ivaNeto.centro)}</b>
              </p>
            </div>

            <p className="text-[10px] leading-snug text-zinc-600">
              Estos números salen de las mismas líneas que ves en el Libro y en Ventas: si algo está mal, corrígelo allí
              y esta auditoría (y el reparto) cambian solos. Así la app se puede verificar igual que hacías con el Excel.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
