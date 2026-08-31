"use client";

// Pagos y cobros: matriz fila × mes replicando la hoja "Gestión de clientes" del Excel.
// Las filas son fijas (tabla pagos_cobros_filas): clientes con ficha o agregados por
// patrón de concepto (Grupales, HSN, Merchan…). Clic en una casilla para apuntar o
// corregir pagos; todo va a la contabilidad real (Libro, CRM, LTV).

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";

interface Cli {
  id: number;
  nombre: string;
  apellidos: string | null;
  entrenador: string;
  canal: string | null;
  tipo_plan: string | null;
  fecha_inicio: string | null;
  fecha_baja: string | null;
  cuota_id: number | null;
  cuota_periodicidad: string;
  cuota_desde: string | null;
  descuento_pct: number;
  descuento_eur: number;
  domiciliado: boolean;
}
interface Fila {
  id: number;
  orden: number;
  etiqueta: string;
  cliente_id: number | null;
  patron: string | null;
}
interface CobroRow { fecha: string; importe: number; facturas: { cliente_id: number | null; concepto: string | null } | null }
// Cobro de una celda concreta (fila × mes), con contexto de su factura
interface CeldaCobro {
  id: number;
  fecha: string;
  importe: number;
  factura_id: number;
  concepto: string;
  iva_pct: number;
  unico: boolean; // única entrega de su factura → editable/borrable aquí
  afecta_caja: boolean;
}
interface CuotaCat {
  id: number;
  precio_mensual: number | null;
  precio_trimestral: number | null;
  precio_semestral: number | null;
  precio_anual: number | null;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PERIODO: Record<string, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };
const GRUPO: Record<string, string> = { david: "David", luis: "Luis" };

const n2 = (v: number) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500";

const regexDe = (patron: string) => {
  try {
    return new RegExp(patron, "i");
  } catch {
    return null;
  }
};

export default function PagosCobrosPage() {
  const [anyo, setAnyo] = useState(new Date().getFullYear());
  const [filasBD, setFilasBD] = useState<Fila[]>([]);
  const [clientes, setClientes] = useState<Cli[]>([]);
  const [cobros, setCobros] = useState<CobroRow[]>([]);
  const [cuotas, setCuotas] = useState<CuotaCat[]>([]);
  const [pendientes, setPendientes] = useState<Map<number, number>>(new Map());
  const [fEntrenador, setFEntrenador] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bancoId, setBancoId] = useState<number | null>(null);
  const [gestionando, setGestionando] = useState(false);

  // Celda abierta (fila × mes) para apuntar/corregir pagos como en el Excel
  const [celda, setCelda] = useState<{ fila: Fila; cli: Cli | null; mesIdx: number } | null>(null);
  const [celdaCobros, setCeldaCobros] = useState<CeldaCobro[]>([]);
  const [nuevoImporte, setNuevoImporte] = useState("");
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoHistorico, setNuevoHistorico] = useState(true);

  // Añadir fila: cliente existente o alta rápida
  const [addCliente, setAddCliente] = useState("");
  const [altaNombre, setAltaNombre] = useState("");
  const [altaEntrenador, setAltaEntrenador] = useState("ethos");
  const [altaPlan, setAltaPlan] = useState("");

  // ---- Esquema manual (verde/rojo): capa de control que NO toca las cuentas ----
  // Marcas: clave "filaId-mesIdx" -> { estado, nota }
  const [marcas, setMarcas] = useState<Map<string, { estado: string; nota: string | null }>>(new Map());
  const [modoEsquema, setModoEsquema] = useState(false);
  // Selección por arrastre: rectángulo entre inicio y fin (índices de fila y mes)
  const [selIni, setSelIni] = useState<{ fi: number; mi: number } | null>(null);
  const [selFin, setSelFin] = useState<{ fi: number; mi: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [barra, setBarra] = useState<{ celdas: { filaId: number; mesIdx: number }[] } | null>(null);
  const [notaBarra, setNotaBarra] = useState("");

  const mesISO = (mesIdx: number) => `${anyo}-${String(mesIdx + 1).padStart(2, "0")}-01`;
  const claveMarca = (filaId: number, mesIdx: number) => `${filaId}-${mesIdx}`;
  const METODO_ESTADO = (e: string) => (e === "pagado" ? "Pagado ✓" : e === "no_pagado" ? "No pagado ✕" : e);

  // ¿está la casilla (fi, mi) dentro del rectángulo de selección en curso?
  const enSeleccion = (fi: number, mi: number) => {
    if (!selIni || !selFin) return false;
    return fi >= Math.min(selIni.fi, selFin.fi) && fi <= Math.max(selIni.fi, selFin.fi) &&
      mi >= Math.min(selIni.mi, selFin.mi) && mi <= Math.max(selIni.mi, selFin.mi);
  };

  const cargar = useCallback(async () => {
    const desde = `${anyo}-01-01`;
    const hasta = `${anyo + 1}-01-01`;
    const [fil, cli, cob, q, sal, cue] = await Promise.all([
      supabase.from("pagos_cobros_filas").select("id, orden, etiqueta, cliente_id, patron").eq("activa", true).order("orden"),
      supabase.from("clientes").select("id, nombre, apellidos, entrenador, canal, tipo_plan, fecha_inicio, fecha_baja, cuota_id, cuota_periodicidad, cuota_desde, descuento_pct, descuento_eur, domiciliado"),
      supabase.from("cobros").select("fecha, importe, facturas!inner(cliente_id, concepto)").gte("fecha", desde).lt("fecha", hasta),
      supabase.from("cuotas").select("id, precio_mensual, precio_trimestral, precio_semestral, precio_anual"),
      supabase.from("v_facturas_saldo").select("cliente_id, pendiente"),
      supabase.from("cuentas").select("id, codigo").eq("codigo", "banco").maybeSingle(),
    ]);
    if (fil.error) return setError(fil.error.message);
    if (cli.error) return setError(cli.error.message);
    setFilasBD((fil.data as Fila[]) ?? []);
    setClientes((cli.data as Cli[]) ?? []);
    setCobros((cob.data as unknown as CobroRow[]) ?? []);
    setCuotas((q.data as CuotaCat[]) ?? []);
    setBancoId((cue.data as { id: number } | null)?.id ?? null);
    // Marcas manuales del esquema (verde/rojo) del año
    const { data: mk } = await supabase
      .from("pagos_cobros_marcas")
      .select("fila_id, mes, estado, nota")
      .gte("mes", desde).lt("mes", hasta);
    const mm = new Map<string, { estado: string; nota: string | null }>();
    for (const x of (mk as { fila_id: number; mes: string; estado: string; nota: string | null }[]) ?? []) {
      mm.set(`${x.fila_id}-${new Date(x.mes + "T00:00:00").getMonth()}`, { estado: x.estado, nota: x.nota });
    }
    setMarcas(mm);
    const p = new Map<number, number>();
    for (const s of (sal.data as { cliente_id: number | null; pendiente: number }[]) ?? []) {
      if (s.cliente_id && Number(s.pendiente) > 0.01) p.set(s.cliente_id, (p.get(s.cliente_id) ?? 0) + Number(s.pendiente));
    }
    setPendientes(p);
  }, [anyo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = new Date();
  const mesActualIdx = hoy.getFullYear() === anyo ? hoy.getMonth() : hoy.getFullYear() < anyo ? -1 : 12;

  const porId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  // ---------- Interacción tipo Excel: clic en celda ----------
  async function abrirCelda(fila: Fila, mesIdx: number) {
    setError(null);
    const cli = fila.cliente_id ? porId.get(fila.cliente_id) ?? null : null;
    const desde = `${anyo}-${String(mesIdx + 1).padStart(2, "0")}-01`;
    const hasta = mesIdx === 11 ? `${anyo + 1}-01-01` : `${anyo}-${String(mesIdx + 2).padStart(2, "0")}-01`;
    let consulta = supabase
      .from("cobros")
      .select("id, fecha, importe, factura_id, afecta_caja, facturas!inner(concepto, iva_pct, cliente_id)")
      .gte("fecha", desde)
      .lt("fecha", hasta)
      .order("fecha");
    consulta = fila.cliente_id
      ? consulta.eq("facturas.cliente_id", fila.cliente_id)
      : consulta.is("facturas.cliente_id", null);
    const { data, error } = await consulta;
    if (error) return setError(error.message);
    let filas = (data as unknown as { id: number; fecha: string; importe: number; factura_id: number; afecta_caja: boolean | null; facturas: { concepto: string; iva_pct: number } }[]) ?? [];
    // Fila por patrón: quedarnos solo con los conceptos que casan
    if (!fila.cliente_id && fila.patron) {
      const re = regexDe(fila.patron);
      if (re) filas = filas.filter((x) => re.test(x.facturas?.concepto ?? ""));
    }
    // ¿Cuáles son la única entrega de su factura? (esas se pueden editar aquí)
    let unicos = new Set<number>();
    if (filas.length) {
      const { data: todos } = await supabase.from("cobros").select("factura_id").in("factura_id", filas.map((x) => x.factura_id));
      const cuenta = new Map<number, number>();
      for (const t of (todos as { factura_id: number }[]) ?? []) cuenta.set(t.factura_id, (cuenta.get(t.factura_id) ?? 0) + 1);
      unicos = new Set(filas.filter((x) => (cuenta.get(x.factura_id) ?? 1) === 1).map((x) => x.id));
    }
    setCeldaCobros(filas.map((x) => ({
      id: x.id, fecha: x.fecha, importe: Number(x.importe), factura_id: x.factura_id,
      concepto: x.facturas?.concepto ?? "", iva_pct: Number(x.facturas?.iva_pct ?? 0),
      unico: unicos.has(x.id), afecta_caja: x.afecta_caja !== false,
    })));
    setNuevoImporte("");
    setNuevoConcepto("");
    // Por defecto: los meses pasados son corrección histórica (no tocan caja)
    setNuevoHistorico(anyo < hoy.getFullYear() || (anyo === hoy.getFullYear() && mesIdx < hoy.getMonth()));
    setCelda({ fila, cli, mesIdx });
  }

  async function guardarPago() {
    if (!celda) return;
    const imp = Number(nuevoImporte.replace(",", "."));
    if (!Number.isFinite(imp) || imp <= 0) return setError("Pon un importe válido.");
    const { data: cat } = await supabase.from("categorias").select("id").eq("tipo", "ingreso").ilike("nombre", "otros").limit(1).maybeSingle();
    const catId = (cat as { id: number } | null)?.id;
    if (!catId || !bancoId) return setError("Faltan la categoría 'Otros' o la cuenta banco.");
    const c = celda.cli;
    const esMesActual = anyo === hoy.getFullYear() && celda.mesIdx === hoy.getMonth();
    const fecha = esMesActual ? hoy.toISOString().slice(0, 10) : `${anyo}-${String(celda.mesIdx + 1).padStart(2, "0")}-15`;
    // En filas agregadas (sin ficha) el concepto lleva la etiqueta para que siga casando con el patrón
    const conceptoDefecto = c
      ? `Pago ${MESES[celda.mesIdx]} ${anyo}`
      : `${celda.fila.etiqueta} ${MESES[celda.mesIdx]} ${anyo}`;
    const { data: fac, error: e1 } = await supabase
      .from("facturas")
      .insert({
        cliente_id: c?.id ?? null, categoria_id: catId,
        atribucion: c && ["luis", "david"].includes(c.entrenador) ? c.entrenador : "ethos",
        fecha_emision: fecha,
        concepto: nuevoConcepto.trim() || conceptoDefecto,
        base: Math.round(imp * 100) / 100, iva_pct: 0, irpf_pct: 0,
        canal: c?.canal ?? "presencial",
        computa_reparto: !nuevoHistorico, computa_impuestos: !nuevoHistorico, es_recurrente: false,
      })
      .select("id").single();
    if (e1 || !fac) return setError(e1?.message ?? "No se pudo crear.");
    const { error: e2 } = await supabase.from("cobros").insert({
      factura_id: fac.id, fecha, importe: Math.round(imp * 100) / 100,
      cuenta_id: bancoId, metodo: "transferencia", afecta_caja: !nuevoHistorico,
    });
    if (e2) return setError(e2.message);
    await abrirCelda(celda.fila, celda.mesIdx);
    cargar();
  }

  // Corrige el importe (solo si es la única entrega de su factura: se ajusta también la base)
  async function editarCobroCelda(row: CeldaCobro, texto: string) {
    const n = Number(texto.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || Math.abs(n - row.importe) < 0.005) return;
    const base = Math.round((n / (1 + row.iva_pct)) * 100) / 100;
    const u1 = await supabase.from("facturas").update({ base }).eq("id", row.factura_id);
    if (u1.error) return setError(u1.error.message);
    const u2 = await supabase.from("cobros").update({ importe: Math.round(n * 100) / 100 }).eq("id", row.id);
    if (u2.error) return setError(u2.error.message);
    if (celda) await abrirCelda(celda.fila, celda.mesIdx);
    cargar();
  }

  async function borrarCobroCelda(row: CeldaCobro) {
    if (!confirm(`¿Borrar el pago de ${n2(row.importe)} € (${row.concepto})?`)) return;
    const d1 = await supabase.from("cobros").delete().eq("id", row.id);
    if (d1.error) return setError(d1.error.message);
    await supabase.from("facturas").delete().eq("id", row.factura_id); // si tiene más cobros u otras referencias, fallará y la factura queda (correcto)
    if (celda) await abrirCelda(celda.fila, celda.mesIdx);
    cargar();
  }

  // ---------- Gestión de filas ----------
  const ordenSiguiente = () => (filasBD.length ? Math.max(...filasBD.map((f) => f.orden)) + 10 : 10);

  async function anadirFilaCliente() {
    const id = Number(addCliente);
    if (!id) return;
    const c = porId.get(id);
    if (!c) return;
    const { error } = await supabase.from("pagos_cobros_filas").insert({
      orden: ordenSiguiente(), etiqueta: `${c.nombre} ${c.apellidos ?? ""}`.trim(), cliente_id: id,
    });
    if (error) return setError(error.message);
    setAddCliente("");
    cargar();
  }

  async function crearClienteRapido() {
    const nombre = altaNombre.trim();
    if (!nombre) return setError("Pon el nombre.");
    const nn = nombre.toLowerCase();
    const parecido = clientes.find((x) => `${x.nombre} ${x.apellidos ?? ""}`.trim().toLowerCase().includes(nn));
    if (parecido && !confirm(`Ya existe "${parecido.nombre} ${parecido.apellidos ?? ""}". ¿Crear otra ficha igualmente?`)) return;
    const { data, error } = await supabase.from("clientes").insert({
      nombre, entrenador: altaEntrenador, estado: "cliente", origen: "manual",
      tipo_plan: altaPlan.trim() || null, fecha_inicio: hoy.toISOString().slice(0, 10),
    }).select("id").single();
    if (error || !data) return setError(error?.message ?? "No se pudo crear.");
    await supabase.from("pagos_cobros_filas").insert({ orden: ordenSiguiente(), etiqueta: nombre, cliente_id: data.id });
    setAltaNombre(""); setAltaPlan("");
    cargar();
  }

  async function quitarFila(f: Fila) {
    if (!confirm(`¿Quitar la fila "${f.etiqueta}" de la matriz? (no borra al cliente ni sus pagos)`)) return;
    const { error } = await supabase.from("pagos_cobros_filas").delete().eq("id", f.id);
    if (error) return setError(error.message);
    cargar();
  }

  // Cobrado por cliente y mes + reparto de los "sin cliente" entre filas de patrón
  const { porCliente, porPatron, otrosSinCliente } = useMemo(() => {
    const pc = new Map<number, number[]>();
    const pp = new Map<number, number[]>(); // fila.id -> meses
    const otros = Array(12).fill(0);
    const patrones = filasBD
      .filter((f) => !f.cliente_id && f.patron)
      .map((f) => ({ id: f.id, re: regexDe(f.patron as string) }))
      .filter((x) => x.re) as { id: number; re: RegExp }[];
    for (const c of cobros) {
      const m = new Date(c.fecha + "T00:00:00").getMonth();
      const id = c.facturas?.cliente_id ?? null;
      if (id !== null) {
        const arr = pc.get(id) ?? Array(12).fill(0);
        arr[m] += Number(c.importe);
        pc.set(id, arr);
        continue;
      }
      const concepto = c.facturas?.concepto ?? "";
      const casa = patrones.find((p) => p.re.test(concepto));
      if (casa) {
        const arr = pp.get(casa.id) ?? Array(12).fill(0);
        arr[m] += Number(c.importe);
        pp.set(casa.id, arr);
      } else {
        otros[m] += Number(c.importe);
      }
    }
    return { porCliente: pc, porPatron: pp, otrosSinCliente: otros };
  }, [cobros, filasBD]);

  // Precio previsto de la cuota del cliente para un mes concreto (según su ciclo)
  const previstoDe = (c: Cli, mesIdx: number): number | null => {
    if (!c.cuota_id || c.fecha_baja) return null;
    const q = cuotas.find((x) => x.id === c.cuota_id);
    if (!q) return null;
    const campo = (`precio_${c.cuota_periodicidad || "mensual"}`) as keyof CuotaCat;
    const base = q[campo];
    if (base === null || base === undefined) return null;
    const desde = c.cuota_desde ?? c.fecha_inicio;
    const ancla = desde ? new Date(desde + "T00:00:00") : null;
    const periodo = PERIODO[c.cuota_periodicidad] ?? 1;
    if (ancla) {
      const diff = (anyo - ancla.getFullYear()) * 12 + (mesIdx - ancla.getMonth());
      if (diff < 0 || diff % periodo !== 0) return null;
    } else if (periodo > 1) {
      return null;
    }
    return Math.max(0, Math.round((Number(base) * (1 - Number(c.descuento_pct) / 100) - Number(c.descuento_eur)) * 100) / 100);
  };

  // Filas visibles en el orden fijo de la tabla
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filasBD
      .map((f) => {
        const c = f.cliente_id ? porId.get(f.cliente_id) ?? null : null;
        const vals = f.cliente_id
          ? porCliente.get(f.cliente_id) ?? Array(12).fill(0)
          : porPatron.get(f.id) ?? Array(12).fill(0);
        return { f, c, vals };
      })
      .filter(({ c }) => {
        if (fEntrenador === "david" || fEntrenador === "luis") return c?.entrenador === fEntrenador;
        if (fEntrenador === "empresa") return !c || (c.entrenador !== "david" && c.entrenador !== "luis");
        return true;
      })
      .filter(({ f, c }) => !q || f.etiqueta.toLowerCase().includes(q) || (c && `${c.nombre} ${c.apellidos ?? ""}`.toLowerCase().includes(q)));
  }, [filasBD, porId, porCliente, porPatron, fEntrenador, busqueda]);

  // Clientes con ficha que aún no tienen fila (para el desplegable de añadir)
  const clientesSinFila = useMemo(() => {
    const con = new Set(filasBD.map((f) => f.cliente_id).filter(Boolean));
    return clientes
      .filter((c) => !con.has(c.id))
      .sort((a, b) => `${a.nombre} ${a.apellidos ?? ""}`.localeCompare(`${b.nombre} ${b.apellidos ?? ""}`));
  }, [clientes, filasBD]);

  // Totales por grupo (David / Luis / Empresa) y total mensual — sobre TODO, sin filtros
  const totales = useMemo(() => {
    const g: Record<string, number[]> = { David: Array(12).fill(0), Luis: Array(12).fill(0), Empresa: Array(12).fill(0) };
    for (const c of cobros) {
      const m = new Date(c.fecha + "T00:00:00").getMonth();
      const id = c.facturas?.cliente_id ?? null;
      const cli = id ? porId.get(id) : null;
      const clave = cli ? GRUPO[cli.entrenador] ?? "Empresa" : "Empresa";
      g[clave][m] += Number(c.importe);
    }
    const mensual = Array(12).fill(0);
    (Object.values(g) as number[][]).forEach((arr) => arr.forEach((v, i) => (mensual[i] += v)));
    return { g, mensual };
  }, [cobros, porId]);

  const bajaEnMes = (c: Cli | null, mesIdx: number) => {
    if (!c?.fecha_baja) return false;
    const b = new Date(c.fecha_baja + "T00:00:00");
    return anyo > b.getFullYear() || (anyo === b.getFullYear() && mesIdx > b.getMonth());
  };

  const suma = (a: number[]) => a.reduce((s, x) => s + x, 0);

  const celdaNum = (v: number, cls = "text-zinc-300") =>
    Math.abs(v) < 0.005 ? <td className="px-2 py-1 text-right text-zinc-800">·</td> : <td className={`px-2 py-1 text-right tabular-nums ${cls}`}>{n2(v)}</td>;

  // ---- Esquema: arrastre de selección y aplicación de marca ----
  function inicioArrastre(fi: number, mi: number) {
    if (!modoEsquema) return;
    setSelIni({ fi, mi }); setSelFin({ fi, mi }); setArrastrando(true); setBarra(null);
  }
  function entraArrastre(fi: number, mi: number) {
    if (arrastrando) setSelFin({ fi, mi });
  }
  function finArrastre() {
    if (!arrastrando || !selIni || !selFin) { setArrastrando(false); return; }
    setArrastrando(false);
    const celdas: { filaId: number; mesIdx: number }[] = [];
    for (let fi = Math.min(selIni.fi, selFin.fi); fi <= Math.max(selIni.fi, selFin.fi); fi++) {
      const fila = filas[fi];
      if (!fila) continue;
      for (let mi = Math.min(selIni.mi, selFin.mi); mi <= Math.max(selIni.mi, selFin.mi); mi++) {
        celdas.push({ filaId: fila.f.id, mesIdx: mi });
      }
    }
    // Nota por defecto: si el bloque abarca varios meses, sugiere la periodicidad
    const nMeses = Math.abs(selFin.mi - selIni.mi) + 1;
    setNotaBarra(nMeses === 3 ? "Trimestral" : nMeses === 6 ? "Semestral" : nMeses === 12 ? "Anual" : "");
    setBarra({ celdas });
  }

  async function aplicarMarca(estado: "pagado" | "no_pagado" | "borrar") {
    if (!barra) return;
    if (estado === "borrar") {
      for (const cel of barra.celdas) {
        await supabase.from("pagos_cobros_marcas").delete().eq("fila_id", cel.filaId).eq("mes", mesISO(cel.mesIdx));
      }
    } else {
      const filasSQL = barra.celdas.map((cel) => ({ fila_id: cel.filaId, mes: mesISO(cel.mesIdx), estado, nota: notaBarra.trim() || null, actualizado_en: new Date().toISOString() }));
      const { error } = await supabase.from("pagos_cobros_marcas").upsert(filasSQL, { onConflict: "fila_id,mes" });
      if (error) return setError(error.message);
    }
    setBarra(null); setSelIni(null); setSelFin(null); setNotaBarra("");
    cargar();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input placeholder="Buscar fila…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputCls} min-w-48 flex-1 sm:max-w-xs`} />
        <select value={fEntrenador} onChange={(e) => setFEntrenador(e.target.value)} className={`${inputCls} appearance-none`}>
          <option value="todos">Entrenador: todos</option>
          <option value="david">David</option>
          <option value="luis">Luis</option>
          <option value="empresa">Empresa (Ethos/Alex)</option>
        </select>
        <select value={anyo} onChange={(e) => setAnyo(Number(e.target.value))} className={`${inputCls} appearance-none`}>
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={() => { setModoEsquema(!modoEsquema); setBarra(null); setSelIni(null); setSelFin(null); }}
          title="Pintar casillas a mano (verde=pagado, rojo=no pagado). No toca las cuentas: es solo vuestro esquema de control."
          className={`ml-auto rounded-full px-4 py-1.5 text-xs font-bold ${modoEsquema ? "bg-sky-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
        >
          {modoEsquema ? "✓ Modo esquema" : "🎨 Modo esquema"}
        </button>
        <button onClick={() => setGestionando(!gestionando)} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white">
          {gestionando ? "Cerrar" : "+ Añadir fila"}
        </button>
      </div>

      {gestionando && (
        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Cliente existente:</span>
            <select value={addCliente} onChange={(e) => setAddCliente(e.target.value)} className={`${inputCls} min-w-56 appearance-none`}>
              <option value="">— elige cliente —</option>
              {clientesSinFila.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ""}</option>
              ))}
            </select>
            <button onClick={anadirFilaCliente} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white">Añadir a la matriz</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-2">
            <span className="text-xs font-bold text-zinc-400">Cliente nuevo:</span>
            <input placeholder="Nombre y apellidos" value={altaNombre} onChange={(e) => setAltaNombre(e.target.value)} className={inputCls} />
            <select value={altaEntrenador} onChange={(e) => setAltaEntrenador(e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="ethos">Empresa</option>
              <option value="david">David</option>
              <option value="luis">Luis</option>
            </select>
            <input placeholder="Servicio/plan (opcional)" value={altaPlan} onChange={(e) => setAltaPlan(e.target.value)} className={inputCls} />
            <button onClick={crearClienteRapido} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white">Crear y añadir</button>
            <span className="text-[10px] text-zinc-600">Se crea también en Contactos (edítalo allí para email, cuota…)</span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Totales por entrenador (como la cabecera del Excel) */}
      <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Ingresos {anyo}</th>
              {MESES.map((m) => <th key={m} className="min-w-16 px-2 py-1.5 text-right">{m}</th>)}
              <th className="min-w-20 border-l border-zinc-800 px-3 py-1.5 text-right text-zinc-400">Total anual</th>
            </tr>
          </thead>
          <tbody>
            {(["David", "Luis", "Empresa"] as const).map((gr) => (
              <tr key={gr} className="border-b border-zinc-800/50">
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1 font-bold text-zinc-300">{gr}</td>
                {totales.g[gr].map((v, i) => <Fragment key={i}>{celdaNum(v)}</Fragment>)}
                <td className="border-l border-zinc-800 px-3 py-1 text-right font-bold tabular-nums text-zinc-200">{n2(suma(totales.g[gr]))}</td>
              </tr>
            ))}
            <tr className="bg-emerald-950/30 font-black">
              <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 text-emerald-400">TOTAL MENSUAL</td>
              {totales.mensual.map((v, i) => <Fragment key={i}>{celdaNum(v, "text-emerald-400 font-black")}</Fragment>)}
              <td className="border-l border-zinc-800 px-3 py-1.5 text-right tabular-nums text-emerald-400">{n2(suma(totales.mensual))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {modoEsquema && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-sky-900 bg-sky-950/20 px-3 py-2 text-[11px] text-zinc-400">
          <b className="text-sky-400">Modo esquema activo.</b> Arrastra el ratón sobre las casillas para seleccionarlas
          (varios meses = un pago trimestral/semestral/anual). Al soltar eliges color y nota.
          <span className="text-zinc-600">Verde = pagado · Rojo = no pagado. No afecta a las cuentas.</span>
        </div>
      )}

      {/* Barra de acción tras seleccionar un rango */}
      {barra && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
          <span className="text-xs font-bold text-white">{barra.celdas.length} casilla(s) seleccionada(s)</span>
          <input
            placeholder="Nota (ej: Trimestral, pagó en enero…)"
            value={notaBarra}
            onChange={(e) => setNotaBarra(e.target.value)}
            className="min-w-40 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-red-500"
          />
          <button onClick={() => aplicarMarca("pagado")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">✓ Pagado</button>
          <button onClick={() => aplicarMarca("no_pagado")} className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600">✕ No pagado</button>
          <button onClick={() => aplicarMarca("borrar")} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:bg-zinc-700">Quitar color</button>
          <button onClick={() => { setBarra(null); setSelIni(null); setSelFin(null); }} className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-500">Cancelar</button>
        </div>
      )}

      {/* Matriz fila × mes */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full select-none text-xs" onMouseLeave={() => arrastrando && finArrastre()} onMouseUp={finArrastre}>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-[9px] font-black uppercase tracking-wider text-zinc-600">
              <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-1.5 text-left">Fila</th>
              <th className="px-2 py-1.5 text-left">Ent.</th>
              {MESES.map((m, i) => (
                <th key={m} className={`min-w-16 px-2 py-1.5 text-right ${i === mesActualIdx ? "text-red-400" : ""}`}>{m}</th>
              ))}
              <th className="min-w-20 border-l border-zinc-800 px-3 py-1.5 text-right text-zinc-400">Total</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ f, c, vals }, fi) => {
              const pend = c ? pendientes.get(c.id) ?? 0 : 0;
              return (
                <tr key={f.id} className="group border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/40">
                  <td className="sticky left-0 z-10 max-w-48 bg-zinc-950/95 px-3 py-1">
                    {c ? (
                      <Link href={`/clientes/${c.id}`} className="block truncate font-semibold text-zinc-200 hover:text-red-400">
                        {f.etiqueta}
                      </Link>
                    ) : (
                      <span className="block truncate font-semibold text-zinc-400">{f.etiqueta}</span>
                    )}
                    <span className="block truncate text-[10px] text-zinc-600">
                      {c?.tipo_plan ?? (f.patron ? "agregado" : "")}
                      {pend > 0.01 && <span className="ml-1 rounded bg-amber-950 px-1 py-0.5 text-[9px] font-bold text-amber-400">debe {n2(pend)}</span>}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-[10px] text-zinc-500">{c ? GRUPO[c.entrenador] ?? "Emp." : "Emp."}</td>
                  {vals.map((v: number, i: number) => {
                    const marca = marcas.get(claveMarca(f.id, i));
                    const sel = modoEsquema && enSeleccion(fi, i);
                    // Fondo de la marca manual (esquema): verde=pagado, rojo=no pagado
                    const bgMarca = marca?.estado === "pagado" ? "bg-emerald-900/50" : marca?.estado === "no_pagado" ? "bg-red-900/50" : "";
                    const borde = sel ? "ring-1 ring-inset ring-sky-400 bg-sky-500/20" : "";
                    // En modo esquema: eventos de arrastre y sin abrir el pago real
                    const props = modoEsquema
                      ? {
                          onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); inicioArrastre(fi, i); },
                          onMouseEnter: () => entraArrastre(fi, i),
                          className: `cursor-cell ${bgMarca} ${borde}`,
                          title: marca?.nota ?? (marca ? METODO_ESTADO(marca.estado) : "Arrastra para marcar"),
                        }
                      : {
                          onClick: () => abrirCelda(f, i),
                          className: `cursor-pointer hover:bg-zinc-800/60 ${bgMarca}`,
                          title: marca?.nota ? `${METODO_ESTADO(marca.estado)} · ${marca.nota}` : "Clic para apuntar o corregir pagos de este mes",
                        };
                    if (bajaEnMes(c, i) && Math.abs(v) < 0.005)
                      return <td key={i} {...props} className={`${props.className} px-2 py-1 text-center text-[9px] font-bold uppercase text-zinc-700`}>baja</td>;
                    if (Math.abs(v) > 0.005)
                      return <td key={i} {...props} className={`${props.className} px-2 py-1 text-right tabular-nums ${i === mesActualIdx ? "font-bold text-white" : "text-zinc-300"}`}>{n2(v)}</td>;
                    // Sin cobro: si es un mes futuro y tiene cuota, enseña lo previsto atenuado
                    if (!modoEsquema && c && i > mesActualIdx && anyo >= hoy.getFullYear()) {
                      const prev = previstoDe(c, i);
                      if (prev !== null && prev > 0)
                        return <td key={i} {...props} className={`${props.className} px-2 py-1 text-right italic tabular-nums text-zinc-600`}>{n2(prev)}</td>;
                    }
                    return <td key={i} {...props} className={`${props.className} px-2 py-1 text-right text-zinc-800`}>·</td>;
                  })}
                  <td className="border-l border-zinc-800 px-3 py-1 text-right font-bold tabular-nums text-zinc-200">{n2(suma(vals))}</td>
                  <td className="px-1 py-1 text-center">
                    <button
                      onClick={() => quitarFila(f)}
                      title="Quitar fila de la matriz (no borra al cliente)"
                      className="font-bold text-transparent group-hover:text-zinc-600 hover:!text-red-400"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* Ingresos sin cliente que no casan con ningún agregado */}
            {suma(otrosSinCliente) > 0.005 && (
              <tr className="border-t border-zinc-700 bg-zinc-900/60">
                <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-1.5 font-bold text-zinc-400">Otros sin fila</td>
                <td className="px-2 py-1 text-[10px] text-zinc-500">Emp.</td>
                {otrosSinCliente.map((v, i) => <Fragment key={i}>{celdaNum(v, "text-zinc-400")}</Fragment>)}
                <td className="border-l border-zinc-800 px-3 py-1.5 text-right font-bold tabular-nums text-zinc-300">{n2(suma(otrosSinCliente))}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-zinc-600">
        <b>Clic en cualquier casilla</b> para apuntar o corregir pagos de esa fila y mes, como en el Excel.
        <b> baja</b> = meses posteriores a su baja · <span className="italic">cursiva</span> = previsto por su cuota ·
        <b className="text-amber-500"> debe</b> = pendiente de cobro · <b>agregado</b> = suma ingresos sin ficha por concepto
        (grupales, merchan…). <b>Otros sin fila</b> = ingresos sin cliente que no casan con ningún agregado.
        <br />
        <b className="text-sky-400">🎨 Modo esquema</b>: fondo <span className="rounded bg-emerald-900/50 px-1 text-emerald-300">verde = pagado</span> ·
        <span className="rounded bg-red-900/50 px-1 text-red-300"> rojo = no pagado</span>. Arrastra sobre varios meses para marcar un pago
        trimestral/semestral/anual con su nota. Este esquema es solo vuestro control de previsión: <b>no afecta a las cuentas</b>.
      </p>

      {/* Celda abierta: pagos de la fila en ese mes */}
      <Modal
        abierto={!!celda}
        onCerrar={() => setCelda(null)}
        titulo={celda ? `${celda.fila.etiqueta} · ${MESES[celda.mesIdx]} ${anyo}` : ""}
        ancho="max-w-lg"
      >
        {celda && (
          <div className="flex flex-col gap-3">
            {celdaCobros.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                {celdaCobros.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 border-b border-zinc-800/60 px-3 py-1.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-zinc-300">{r.concepto}</p>
                      <p className="text-[10px] text-zinc-600">
                        {new Date(r.fecha).toLocaleDateString("es-ES")}
                        {!r.afecta_caja && <span className="ml-1.5 rounded bg-sky-950 px-1 py-0.5 text-[9px] font-bold text-sky-400">histórico</span>}
                      </p>
                    </div>
                    {r.unico ? (
                      <>
                        <input
                          key={`${r.id}-${r.importe}`}
                          defaultValue={r.importe.toFixed(2)}
                          onBlur={(e) => editarCobroCelda(r, e.target.value)}
                          inputMode="decimal"
                          className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-right text-xs tabular-nums text-white outline-none focus:border-red-500"
                        />
                        <span className="text-[10px] text-zinc-600">€</span>
                        <button onClick={() => borrarCobroCelda(r)} title="Borrar este pago" className="px-1 font-bold text-zinc-600 hover:text-red-400">✕</button>
                      </>
                    ) : (
                      <span className="text-xs font-bold tabular-nums text-zinc-300">{n2(r.importe)} € <span className="text-[9px] font-normal text-zinc-600">(parcial: edítalo en su ficha)</span></span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-center text-xs text-zinc-600">Sin pagos apuntados este mes.</p>
            )}

            {/* Apuntar pago nuevo, como escribir en la casilla del Excel */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase text-zinc-500">Importe €</span>
                  <input inputMode="decimal" placeholder="0,00" value={nuevoImporte} onChange={(e) => setNuevoImporte(e.target.value)} className={`${inputCls} w-24 text-right`} autoFocus />
                </label>
                <label className="flex min-w-32 flex-1 flex-col gap-1"><span className="text-[10px] font-bold uppercase text-zinc-500">Concepto (opcional)</span>
                  <input placeholder={celda.cli ? `Pago ${MESES[celda.mesIdx]}` : `${celda.fila.etiqueta} ${MESES[celda.mesIdx]}`} value={nuevoConcepto} onChange={(e) => setNuevoConcepto(e.target.value)} className={inputCls} />
                </label>
                <button onClick={guardarPago} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Apuntar</button>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={nuevoHistorico} onChange={(e) => setNuevoHistorico(e.target.checked)} className="h-4 w-4 accent-red-600" />
                Histórico: no toca los saldos de caja ni el reparto <span className="text-[10px] text-zinc-600">(desmárcalo si es dinero que entra ahora al banco)</span>
              </label>
              {!celda.cli && celda.fila.patron && (
                <p className="mt-1 text-[10px] text-zinc-600">
                  Fila agregada: si cambias el concepto, procura que incluya «{celda.fila.etiqueta.toLowerCase()}» para que siga contando aquí.
                </p>
              )}
            </div>
            <p className="text-[10px] leading-snug text-zinc-600">
              Todo lo que apuntes aquí queda en la contabilidad de verdad (Libro, CRM, LTV), así la matriz nunca se
              desincroniza. Para cobros parciales de facturas grandes usa la ficha del cliente.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
