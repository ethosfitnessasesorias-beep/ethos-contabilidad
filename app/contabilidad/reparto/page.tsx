"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur, eurEntero } from "@/lib/formato";

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
  const [pagados, setPagados] = useState<Set<string>>(new Set()); // "YYYY-MM-persona" con tick de pagado
  const [huchaDesde, setHuchaDesde] = useState("2026-03-01"); // la hucha empezó tras la obra del local
  const [huchaAjuste, setHuchaAjuste] = useState(0); // cuadre manual con la hucha real (Ajustes → Negocio)

  const cargar = useCallback(async () => {
    const [r, inv, c, rp] = await Promise.all([
      supabase.from("v_reparto_beneficios").select("*").order("mes"),
      supabase.from("v_inversion_mensual").select("*").order("mes"),
      supabase.from("v_pagos_colaboradores").select("*").order("mes"),
      supabase.from("reparto_pagos").select("mes, persona"),
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
    const set = new Set<string>();
    for (const x of (rp.data as { mes: string; persona: string }[]) ?? []) set.add(`${x.mes.slice(0, 7)}-${x.persona}`);
    setPagados(set);
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
  // el pago real (efectivo/transferencia) se apunta a mano si se quiere.
  async function togglePagado(mes: string, persona: string) {
    const k = `${mes.slice(0, 7)}-${persona}`;
    const mesISO = `${mes.slice(0, 7)}-01`;
    if (pagados.has(k)) {
      const { error } = await supabase.from("reparto_pagos").delete().eq("mes", mesISO).eq("persona", persona);
      if (error) return setError(error.message);
      setPagados((prev) => { const s = new Set(prev); s.delete(k); return s; });
    } else {
      const { error } = await supabase.from("reparto_pagos").insert({ mes: mesISO, persona });
      if (error) return setError(error.message);
      setPagados((prev) => new Set(prev).add(k));
    }
  }

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
      acc.pagado += pagados.has(`${c.mes.slice(0, 7)}-${c.colaborador}`) ? Number(c.a_pagar) : 0;
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
                      <span className="capitalize">{MESLARGO(mes)}</span>
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
                          <button
                            onClick={() => togglePagado(mes, socio)}
                            title={pagadoTick ? "Quitar el pagado" : "Marcar como pagado"}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                              pagadoTick
                                ? "bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-800/60"
                                : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {pagadoTick ? "✓ pagado" : "pendiente"}
                          </button>
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
                        const hecho = pagados.has(`${m.mes.slice(0, 7)}-${c.codigo}`);
                        return (
                          <button
                            key={m.mes}
                            onClick={() => togglePagado(m.mes, c.codigo)}
                            title={hecho ? "Quitar el pagado" : "Marcar como pagado"}
                            className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                              hecho ? "bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-800" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <span className="capitalize">{MESCORTO(m.mes)}</span> {eur(Number(m.a_pagar))}{hecho ? " ✓" : ""}
                          </button>
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
    </div>
  );
}
