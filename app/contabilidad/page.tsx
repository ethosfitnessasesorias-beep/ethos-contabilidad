"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";
import Modal from "@/components/Modal";
import { ATRIBUCIONES } from "@/lib/tipos";

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

// Estado del modal de edición de un movimiento (según su tipo)
interface EdIngreso {
  tipo: "ingreso"; id: number; facturaId: number | null;
  fecha: string; importe: string; cuenta_id: number;
  concepto: string; canal: string; categoria_id: number | "";
}
interface EdGasto {
  tipo: "gasto"; id: number;
  fecha: string; concepto: string; proveedor: string;
  categoria_id: number | ""; cuenta_id: number; canal: string; imputado_a: string;
  base: string; iva_pct: string; deducible: boolean; tiene_factura: boolean;
}
interface EdTraspaso {
  tipo: "traspaso"; id: number;
  fecha: string; importe: string; motivo: string;
  cuenta_origen_id: number; cuenta_destino_id: number;
}
type EdMov = EdIngreso | EdGasto | EdTraspaso;

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
  const [nominaIds, setNominaIds] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [fTexto, setFTexto] = useState("");
  const [fTipo, setFTipo] = useState<"todos" | TipoMov>("todos");
  const [fCanal, setFCanal] = useState<"todos" | "online" | "presencial">("todos");
  const [fCats, setFCats] = useState<Set<number>>(new Set());
  const [catAbierto, setCatAbierto] = useState(false);
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");

  // Edición de movimientos
  const [ed, setEd] = useState<EdMov | null>(null);
  const [edError, setEdError] = useState<string | null>(null);

  const cargarCuentas = useCallback(async () => {
    const [cu, sa, cat] = await Promise.all([
      supabase.from("cuentas").select("id, codigo, nombre, es_transito, saldo_inicial").eq("activa", true).order("id"),
      supabase.from("v_saldo_cuentas").select("codigo, saldo"),
      supabase.from("categorias").select("id, tipo, grupo, nombre").order("tipo").order("grupo").order("nombre"),
    ]);
    setCuentas((cu.data as Cuenta[]) ?? []);
    setSaldos((sa.data as Saldo[]) ?? []);
    const cats = (cat.data as Categoria[]) ?? [];
    setCategorias(cats);
    // Las nóminas son reparto de beneficio, no un gasto: se separan del total
    setNominaIds(new Set(cats.filter((c) => /mina/i.test(c.nombre)).map((c) => c.id)));
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

  // ---------- Edición de movimientos ----------
  async function abrirEdicion(m: Movimiento) {
    setEdError(null);
    const id = parseInt(m.key.slice(1), 10);
    if (m.tipo === "ingreso") {
      const { data, error } = await supabase
        .from("cobros")
        .select("id, fecha, importe, cuenta_id, factura_id, facturas(id, concepto, canal, categoria_id)")
        .eq("id", id)
        .single();
      if (error || !data) return setEdError(error?.message ?? "No encontrado");
      const c = data as unknown as { id: number; fecha: string; importe: number; cuenta_id: number; factura_id: number | null; facturas: { id: number; concepto: string; canal: string | null; categoria_id: number | null } | null };
      setEd({
        tipo: "ingreso", id: c.id, facturaId: c.facturas?.id ?? c.factura_id,
        fecha: c.fecha, importe: String(c.importe), cuenta_id: c.cuenta_id,
        concepto: c.facturas?.concepto ?? "", canal: c.facturas?.canal ?? "",
        categoria_id: c.facturas?.categoria_id ?? "",
      });
    } else if (m.tipo === "gasto") {
      const { data, error } = await supabase
        .from("gastos")
        .select("id, fecha, concepto, proveedor, categoria_id, cuenta_id, canal, imputado_a, base, iva_pct, deducible, tiene_factura")
        .eq("id", id)
        .single();
      if (error || !data) return setEdError(error?.message ?? "No encontrado");
      const g = data as { id: number; fecha: string; concepto: string; proveedor: string | null; categoria_id: number; cuenta_id: number; canal: string | null; imputado_a: string; base: number; iva_pct: number; deducible: boolean; tiene_factura: boolean };
      setEd({
        tipo: "gasto", id: g.id, fecha: g.fecha, concepto: g.concepto, proveedor: g.proveedor ?? "",
        categoria_id: g.categoria_id, cuenta_id: g.cuenta_id, canal: g.canal ?? "", imputado_a: g.imputado_a,
        base: String(g.base), iva_pct: String(g.iva_pct), deducible: g.deducible, tiene_factura: g.tiene_factura,
      });
    } else {
      const { data, error } = await supabase
        .from("traspasos")
        .select("id, fecha, importe, motivo, cuenta_origen_id, cuenta_destino_id")
        .eq("id", id)
        .single();
      if (error || !data) return setEdError(error?.message ?? "No encontrado");
      const t = data as { id: number; fecha: string; importe: number; motivo: string | null; cuenta_origen_id: number; cuenta_destino_id: number };
      setEd({
        tipo: "traspaso", id: t.id, fecha: t.fecha, importe: String(t.importe),
        motivo: t.motivo ?? "", cuenta_origen_id: t.cuenta_origen_id, cuenta_destino_id: t.cuenta_destino_id,
      });
    }
  }

  const num = (s: string) => Number(s.replace(",", "."));

  async function guardarEdicion() {
    if (!ed) return;
    setEdError(null);
    if (ed.tipo === "ingreso") {
      const imp = num(ed.importe);
      if (!Number.isFinite(imp) || imp === 0) return setEdError("Importe no válido (0 no se permite; usa negativo para devolución).");
      const u1 = await supabase.from("cobros").update({ fecha: ed.fecha, importe: imp, cuenta_id: ed.cuenta_id }).eq("id", ed.id);
      if (u1.error) return setEdError(u1.error.message);
      if (ed.facturaId) {
        const u2 = await supabase
          .from("facturas")
          .update({ concepto: ed.concepto, canal: ed.canal || null, ...(ed.categoria_id ? { categoria_id: ed.categoria_id } : {}) })
          .eq("id", ed.facturaId);
        if (u2.error) return setEdError(u2.error.message);
      }
    } else if (ed.tipo === "gasto") {
      const base = num(ed.base);
      const iva = Number(ed.iva_pct);
      if (!Number.isFinite(base) || base < 0) return setEdError("Base no válida.");
      const deducible = ed.deducible && ed.tiene_factura; // sin factura no puede ser deducible
      const u = await supabase
        .from("gastos")
        .update({
          fecha: ed.fecha, concepto: ed.concepto, proveedor: ed.proveedor || null,
          ...(ed.categoria_id ? { categoria_id: ed.categoria_id } : {}),
          cuenta_id: ed.cuenta_id, canal: ed.canal || null, imputado_a: ed.imputado_a,
          base, iva_pct: iva,
          iva_soportado: deducible ? Math.round(base * iva * 100) / 100 : 0,
          deducible, tiene_factura: ed.tiene_factura,
        })
        .eq("id", ed.id);
      if (u.error) return setEdError(u.error.message);
    } else {
      const imp = num(ed.importe);
      if (!Number.isFinite(imp) || imp <= 0) return setEdError("Importe no válido.");
      if (ed.cuenta_origen_id === ed.cuenta_destino_id) return setEdError("Las cuentas deben ser distintas.");
      const u = await supabase
        .from("traspasos")
        .update({ fecha: ed.fecha, importe: imp, motivo: ed.motivo || null, cuenta_origen_id: ed.cuenta_origen_id, cuenta_destino_id: ed.cuenta_destino_id })
        .eq("id", ed.id);
      if (u.error) return setEdError(u.error.message);
    }
    setEd(null);
    cargarCuentas();
    cargar();
  }

  async function borrarMovimiento() {
    if (!ed) return;
    const nombres = { ingreso: "el cobro", gasto: "el gasto", traspaso: "el traspaso" } as const;
    if (!confirm(`¿Borrar ${nombres[ed.tipo]} de forma permanente? Los saldos se recalculan.`)) return;
    const tabla = ed.tipo === "ingreso" ? "cobros" : ed.tipo === "gasto" ? "gastos" : "traspasos";
    const { error } = await supabase.from(tabla).delete().eq("id", ed.id);
    if (error) {
      setEdError(/foreign key|violates|referenced/i.test(error.message)
        ? "No se puede borrar: tiene registros asociados (p. ej. un apunte de la hucha)."
        : error.message);
      return;
    }
    setEd(null);
    cargarCuentas();
    cargar();
  }

  // Filtros de la lista (además del mes y la cuenta, que filtran la consulta)
  const filtrados = useMemo(() => {
    const q = fTexto.trim().toLowerCase();
    const min = fMin.trim() === "" ? null : Number(fMin.replace(",", "."));
    const max = fMax.trim() === "" ? null : Number(fMax.replace(",", "."));
    return movs.filter((m) => {
      if (fTipo !== "todos" && m.tipo !== fTipo) return false;
      if (fCanal !== "todos" && m.canal !== fCanal) return false;
      if (fCats.size > 0 && (m.categoriaId === null || !fCats.has(m.categoriaId))) return false;
      const abs = Math.abs(m.importe);
      if (min !== null && Number.isFinite(min) && abs < min) return false;
      if (max !== null && Number.isFinite(max) && abs > max) return false;
      if (q && !`${m.concepto} ${m.detalle}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [movs, fTexto, fTipo, fCanal, fCats, fMin, fMax]);

  // Totales por naturaleza: los traspasos entre cuentas propias NO son ni
  // ingreso ni gasto (antes inflaban ambos lados); un cobro negativo
  // (devolución) minora "Entra" y un gasto negativo minora "Sale".
  const totales = useMemo(() => {
    let ing = 0, gas = 0, reparto = 0;
    for (const m of filtrados) {
      if (m.tipo === "ingreso") ing += m.importe;
      else if (m.tipo === "gasto") {
        // Las nóminas cuentan como reparto, no como gasto del negocio
        if (m.categoriaId && nominaIds.has(m.categoriaId)) reparto += -m.importe;
        else gas += -m.importe;
      }
    }
    return { ing, gas, reparto, neto: ing - gas };
  }, [filtrados, nominaIds]);

  const hayFiltros =
    fTexto.trim() !== "" || fTipo !== "todos" || fCanal !== "todos" || fCats.size > 0 || fMin !== "" || fMax !== "";

  const saldoDe = (codigo: string) => Number(saldos.find((s) => s.codigo === codigo)?.saldo ?? 0);

  function irAApuntar(tab: "ingreso" | "gasto") {
    try {
      sessionStorage.setItem("prefill_pestana", tab);
    } catch {}
    router.push("/");
  }


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
          {totales.reparto > 0 && (
            <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-violet-400">Reparto (nóminas) {eur(totales.reparto)}</span>
          )}
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
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value as typeof fTipo)} className={`${inputCls} appearance-none`}>
          <option value="todos">Tipo: todo</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
          <option value="traspaso">Traspasos</option>
        </select>
        <select value={fCanal} onChange={(e) => setFCanal(e.target.value as typeof fCanal)} className={`${inputCls} appearance-none`}>
          <option value="todos">Canal: todos</option>
          <option value="online">Online</option>
          <option value="presencial">GYM</option>
        </select>
        <div className="relative">
          <button
            onClick={() => setCatAbierto(!catAbierto)}
            className={`${inputCls} ${fCats.size > 0 ? "border-red-700 text-white" : "text-zinc-400"}`}
          >
            {fCats.size === 0 ? "Categorías: todas" : `Categorías (${fCats.size})`} ▾
          </button>
          {catAbierto && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setCatAbierto(false)} />
              <div className="absolute left-0 top-full z-30 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
                {fCats.size > 0 && (
                  <button
                    onClick={() => setFCats(new Set())}
                    className="mb-1 w-full rounded-lg bg-zinc-800 py-1.5 text-xs font-bold text-zinc-300"
                  >
                    ✕ Quitar selección
                  </button>
                )}
                {(["ingreso", "gasto"] as const).map((tipo) => (
                  <div key={tipo}>
                    <p className="px-2 pb-1 pt-2 text-[10px] font-black uppercase tracking-wider text-zinc-600">
                      {tipo === "ingreso" ? "Ingresos" : "Gastos"}
                    </p>
                    {categorias.filter((c) => c.tipo === tipo).map((c) => (
                      <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
                        <input
                          type="checkbox"
                          checked={fCats.has(c.id)}
                          onChange={() => {
                            const s = new Set(fCats);
                            if (s.has(c.id)) s.delete(c.id); else s.add(c.id);
                            setFCats(s);
                          }}
                          className="h-4 w-4 accent-red-600"
                        />
                        <span className="truncate">{c.grupo} · {c.nombre}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <input placeholder="Mín €" inputMode="decimal" value={fMin} onChange={(e) => setFMin(e.target.value)} className={`${inputCls} w-20`} />
        <input placeholder="Máx €" inputMode="decimal" value={fMax} onChange={(e) => setFMax(e.target.value)} className={`${inputCls} w-20`} />
        {hayFiltros && (
          <button
            onClick={() => {
              setFTexto("");
              setFTipo("todos");
              setFCanal("todos");
              setFCats(new Set());
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
            <div
              key={m.key}
              onClick={() => abrirEdicion(m)}
              title="Editar movimiento"
              className="flex cursor-pointer items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 last:border-0 hover:bg-zinc-900"
            >
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

      {/* Modal de edición de movimiento */}
      <Modal
        abierto={!!ed}
        onCerrar={() => setEd(null)}
        titulo={ed ? (ed.tipo === "ingreso" ? "Editar ingreso" : ed.tipo === "gasto" ? "Editar gasto" : "Editar traspaso") : ""}
        ancho="max-w-xl"
      >
        {ed && (
          <div className="flex flex-col gap-3">
            {edError && <p className="rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{edError}</p>}

            {ed.tipo === "ingreso" && (
              <>
                <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Concepto</span>
                  <input value={ed.concepto} onChange={(e) => setEd({ ...ed, concepto: e.target.value })} className={inputCls} />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Fecha</span>
                    <input type="date" value={ed.fecha} onChange={(e) => setEd({ ...ed, fecha: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Importe €</span>
                    <input inputMode="decimal" value={ed.importe} onChange={(e) => setEd({ ...ed, importe: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Cuenta</span>
                    <select value={ed.cuenta_id} onChange={(e) => setEd({ ...ed, cuenta_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                      {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre.split(" (")[0]}</option>)}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Categoría</span>
                    <select value={ed.categoria_id} onChange={(e) => setEd({ ...ed, categoria_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                      {categorias.filter((c) => c.tipo === "ingreso").map((c) => <option key={c.id} value={c.id}>{c.grupo} · {c.nombre}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Canal</span>
                    <select value={ed.canal} onChange={(e) => setEd({ ...ed, canal: e.target.value })} className={`${inputCls} appearance-none`}>
                      <option value="">—</option><option value="online">Online</option><option value="presencial">GYM</option>
                    </select>
                  </label>
                </div>
                <p className="text-[11px] text-zinc-600">El concepto, la categoría y el canal se cambian en la factura del cobro (afecta a todos sus cobros).</p>
              </>
            )}

            {ed.tipo === "gasto" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Concepto</span>
                    <input value={ed.concepto} onChange={(e) => setEd({ ...ed, concepto: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Proveedor</span>
                    <input value={ed.proveedor} onChange={(e) => setEd({ ...ed, proveedor: e.target.value })} className={inputCls} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Fecha</span>
                    <input type="date" value={ed.fecha} onChange={(e) => setEd({ ...ed, fecha: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Base €</span>
                    <input inputMode="decimal" value={ed.base} onChange={(e) => setEd({ ...ed, base: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">IVA</span>
                    <select value={ed.iva_pct} onChange={(e) => setEd({ ...ed, iva_pct: e.target.value })} className={`${inputCls} appearance-none`}>
                      <option value="0">0%</option><option value="0.1">10%</option><option value="0.21">21%</option>
                    </select>
                  </label>
                </div>
                <p className="-mt-1 text-[11px] text-zinc-600">
                  Total con IVA: <b className="text-zinc-300">{eur((Number(ed.base.replace(",", ".")) || 0) * (1 + Number(ed.iva_pct)))}</b>
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Categoría</span>
                    <select value={ed.categoria_id} onChange={(e) => setEd({ ...ed, categoria_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                      {categorias.filter((c) => c.tipo === "gasto").map((c) => <option key={c.id} value={c.id}>{c.grupo} · {c.nombre}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Cuenta</span>
                    <select value={ed.cuenta_id} onChange={(e) => setEd({ ...ed, cuenta_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                      {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre.split(" (")[0]}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Canal</span>
                    <select value={ed.canal} onChange={(e) => setEd({ ...ed, canal: e.target.value })} className={`${inputCls} appearance-none`}>
                      <option value="">—</option><option value="online">Online</option><option value="presencial">GYM</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Imputado a</span>
                    <select value={ed.imputado_a} onChange={(e) => setEd({ ...ed, imputado_a: e.target.value })} className={`${inputCls} appearance-none`}>
                      {ATRIBUCIONES.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={ed.tiene_factura} onChange={(e) => setEd({ ...ed, tiene_factura: e.target.checked })} className="h-4 w-4 accent-red-600" />
                    Tiene factura
                  </label>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={ed.deducible && ed.tiene_factura} disabled={!ed.tiene_factura} onChange={(e) => setEd({ ...ed, deducible: e.target.checked })} className="h-4 w-4 accent-red-600 disabled:opacity-40" />
                    Deducible
                  </label>
                </div>
              </>
            )}

            {ed.tipo === "traspaso" && (
              <>
                <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Motivo</span>
                  <input value={ed.motivo} onChange={(e) => setEd({ ...ed, motivo: e.target.value })} className={inputCls} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Fecha</span>
                    <input type="date" value={ed.fecha} onChange={(e) => setEd({ ...ed, fecha: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Importe €</span>
                    <input inputMode="decimal" value={ed.importe} onChange={(e) => setEd({ ...ed, importe: e.target.value })} className={inputCls} />
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">De la cuenta</span>
                    <select value={ed.cuenta_origen_id} onChange={(e) => setEd({ ...ed, cuenta_origen_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                      {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre.split(" (")[0]}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">A la cuenta</span>
                    <select value={ed.cuenta_destino_id} onChange={(e) => setEd({ ...ed, cuenta_destino_id: Number(e.target.value) })} className={`${inputCls} appearance-none`}>
                      {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre.split(" (")[0]}</option>)}
                    </select>
                  </label>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
              <button onClick={guardarEdicion} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">Guardar</button>
              <button onClick={borrarMovimiento} title="Borrar permanentemente" className="rounded-xl border border-red-900 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-950">Borrar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
