"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Atribucion } from "@/lib/tipos";

interface Kpis {
  caja_total: number;
  iva_pendiente: number;
  irpf_pendiente: number;
  hucha_actual: number;
  caja_libre: number;
  gasto_fijo_mensual: number;
  runway_meses: number | null;
  cobertura_fijos: number | null;
  mrr: number;
  pct_efectivo: number | null;
}
interface Saldo {
  codigo: string;
  nombre: string;
  es_transito: boolean;
  saldo: number;
}
interface Moroso {
  id: number;
  cliente: string | null;
  concepto: string;
  fecha_emision: string;
  pendiente: number;
}
interface RepartoFila {
  atribucion: Atribucion;
  cobrado: number;
  gasto: number;
  balance: number;
  a_entrenador: number;
  a_hucha: number;
}

const eur = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const NOMBRES: Record<string, string> = {
  ethos: "Ethos",
  luis: "Luis",
  david: "David",
  alex_esteban: "Alex E.",
  alex_guerrero: "Alex G.",
};

function Tarjeta({ titulo, valor, detalle, alarma, children }: { titulo: string; valor: string; detalle?: string; alarma?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${alarma ? "border-red-700 bg-red-950" : "border-zinc-800 bg-zinc-900/40"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{titulo}</p>
      <p className={`text-base font-black ${alarma ? "text-red-300" : "text-white"}`}>{valor}</p>
      {detalle && <p className="text-[10px] leading-tight text-zinc-600">{detalle}</p>}
      {children}
    </div>
  );
}

export default function FinanzasPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [morosos, setMorosos] = useState<Moroso[]>([]);
  const [telefonos, setTelefonos] = useState<Map<number, string>>(new Map());
  const [salud, setSalud] = useState<{
    huchaSaldo: number;
    benMeses: { mes: string; total: number }[];
    facturado3m: number;
    pendienteTotal: number;
    altas2m: number;
    bajas2m: number;
  } | null>(null);
  const [reparto, setReparto] = useState<RepartoFila[]>([]);
  const [mesReparto, setMesReparto] = useState(new Date().toISOString().slice(0, 7));
  const [alarma, setAlarma] = useState(3);

  useEffect(() => {
    (async () => {
      const [k, s, m, cfg] = await Promise.all([
        supabase.from("v_kpis").select("*").single(),
        supabase.from("v_saldo_cuentas").select("*").order("id"),
        supabase.from("v_morosos").select("id, cliente, concepto, fecha_emision, pendiente").limit(50),
        supabase.from("config").select("valor").eq("clave", "alarma_runway_meses").single(),
      ]);
      if (k.data) setKpis(k.data as Kpis);
      setSaldos((s.data as Saldo[]) ?? []);
      const lista = (m.data as Moroso[]) ?? [];
      setMorosos(lista);
      if (cfg.data) setAlarma(Number(cfg.data.valor));
      // Teléfonos de los morosos para reclamar por WhatsApp
      if (lista.length) {
        const { data: tels } = await supabase
          .from("facturas")
          .select("id, clientes(nombre, telefono)")
          .in("id", lista.map((x) => x.id));
        const map = new Map<number, string>();
        for (const t of (tels as unknown as { id: number; clientes: { telefono: string | null } | null }[]) ?? []) {
          if (t.clientes?.telefono) map.set(t.id, t.clientes.telefono);
        }
        setTelefonos(map);
      }

      // Datos para reinversión y salud financiera
      const hoy = new Date();
      const hace3m = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1).toISOString().slice(0, 10);
      const hace2m = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1).toISOString().slice(0, 10);
      const [ben, inv, hd, ha, fac3, pend, cliMov] = await Promise.all([
        supabase.from("v_reparto_beneficios").select("mes, beneficio").order("mes"),
        supabase.from("v_inversion_mensual").select("mes, inversion"),
        supabase.from("config_texto").select("valor").eq("clave", "hucha_desde").maybeSingle(),
        supabase.from("config").select("valor").eq("clave", "hucha_ajuste").maybeSingle(),
        supabase.from("facturas").select("total").gte("fecha_emision", hace3m).eq("computa_reparto", true),
        supabase.from("v_facturas_saldo").select("pendiente"),
        supabase.from("clientes").select("fecha_inicio, fecha_baja"),
      ]);
      const huchaDesde = (hd.data as { valor: string } | null)?.valor ?? "2026-03-01";
      const huchaAjuste = Number((ha.data as { valor: number } | null)?.valor ?? 0);
      const benMesesMap = new Map<string, number>();
      let aporte20 = 0;
      for (const b of (ben.data as { mes: string; beneficio: number }[]) ?? []) {
        benMesesMap.set(b.mes, (benMesesMap.get(b.mes) ?? 0) + Number(b.beneficio));
        if (b.mes >= huchaDesde) aporte20 += Math.max(0, Number(b.beneficio)) * 0.2;
      }
      const invTotal = ((inv.data as { mes: string; inversion: number }[]) ?? [])
        .filter((x) => x.mes >= huchaDesde)
        .reduce((s, x) => s + Number(x.inversion), 0);
      setSalud({
        huchaSaldo: aporte20 - invTotal + huchaAjuste,
        benMeses: [...benMesesMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([mes, total]) => ({ mes, total })),
        facturado3m: ((fac3.data as { total: number }[]) ?? []).reduce((s, x) => s + Number(x.total), 0),
        pendienteTotal: ((pend.data as { pendiente: number }[]) ?? []).reduce((s, x) => s + Math.max(0, Number(x.pendiente)), 0),
        altas2m: ((cliMov.data as { fecha_inicio: string | null }[]) ?? []).filter((c) => c.fecha_inicio && c.fecha_inicio >= hace2m).length,
        bajas2m: ((cliMov.data as { fecha_baja: string | null }[]) ?? []).filter((c) => c.fecha_baja && c.fecha_baja >= hace2m).length,
      });
    })();
  }, []);

  useEffect(() => {
    supabase
      .from("v_reparto_mensual")
      .select("*")
      .eq("mes", `${mesReparto}-01`)
      .then(({ data }) => setReparto((data as RepartoFila[]) ?? []));
  }, [mesReparto]);

  if (!kpis) return <p className="py-8 text-center text-sm text-zinc-500">Cargando…</p>;

  const runwayAlarma = kpis.runway_meses !== null && Number(kpis.runway_meses) < alarma;

  const saldoDe = (codigo: string) => Number(saldos.find((s) => s.codigo === codigo)?.saldo ?? 0);
  const reservado = Number(kpis.iva_pendiente) + Number(kpis.irpf_pendiente) + Number(kpis.hucha_actual);
  const efectivoLibre = saldoDe("caja");
  const bancoLibre = saldoDe("banco") - reservado;

  // ---------- ¿Cuánto puedo reinvertir? ----------
  const colchonMeses = Math.max(3, alarma);
  const colchon = colchonMeses * Number(kpis.gasto_fijo_mensual);
  const margenCaja = Math.max(0, Number(kpis.caja_libre) - colchon);
  const hucha = salud?.huchaSaldo ?? 0;
  const puedoInvertir = Math.max(0, Math.min(Math.max(0, hucha), margenCaja));

  // ---------- Salud financiera: score + puntos de fuga ----------
  const fugas: { txt: string; grave: boolean }[] = [];
  let score = 100;
  const bm = salud?.benMeses ?? [];
  const ult3 = bm.slice(-3).map((x) => x.total);
  const prev3 = bm.slice(-6, -3).map((x) => x.total);
  const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const benMedio = media(ult3);
  const ingresoMensual = salud ? salud.facturado3m / 3 : 0;

  const r = kpis.runway_meses === null ? null : Number(kpis.runway_meses);
  if (r !== null && r < 2) { score -= 30; fugas.push({ txt: `Runway crítico: ${r} meses de caja si dejaras de ingresar.`, grave: true }); }
  else if (r !== null && r < alarma) { score -= 15; fugas.push({ txt: `Runway justo: ${r} meses (tu alarma está en ${alarma}).`, grave: false }); }

  if (benMedio <= 0 && ult3.length >= 2) { score -= 25; fugas.push({ txt: "Sin beneficio medio en los últimos 3 meses: se está quemando caja.", grave: true }); }
  else if (prev3.length >= 2 && media(prev3) > 0 && benMedio < media(prev3) * 0.8) {
    score -= 15;
    fugas.push({ txt: `El beneficio medio cae un ${Math.round((1 - benMedio / media(prev3)) * 100)}% frente al trimestre anterior.`, grave: false });
  }

  if (ingresoMensual > 0) {
    const cobFijos = Number(kpis.gasto_fijo_mensual) / ingresoMensual;
    if (cobFijos > 0.85) { score -= 20; fugas.push({ txt: `Los gastos fijos se comen el ${Math.round(cobFijos * 100)}% de lo que facturas: casi no queda margen.`, grave: true }); }
    else if (cobFijos > 0.6) { score -= 10; fugas.push({ txt: `Los gastos fijos suponen el ${Math.round(cobFijos * 100)}% de la facturación media (ideal <60%).`, grave: false }); }
  }

  if (salud && salud.facturado3m > 0) {
    const morosidad = salud.pendienteTotal / salud.facturado3m;
    if (morosidad > 0.3) { score -= 20; fugas.push({ txt: `Morosidad alta: ${eur(salud.pendienteTotal)} sin cobrar (${Math.round(morosidad * 100)}% de lo facturado en 3 meses).`, grave: true }); }
    else if (morosidad > 0.15) { score -= 10; fugas.push({ txt: `${eur(salud.pendienteTotal)} pendientes de cobro (${Math.round(morosidad * 100)}% del último trimestre): reclámalos.`, grave: false }); }
  }

  if (salud && salud.bajas2m > salud.altas2m) {
    score -= 10;
    fugas.push({ txt: `Se van más clientes de los que entran (${salud.bajas2m} bajas vs ${salud.altas2m} altas en 2 meses).`, grave: false });
  }
  if (hucha < -0.01) { score -= 10; fugas.push({ txt: "La hucha está en negativo: se invirtió más de lo ahorrado.", grave: false }); }

  score = Math.max(0, score);
  const nivel = score >= 80 ? "verde" : score >= 60 ? "ambar" : "rojo";

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tarjeta titulo="Caja libre" valor={eur(kpis.caja_libre)} detalle="usable ya restados impuestos y hucha">
          <p className="text-[10px] text-zinc-500">
            <b className="text-zinc-300">{eur(efectivoLibre)}</b> efectivo · <b className={bancoLibre < 0 ? "text-red-400" : "text-zinc-300"}>{eur(bancoLibre)}</b> banco
          </p>
        </Tarjeta>
        <Tarjeta
          titulo="Runway"
          valor={kpis.runway_meses === null ? "—" : `${kpis.runway_meses} meses`}
          detalle={`fijos ${eur(kpis.gasto_fijo_mensual)}/mes`}
          alarma={runwayAlarma}
        />
        <Tarjeta titulo="Reservado" valor={eur(reservado)} detalle="impuestos + hucha (no tocar)" />
        <Tarjeta titulo="% efectivo" valor={kpis.pct_efectivo === null ? "—" : `${kpis.pct_efectivo}%`} detalle="tiende a 0" />
      </div>

      {/* Salud financiera + reinversión */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Salud financiera */}
        <div className={`rounded-xl border p-4 ${nivel === "rojo" ? "border-red-800 bg-red-950/30" : nivel === "ambar" ? "border-amber-900 bg-amber-950/20" : "border-zinc-800 bg-zinc-900/40"}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-white">Salud financiera</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-black ${nivel === "verde" ? "bg-emerald-950 text-emerald-400" : nivel === "ambar" ? "bg-amber-950 text-amber-400" : "bg-red-950 text-red-300"}`}>
              {score}/100 · {nivel === "verde" ? "sólido" : nivel === "ambar" ? "vigilar" : "riesgo alto"}
            </span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-full rounded-full ${nivel === "verde" ? "bg-emerald-500" : nivel === "ambar" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
          </div>
          {fugas.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Sin puntos de fuga detectados: runway, beneficio, fijos, morosidad y clientes en orden.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {fugas.map((f, i) => (
                <li key={i} className={`flex items-start gap-1.5 text-[11px] leading-snug ${f.grave ? "text-red-300" : "text-amber-300/90"}`}>
                  <span className="mt-0.5 shrink-0">{f.grave ? "⛔" : "⚠"}</span> {f.txt}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] leading-snug text-zinc-600">
            Mide runway, tendencia del beneficio, peso de los fijos, morosidad, altas/bajas y hucha. Si baja de 60, corta gastos o acelera cobros.
          </p>
        </div>

        {/* ¿Cuánto puedo reinvertir? */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="mb-1 text-sm font-black text-white">¿Cuánto puedo reinvertir?</h3>
          <p className={`text-2xl font-black ${puedoInvertir > 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(puedoInvertir)}</p>
          <p className="mb-2 text-[10px] text-zinc-600">para máquinas, obra o mejoras, sin comprometer el negocio</p>
          <div className="flex flex-col gap-1 rounded-lg bg-zinc-950/60 px-3 py-2 text-[11px]">
            <span className="flex justify-between text-zinc-500">
              <span>Hucha disponible (20% ahorrado − invertido)</span>
              <b className={hucha < 0 ? "text-red-400" : "text-zinc-300"}>{eur(Math.max(0, hucha))}</b>
            </span>
            <span className="flex justify-between text-zinc-500">
              <span>Caja libre tras colchón de {colchonMeses} meses de fijos ({eur(colchon)})</span>
              <b className="text-zinc-300">{eur(margenCaja)}</b>
            </span>
            <span className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-400">
              <span>Puedes gastar (el menor de los dos)</span>
              <b className={puedoInvertir > 0 ? "text-emerald-400" : "text-red-400"}>{eur(puedoInvertir)}</b>
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-zinc-600">
            {puedoInvertir > 0
              ? `Si la compra supera ${eur(puedoInvertir)}, tocaríais el colchón de seguridad: mejor esperar un mes o financiarla.`
              : hucha <= 0
                ? "La hucha aún no tiene saldo: cada mes con beneficio le aporta el 20%."
                : "La caja libre no cubre el colchón de seguridad todavía: prioriza cobrar pendientes antes de invertir."}
          </p>
        </div>
      </div>

      {/* Saldos */}
      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-400">Saldo por cuenta</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          {saldos.map((s) => (
            <div key={s.codigo} className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 last:border-0">
              <span className="text-[13px] text-zinc-300">
                {s.nombre.split(" (")[0]}
                {s.es_transito && <span className="ml-2 text-[11px] text-zinc-600">(en tránsito)</span>}
              </span>
              <span className={`text-[13px] font-bold ${Number(s.saldo) < 0 ? "text-red-400" : "text-white"}`}>
                {eur(s.saldo)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Reparto */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-400">Reparto por socio</h2>
          <input
            type="month"
            value={mesReparto}
            onChange={(e) => setMesReparto(e.target.value || new Date().toISOString().slice(0, 7))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
          />
        </div>
        {reparto.filter((r) => r.atribucion !== "ethos").length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
            Sin cobros en este mes.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr] bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
              <span>Socio</span><span className="text-right">Cobrado − gastos</span><span className="text-right">Nómina</span><span className="text-right">A hucha</span>
            </div>
            {reparto
              .filter((r) => r.atribucion !== "ethos")
              .map((r) => {
                const colaborador = r.atribucion === "alex_esteban" || r.atribucion === "alex_guerrero";
                return (
                  <div key={r.atribucion} className="grid grid-cols-[1fr_1.4fr_1fr_1fr] items-center border-t border-zinc-800 px-3 py-2 text-[13px]">
                    <span className="font-bold text-white">{NOMBRES[r.atribucion]}</span>
                    <span className="text-right text-zinc-400">
                      {colaborador ? eur(r.cobrado) : `${eur(r.cobrado)} − ${eur(r.gasto)}`}
                    </span>
                    <span className="text-right font-bold text-emerald-400">{eur(r.a_entrenador)}</span>
                    <span className="text-right text-zinc-400">{eur(r.a_hucha)}</span>
                  </div>
                );
              })}
          </div>
        )}
        <p className="mt-1.5 px-1 text-[11px] text-zinc-600">
          Nómina = 80% del balance; el 20% va a la hucha. Los Alex aportan a ETHOS; no tienen reparto propio.
        </p>
      </section>

      {/* Morosos */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-400">
          Pendiente de cobro ({morosos.length})
        </h2>
        {morosos.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
            Nadie debe nada. 🎉
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            {morosos.map((m) => {
              const tel = telefonos.get(m.id);
              const telLimpio = tel ? tel.replace(/\D/g, "") : null;
              const waTel = telLimpio ? (telLimpio.length === 9 ? `34${telLimpio}` : telLimpio) : null;
              const msg = `¡Hola ${(m.cliente ?? "").split(" ")[0]}! Somos Ethos Fitness 💪 Nos consta pendiente el pago de "${m.concepto}" (${eur(Number(m.pendiente))}). ¿Puedes revisarlo cuando tengas un momento? ¡Gracias!`;
              return (
                <div key={m.id} className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2 last:border-0 hover:bg-zinc-900">
                  <Link href={`/facturas/${m.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">{m.cliente ?? m.concepto}</p>
                      <p className="truncate text-[11px] text-zinc-500">
                        Factura · {m.concepto} · {new Date(m.fecha_emision).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-amber-400">{eur(Number(m.pendiente))}</span>
                  </Link>
                  {waTel ? (
                    <a
                      href={`https://wa.me/${waTel}?text=${encodeURIComponent(msg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Reclamar por WhatsApp"
                      className="shrink-0 rounded-lg bg-emerald-950 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-900"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="shrink-0 text-[10px] text-zinc-700" title="Sin teléfono en el CRM">sin tel.</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
