"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  es_transito: boolean;
  saldo_inicial: number;
}
interface Saldo {
  codigo: string;
  saldo: number;
}
interface Categoria {
  id: number;
  tipo: string;
  grupo: string;
  nombre: string;
}
type TipoMov = "ingreso" | "gasto" | "traspaso";
interface Movimiento {
  key: string;
  tipo: TipoMov;
  fecha: string;
  concepto: string;
  detalle: string;
  cuentaId: number | null;
  categoriaId: number | null;
  importe: number; // efecto en caja, con signo
  canal?: string | null;
  saldoTras?: number; // saldo de la cuenta tras el movimiento (si hay cuenta filtrada)
}

const mesActualISO = () => new Date().toISOString().slice(0, 7);

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function LibroPage() {
  const router = useRouter();
  const [mes, setMes] = useState(mesActualISO());
  const [cuentaSel, setCuentaSel] = useState<string>("todas");
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [porPedir, setPorPedir] = useState(0);
  const [inversionMes, setInversionMes] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [fTexto, setFTexto] = useState("");
  const [fTipo, setFTipo] = useState<"todos" | TipoMov>("todos");
  const [fCanal, setFCanal] = useState<"todos" | "online" | "presencial">("todos");
  const [fCategoria, setFCategoria] = useState<number | "todas">("todas");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");

  const cargarCuentas = useCallback(async () => {
    const [cu, sa, cat] = await Promise.all([
      supabase.from("cuentas").select("id, codigo, nombre, es_transito, saldo_inicial").eq("activa", true).order("id"),
      supabase.from("v_saldo_cuentas").select("codigo, saldo"),
      supabase.from("categorias").select("id, tipo, grupo, nombre").order("tipo").order("grupo").order("nombre"),
    ]);
    setCuentas((cu.data as Cuenta[]) ?? []);
    setSaldos((sa.data as Saldo[]) ?? []);
    setCategorias((cat.data as Categoria[]) ?? []);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    const desde = `${mes}-01`;
    const d = new Date(desde);
    const hasta = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
    const cuentaObj = cuentas.find((c) => c.codigo === cuentaSel);
    const filtroCuenta = cuentaObj?.id;

    // Movimientos del mes: cobros, gastos y traspasos
    const [cobros, gastos, traspasos, pedir] = await Promise.all([
      supabase
        .from("cobros")
        .select("id, fecha, importe, cuenta_id, facturas(concepto, canal, categoria_id, clientes(nombre))")
        .gte("fecha", desde)
        .lt("fecha", hasta),
      supabase
        .from("gastos")
        .select("id, fecha, concepto, proveedor, total, irpf_soportado, cuenta_id, canal, categoria_id")
        .gte("fecha", desde)
        .lt("fecha", hasta),
      supabase
        .from("traspasos")
        .select("id, fecha, importe, motivo, cuenta_origen_id, cuenta_destino_id")
        .gte("fecha", desde)
        .lt("fecha", hasta),
      supabase.from("gastos").select("id", { count: "exact", head: true }).eq("tiene_factura", false).gt("base", 0),
    ]);

    // Inversión del mes (para separarla del gasto corriente en el balance)
    const inv = await supabase.from("v_inversion_mensual").select("inversion").eq("mes", desde).maybeSingle();
    setInversionMes(Number((inv.data as { inversion: number } | null)?.inversion ?? 0));

    const lista: Movimiento[] = [];
    for (const c of (cobros.data as unknown as Array<{
      id: number; fecha: string; importe: number; cuenta_id: number;
      facturas: { concepto: string; canal: string | null; categoria_id: number | null; clientes: { nombre: string } | null } | null;
    }>) ?? []) {
      lista.push({
        key: `c${c.id}`, tipo: "ingreso", fecha: c.fecha, concepto: c.facturas?.concepto ?? "Cobro",
        detalle: c.facturas?.clientes?.nombre ?? "", cuentaId: c.cuenta_id,
        categoriaId: c.facturas?.categoria_id ?? null,
        importe: Number(c.importe), canal: c.facturas?.canal,
      });
    }
    for (const g of (gastos.data as Array<{
      id: number; fecha: string; concepto: string; proveedor: string | null;
      total: number; irpf_soportado: number; cuenta_id: number; canal: string | null; categoria_id: number | null;
    }>) ?? []) {
      lista.push({
        key: `g${g.id}`, tipo: "gasto", fecha: g.fecha, concepto: g.concepto, detalle: g.proveedor ?? "",
        cuentaId: g.cuenta_id, categoriaId: g.categoria_id,
        importe: -(Number(g.total) - Number(g.irpf_soportado)), canal: g.canal,
      });
    }
    for (const t of (traspasos.data as Array<{
      id: number; fecha: string; importe: number; motivo: string | null;
      cuenta_origen_id: number; cuenta_destino_id: number;
    }>) ?? []) {
      // Un traspaso se ve en las dos cuentas implicadas
      lista.push({ key: `t${t.id}o`, tipo: "traspaso", fecha: t.fecha, concepto: t.motivo ?? "Traspaso", detalle: "salida", cuentaId: t.cuenta_origen_id, categoriaId: null, importe: -Number(t.importe) });
      lista.push({ key: `t${t.id}d`, tipo: "traspaso", fecha: t.fecha, concepto: t.motivo ?? "Traspaso", detalle: "entrada", cuentaId: t.cuenta_destino_id, categoriaId: null, importe: Number(t.importe) });
    }

    let visibles = lista;
    if (filtroCuenta) visibles = lista.filter((m) => m.cuentaId === filtroCuenta);

    // Saldo acumulado (solo con una cuenta filtrada): partir del saldo de
    // apertura del mes y acumular cronológicamente.
    if (filtroCuenta && cuentaObj) {
      const [preC, preG, preTin, preTout] = await Promise.all([
        supabase.from("cobros").select("importe").eq("cuenta_id", filtroCuenta).lt("fecha", desde),
        supabase.from("gastos").select("total, irpf_soportado").eq("cuenta_id", filtroCuenta).lt("fecha", desde),
        supabase.from("traspasos").select("importe").eq("cuenta_destino_id", filtroCuenta).lt("fecha", desde),
        supabase.from("traspasos").select("importe").eq("cuenta_origen_id", filtroCuenta).lt("fecha", desde),
      ]);
      const suma = (arr: Record<string, number>[] | null, f: (x: Record<string, number>) => number): number =>
        (arr ?? []).reduce((s: number, x) => s + f(x), 0);
      let saldo =
        Number(cuentaObj.saldo_inicial) +
        suma(preC.data as Record<string, number>[], (x) => Number(x.importe)) -
        suma(preG.data as Record<string, number>[], (x) => Number(x.total) - Number(x.irpf_soportado)) +
        suma(preTin.data as Record<string, number>[], (x) => Number(x.importe)) -
        suma(preTout.data as Record<string, number>[], (x) => Number(x.importe));
      const cronologico = [...visibles].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
      for (const m of cronologico) {
        saldo += m.importe;
        m.saldoTras = Math.round(saldo * 100) / 100;
      }
    }

    visibles.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
    setMovs(visibles);
    setPorPedir(pedir.count ?? 0);
    setCargando(false);
  }, [mes, cuentaSel, cuentas]);

  useEffect(() => {
    cargarCuentas();
  }, [cargarCuentas]);

  useEffect(() => {
    if (cuentas.length) cargar();
  }, [cargar, cuentas.length]);

  // Filtros de la lista (además del mes y la cuenta, que filtran la consulta)
  const filtrados = useMemo(() => {
    const q = fTexto.trim().toLowerCase();
    const min = fMin.trim() === "" ? null : Number(fMin.replace(",", "."));
    const max = fMax.trim() === "" ? null : Number(fMax.replace(",", "."));
    return movs.filter((m) => {
      if (fTipo !== "todos" && m.tipo !== fTipo) return false;
      if (fCanal !== "todos" && m.canal !== fCanal) return false;
      if (fCategoria !== "todas" && m.categoriaId !== fCategoria) return false;
      const abs = Math.abs(m.importe);
      if (min !== null && Number.isFinite(min) && abs < min) return false;
      if (max !== null && Number.isFinite(max) && abs > max) return false;
      if (q && !`${m.concepto} ${m.detalle}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [movs, fTexto, fTipo, fCanal, fCategoria, fMin, fMax]);

  // Totales por naturaleza: los traspasos entre cuentas propias NO son ni
  // ingreso ni gasto (antes inflaban ambos lados); un cobro negativo
  // (devolución) minora "Entra" y un gasto negativo minora "Sale".
  const totales = useMemo(() => {
    let ing = 0, gas = 0;
    for (const m of filtrados) {
      if (m.tipo === "ingreso") ing += m.importe;
      else if (m.tipo === "gasto") gas += -m.importe;
    }
    return { ing, gas, neto: ing - gas };
  }, [filtrados]);

  const hayFiltros =
    fTexto.trim() !== "" || fTipo !== "todos" || fCanal !== "todos" || fCategoria !== "todas" || fMin !== "" || fMax !== "";

  const saldoDe = (codigo: string) => Number(saldos.find((s) => s.codigo === codigo)?.saldo ?? 0);

  function irAApuntar(tab: "ingreso" | "gasto") {
    try {
      sessionStorage.setItem("prefill_pestana", tab);
    } catch {}
    router.push("/");
  }

  const chip = (activo: boolean, etiqueta: string, onClick: () => void) => (
    <button
      key={etiqueta}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        activo ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <div>
      {/* Tarjetas de saldo por cuenta (como app de banco) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cuentas.map((c) => (
          <button
            key={c.codigo}
            onClick={() => setCuentaSel(cuentaSel === c.codigo ? "todas" : c.codigo)}
            className={`rounded-2xl border p-3 text-left ${
              cuentaSel === c.codigo ? "border-red-600 bg-zinc-900" : "border-zinc-800 bg-zinc-900/40"
            }`}
          >
            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              {c.nombre.split(" (")[0]}
            </p>
            <p className={`mt-1 text-lg font-black ${saldoDe(c.codigo) < 0 ? "text-red-400" : "text-white"}`}>
              {eur(saldoDe(c.codigo))}
            </p>
          </button>
        ))}
      </div>

      {porPedir > 0 && (
        <Link href="/gastos" className="mb-4 flex items-center justify-between rounded-xl bg-amber-950 px-4 py-3 text-sm">
          <span className="font-semibold text-amber-300">
            {porPedir} {porPedir === 1 ? "gasto" : "gastos"} sin factura por pedir
          </span>
          <span className="text-amber-500">revisar →</span>
        </Link>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-emerald-400">Entra {eur(totales.ing)}</span>
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-red-400">
            Sale {eur(totales.gas)}
            {inversionMes > 0 && cuentaSel === "todas" && (
              <span className="ml-1 text-[11px] text-zinc-500">
                (corriente {eur(Math.max(0, totales.gas - inversionMes))} · inversión {eur(inversionMes)})
              </span>
            )}
          </span>
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 font-bold text-white">Neto {eur(totales.neto)}</span>
          {cuentaSel !== "todas" && (
            <span className="self-center text-xs text-zinc-500">— filtrando {cuentaSel}, toca la tarjeta para quitar</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => irAApuntar("ingreso")}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
          >
            + Ingreso
          </button>
          <button
            onClick={() => irAApuntar("gasto")}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500"
          >
            + Gasto
          </button>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value || mesActualISO())}
            className={inputCls}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          placeholder="Buscar concepto, cliente, proveedor…"
          value={fTexto}
          onChange={(e) => setFTexto(e.target.value)}
          className={`${inputCls} min-w-48 flex-1`}
        />
        {chip(fTipo === "todos", "Todo", () => setFTipo("todos"))}
        {chip(fTipo === "ingreso", "Ingresos", () => setFTipo("ingreso"))}
        {chip(fTipo === "gasto", "Gastos", () => setFTipo("gasto"))}
        {chip(fTipo === "traspaso", "Traspasos", () => setFTipo("traspaso"))}
        {chip(fCanal === "online", "Online", () => setFCanal(fCanal === "online" ? "todos" : "online"))}
        {chip(fCanal === "presencial", "Presencial", () => setFCanal(fCanal === "presencial" ? "todos" : "presencial"))}
        <select
          value={fCategoria === "todas" ? "" : fCategoria}
          onChange={(e) => setFCategoria(e.target.value === "" ? "todas" : Number(e.target.value))}
          className={`${inputCls} max-w-48`}
        >
          <option value="">Categoría (todas)</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tipo === "gasto" ? "Gasto" : "Ingreso"} · {c.grupo} · {c.nombre}
            </option>
          ))}
        </select>
        <input placeholder="Mín €" inputMode="decimal" value={fMin} onChange={(e) => setFMin(e.target.value)} className={`${inputCls} w-20`} />
        <input placeholder="Máx €" inputMode="decimal" value={fMax} onChange={(e) => setFMax(e.target.value)} className={`${inputCls} w-20`} />
        {hayFiltros && (
          <button
            onClick={() => {
              setFTexto("");
              setFTipo("todos");
              setFCanal("todos");
              setFCategoria("todas");
              setFMin("");
              setFMax("");
            }}
            className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-400"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {cargando ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            {hayFiltros ? "Sin movimientos con esos filtros." : "Sin movimientos este mes."}
          </p>
        ) : (
          filtrados.map((m) => (
            <div key={m.key} className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm ${
                    m.tipo === "traspaso"
                      ? "bg-zinc-800 text-zinc-400"
                      : m.importe >= 0
                        ? "bg-emerald-950 text-emerald-400"
                        : "bg-red-950 text-red-400"
                  }`}
                >
                  {m.tipo === "traspaso" ? "⇄" : m.importe >= 0 ? "↑" : "↓"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{m.concepto}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {new Date(m.fecha).toLocaleDateString("es-ES")}
                    {m.detalle ? ` · ${m.detalle}` : ""}
                    {m.canal ? ` · ${m.canal}` : ""}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`text-sm font-bold ${
                    m.tipo === "traspaso" ? "text-zinc-400" : m.importe >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {m.importe >= 0 ? "+" : ""}
                  {eur(m.importe)}
                </p>
                {m.saldoTras !== undefined && (
                  <p className="text-[11px] text-zinc-600">saldo {eur(m.saldoTras)}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
