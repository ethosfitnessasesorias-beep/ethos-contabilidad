"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FilaTrim {
  anyo: number;
  trim: number;
  iva_a_pagar: number;
  irpf_retenciones: number;
  beneficio: number;
  modelo_130: number;
}
interface Ajuste {
  anyo: number;
  trimestre: number;
  modelo: string;
  importe: number;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const inputCls =
  "w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-right text-sm text-white outline-none focus:border-red-500";

// Los tres tributos que se reservan cada trimestre
const MODELOS = [
  { key: "iva", etiqueta: "IVA (modelo 303)", campo: "iva_a_pagar" as const },
  { key: "irpf_ret", etiqueta: "IRPF retenciones (111/115)", campo: "irpf_retenciones" as const },
  { key: "irpf_130", etiqueta: "IRPF pago fraccionado (130)", campo: "modelo_130" as const },
];

export default function ImpuestosPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [filas, setFilas] = useState<FilaTrim[]>([]);
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [v, a] = await Promise.all([
      supabase.from("v_impuestos_trimestrales").select("*").eq("anyo", anyo),
      supabase.from("impuestos_ajustes").select("*").eq("anyo", anyo),
    ]);
    if (v.error) return setError(v.error.message);
    setFilas((v.data as FilaTrim[]) ?? []);
    setAjustes((a.data as Ajuste[]) ?? []);
  }, [anyo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ajusteDe = (trim: number, modelo: string) =>
    ajustes.find((a) => a.trimestre === trim && a.modelo === modelo)?.importe;

  async function guardarAjuste(trim: number, modelo: string, valor: string) {
    const txt = valor.trim();
    if (txt === "") {
      await supabase.from("impuestos_ajustes").delete().eq("anyo", anyo).eq("trimestre", trim).eq("modelo", modelo);
    } else {
      const importe = Number(txt.replace(",", "."));
      if (!Number.isFinite(importe)) return;
      await supabase.from("impuestos_ajustes").upsert({ anyo, trimestre: trim, modelo, importe });
    }
    cargar();
  }

  // Valor a reservar de un modelo: la previsión manual si existe, si no el
  // cálculo (el IVA a compensar —negativo— no se paga: cuenta como 0).
  function aReservar(fila: FilaTrim | undefined, modelo: (typeof MODELOS)[number], trim: number): number {
    const manual = ajusteDe(trim, modelo.key);
    if (manual !== undefined) return Number(manual);
    const calc = fila ? Number(fila[modelo.campo]) : 0;
    return modelo.key === "iva" ? Math.max(0, calc) : Math.max(0, calc);
  }

  const totalAnyo = useMemo(() => {
    let t = 0;
    for (let q = 1; q <= 4; q++) {
      const fila = filas.find((f) => f.trim === q);
      for (const m of MODELOS) t += aReservar(fila, m, q);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, ajustes]);

  const trimActual = Math.floor(new Date().getMonth() / 3) + 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Predicción aproximada de lo que reservar para Hacienda cada trimestre. Edita cualquier
            cifra si el gestor la ajusta.
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

      <div className="mb-4 rounded-2xl border border-red-900 bg-red-950/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-red-400">A reservar en {anyo}</p>
        <p className="mt-1 text-3xl font-black text-white">{eur(totalAnyo)}</p>
        <p className="mt-1 text-xs text-zinc-500">Suma de las previsiones de los cuatro trimestres.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((q) => {
          const fila = filas.find((f) => f.trim === q);
          const totalTrim = MODELOS.reduce((s, m) => s + aReservar(fila, m, q), 0);
          const esActual = anyo === new Date().getFullYear() && q === trimActual;
          return (
            <div
              key={q}
              className={`rounded-2xl border p-4 ${esActual ? "border-red-600 bg-zinc-900" : "border-zinc-800 bg-zinc-900/40"}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black text-white">
                  {q}º trimestre {esActual && <span className="text-xs font-bold text-red-500">· en curso</span>}
                </h3>
                <span className="text-sm font-black text-white">{eur(totalTrim)}</span>
              </div>
              <div className="flex flex-col gap-2">
                {MODELOS.map((m) => {
                  const calc = fila ? Number(fila[m.campo]) : 0;
                  const ivaCompensar = m.key === "iva" && calc < 0;
                  return (
                    <div key={m.key} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-zinc-300">{m.etiqueta}</p>
                        <p className="text-[11px] text-zinc-600">
                          {ivaCompensar ? `a compensar ${eur(Math.abs(calc))}` : `estimado ${eur(calc)}`}
                        </p>
                      </div>
                      <input
                        placeholder={ivaCompensar ? "0" : String(Math.max(0, Math.round(calc)))}
                        defaultValue={ajusteDe(q, m.key) ?? ""}
                        onBlur={(e) => guardarAjuste(q, m.key, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300">
        Es una estimación para que reserves dinero, no una liquidación oficial. El modelo 130
        real es acumulado en el año y resta pagos y retenciones previas; el IVA negativo se
        compensa, no se paga. Cuadra los importes definitivos con Xavi cada trimestre y ajústalos aquí.
      </div>
    </div>
  );
}
