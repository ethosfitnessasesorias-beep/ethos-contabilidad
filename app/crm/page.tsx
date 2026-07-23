"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/lib/useSesion";
import { Shell } from "../shell";
import Modal from "@/components/Modal";
import { ATRIBUCIONES, METODO_POR_CUENTA, type MetodoPago } from "@/lib/tipos";
import { eur } from "@/lib/formato";

interface FacSaldo {
  id: number;
  concepto: string;
  fecha_emision: string;
  total: number;
  cobrado: number;
  pendiente: number;
  condonado: number;
}
interface CobroRow { id: number; factura_id: number; fecha: string; importe: number }
interface CuentaMin { id: number; codigo: string; nombre: string }

interface Cli {
  id: number;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  nif: string | null;
  fecha_registro: string | null;
  entrenador: string;
  estado: string | null;
  canal: string | null;
  origen: string | null;
  tipo_plan: string | null;
  primer_contacto: string | null;
  fecha_compra: string | null;
  fecha_inicio: string | null;
  fecha_baja: string | null;
  objetivo: string | null;
  seg_cambio_fisico: boolean;
  seg_satisfaccion: boolean;
  seg_marcha: boolean;
  seg_google_maps: boolean;
  seg_trustpilot: boolean;
  cuota_id: number | null;
  descuento_pct: number;
  descuento_eur: number;
  domiciliado: boolean;
  cuota_desde: string | null;
  cuota_periodicidad: string;
}
interface CuotaCat {
  id: number;
  nombre: string;
  activa: boolean;
  precio_mensual: number | null;
  precio_trimestral: number | null;
  precio_semestral: number | null;
  precio_anual: number | null;
}
const MODALIDADES = [
  { valor: "mensual", etiqueta: "Mensual", campo: "precio_mensual" },
  { valor: "trimestral", etiqueta: "Trimestral", campo: "precio_trimestral" },
  { valor: "semestral", etiqueta: "Semestral", campo: "precio_semestral" },
  { valor: "anual", etiqueta: "Anual", campo: "precio_anual" },
] as const;
const precioDe = (q: CuotaCat | undefined, modalidad: string): number | null => {
  if (!q) return null;
  const m = MODALIDADES.find((x) => x.valor === modalidad) ?? MODALIDADES[0];
  const v = q[m.campo];
  return v === null || v === undefined ? null : Number(v);
};

const MESES_PERIODO: Record<string, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
// Próximo mes en que le toca factura según su ciclo (desde + múltiplos del periodo)
function proximaFactura(desde: string | null | undefined, periodicidad: string): Date {
  const periodo = MESES_PERIODO[periodicidad] ?? 1;
  const base = desde ? new Date(desde + "T00:00:00") : new Date();
  const ancla = new Date(base.getFullYear(), base.getMonth(), 1);
  const ahora = new Date();
  const mesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const diff = (mesActual.getFullYear() - ancla.getFullYear()) * 12 + (mesActual.getMonth() - ancla.getMonth());
  const k = diff < 0 ? 0 : Math.ceil(diff / periodo) * periodo;
  return new Date(ancla.getFullYear(), ancla.getMonth() + k, 1);
}

const NOMBRE: Record<string, string> = {
  ethos: "Ethos", luis: "Luis", david: "David", alex_esteban: "Alex E.", alex_guerrero: "Alex G.",
};
const SEG: { campo: keyof Cli; corto: string }[] = [
  { campo: "seg_cambio_fisico", corto: "Cambio físico" },
  { campo: "seg_satisfaccion", corto: "Enc. satisf." },
  { campo: "seg_marcha", corto: "Enc. marcha" },
  { campo: "seg_google_maps", corto: "Maps" },
  { campo: "seg_trustpilot", corto: "Trustpilot" },
];

const diasEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
function humano(dias: number): string {
  if (dias < 0) return "—";
  const m = Math.floor(dias / 30.44);
  const d = Math.round(dias - m * 30.44);
  if (m <= 0) return `${d} d`;
  return `${m} mes${m === 1 ? "" : "es"}${d ? ` ${d} d` : ""}`;
}
const inputCls =
  "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

export default function CrmPage() {
  const sesionOk = useSesion();
  const [cli, setCli] = useState<Cli[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "cliente" | "lead" | "baja">("todos");
  const [filtroPrep, setFiltroPrep] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "online" | "presencial">("todos");
  const [sortKey, setSortKey] = useState<string>("inicio");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [ed, setEd] = useState<Cli | null>(null);
  const [creando, setCreando] = useState(false);
  const [f, setF] = useState<Partial<Cli>>({});
  const [saldos, setSaldos] = useState<Map<number, { cobrado: number; pendiente: number }>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [cuotasCat, setCuotasCat] = useState<CuotaCat[]>([]);
  // Editor de dinero (pagado/deuda) de un cliente
  const [dineroCli, setDineroCli] = useState<{ cli: Cli; facturas: FacSaldo[]; cobros: CobroRow[] } | null>(null);
  const [cuentas, setCuentas] = useState<CuentaMin[]>([]);
  const [cuentaCobro, setCuentaCobro] = useState("banco");
  const [fechaCobro, setFechaCobro] = useState(new Date().toISOString().slice(0, 10));
  const [verCobrosDe, setVerCobrosDe] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from("clientes").select("*").order("fecha_inicio", { ascending: false, nullsFirst: false });
    if (error) {
      setError(error.message.includes("primer_contacto") || error.message.includes("seg_") ? "Falta la migración crm_clientes.sql." : error.message);
      return;
    }
    setCli((data as Cli[]) ?? []);
    const { data: qs } = await supabase.from("cuotas").select("id, nombre, activa, precio_mensual, precio_trimestral, precio_semestral, precio_anual").order("nombre");
    setCuotasCat((qs as CuotaCat[]) ?? []);
    const { data: sal } = await supabase.from("v_facturas_saldo").select("cliente_id, cobrado, pendiente");
    const m = new Map<number, { cobrado: number; pendiente: number }>();
    for (const s of (sal as { cliente_id: number | null; cobrado: number; pendiente: number }[]) ?? []) {
      if (!s.cliente_id) continue;
      const cur = m.get(s.cliente_id) ?? { cobrado: 0, pendiente: 0 };
      cur.cobrado += Number(s.cobrado); cur.pendiente += Number(s.pendiente);
      m.set(s.cliente_id, cur);
    }
    setSaldos(m);
  }, []);

  useEffect(() => {
    if (sesionOk) cargar();
  }, [sesionOk, cargar]);

  function abrirEditar(c: Cli) {
    setCreando(false);
    setEd(c);
    setF({ ...c });
  }

  // Alta manual: por si el formulario falla o el cliente no lo rellenó
  function abrirNuevo() {
    setEd(null);
    setCreando(true);
    setF({
      nombre: "", entrenador: "ethos", estado: "cliente", canal: null,
      fecha_inicio: new Date().toISOString().slice(0, 10),
      descuento_pct: 0, descuento_eur: 0, domiciliado: false, cuota_id: null,
      cuota_desde: new Date().toISOString().slice(0, 10), cuota_periodicidad: "mensual",
    });
  }
  async function guardarEditar() {
    if (!ed && !creando) return;
    const campos = [
      "nombre", "apellidos", "email", "telefono", "nif", "entrenador", "canal", "tipo_plan", "objetivo",
      "fecha_registro", "primer_contacto", "fecha_compra", "fecha_inicio", "fecha_baja",
    ] as const;
    const datos: Record<string, unknown> = {};
    const src = f as Record<string, unknown>;
    for (const k of campos) { const v = src[k]; datos[k] = v === "" ? null : v ?? null; }
    const estado = (f.estado as string) || "cliente";
    datos.estado = estado;
    // En toda la app la baja se detecta por fecha_baja: la mantenemos coherente con el estado.
    datos.fecha_baja = estado === "baja" ? (f.fecha_baja || hoy) : null;
    datos.cuota_id = f.cuota_id ?? null;
    datos.descuento_pct = Number(f.descuento_pct) || 0;
    datos.descuento_eur = Number(f.descuento_eur) || 0;
    datos.domiciliado = !!f.domiciliado;
    datos.cuota_desde = f.cuota_desde || null;
    datos.cuota_periodicidad = (f.cuota_periodicidad as string) || "mensual";
    if (creando) {
      if (!String(datos.nombre ?? "").trim()) return setError("Pon al menos el nombre.");
      datos.entrenador = (datos.entrenador as string) || "ethos";
      datos.origen = "manual";
      const { error } = await supabase.from("clientes").insert(datos);
      if (error) return setError(error.message);
      setCreando(false);
    } else {
      const { error } = await supabase.from("clientes").update(datos).eq("id", ed!.id);
      if (error) return setError(error.message);
      setEd(null);
    }
    cargar();
  }
  async function borrar() {
    if (!ed) return;
    const nom = `${ed.nombre} ${ed.apellidos ?? ""}`.trim();
    if (!confirm(`¿Borrar a ${nom} de forma permanente?\n\nEsto no se puede deshacer. Úsalo solo para pruebas o registros que no son clientes.`)) return;
    setError(null);
    const { data, error } = await supabase.from("clientes").delete().eq("id", ed.id).select();
    if (error) {
      setError(/foreign key|violates|referenced/i.test(error.message)
        ? "No se puede borrar: tiene facturas u otros registros asociados. Da de baja al cliente en su lugar."
        : error.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("No se pudo borrar (la base de datos no lo permite). Avísame y habilito el permiso de borrado.");
      return;
    }
    setEd(null);
    cargar();
  }

  async function setCanal(c: Cli, canal: string | null) {
    setCli((prev) => prev.map((x) => (x.id === c.id ? { ...x, canal } : x)));
    const { error } = await supabase.from("clientes").update({ canal }).eq("id", c.id);
    if (error) { setError(error.message); cargar(); }
  }

  // ---------- Editor de dinero: las casillas Pagado/Deuda salen de las
  // facturas y cobros; aquí se cobran, se perdonan o se corrigen. ----------
  async function abrirDinero(c: Cli) {
    setError(null);
    const [f, cu] = await Promise.all([
      supabase
        .from("v_facturas_saldo")
        .select("id, concepto, fecha_emision, total, cobrado, pendiente, condonado")
        .eq("cliente_id", c.id)
        .order("fecha_emision", { ascending: false }),
      cuentas.length
        ? Promise.resolve({ data: cuentas, error: null })
        : supabase.from("cuentas").select("id, codigo, nombre").eq("activa", true).order("id"),
    ]);
    if (f.error) return setError(f.error.message);
    if (!cuentas.length && cu.data) setCuentas(cu.data as CuentaMin[]);
    const facs = (f.data as FacSaldo[]) ?? [];
    let cobs: CobroRow[] = [];
    if (facs.length) {
      const { data } = await supabase
        .from("cobros")
        .select("id, factura_id, fecha, importe")
        .in("factura_id", facs.map((x) => x.id))
        .order("fecha", { ascending: false });
      cobs = (data as CobroRow[]) ?? [];
    }
    setVerCobrosDe(null);
    setDineroCli({ cli: c, facturas: facs, cobros: cobs });
  }

  async function refrescarDinero() {
    if (dineroCli) await abrirDinero(dineroCli.cli);
    cargar();
  }

  async function cobrarFactura(f: FacSaldo) {
    const cuenta = cuentas.find((x) => x.codigo === cuentaCobro) ?? cuentas[0];
    if (!cuenta) return setError("No hay cuentas activas.");
    const { error } = await supabase.from("cobros").insert({
      factura_id: f.id,
      fecha: fechaCobro,
      importe: Math.round(Number(f.pendiente) * 100) / 100,
      cuenta_id: cuenta.id,
      metodo: (METODO_POR_CUENTA[cuenta.codigo] ?? "transferencia") as MetodoPago,
    });
    if (error) return setError(error.message);
    refrescarDinero();
  }

  async function perdonarFactura(f: FacSaldo) {
    if (!confirm(`¿Perdonar los ${eur(Number(f.pendiente))} pendientes de "${f.concepto}"?\n\nNo entra dinero en caja: la deuda se apaga (p. ej. si en realidad nunca se va a cobrar o la factura estaba mal).`)) return;
    const { error } = await supabase
      .from("facturas")
      .update({ condonado: Math.round((Number(f.condonado) + Number(f.pendiente)) * 100) / 100 })
      .eq("id", f.id);
    if (error) return setError(error.message);
    refrescarDinero();
  }

  async function borrarCobro(co: CobroRow) {
    if (!confirm(`¿Borrar el cobro de ${eur(Number(co.importe))} del ${new Date(co.fecha).toLocaleDateString("es-ES")}?\n\nÚsalo si se apuntó por error: el dinero saldrá del saldo de la cuenta y volverá a contar como deuda.`)) return;
    const { error } = await supabase.from("cobros").delete().eq("id", co.id);
    if (error) return setError(error.message);
    refrescarDinero();
  }

  async function toggleSeg(c: Cli, campo: keyof Cli) {
    const nuevo = !c[campo];
    setCli((prev) => prev.map((x) => (x.id === c.id ? { ...x, [campo]: nuevo } : x)));
    const { error } = await supabase.from("clientes").update({ [campo]: nuevo }).eq("id", c.id);
    if (error) { setError(error.message); cargar(); }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const esBaja = (c: Cli) => !!c.fecha_baja;
  const esCliente = (c: Cli) => !esBaja(c) && c.estado !== "lead";
  const esLead = (c: Cli) => !esBaja(c) && c.estado === "lead";

  // Métricas
  const metricas = useMemo(() => {
    const activos = cli.filter(esCliente);
    const leads = cli.filter(esLead);
    const tiempos: number[] = [], compras: number[] = [];
    const porPrep = new Map<string, { tiempo: number[]; compra: number[]; n: number }>();
    for (const c of cli) {
      const acc = porPrep.get(c.entrenador) ?? { tiempo: [], compra: [], n: 0 };
      if (esCliente(c) && c.fecha_inicio) {
        const t = diasEntre(c.fecha_inicio, c.fecha_baja ?? hoy);
        tiempos.push(t); acc.tiempo.push(t); acc.n++;
      }
      if (c.fecha_compra && c.primer_contacto) {
        const t = diasEntre(c.primer_contacto, c.fecha_compra);
        if (t >= 0) { compras.push(t); acc.compra.push(t); }
      }
      porPrep.set(c.entrenador, acc);
    }
    const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
    return {
      activos: activos.length,
      leads: leads.length,
      conversion: activos.length + leads.length > 0 ? Math.round((activos.length / (activos.length + leads.length)) * 100) : 0,
      mediaTiempo: media(tiempos),
      mediaCompra: media(compras),
      porPrep: [...porPrep.entries()]
        .filter(([, v]) => v.tiempo.length || v.compra.length)
        .map(([k, v]) => ({ prep: k, n: v.n, mediaTiempo: media(v.tiempo), mediaCompra: media(v.compra) }))
        .sort((a, b) => b.n - a.n),
    };
  }, [cli, hoy]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cli.filter((c) => {
      if (filtroEstado === "baja" && !esBaja(c)) return false;
      if (filtroEstado === "cliente" && !esCliente(c)) return false;
      if (filtroEstado === "lead" && !esLead(c)) return false;
      if (filtroPrep !== "todos" && c.entrenador !== filtroPrep) return false;
      if (filtroCanal !== "todos" && c.canal !== filtroCanal) return false;
      if (q && ![c.nombre, c.apellidos, c.email, c.telefono].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))) return false;
      return true;
    });
  }, [cli, busqueda, filtroEstado, filtroPrep, filtroCanal]);

  // Dinero de los clientes visibles (respeta filtros): facturado, cobrado, media por cliente
  const dinero = useMemo(() => {
    let facturado = 0, cobrado = 0, pendiente = 0, conPago = 0;
    for (const c of visibles) {
      const s = saldos.get(c.id);
      if (!s) continue;
      facturado += s.cobrado + s.pendiente;
      cobrado += s.cobrado;
      pendiente += s.pendiente;
      if (s.cobrado > 0.01) conPago++;
    }
    return { facturado, cobrado, pendiente, media: conPago ? cobrado / conPago : 0 };
  }, [visibles, saldos]);

  const valorOrden = (c: Cli, k: string): string | number => {
    switch (k) {
      case "nombre": return `${c.nombre} ${c.apellidos ?? ""}`.toLowerCase();
      case "estado": return esBaja(c) ? 2 : esLead(c) ? 0 : 1;
      case "entrenador": return c.entrenador;
      case "canal": return c.canal ?? "zzz";
      case "plan": return (c.tipo_plan ?? "zzz").toLowerCase();
      case "pagado": return saldos.get(c.id)?.cobrado ?? 0;
      case "deuda": return saldos.get(c.id)?.pendiente ?? 0;
      case "inicio": return c.fecha_inicio ? new Date(c.fecha_inicio).getTime() : 0;
      case "compra": return c.fecha_compra && c.primer_contacto ? diasEntre(c.primer_contacto, c.fecha_compra) : -1;
      default: return 0;
    }
  };
  const ordenados = useMemo(() => {
    return [...visibles].sort((a, b) => {
      const va = valorOrden(a, sortKey), vb = valorOrden(b, sortKey);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibles, sortKey, sortDir]);
  const clicOrden = (k: string) => { if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setSortDir(1); } };
  const fEd = (k: keyof Cli) => (f[k] as string) ?? "";

  if (sesionOk === null) {
    return <div className="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-500">Cargando…</div>;
  }

  const mini = (v: string, et: string, c = "text-zinc-200") => (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-base font-black ${c}`}>{v}</span>
      <span className="text-[11px] text-zinc-500">{et}</span>
    </span>
  );

  return (
    <Shell titulo="CRM">
      <div className="px-5 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">CRM</h1>
            <p className="mt-1 text-sm text-zinc-500">Ciclo de vida, métricas y seguimiento de clientes. Entra solo desde el formulario, o a mano.</p>
          </div>
          <button onClick={abrirNuevo} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">+ Nuevo cliente</button>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>}

        {/* Resumen compacto */}
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
          {mini(String(metricas.activos), "activos", "text-white")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(String(metricas.leads), "leads", "text-amber-400")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(`${metricas.conversion}%`, "conversión", "text-emerald-400")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(humano(metricas.mediaTiempo), "media con nosotros")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(humano(metricas.mediaCompra), "media hasta comprar")}
        </div>
        {/* Dinero (respeta los filtros) */}
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
          {mini(eur(dinero.facturado), "facturado", "text-white")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(eur(dinero.cobrado), "cash collected", "text-emerald-400")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(eur(dinero.media), "media por cliente", "text-white")}
          <span className="h-3.5 w-px bg-zinc-800" />
          {mini(eur(dinero.pendiente), "pendiente de cobro", "text-amber-400")}
        </div>
        {metricas.porPrep.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-zinc-500">
            {metricas.porPrep.map((p) => (
              <span key={p.prep}>
                <span className="font-bold text-zinc-300">{NOMBRE[p.prep] ?? p.prep}</span> · {p.n} activos · media {humano(p.mediaTiempo)} · compra {humano(p.mediaCompra)}
              </span>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input placeholder="Buscar por nombre, email o teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-56 flex-1 sm:max-w-xs`} />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)} className={`${inputCls} appearance-none`}>
            <option value="todos">Estado: todos</option>
            <option value="cliente">Clientes</option>
            <option value="lead">Leads</option>
            <option value="baja">Bajas</option>
          </select>
          <select value={filtroPrep} onChange={(e) => setFiltroPrep(e.target.value)} className={`${inputCls} appearance-none`}>
            <option value="todos">Preparador: todos</option>
            {ATRIBUCIONES.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
          </select>
          <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value as typeof filtroCanal)} className={`${inputCls} appearance-none`}>
            <option value="todos">Canal: todos</option>
            <option value="online">Online</option>
            <option value="presencial">GYM</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500">
                {([["nombre", "Cliente"], ["estado", "Estado"], ["entrenador", "Prep."], ["canal", "Canal"], ["plan", "Plan"], ["inicio", "Con nosotros"], ["compra", "Compra"], ["pagado", "Pagado"], ["deuda", "Deuda"]] as [string, string][]).map(([k, et]) => (
                  <th key={k} onClick={() => clicOrden(k)} className="cursor-pointer whitespace-nowrap px-3 py-2.5 hover:text-zinc-300">
                    {et}{sortKey === k ? (sortDir === 1 ? " ↑" : " ↓") : ""}
                  </th>
                ))}
                {SEG.map((s) => <th key={String(s.campo)} className="px-2 py-2.5 text-center">{s.corto}</th>)}
              </tr>
            </thead>
            <tbody>
              {ordenados.map((c) => {
                const tiempo = esCliente(c) && c.fecha_inicio ? humano(diasEntre(c.fecha_inicio, c.fecha_baja ?? hoy)) : "—";
                const compra = c.fecha_compra && c.primer_contacto ? humano(diasEntre(c.primer_contacto, c.fecha_compra)) : "—";
                const sd = saldos.get(c.id) ?? { cobrado: 0, pendiente: 0 };
                return (
                  <tr key={c.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => abrirEditar(c)} aria-label="Editar" title="Editar cliente" className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white">✎</button>
                        <Link href={`/clientes/${c.id}`} className="font-semibold text-white hover:text-red-400">
                          {c.nombre} {c.apellidos ?? ""}
                        </Link>
                      </div>
                      <p className="pl-8 text-[11px] text-zinc-600">{c.email ?? c.telefono ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${esBaja(c) ? "bg-zinc-800 text-zinc-500" : esLead(c) ? "bg-amber-950 text-amber-400" : "bg-emerald-950 text-emerald-400"}`}>
                        {esBaja(c) ? "Baja" : esLead(c) ? "Lead" : "Cliente"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">{NOMBRE[c.entrenador] ?? c.entrenador}</td>
                    <td className="px-3 py-2.5">
                      <select
                        value={c.canal ?? ""}
                        onChange={(e) => setCanal(c, e.target.value || null)}
                        className={`rounded-md border-0 px-2 py-1 text-xs font-bold outline-none ${c.canal === "online" ? "bg-blue-950 text-blue-400" : c.canal === "presencial" ? "bg-red-950 text-red-400" : "bg-zinc-800 text-zinc-500"}`}
                      >
                        <option value="">—</option>
                        <option value="online">Online</option>
                        <option value="presencial">GYM</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">{c.tipo_plan ?? "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-300">{tiempo}</td>
                    <td className="px-3 py-2.5 text-zinc-300">{compra}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <button onClick={() => abrirDinero(c)} title="Ver y corregir cobros" className="font-semibold text-emerald-400 hover:underline">
                        {sd.cobrado > 0.01 ? eur(sd.cobrado) : <span className="text-zinc-600">—</span>}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <button onClick={() => abrirDinero(c)} title="Ver y corregir cobros">
                        {sd.pendiente > 0.01
                          ? <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 hover:bg-amber-900">{eur(sd.pendiente)}</span>
                          : <span className="text-zinc-600">—</span>}
                      </button>
                    </td>
                    {SEG.map((s) => (
                      <td key={String(s.campo)} className="px-2 py-2.5 text-center">
                        <button
                          onClick={() => toggleSeg(c, s.campo)}
                          aria-label={s.corto}
                          className={`grid h-6 w-6 place-items-center rounded-md text-xs font-black ${c[s.campo] ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-600"}`}
                        >
                          {c[s.campo] ? "✓" : ""}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr><td colSpan={9 + SEG.length} className="px-4 py-8 text-center text-sm text-zinc-500">Sin clientes con esos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal
          abierto={!!ed || creando}
          onCerrar={() => { setEd(null); setCreando(false); }}
          titulo={creando ? "Nuevo cliente" : ed ? `${ed.nombre} ${ed.apellidos ?? ""}` : ""}
          ancho="max-w-2xl"
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Estado</span>
              <select value={(f.estado as string) ?? "cliente"} onChange={(e) => setF({ ...f, estado: e.target.value })} className={`${inputCls} appearance-none`}>
                <option value="lead">Lead</option>
                <option value="cliente">Cliente</option>
                <option value="baja">Baja</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Nombre</span><input value={fEd("nombre")} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Apellidos</span><input value={fEd("apellidos")} onChange={(e) => setF({ ...f, apellidos: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Email</span><input value={fEd("email")} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Teléfono</span><input value={fEd("telefono")} onChange={(e) => setF({ ...f, telefono: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">DNI/NIE</span><input value={fEd("nif")} onChange={(e) => setF({ ...f, nif: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Plan</span><input value={fEd("tipo_plan")} onChange={(e) => setF({ ...f, tipo_plan: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Preparador</span>
                <select value={fEd("entrenador")} onChange={(e) => setF({ ...f, entrenador: e.target.value })} className={`${inputCls} appearance-none`}>
                  {ATRIBUCIONES.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Canal</span>
                <select value={fEd("canal")} onChange={(e) => setF({ ...f, canal: e.target.value })} className={`${inputCls} appearance-none`}>
                  <option value="">—</option><option value="online">Online</option><option value="presencial">GYM</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">1er contacto</span><input type="date" value={fEd("primer_contacto")} onChange={(e) => setF({ ...f, primer_contacto: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Compra</span><input type="date" value={fEd("fecha_compra")} onChange={(e) => setF({ ...f, fecha_compra: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Inicio</span><input type="date" value={fEd("fecha_inicio")} onChange={(e) => setF({ ...f, fecha_inicio: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Registro form</span><input type="date" value={fEd("fecha_registro")} onChange={(e) => setF({ ...f, fecha_registro: e.target.value })} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-red-400">Fecha de baja</span><input type="date" value={fEd("fecha_baja")} onChange={(e) => setF({ ...f, fecha_baja: e.target.value })} className={inputCls} /></label>
            </div>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-bold uppercase text-zinc-500">Objetivo</span><textarea rows={2} value={fEd("objetivo")} onChange={(e) => setF({ ...f, objetivo: e.target.value })} className={inputCls} /></label>

            {/* Cuota del centro (remesa de domiciliados) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-sky-400">Cuota del centro</p>
              <div className="grid gap-3 sm:grid-cols-5">
                <label className="flex flex-col gap-1 sm:col-span-2"><span className="text-[10px] font-bold uppercase text-zinc-500">Plan</span>
                  <select value={f.cuota_id ?? ""} onChange={(e) => setF({ ...f, cuota_id: Number(e.target.value) || null })} className={`${inputCls} appearance-none`}>
                    <option value="">Sin cuota</option>
                    {cuotasCat.filter((q) => q.activa || q.id === f.cuota_id).map((q) => (
                      <option key={q.id} value={q.id}>{q.nombre}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase text-zinc-500">Modalidad</span>
                  <select
                    value={(f.cuota_periodicidad as string) ?? "mensual"}
                    onChange={(e) => setF({ ...f, cuota_periodicidad: e.target.value })}
                    className={`${inputCls} appearance-none`}
                  >
                    {(() => {
                      const q = cuotasCat.find((x) => x.id === f.cuota_id);
                      return MODALIDADES.filter((m) => !q || q[m.campo] !== null || m.valor === f.cuota_periodicidad).map((m) => {
                        const p = precioDe(q, m.valor);
                        return <option key={m.valor} value={m.valor}>{m.etiqueta}{p !== null ? ` · ${p.toFixed(2).replace(".", ",")} €` : ""}</option>;
                      });
                    })()}
                  </select>
                </label>
                <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase text-zinc-500">Descuento %</span>
                  <input inputMode="decimal" value={f.descuento_pct ?? 0} onChange={(e) => setF({ ...f, descuento_pct: Number(e.target.value.replace(",", ".")) || 0 })} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase text-zinc-500">Descuento €</span>
                  <input inputMode="decimal" value={f.descuento_eur ?? 0} onChange={(e) => setF({ ...f, descuento_eur: Number(e.target.value.replace(",", ".")) || 0 })} className={inputCls} />
                </label>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase text-zinc-500">Empieza a contar</span>
                  <input type="date" value={f.cuota_desde ?? ""} onChange={(e) => setF({ ...f, cuota_desde: e.target.value || null })} className={inputCls} />
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={!!f.domiciliado} onChange={(e) => setF({ ...f, domiciliado: e.target.checked })} className="h-4 w-4 accent-red-600" />
                  Domiciliado <span className="text-[10px] text-zinc-600">(entra en la remesa)</span>
                </label>
              </div>
              {(() => {
                const q = cuotasCat.find((x) => x.id === f.cuota_id);
                if (!q) return null;
                const modalidad = (f.cuota_periodicidad as string) || "mensual";
                const base = precioDe(q, modalidad);
                if (base === null) {
                  return <p className="mt-2 rounded-lg bg-amber-950/60 px-3 py-1.5 text-[11px] text-amber-300">Este plan no tiene precio {modalidad}: ponlo en Ajustes → Cuotas o elige otra modalidad.</p>;
                }
                const precio = Math.max(0, Math.round((base * (1 - (Number(f.descuento_pct) || 0) / 100) - (Number(f.descuento_eur) || 0)) * 100) / 100);
                const periodo = MESES_PERIODO[modalidad] ?? 1;
                const prox = proximaFactura(f.cuota_desde ?? f.fecha_inicio, modalidad);
                return (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-900/70 px-3 py-1.5">
                    <span className="text-[11px] text-zinc-500">
                      Próxima factura: <b className="capitalize text-white">{prox.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</b>
                      {periodo > 1 ? ` · luego cada ${periodo} meses` : " · cada mes"}
                      {!f.cuota_desde && <span className="text-zinc-600"> (ciclo desde su fecha de inicio; ponla arriba si es otra)</span>}
                    </span>
                    <span className="text-sm font-black text-emerald-400">{precio.toFixed(2).replace(".", ",")} €</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
              <button onClick={guardarEditar} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white">{creando ? "Crear cliente" : "Guardar"}</button>
              {!creando && (
                <button onClick={borrar} title="Borrar permanentemente" className="rounded-xl border border-red-900 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-950">Borrar</button>
              )}
            </div>
          </div>
        </Modal>

        {/* Editor de dinero: cobros y deuda del cliente */}
        <Modal
          abierto={!!dineroCli}
          onCerrar={() => setDineroCli(null)}
          titulo={dineroCli ? `Dinero de ${dineroCli.cli.nombre} ${dineroCli.cli.apellidos ?? ""}` : ""}
          ancho="max-w-2xl"
        >
          {dineroCli && (() => {
            const tFact = dineroCli.facturas.reduce((s, f) => s + Number(f.total), 0);
            const tCob = dineroCli.facturas.reduce((s, f) => s + Number(f.cobrado), 0);
            const tPend = dineroCli.facturas.reduce((s, f) => s + Math.max(0, Number(f.pendiente)), 0);
            const tCond = dineroCli.facturas.reduce((s, f) => s + Number(f.condonado), 0);
            return (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-zinc-950/60 px-3 py-2 text-[13px]">
                  <span className="text-zinc-500">Facturado <b className="text-white">{eur(tFact)}</b></span>
                  <span className="text-zinc-500">Pagado <b className="text-emerald-400">{eur(tCob)}</b></span>
                  <span className="text-zinc-500">Deuda <b className={tPend > 0.01 ? "text-amber-400" : "text-zinc-400"}>{eur(tPend)}</b></span>
                  {tCond > 0.01 && <span className="text-zinc-500">Perdonado <b className="text-zinc-400">{eur(tCond)}</b></span>}
                </div>

                {tPend > 0.01 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    Al cobrar, apuntar en
                    <select value={cuentaCobro} onChange={(e) => setCuentaCobro(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none">
                      {cuentas.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre.split(" (")[0]}</option>)}
                    </select>
                    con fecha
                    <input type="date" value={fechaCobro} onChange={(e) => setFechaCobro(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none" />
                  </div>
                )}

                {dineroCli.facturas.length === 0 ? (
                  <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-600">
                    Este cliente no tiene facturas. El pagado y la deuda salen de sus facturas y cobros:
                    crea una desde Contabilidad → Facturas y aparecerá aquí.
                  </p>
                ) : (
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-zinc-800">
                    {dineroCli.facturas.map((f) => {
                      const pend = Number(f.pendiente);
                      const cobs = dineroCli.cobros.filter((c) => c.factura_id === f.id);
                      return (
                        <div key={f.id} className="border-b border-zinc-800/60 px-3 py-2 last:border-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-white">{f.concepto}</p>
                              <p className="text-[11px] text-zinc-500">
                                {new Date(f.fecha_emision).toLocaleDateString("es-ES")} · total {eur(Number(f.total))} · pagado {eur(Number(f.cobrado))}
                                {Number(f.condonado) > 0.01 && <> · perdonado {eur(Number(f.condonado))}</>}
                                {cobs.length > 0 && (
                                  <button onClick={() => setVerCobrosDe(verCobrosDe === f.id ? null : f.id)} className="ml-2 text-zinc-400 underline hover:text-white">
                                    {cobs.length} cobro{cobs.length === 1 ? "" : "s"} {verCobrosDe === f.id ? "▴" : "▾"}
                                  </button>
                                )}
                              </p>
                            </div>
                            {pend > 0.01 ? (
                              <span className="flex shrink-0 items-center gap-1.5">
                                <span className="rounded-full bg-amber-950 px-2 py-0.5 text-[11px] font-bold text-amber-400">debe {eur(pend)}</span>
                                <button onClick={() => cobrarFactura(f)} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-600">
                                  Cobrar
                                </button>
                                <button onClick={() => perdonarFactura(f)} title="Apagar la deuda sin cobrarla" className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-200">
                                  Perdonar
                                </button>
                              </span>
                            ) : (
                              <span className="shrink-0 text-[11px] font-bold text-emerald-500">✓ al día</span>
                            )}
                          </div>
                          {verCobrosDe === f.id && cobs.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-zinc-800/60 pt-1.5">
                              {cobs.map((co) => (
                                <span key={co.id} className="flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
                                  {new Date(co.fecha).toLocaleDateString("es-ES")} · <b className={Number(co.importe) < 0 ? "text-red-400" : "text-emerald-400"}>{eur(Number(co.importe))}</b>
                                  <button onClick={() => borrarCobro(co)} title="Borrar este cobro (se apuntó por error)" className="ml-1 font-bold text-zinc-600 hover:text-red-400">✕</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-[10px] leading-snug text-zinc-600">
                  Las casillas Pagado y Deuda se calculan solas con las facturas y cobros: <b>Cobrar</b> apunta el
                  cobro en la cuenta elegida, <b>Perdonar</b> apaga la deuda sin mover dinero, y la ✕ de un cobro
                  lo borra si se apuntó por error. Todo cuadra automáticamente con el Libro y Finanzas.
                </p>
              </div>
            );
          })()}
        </Modal>
      </div>
    </Shell>
  );
}
