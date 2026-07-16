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
  const [cuentaBanco, setCuentaBanco] = useState<number | null>(null);
  const [nominaCatId, setNominaCatId] = useState<number | null>(null);
  const [nominaPuesta, setNominaPuesta] = useState<Set<string>>(new Set()); // "mes-socio"

  const cargar = useCallback(async () => {
    const [r, inv, c, cue, cat] = await Promise.all([
      supabase.from("v_reparto_beneficios").select("*").order("mes"),
      supabase.from("v_inversion_mensual").select("*").order("mes"),
      supabase.from("v_pagos_colaboradores").select("*").order("mes"),
      supabase.from("cuentas").select("id, codigo").eq("activa", true),
      supabase.from("categorias").select("id, nombre").ilike("nombre", "%mina%").limit(1),
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
    const banco = (cue.data as { id: number; codigo: string }[])?.find((x) => x.codigo === "banco");
    setCuentaBanco(banco?.id ?? (cue.data as { id: number }[])?.[0]?.id ?? null);
    const nomCat = (cat.data as { id: number }[])?.[0]?.id ?? null;
    setNominaCatId(nomCat);
    // Meses/socios que ya tienen nómina apuntada
    if (nomCat) {
      const { data: g } = await supabase
        .from("gastos")
        .select("fecha, imputado_a")
        .eq("categoria_id", nomCat);
      const set = new Set<string>();
      for (const x of (g as { fecha: string; imputado_a: string }[]) ?? [])
        set.add(`${x.fecha.slice(0, 7)}-${x.imputado_a}`);
      setNominaPuesta(set);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si no hay beneficio, no hay nómina ni hucha: nunca en negativo.
  const nomina = (b: number) => Math.max(0, b * 0.8);
  const aHucha = (b: number) => Math.max(0, b * 0.2);

  // Registra la nómina del mes como gasto en la categoría Nóminas (imputado al socio)
  async function registrarNomina(mes: string, socio: string, importe: number) {
    if (!nominaCatId || importe <= 0) return;
    const nombreSocio = NOMBRE[socio] ?? socio;
    const { error } = await supabase.from("gastos").insert({
      fecha: `${mes.slice(0, 7)}-28`,
      concepto: `Nómina ${nombreSocio} ${MESLARGO(mes)}`,
      categoria_id: nominaCatId,
      cuenta_id: cuentaBanco,
      imputado_a: socio,
      base: Math.round(importe * 100) / 100,
      iva_pct: 0,
      irpf_pct: 0,
      deducible: false,
      tiene_factura: false,
      es_fijo: false,
    });
    if (error) return setError(error.message);
    setOk(`Nómina de ${nombreSocio} apuntada ✓`);
    setTimeout(() => setOk(null), 3000);
    cargar();
  }

  // Hucha (histórico completo): 20% acumulado − inversiones
  const aporte20Total = filas.reduce((s, f) => s + Math.max(0, Number(f.beneficio)) * 0.2, 0);
  const inversionTotal = inversiones.reduce((s, i) => s + Number(i.inversion), 0);
  const huchaSaldo = aporte20Total - inversionTotal;

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
    const m = new Map<string, { nombre: string; pct: number; aPagar: number; aEthos: number; base: number; meses: FilaColab[] }>();
    for (const c of colab) {
      if (new Date(c.mes).getFullYear() !== anyo) continue;
      const acc = m.get(c.colaborador) ?? { nombre: c.nombre, pct: Number(c.pct), aPagar: 0, aEthos: 0, base: 0, meses: [] };
      acc.aPagar += Number(c.a_pagar);
      acc.aEthos += Number(c.a_ethos);
      acc.base += Number(c.base_cobrada);
      acc.meses.push(c);
      m.set(c.colaborador, acc);
    }
    return [...m.values()].sort((a, b) => b.aPagar - a.aPagar);
  }, [colab, anyo]);
  const totalColab = colabAnyo.reduce((s, c) => s + c.aPagar, 0);

  const maxNomina = Math.max(
    1,
    ...meses.flatMap(([, p]) => [
      Math.max(0, nomina(Number(p.luis?.beneficio ?? 0))),
      Math.max(0, nomina(Number(p.david?.beneficio ?? 0))),
    ])
  );

  const stat = (etiqueta: string, valor: string, color: string, sub?: string) => (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Reparto de beneficios</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
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
        {stat("A colaboradores · " + anyo, eurEntero(totalColab), "text-sky-400", "Alex y empleados")}
        {stat("Hucha (saldo)", eurEntero(huchaSaldo), huchaSaldo < 0 ? "text-red-400" : "text-white", "20% acum. − inversión")}
      </div>

      {/* Gráfica de nómina mensual */}
      {meses.length > 0 && (
        <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-zinc-400">Nómina por mes</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Luis</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> David</span>
            </div>
          </div>
          <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ height: 180 }}>
            {meses.map(([mes, par]) => {
              const nl = Math.max(0, nomina(Number(par.luis?.beneficio ?? 0)));
              const nd = Math.max(0, nomina(Number(par.david?.beneficio ?? 0)));
              return (
                <div key={mes} className="flex min-w-12 flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end justify-center gap-1">
                    <div
                      className="w-1/2 max-w-6 rounded-t bg-emerald-500"
                      style={{ height: `${(nl / maxNomina) * 100}%` }}
                      title={`Luis ${eur(nl)}`}
                    />
                    <div
                      className="w-1/2 max-w-6 rounded-t bg-sky-500"
                      style={{ height: `${(nd / maxNomina) * 100}%` }}
                      title={`David ${eur(nd)}`}
                    />
                  </div>
                  <span className="text-[10px] capitalize text-zinc-500">{MESCORTO(mes)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalle por mes */}
      {meses.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          Sin datos de reparto en {anyo}.
        </p>
      ) : (
        <div className="mb-5 flex flex-col gap-2.5">
          {[...meses].reverse().map(([mes, par]) => {
            const inv = invDe(mes);
            return (
              <div key={mes} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black capitalize text-white">{MESLARGO(mes)}</h3>
                  {inv > 0 && (
                    <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-400">
                      inversión {eur(inv)} · sale de la hucha
                    </span>
                  )}
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(["luis", "david"] as const).map((socio) => {
                    const f = par[socio];
                    if (!f) return <div key={socio} />;
                    const ben = Number(f.beneficio);
                    const nom = nomina(ben);
                    const huc = aHucha(ben);
                    const clave = `${mes}-${socio}`;
                    return (
                      <div key={socio} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${socio === "luis" ? "bg-emerald-950 text-emerald-300" : "bg-sky-950 text-sky-300"}`}>
                              {NOMBRE[socio][0]}
                            </span>
                            <span className="font-black text-white">{NOMBRE[socio]}</span>
                          </div>
                          <button onClick={() => setAbierto(abierto === clave ? null : clave)} className="text-xs font-semibold text-zinc-500 hover:text-white">
                            {abierto === clave ? "ocultar" : "ver cálculo"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-emerald-950/40 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-emerald-500/80">Nómina (80%)</p>
                            <p className="text-lg font-black text-emerald-400">{eur(nom)}</p>
                            {ben <= 0 && <p className="text-[10px] text-zinc-500">sin beneficio este mes</p>}
                          </div>
                          <div className="rounded-lg bg-sky-950/40 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-sky-500/80">A hucha (20%)</p>
                            <p className="text-lg font-black text-sky-400">{eur(huc)}</p>
                          </div>
                        </div>
                        {nom > 0 && (
                          nominaPuesta.has(`${mes.slice(0, 7)}-${socio}`) ? (
                            <p className="mt-2 text-center text-[11px] font-bold text-emerald-500">✓ nómina apuntada</p>
                          ) : (
                            <button
                              onClick={() => registrarNomina(mes, socio, nom)}
                              className="mt-2 w-full rounded-lg bg-zinc-800 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
                            >
                              Registrar nómina ({eur(nom)})
                            </button>
                          )
                        )}
                        {abierto === clave && (
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-zinc-800 pt-2 text-xs">
                            <dt className="text-zinc-500">Cobrado propio</dt>
                            <dd className="text-right text-zinc-300">{eur(Number(f.cobrado_propio))}</dd>
                            <dt className="text-zinc-500">Cobrado centro ÷2</dt>
                            <dd className="text-right text-zinc-300">{eur(Number(f.cobrado_ethos))}</dd>
                            <dt className="text-zinc-500">− IVA a reservar</dt>
                            <dd className="text-right text-zinc-400">{eur(Number(f.iva_propio) + Number(f.iva_ethos))}</dd>
                            <dt className="text-zinc-500">− Gasto (sin inversión ni nóminas)</dt>
                            <dd className="text-right text-zinc-400">{eur(Number(f.gasto_propio) + Number(f.gasto_ethos))}</dd>
                            <dt className="border-t border-zinc-800 pt-1 font-bold text-zinc-300">= Beneficio</dt>
                            <dd className="border-t border-zinc-800 pt-1 text-right font-bold text-white">
                              {ben > 0 ? eur(ben) : eur(0)}
                            </dd>
                          </dl>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
            {colabAnyo.map((c) => (
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
                    <p className="text-xl font-black text-violet-300">{eur(c.aPagar)}</p>
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
                    .map((m) => (
                      <span key={m.mes} className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300">
                        <span className="capitalize text-zinc-500">{MESCORTO(m.mes)}</span> {eur(Number(m.a_pagar))}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hucha */}
      <div className="rounded-2xl border border-sky-900 bg-sky-950/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-white">Hucha de la empresa</h3>
          <span className={`text-2xl font-black ${huchaSaldo < 0 ? "text-red-400" : "text-white"}`}>{eur(huchaSaldo)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">20% acumulado</p>
            <p className="font-bold text-sky-400">{eur(aporte20Total)}</p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Invertido / reinvertido</p>
            <p className="font-bold text-red-400">−{eur(inversionTotal)}</p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Saldo</p>
            <p className={`font-bold ${huchaSaldo < 0 ? "text-red-400" : "text-emerald-400"}`}>{eur(huchaSaldo)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          En negativo <b>no significa perder dinero cada mes</b> (las nóminas de arriba son positivas):
          es que habéis invertido {eur(inversionTotal)} en el centro, más de lo acumulado en el 20%.
          Se financia con aportaciones o con parte del 80%.
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300">
        Estimación sobre lo cobrado. El IVA solo resta si hay que pagarlo (si sale a compensar, no
        resta). Cuadra los definitivos con el gestor.
      </div>
    </div>
  );
}
