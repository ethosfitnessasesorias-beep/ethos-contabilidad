"use client";

// Importador de domiciliaciones de BEMADBOX (remesa SEPA pain.008).
// Lee el XML, empareja cada recibo con su cliente y crea el cobro de cada uno
// (como COBRADO, cuenta banco, fecha de cobro de la remesa). Recuerda el
// emparejamiento por nº de mandato y evita duplicados por el ID de cada recibo,
// todo guardado en config_texto (sin tablas nuevas). Si una domiciliación se
// devuelve, basta con borrar ese cobro a mano en la factura del cliente.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { eur } from "@/lib/formato";

interface Cli { id: number; nombre: string; apellidos: string | null; entrenador: string }
interface Tx {
  endToEndId: string;
  nombre: string;      // nombre que viene en el recibo
  importe: number;
  mandato: string;
  iban: string;
  concepto: string;
}

const inputCls = "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-red-500";
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Normaliza nombres para emparejar: mayúsculas, sin tildes, solo letras/números
const norm = (s: string) =>
  (s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const normMand = (s: string) => (s || "").replace(/\s+/g, "");

function parseSEPA(xml: string): { txs: Tx[]; fechaCobro: string | null } {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("XML inválido");
  const uno = (el: Element | Document, tag: string) =>
    (el.getElementsByTagNameNS("*", tag)[0]?.textContent ?? "").trim();
  const fechaCobro = uno(doc, "ReqdColltnDt") || null;
  const txs: Tx[] = [];
  for (const inf of Array.from(doc.getElementsByTagNameNS("*", "DrctDbtTxInf"))) {
    const dbtr = inf.getElementsByTagNameNS("*", "Dbtr")[0];
    txs.push({
      endToEndId: uno(inf, "EndToEndId"),
      nombre: dbtr ? uno(dbtr, "Nm") : "",
      importe: Math.round(Number(uno(inf, "InstdAmt")) * 100) / 100,
      mandato: normMand(uno(inf, "MndtId")),
      iban: uno(inf, "IBAN"),
      concepto: uno(inf, "Ustrd"),
    });
  }
  return { txs, fechaCobro };
}

export default function ImportarSepaPage() {
  const [clientes, setClientes] = useState<Cli[]>([]);
  const [bancoId, setBancoId] = useState<number | null>(null);
  const [catId, setCatId] = useState<number | null>(null);
  const [mandatos, setMandatos] = useState<Record<string, number>>({});
  const [importados, setImportados] = useState<Set<string>>(new Set());
  const [txs, setTxs] = useState<Tx[]>([]);
  const [fechaCobro, setFechaCobro] = useState("");
  const [asign, setAsign] = useState<Record<string, number | null>>({});
  const [incluir, setIncluir] = useState<Record<string, boolean>>({});
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const [cli, cue, cat, cfgM, cfgI] = await Promise.all([
      supabase.from("clientes").select("id, nombre, apellidos, entrenador").order("nombre"),
      supabase.from("cuentas").select("id, codigo").eq("codigo", "banco").maybeSingle(),
      supabase.from("categorias").select("id, nombre").eq("tipo", "ingreso"),
      supabase.from("config_texto").select("valor").eq("clave", "sepa_mandatos").maybeSingle(),
      supabase.from("config_texto").select("valor").eq("clave", "sepa_importados").maybeSingle(),
    ]);
    setClientes((cli.data as Cli[]) ?? []);
    setBancoId((cue.data as { id: number } | null)?.id ?? null);
    const cats = (cat.data as { id: number; nombre: string }[]) ?? [];
    setCatId(cats.find((c) => /grupal/i.test(c.nombre))?.id ?? cats.find((c) => /otros/i.test(c.nombre))?.id ?? cats[0]?.id ?? null);
    try { setMandatos(JSON.parse((cfgM.data as { valor: string } | null)?.valor ?? "{}")); } catch { setMandatos({}); }
    try { setImportados(new Set(JSON.parse((cfgI.data as { valor: string } | null)?.valor ?? "[]"))); } catch { setImportados(new Set()); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const porNombre = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clientes) m.set(norm(`${c.nombre} ${c.apellidos ?? ""}`), c.id);
    return m;
  }, [clientes]);

  const emparejar = useCallback((t: Tx): number | null => {
    if (t.mandato && mandatos[t.mandato]) return mandatos[t.mandato];
    const n = norm(t.nombre);
    if (porNombre.has(n)) return porNombre.get(n)!;
    for (const c of clientes) {
      const cn = norm(`${c.nombre} ${c.apellidos ?? ""}`);
      if (cn.length >= 6 && (cn.includes(n) || n.includes(cn))) return c.id;
    }
    return null;
  }, [mandatos, porNombre, clientes]);

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNombreArchivo(file.name); setError(null); setOk(null);
    let parsed: { txs: Tx[]; fechaCobro: string | null };
    try { parsed = parseSEPA(await file.text()); } catch { return setError("No se pudo leer el XML de la remesa."); }
    if (!parsed.txs.length) return setError("No encontré domiciliaciones en el archivo.");
    setTxs(parsed.txs);
    setFechaCobro(parsed.fechaCobro ?? new Date().toISOString().slice(0, 10));
    const a: Record<string, number | null> = {};
    const inc: Record<string, boolean> = {};
    for (const t of parsed.txs) {
      const cid = emparejar(t);
      a[t.endToEndId] = cid;
      inc[t.endToEndId] = !importados.has(t.endToEndId) && cid !== null;
    }
    setAsign(a); setIncluir(inc);
  }

  const resumen = useMemo(() => {
    let nuevos = 0, yaImp = 0, sinAsignar = 0, totalSel = 0, totalArchivo = 0;
    for (const t of txs) {
      totalArchivo += t.importe;
      if (importados.has(t.endToEndId)) { yaImp++; continue; }
      nuevos++;
      if (asign[t.endToEndId] == null) sinAsignar++;
      if (incluir[t.endToEndId] && asign[t.endToEndId] != null) totalSel += t.importe;
    }
    return {
      nuevos, yaImp, sinAsignar,
      totalSel: Math.round(totalSel * 100) / 100,
      totalArchivo: Math.round(totalArchivo * 100) / 100,
      seleccionados: txs.filter((t) => incluir[t.endToEndId] && asign[t.endToEndId] != null && !importados.has(t.endToEndId)).length,
    };
  }, [txs, asign, incluir, importados]);

  async function importar() {
    if (!bancoId) return setError("No encuentro la cuenta 'banco'.");
    if (!catId) return setError("No encuentro una categoría de ingreso.");
    const aMeter = txs.filter((t) => incluir[t.endToEndId] && asign[t.endToEndId] != null && !importados.has(t.endToEndId));
    if (!aMeter.length) return setError("No hay nada seleccionado para importar.");
    setGuardando(true); setError(null); setOk(null);
    const mes = fechaCobro ? MESES[Number(fechaCobro.slice(5, 7)) - 1] : "";
    const anyo = fechaCobro ? fechaCobro.slice(0, 4) : "";
    const concepto = `Grupales ${mes} ${anyo}`.trim();
    const nuevosMand = { ...mandatos };
    const nuevosImp = new Set(importados);
    let hechos = 0, suma = 0;
    for (const t of aMeter) {
      const cid = asign[t.endToEndId]!;
      const { data: fac, error: e1 } = await supabase.from("facturas").insert({
        cliente_id: cid, categoria_id: catId, atribucion: "ethos",
        fecha_emision: fechaCobro, concepto, base: t.importe, iva_pct: 0, irpf_pct: 0,
        canal: "presencial", computa_reparto: true, computa_impuestos: true, es_recurrente: false,
      }).select("id").single();
      if (e1 || !fac) { setError(`Error creando la factura de ${t.nombre}: ${e1?.message}`); break; }
      const { error: e2 } = await supabase.from("cobros").insert({
        factura_id: fac.id, fecha: fechaCobro, importe: t.importe,
        cuenta_id: bancoId, metodo: "transferencia", afecta_caja: true,
      });
      if (e2) { setError(`Error apuntando el cobro de ${t.nombre}: ${e2.message}`); break; }
      if (t.mandato) nuevosMand[t.mandato] = cid;
      nuevosImp.add(t.endToEndId);
      hechos++; suma += t.importe;
    }
    await supabase.from("config_texto").upsert({ clave: "sepa_mandatos", valor: JSON.stringify(nuevosMand), descripcion: "Emparejamiento mandato SEPA → cliente (BEMADBOX)" });
    await supabase.from("config_texto").upsert({ clave: "sepa_importados", valor: JSON.stringify([...nuevosImp]), descripcion: "IDs de recibos SEPA ya importados (anti-duplicado)" });
    setMandatos(nuevosMand); setImportados(nuevosImp);
    setIncluir((prev) => { const n = { ...prev }; for (const t of aMeter) if (nuevosImp.has(t.endToEndId)) n[t.endToEndId] = false; return n; });
    setGuardando(false);
    setOk(`✅ ${hechos} cobros apuntados (${eur(Math.round(suma * 100) / 100)}) con fecha ${fechaCobro}. Si alguna domiciliación se devuelve, bórrala en la factura del cliente.`);
  }

  const clientesOrden = useMemo(
    () => [...clientes].sort((a, b) => `${a.nombre} ${a.apellidos ?? ""}`.localeCompare(`${b.nombre} ${b.apellidos ?? ""}`)),
    [clientes]
  );
  const nombreCli = (id: number | null) => {
    if (id == null) return "";
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellidos ?? ""}`.trim() : "";
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-black text-white">Importar domiciliaciones (BEMADBOX)</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
          Sube el archivo SEPA de la remesa de grupales y crea el cobro de cada cliente de golpe. Recuerda los
          emparejamientos de un mes para el siguiente y no duplica recibos ya importados.
        </p>
      </div>

      {error && <p className="mb-3 rounded-xl bg-red-950 px-4 py-2 text-sm text-red-300">{error}</p>}
      {ok && <p className="mb-3 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-300">{ok}</p>}

      {/* Paso 1: subir */}
      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">
            Elegir archivo SEPA (.xml)
            <input type="file" accept=".xml,text/xml,application/xml" onChange={onArchivo} className="hidden" />
          </label>
          <span className="text-xs text-zinc-500">{nombreArchivo || "Ningún archivo aún"}</span>
          {txs.length > 0 && (
            <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
              Fecha de cobro
              <input type="date" value={fechaCobro} onChange={(e) => setFechaCobro(e.target.value)} className={inputCls} />
            </label>
          )}
        </div>
        {txs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
            <span>Recibos: <b className="text-zinc-300">{txs.length}</b></span>
            <span>Total archivo: <b className="text-zinc-300">{eur(resumen.totalArchivo)}</b></span>
            <span>Nuevos: <b className="text-zinc-300">{resumen.nuevos}</b></span>
            {resumen.yaImp > 0 && <span>Ya importados: <b className="text-zinc-400">{resumen.yaImp}</b></span>}
            {resumen.sinAsignar > 0 && <span className="text-amber-400">Sin cliente: <b>{resumen.sinAsignar}</b> (asígnalos abajo)</span>}
          </div>
        )}
      </div>

      {/* Paso 2: revisar y emparejar */}
      {txs.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2.5 text-center">✓</th>
                  <th className="px-3 py-2.5">Recibo (nombre del banco)</th>
                  <th className="px-3 py-2.5 text-right">Importe</th>
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const ya = importados.has(t.endToEndId);
                  const cid = asign[t.endToEndId] ?? null;
                  const auto = !ya && cid != null && !!(t.mandato && mandatos[t.mandato]);
                  return (
                    <tr key={t.endToEndId} className={`border-b border-zinc-800/60 last:border-0 ${ya ? "opacity-40" : "hover:bg-zinc-900/40"}`}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={ya || cid == null}
                          checked={!!incluir[t.endToEndId] && !ya && cid != null}
                          onChange={(e) => setIncluir((p) => ({ ...p, [t.endToEndId]: e.target.checked }))}
                          className="h-4 w-4 accent-red-600"
                        />
                      </td>
                      <td className="px-3 py-2 text-zinc-300">{t.nombre || <span className="text-zinc-600">(sin nombre)</span>}</td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums text-zinc-200">{eur(t.importe)}</td>
                      <td className="px-3 py-2">
                        {ya ? (
                          <span className="text-zinc-500">{nombreCli(cid)}</span>
                        ) : (
                          <select
                            value={cid ?? ""}
                            onChange={(e) => {
                              const v = e.target.value ? Number(e.target.value) : null;
                              setAsign((p) => ({ ...p, [t.endToEndId]: v }));
                              setIncluir((p) => ({ ...p, [t.endToEndId]: v != null }));
                            }}
                            className={`${inputCls} ${cid == null ? "border-amber-700" : ""} max-w-[14rem] appearance-none`}
                          >
                            <option value="">— sin asignar —</option>
                            {clientesOrden.map((c) => (
                              <option key={c.id} value={c.id}>{c.nombre} {c.apellidos ?? ""}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        {ya ? <span className="text-zinc-500">ya importado</span>
                          : cid == null ? <span className="font-bold text-amber-400">sin cliente</span>
                          : auto ? <span className="text-emerald-400">emparejado ✓</span>
                          : <span className="text-sky-400">nuevo</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-3 mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-lg">
            <span className="text-sm text-zinc-400">
              <b className="text-white">{resumen.seleccionados}</b> seleccionados · <b className="text-emerald-400">{eur(resumen.totalSel)}</b>
            </span>
            <button
              onClick={importar}
              disabled={guardando || resumen.seleccionados === 0}
              className="ml-auto rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              {guardando ? "Importando…" : `Importar ${resumen.seleccionados} cobros`}
            </button>
          </div>
          <p className="mt-3 text-[10px] leading-snug text-zinc-600">
            Los cobros se apuntan como <b>cobrados</b> en la cuenta banco con la fecha de cobro de la remesa, atribuidos a la
            empresa (grupales). Si una domiciliación se <b>devuelve</b>, entra en la factura de ese cliente y borra el cobro.
            La próxima remesa recordará a quién pertenece cada recibo por su nº de mandato.
          </p>
        </>
      )}
    </div>
  );
}
