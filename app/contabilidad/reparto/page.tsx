"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

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

const NOMBRE: Record<string, string> = { luis: "Luis", david: "David" };
const MESNOM = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });

export default function RepartoPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [filas, setFilas] = useState<FilaReparto[]>([]);
  const [inversiones, setInversiones] = useState<FilaInversion[]>([]);
  const [huchaReg, setHuchaReg] = useState(0);
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null); // "mes-socio" desglosado

  const cargar = useCallback(async () => {
    const [r, inv, h] = await Promise.all([
      supabase.from("v_reparto_beneficios").select("*").order("mes"),
      supabase.from("v_inversion_mensual").select("*").order("mes"),
      supabase.from("v_hucha").select("hucha_actual").single(),
    ]);
    if (r.error) {
      setDisponible(false);
      setError("Falta la migración mejoras_v4.sql (reparto de beneficios).");
      return;
    }
    setDisponible(true);
    setFilas((r.data as FilaReparto[]) ?? []);
    setInversiones((inv.data as FilaInversion[]) ?? []);
    setHuchaReg(Number((h.data as { hucha_actual: number } | null)?.hucha_actual ?? 0));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Hucha = 20% acumulado de ambos socios (todo el histórico) − inversiones.
  const aporte20Total = filas.reduce((s, f) => s + Number(f.beneficio) * 0.2, 0);
  const inversionTotal = inversiones.reduce((s, i) => s + Number(i.inversion), 0);
  const huchaSaldo = aporte20Total - inversionTotal;

  // Meses del año seleccionado, con las dos filas (luis/david)
  const meses = useMemo(() => {
    const set = new Map<string, { luis?: FilaReparto; david?: FilaReparto }>();
    for (const f of filas) {
      if (new Date(f.mes).getFullYear() !== anyo) continue;
      const acc = set.get(f.mes) ?? {};
      acc[f.socio as "luis" | "david"] = f;
      set.set(f.mes, acc);
    }
    return [...set.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filas, anyo]);

  const invDe = (mes: string) => Number(inversiones.find((i) => i.mes === mes)?.inversion ?? 0);

  const tarjetaSocio = (mes: string, f: FilaReparto | undefined, socio: string) => {
    if (!f) return null;
    const ben = Number(f.beneficio);
    const nomina = ben * 0.8;
    const hucha = ben * 0.2;
    const clave = `${mes}-${socio}`;
    const cobrado = Number(f.cobrado_propio) + Number(f.cobrado_ethos);
    const dedu = Number(f.iva_propio) + Number(f.iva_ethos) + Number(f.irpf_propio) + Number(f.irpf_ethos) + Number(f.gasto_propio) + Number(f.gasto_ethos);
    return (
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-black text-white">{NOMBRE[socio]}</span>
          <button onClick={() => setAbierto(abierto === clave ? null : clave)} className="text-xs font-semibold text-zinc-500 hover:text-white">
            {abierto === clave ? "ocultar" : "desglose"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-600">Beneficio</p>
            <p className={`text-sm font-black ${ben < 0 ? "text-red-400" : "text-white"}`}>{eur(ben)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-600">Nómina 80%</p>
            <p className={`text-sm font-black ${nomina < 0 ? "text-red-400" : "text-emerald-400"}`}>{eur(nomina)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-600">Hucha 20%</p>
            <p className={`text-sm font-black ${hucha < 0 ? "text-red-400" : "text-sky-400"}`}>{eur(hucha)}</p>
          </div>
        </div>
        {abierto === clave && (
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-zinc-800 pt-2 text-xs">
            <dt className="text-zinc-500">Cobrado propio</dt>
            <dd className="text-right text-zinc-300">{eur(Number(f.cobrado_propio))}</dd>
            <dt className="text-zinc-500">Cobrado ETHOS ÷2</dt>
            <dd className="text-right text-zinc-300">{eur(Number(f.cobrado_ethos))}</dd>
            <dt className="text-zinc-500">− IVA a reservar</dt>
            <dd className="text-right text-zinc-400">{eur(Number(f.iva_propio) + Number(f.iva_ethos))}</dd>
            <dt className="text-zinc-500">− IRPF a reservar</dt>
            <dd className="text-right text-zinc-400">{eur(Number(f.irpf_propio) + Number(f.irpf_ethos))}</dd>
            <dt className="text-zinc-500">− Gasto sin inversión</dt>
            <dd className="text-right text-zinc-400">{eur(Number(f.gasto_propio) + Number(f.gasto_ethos))}</dd>
            <dt className="border-t border-zinc-800 pt-1 font-bold text-zinc-300">Beneficio</dt>
            <dd className={`border-t border-zinc-800 pt-1 text-right font-bold ${ben < 0 ? "text-red-400" : "text-white"}`}>{eur(ben)}</dd>
            <dt className="text-zinc-600">(ingresos {eur(cobrado)} − deducciones {eur(dedu)})</dt>
            <dd />
          </dl>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-zinc-400">
          Reparto mensual según tu hoja: <b>Beneficio = cobrado propio + cobrado del centro ÷2 −
          (IVA + IRPF a reservar + gastos sin inversión)</b>. La <b>nómina es el 80%</b> y el <b>20%
          va a la hucha</b>. La inversión no resta de la nómina: sale de la hucha.
        </p>
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
      {!disponible && (
        <p className="mb-3 rounded-xl bg-amber-950 px-4 py-2 text-xs text-amber-300">
          Ejecuta <b>supabase/mejoras_v4.sql</b> para ver el reparto.
        </p>
      )}

      {/* Hucha de la empresa */}
      <div className="mb-5 rounded-2xl border border-sky-900 bg-sky-950/30 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Hucha de la empresa</p>
        <p className={`mt-1 text-3xl font-black ${huchaSaldo < 0 ? "text-red-400" : "text-white"}`}>{eur(huchaSaldo)}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">20% acumulado (histórico)</p>
            <p className="font-bold text-sky-400">{eur(aporte20Total)}</p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Invertido / reinvertido</p>
            <p className="font-bold text-red-400">−{eur(inversionTotal)}</p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 px-3 py-2">
            <p className="text-zinc-500">Saldo = lo que queda</p>
            <p className={`font-bold ${huchaSaldo < 0 ? "text-red-400" : "text-emerald-400"}`}>{eur(huchaSaldo)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Es el 20% que dejáis en la cuenta del 80/20, menos lo gastado en inversiones. En negativo =
          habéis invertido más de lo acumulado (financiado con aportaciones o con el 80%).
          {huchaReg > 0 && ` · Hucha registrada aparte: ${eur(huchaReg)}.`}
        </p>
      </div>

      {/* Reparto por mes */}
      {meses.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          Sin datos de reparto en {anyo}.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {meses.map(([mes, par]) => {
            const inv = invDe(mes);
            return (
              <div key={mes} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-black capitalize text-white">{MESNOM(mes)}</h3>
                  {inv > 0 && (
                    <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-400">
                      inversión del mes {eur(inv)} (sale de la hucha)
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {tarjetaSocio(mes, par.luis, "luis")}
                  {tarjetaSocio(mes, par.david, "david")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300">
        La nómina y la hucha se calculan sobre lo <b>cobrado</b> (no lo facturado). En meses de
        pérdidas el beneficio sale negativo (no hay nómina ese mes). El IVA/IRPF a reservar son
        estimaciones; cuadra los definitivos con el gestor.
      </div>
    </div>
  );
}
