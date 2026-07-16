"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Ajuste {
  anyo: number;
  trimestre: number;
  modelo: string;
  importe: number;
}
// v_impuestos_declaracion: por año, trimestre y titular
interface FilaDecl {
  anyo: number;
  trim: number;
  titular: string;
  ingresos_base: number;
  iva_repercutido: number;
  irpf_retenido_clientes: number;
  gastos_base_deducible: number;
  iva_soportado: number;
  irpf_retenciones: number;
  iva_resultado: number;
  beneficio: number;
}

const inputCls =
  "w-24 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-right text-sm text-white outline-none focus:border-red-500";

// Los tres tributos que se reservan/declaran cada trimestre
const MODELOS = [
  { key: "iva", etiqueta: "IVA (modelo 303)" },
  { key: "irpf_ret", etiqueta: "IRPF retenciones (111/115)" },
  { key: "irpf_130", etiqueta: "IRPF pago fraccionado (130)" },
] as const;

// Cada socio autónomo declara lo suyo; los Alex van dentro de Ethos.
const TITULARES = [
  { codigo: "david", nombre: "David" },
  { codigo: "luis", nombre: "Luis" },
  { codigo: "ethos", nombre: "Ethos (+ Alex)" },
];

const IRPF_130_PCT = 0.2; // pago fraccionado estimado sobre beneficio

interface Calc {
  iva: number; // a pagar tras compensación
  ivaCompensadoUsado: number;
  ivaSaldoRestante: number;
  ivaResultado: number;
  irpf_ret: number;
  irpf_130: number;
}

export default function ImpuestosPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [titular, setTitular] = useState<string>("todos");
  const [declaracion, setDeclaracion] = useState<FilaDecl[]>([]);
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<number | null>(null);
  const [verDeclaracion, setVerDeclaracion] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const [d, a] = await Promise.all([
      supabase.from("v_impuestos_declaracion").select("*").order("anyo").order("trim"),
      supabase.from("impuestos_ajustes").select("*").eq("anyo", anyo),
    ]);
    if (d.error) {
      setDisponible(false);
      setError("Falta la migración mejoras_v2.sql (declaración por titular).");
      return;
    }
    setDisponible(true);
    setDeclaracion((d.data as FilaDecl[]) ?? []);
    setAjustes((a.data as Ajuste[]) ?? []);
  }, [anyo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Modelo namespaced por titular para "pagado real" (no al ver "todos")
  const modeloKey = (base: string, tit: string) => `${base}:${tit}`;
  const ajusteDe = (trim: number, base: string, tit: string) =>
    ajustes.find((a) => a.trimestre === trim && a.modelo === modeloKey(base, tit))?.importe;

  async function guardarAjuste(trim: number, base: string, tit: string, valor: string) {
    const txt = valor.trim();
    setError(null);
    const modelo = modeloKey(base, tit);
    const del = await supabase
      .from("impuestos_ajustes")
      .delete()
      .eq("anyo", anyo)
      .eq("trimestre", trim)
      .eq("modelo", modelo);
    if (del.error) return setError(del.error.message);
    if (txt !== "") {
      const importe = Number(txt.replace(",", "."));
      if (!Number.isFinite(importe)) return setError("Importe no válido.");
      const ins = await supabase.from("impuestos_ajustes").insert({ anyo, trimestre: trim, modelo, importe });
      if (ins.error) return setError(ins.error.message);
    }
    setGuardado(`${trim}-${modelo}`);
    setTimeout(() => setGuardado(null), 2000);
    cargar();
  }

  // Cálculo por titular con compensación de IVA arrastrada entre trimestres.
  // Devuelve Map `${anyo}-${trim}` -> Calc para UN titular.
  function calcTitular(tit: string): Map<string, Calc> {
    const filas = declaracion.filter((f) => f.titular === tit);
    const res = new Map<string, Calc>();
    let saldoIva = 0; // crédito de IVA a compensar acumulado
    for (const f of filas) {
      const cuota = Number(f.iva_resultado);
      const neto = cuota - saldoIva;
      let ivaPagar = 0,
        compensadoUsado = 0,
        saldoRestante = 0;
      if (neto > 0) {
        ivaPagar = neto;
        compensadoUsado = saldoIva;
        saldoIva = 0;
      } else {
        ivaPagar = 0;
        compensadoUsado = cuota > 0 ? cuota : 0;
        saldoRestante = -neto;
        saldoIva = -neto;
      }
      res.set(`${f.anyo}-${f.trim}`, {
        iva: ivaPagar,
        ivaCompensadoUsado: compensadoUsado,
        ivaSaldoRestante: saldoRestante,
        ivaResultado: cuota,
        irpf_ret: Math.max(0, Number(f.irpf_retenciones)),
        irpf_130: Math.max(0, Math.round(IRPF_130_PCT * Number(f.beneficio) * 100) / 100),
      });
    }
    return res;
  }

  // Mapa combinado según el titular seleccionado ("todos" suma los tres)
  const calc = useMemo(() => {
    const titulares = titular === "todos" ? TITULARES.map((t) => t.codigo) : [titular];
    const porTit = titulares.map((t) => calcTitular(t));
    const out = new Map<string, Calc>();
    for (let q = 1; q <= 4; q++) {
      const key = `${anyo}-${q}`;
      const acc: Calc = {
        iva: 0,
        ivaCompensadoUsado: 0,
        ivaSaldoRestante: 0,
        ivaResultado: 0,
        irpf_ret: 0,
        irpf_130: 0,
      };
      for (const m of porTit) {
        const c = m.get(key);
        if (!c) continue;
        acc.iva += c.iva;
        acc.ivaCompensadoUsado += c.ivaCompensadoUsado;
        acc.ivaSaldoRestante += c.ivaSaldoRestante;
        acc.ivaResultado += c.ivaResultado;
        acc.irpf_ret += c.irpf_ret;
        acc.irpf_130 += c.irpf_130;
      }
      out.set(key, acc);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [declaracion, titular, anyo]);

  // Cifras "a declarar" agregadas del titular seleccionado
  const declPorTrim = useMemo(() => {
    const out = new Map<number, FilaDecl>();
    const rows = declaracion.filter(
      (f) => f.anyo === anyo && (titular === "todos" || f.titular === titular)
    );
    for (const f of rows) {
      const acc =
        out.get(f.trim) ??
        ({
          anyo,
          trim: f.trim,
          titular,
          ingresos_base: 0,
          iva_repercutido: 0,
          irpf_retenido_clientes: 0,
          gastos_base_deducible: 0,
          iva_soportado: 0,
          irpf_retenciones: 0,
          iva_resultado: 0,
          beneficio: 0,
        } as FilaDecl);
      acc.ingresos_base += Number(f.ingresos_base);
      acc.iva_repercutido += Number(f.iva_repercutido);
      acc.irpf_retenido_clientes += Number(f.irpf_retenido_clientes);
      acc.gastos_base_deducible += Number(f.gastos_base_deducible);
      acc.iva_soportado += Number(f.iva_soportado);
      acc.irpf_retenciones += Number(f.irpf_retenciones);
      acc.iva_resultado += Number(f.iva_resultado);
      acc.beneficio += Number(f.beneficio);
      out.set(f.trim, acc);
    }
    return out;
  }, [declaracion, anyo, titular]);

  // Valor a reservar de un modelo: pagado real si existe, si no el calculado.
  function aReservar(trim: number, base: string): number {
    if (titular !== "todos") {
      const manual = ajusteDe(trim, base, titular);
      if (manual !== undefined) return Number(manual);
    }
    const c = calc.get(`${anyo}-${trim}`);
    if (!c) return 0;
    return base === "iva" ? c.iva : base === "irpf_ret" ? c.irpf_ret : c.irpf_130;
  }

  const totalAnyo = useMemo(() => {
    let t = 0;
    for (let q = 1; q <= 4; q++) for (const m of MODELOS) t += aReservar(q, m.key);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc, ajustes, titular, anyo]);

  const trimActual = Math.floor(new Date().getMonth() / 3) + 1;
  const nombreTitular = titular === "todos" ? "todos" : TITULARES.find((t) => t.codigo === titular)?.nombre ?? titular;

  function resumenGestor(d: FilaDecl): string {
    return [
      `Declaración ${d.trim}T ${d.anyo} — ${nombreTitular} (Ethos Fitness)`,
      `INGRESOS (que computan): base ${eur(d.ingresos_base)} · IVA repercutido ${eur(d.iva_repercutido)}`,
      `GASTOS deducibles (con factura): base ${eur(d.gastos_base_deducible)} · IVA soportado ${eur(d.iva_soportado)}`,
      `IVA resultado (303): ${eur(d.iva_resultado)}${d.iva_resultado < 0 ? " (a compensar)" : ""}`,
      `Retenciones IRPF practicadas (111/115): ${eur(d.irpf_retenciones)}`,
      `IRPF retenido por clientes en factura: ${eur(d.irpf_retenido_clientes)}`,
      `Beneficio del trimestre (para 130): ${eur(d.beneficio)}`,
    ].join("\n");
  }

  async function copiarResumen(d: FilaDecl) {
    try {
      await navigator.clipboard.writeText(resumenGestor(d));
      setCopiado(d.trim);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }

  const chip = (activo: boolean, etiqueta: string, onClick: () => void, key?: string) => (
    <button
      key={key ?? etiqueta}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
        activo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-zinc-400">
          Lo que declara cada titular por trimestre. Solo cuenta lo <b>deducible / con factura</b> en
          gastos y los ingresos marcados para computar. Cuando pagues, apunta el importe en “Pagado real”.
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

      {/* Selector de titular */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Declarar de:</span>
        {chip(titular === "todos", "Todos", () => setTitular("todos"), "todos")}
        {TITULARES.map((t) => chip(titular === t.codigo, t.nombre, () => setTitular(t.codigo), t.codigo))}
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {!disponible && (
        <p className="mb-3 rounded-xl bg-amber-950 px-4 py-2 text-xs text-amber-300">
          Ejecuta <b>supabase/mejoras_v2.sql</b> para ver la declaración por titular.
        </p>
      )}

      <div className="mb-4 rounded-2xl border border-red-900 bg-red-950/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-red-400">
          A reservar en {anyo} · {nombreTitular}
        </p>
        <p className="mt-1 text-3xl font-black text-white">{eur(totalAnyo)}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Suma de los cuatro trimestres (pagos reales donde los hayas apuntado; estimaciones en el resto).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((q) => {
          const c = calc.get(`${anyo}-${q}`);
          const decl = declPorTrim.get(q);
          const totalTrim = MODELOS.reduce((s, m) => s + aReservar(q, m.key), 0);
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
                  let detalle = "";
                  if (m.key === "iva" && c) {
                    if (c.ivaSaldoRestante > 0) detalle = `cuota ${eur(c.ivaResultado)} · queda a compensar ${eur(c.ivaSaldoRestante)} → paga 0`;
                    else if (c.ivaCompensadoUsado > 0) detalle = `cuota ${eur(c.ivaResultado)} − compensación ${eur(c.ivaCompensadoUsado)} → ${eur(c.iva)}`;
                    else detalle = `estimado ${eur(c.iva)}`;
                  } else if (c) {
                    detalle = `estimado ${eur(m.key === "irpf_ret" ? c.irpf_ret : c.irpf_130)}`;
                  }
                  const clave = `${q}-${modeloKey(m.key, titular)}`;
                  return (
                    <div key={m.key} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-zinc-300">{m.etiqueta}</p>
                        <p className="text-[11px] text-zinc-600">{detalle}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        {titular === "todos" ? (
                          <span className="text-sm font-bold text-white">{eur(aReservar(q, m.key))}</span>
                        ) : (
                          <>
                            <label className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase text-zinc-600">Pagado real</span>
                              <input
                                placeholder={String(Math.round(aReservar(q, m.key)))}
                                defaultValue={ajusteDe(q, m.key, titular) ?? ""}
                                onBlur={(e) => guardarAjuste(q, m.key, titular, e.target.value)}
                                className={inputCls}
                              />
                            </label>
                            {guardado === clave && <span className="text-[10px] font-bold text-emerald-400">✓ Guardado</span>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {decl && (
                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setVerDeclaracion(verDeclaracion === q ? null : q)}
                      className="text-xs font-bold text-zinc-400 hover:text-white"
                    >
                      {verDeclaracion === q ? "▾" : "▸"} A declarar (para el gestor)
                    </button>
                    <button
                      onClick={() => copiarResumen(decl)}
                      className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700"
                    >
                      {copiado === q ? "✓ Copiado" : "Copiar resumen"}
                    </button>
                  </div>
                  {verDeclaracion === q && (
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <dt className="text-zinc-500">Ingresos (base)</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.ingresos_base))}</dd>
                      <dt className="text-zinc-500">IVA repercutido</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.iva_repercutido))}</dd>
                      <dt className="text-zinc-500">Gastos deducibles (base)</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.gastos_base_deducible))}</dd>
                      <dt className="text-zinc-500">IVA soportado</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.iva_soportado))}</dd>
                      <dt className="text-zinc-500">IVA resultado (303)</dt>
                      <dd className={`text-right font-semibold ${Number(decl.iva_resultado) < 0 ? "text-emerald-400" : "text-white"}`}>
                        {eur(Number(decl.iva_resultado))}
                        {Number(decl.iva_resultado) < 0 && " (a compensar)"}
                      </dd>
                      <dt className="text-zinc-500">Retenciones IRPF (111/115)</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.irpf_retenciones))}</dd>
                      <dt className="text-zinc-500">IRPF retenido por clientes</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.irpf_retenido_clientes))}</dd>
                      <dt className="text-zinc-500">Beneficio (para 130)</dt>
                      <dd className="text-right font-semibold text-white">{eur(Number(decl.beneficio))}</dd>
                    </dl>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-amber-950 px-4 py-3 text-xs text-amber-300">
        Estimación para reservar dinero, no una liquidación oficial. El modelo 130 real es acumulado
        anual y resta pagos y retenciones previas. El IVA negativo se compensa en los trimestres
        siguientes (ya descontado). Cada socio (David, Luis) declara lo suyo; los Alex van dentro de
        Ethos. Cuadra los definitivos con el gestor y apunta lo pagado en “Pagado real”.
      </div>
    </div>
  );
}
