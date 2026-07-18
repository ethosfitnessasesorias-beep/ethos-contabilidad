"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Reparto {
  socio: string;
  beneficio: number;
}

const NOMBRE: Record<string, string> = { luis: "Luis", david: "David" };
const mesActualISO = () => new Date().toISOString().slice(0, 7);

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
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const desde = `${mes}-01`;
    const d = new Date(desde);
    const hasta = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
    const iniMesPasado = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10);
    const trim = Math.floor(d.getMonth() / 3) + 1;
    const anyo = d.getFullYear();

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
    if (nomCat) {
      const { data: gn } = await supabase.from("gastos").select("imputado_a").eq("categoria_id", nomCat).gte("fecha", desde).lt("fecha", hasta);
      setNominaPuesta(new Set(((gn as { imputado_a: string }[]) ?? []).map((x) => x.imputado_a)));
    }
  }, [mes]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nominaDe = (socio: string) => Math.max(0, Number(reparto.find((r) => r.socio === socio)?.beneficio ?? 0) * 0.8);
  const beneficioTotal = reparto.reduce((s, r) => s + Math.max(0, Number(r.beneficio)), 0);
  const nominaTotal = reparto.reduce((s, r) => s + Math.max(0, Number(r.beneficio) * 0.8), 0);
  const huchaTotal = reparto.reduce((s, r) => s + Math.max(0, Number(r.beneficio) * 0.2), 0);

  async function registrarNomina(socio: string) {
    const imp = nominaDe(socio);
    if (!nominaCatId || imp <= 0) return;
    const nombreSocio = NOMBRE[socio] ?? socio;
    const mesLargo = new Date(`${mes}-01T00:00:00`).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const { error } = await supabase.from("gastos").insert({
      fecha: `${mes}-28`,
      concepto: `Nómina ${nombreSocio} ${mesLargo}`,
      categoria_id: nominaCatId,
      cuenta_id: cuentaBanco,
      imputado_a: socio,
      base: Math.round(imp * 100) / 100,
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

  // Estado de cada paso
  const nominasPendientes = reparto.filter((r) => nominaDe(r.socio) > 0 && !nominaPuesta.has(r.socio));
  const pasos = [
    { hecho: morososN === 0, titulo: morososN === 0 ? "Sin cobros pendientes" : `${morososN} clientes deben ${eur(morososTotal)}`, href: "/crm", accion: "Revisar" },
    { hecho: porFacturar === 0, titulo: porFacturar === 0 ? "Todas las facturas pedidas" : `${porFacturar} gastos sin factura por pedir`, href: "/gastos", accion: "Ver" },
    { hecho: fijosPend === 0, titulo: fijosPend === 0 ? "Gastos fijos del mes apuntados" : `${fijosPend} gastos fijos por apuntar`, href: "/contabilidad/tesoreria", accion: "Apuntar" },
    { hecho: nominasPendientes.length === 0, titulo: nominasPendientes.length === 0 ? "Nóminas registradas" : `Registrar nómina de ${nominasPendientes.map((r) => NOMBRE[r.socio]).join(" y ")}`, href: null, accion: "" },
    { hecho: false, info: true, titulo: ivaTrim > 0 ? `Reservar ${eur(ivaTrim)} de IVA del trimestre` : "IVA del trimestre: nada a pagar (a compensar)", href: "/contabilidad/impuestos", accion: "Impuestos" },
  ];
  const completados = pasos.filter((p) => p.hecho).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Cierre de mes</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Repasa todo lo del mes en una pantalla, en orden.</p>
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

      {/* Checklist */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-400">Checklist del cierre</h3>
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
              {/* Paso de nóminas: botones inline */}
              {i === 3 && nominasPendientes.length > 0 &&
                nominasPendientes.map((r) => (
                  <button
                    key={r.socio}
                    onClick={() => registrarNomina(r.socio)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {NOMBRE[r.socio]} ({eur(nominaDe(r.socio))})
                  </button>
                ))}
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
