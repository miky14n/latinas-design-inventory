"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RgbPaletColor } from "@/components/catalogo/rgbpaletcolor";
import { useRouter } from "next/navigation";

const sections = [
  { key: "marca", title: "Marcas", singular: "marca" },
  { key: "categoria", title: "Categorías", singular: "categoría" },
  { key: "modelo_corte", title: "Cortes", singular: "corte" },
  { key: "escala_talla", title: "Escalas", singular: "escala" },
  { key: "talla", title: "Tallas", singular: "talla" },
  { key: "color", title: "Colores", singular: "color" },
] as const;
type Kind = typeof sections[number]["key"];
type Item = { id: string; activo: boolean; nombre?: string; valor?: string; codigo?: string; hex?: string | null; tipo?: string; orden?: number; padre_id?: string | number | null; categoria_id?: string | number; escala_id?: string | number; prefijo_codigo?: string | null };
type Catalog = Record<Kind, Item[]>;
type LoadState = { status: "loading" } | { status: "ready"; data: Catalog } | { status: "error"; message: string };
type Form = { id?: string; nombre: string; valor: string; codigo: string; hex: string; tipo: string; orden: string; padre_id: string; categoria_id: string; escala_id: string; prefijo_codigo: string; activo: boolean };
const emptyForm: Form = { nombre: "", valor: "", codigo: "", hex: "", tipo: "DAMA", orden: "1", padre_id: "", categoria_id: "", escala_id: "", prefijo_codigo: "", activo: true };
const fieldClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950";

const namedColors = [
  ["Negro", "#000000"], ["Blanco", "#FFFFFF"], ["Gris", "#808080"], ["Rojo", "#FF0000"],
  ["Granate", "#800000"], ["Rosa", "#FF69B4"], ["Naranja", "#FF8000"], ["Amarillo", "#FFFF00"],
  ["Beige", "#D2B48C"], ["Marrón", "#804000"], ["Verde", "#008000"], ["Verde lima", "#80FF00"],
  ["Turquesa", "#40E0D0"], ["Celeste", "#87CEEB"], ["Azul", "#0000FF"], ["Azul marino", "#000080"],
  ["Violeta", "#8000FF"], ["Morado", "#800080"],
] as const;
function colorName(hex: string) {
  const rgb = (value: string) => [1, 3, 5].map((start) => parseInt(value.slice(start, start + 2), 16));
  const selected = rgb(hex);
  return namedColors.reduce((best, color) => {
    const distance = rgb(color[1]).reduce((sum, channel, index) => sum + (channel - selected[index]) ** 2, 0);
    return distance < best.distance ? { name: color[0], distance } : best;
  }, { name: "", distance: Infinity }).name;
}
function colorCode(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
}


export default function CatalogConfigurationPage() {
  const router = useRouter();
  const [section, setSection] = useState<Kind>("marca");
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<Form | null>(null);
  const [customColorCode, setCustomColorCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const current = sections.find((entry) => entry.key === section)!;

  const fetchCatalog = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/catalogo/configuracion", { signal, cache: "no-store" });
      if (response.status === 401) { router.replace("/auth/sign-in"); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo cargar la configuración.");
      if (!signal?.aborted) setLoad({ status: "ready", data: body.data });
    } catch (caught) {
      if (!signal?.aborted) setLoad({ status: "error", message: caught instanceof Error ? caught.message : "No se pudo cargar la configuración." });
    }
  }, [router]);
  useEffect(() => {
    const controller = new AbortController();
    // La petición actualiza el estado al completarse o fallar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCatalog(controller.signal);
    return () => controller.abort();
  }, [fetchCatalog]);

  function openEdit(item: Item) {
    setError(""); setNotice("");
    setCustomColorCode(true);
    setForm({ ...emptyForm, ...item, nombre: item.nombre || "", valor: item.valor || "", codigo: item.codigo || "", hex: item.hex || "",
      tipo: item.tipo || "DAMA", orden: String(item.orden ?? 1), padre_id: String(item.padre_id ?? ""), categoria_id: String(item.categoria_id ?? ""),
      escala_id: String(item.escala_id ?? ""), prefijo_codigo: item.prefijo_codigo || "" });
  }
  async function save(values: Form) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/catalogo/configuracion", { method: values.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, kind: section }) });
      const body = await response.json();
      if (response.status === 401) { router.replace("/auth/sign-in"); return; }
      if (!response.ok) throw new Error(body.error || "No se pudo guardar el registro.");
      setForm(null);
      await fetchCatalog();
      setNotice("Los cambios se guardaron correctamente.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el registro.");
    } finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (form && !busy) void save(form); }
  function update(field: keyof Form, value: string) { setForm((prev) => prev ? { ...prev, [field]: value } : prev); }
  function updateName(name: string) {
    setForm((prev) => prev ? { ...prev, nombre: name, ...(section === "color" && !customColorCode ? { codigo: colorCode(name) } : {}) } : prev);
  }
  function selectColor(hex: string) {
    const name = colorName(hex);
    setForm((prev) => prev ? { ...prev, hex: hex.toUpperCase(), nombre: name, ...(!customColorCode ? { codigo: colorCode(name) } : {}) } : prev);
  }

  if (load.status === "loading") return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><div role="status" className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs"><span aria-hidden="true" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" /><p className="mt-4 text-sm font-medium text-zinc-900">Cargando configuración del catálogo…</p></div></main>;
  if (load.status === "error") return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{load.message}</p><button type="button" onClick={() => { setLoad({ status: "loading" }); void fetchCatalog(); }} className="mt-4 rounded-lg bg-zinc-950 px-4 py-2 font-semibold text-white">Reintentar</button></div></main>;

  const data = load.data;
  const selected = data[section].filter((item) => (filter === "todos" || item.activo === (filter === "activos")) &&
    [item.nombre, item.valor, item.codigo].some((value) => value?.toLowerCase().includes(query.trim().toLowerCase())));
  function parentName(kind: "categoria" | "escala_talla", id: unknown) {
    return data[kind].find((item) => String(item.id) === String(id))?.nombre || "Sin asignar";
  }
  const parentOptions = (kind: "categoria" | "escala_talla", selectedId: string) =>
    data[kind].filter((item) => item.activo || String(item.id) === selectedId);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><nav aria-label="Ruta de navegación" className="text-xs text-zinc-500"><Link href="/" className="hover:text-zinc-900">Inicio</Link> / Catálogo / Configuración</nav>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Configuración del catálogo</h1>
          <p className="mt-1 text-sm text-zinc-600">Administra las opciones utilizadas al registrar productos.</p></div>
        <Link href="/catalogo/productos/nuevo" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Nuevo producto</Link>
      </header>
      <div aria-label="Secciones del catálogo" className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
        {sections.map((entry) => <button key={entry.key} type="button" disabled={busy} aria-pressed={section === entry.key} onClick={() => { setSection(entry.key); setForm(null); setError(""); setNotice(""); setQuery(""); }}
          className={`rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 ${section === entry.key ? "bg-zinc-950 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"}`}>{entry.title}</button>)}
      </div>
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      <section aria-labelledby="section-title" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="section-title" className="text-lg font-semibold text-zinc-950">{current.title}</h2><p className="mt-1 text-sm text-zinc-500">Consulta y administra los registros activos e inactivos.</p></div>
          <button type="button" disabled={busy} onClick={() => { setError(""); setNotice(""); setCustomColorCode(false); setForm({ ...emptyForm }); }} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">Agregar {current.singular}</button></div>
        <div className="mt-5 flex flex-wrap gap-3"><label className="text-xs font-medium text-zinc-700">Buscar<input value={query} onChange={(e) => setQuery(e.target.value)} className={fieldClass} placeholder="Nombre o código" /></label>
          <label className="text-xs font-medium text-zinc-700">Estado<select value={filter} onChange={(e) => setFilter(e.target.value)} className={fieldClass}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select></label></div>
        {form && <form onSubmit={submit} className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-zinc-950">{form.id ? "Editar" : "Agregar"} {current.singular}</h3>
          <fieldset disabled={busy} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-zinc-700">{section === "talla" ? "Valor de la talla" : "Nombre"}<input required maxLength={section === "talla" ? 50 : 200} value={section === "talla" ? form.valor : form.nombre} onChange={(e) => section === "talla" ? update("valor", e.target.value) : updateName(e.target.value)} className={fieldClass} /></label>
            {section === "categoria" && <><label className="text-xs font-medium text-zinc-700">Categoría superior<select value={form.padre_id} onChange={(e) => update("padre_id", e.target.value)} className={fieldClass}><option value="">Sin categoría superior</option>{parentOptions("categoria", form.padre_id).filter((item) => item.id !== form.id).map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactiva)" : ""}</option>)}</select></label>
              <label className="text-xs font-medium text-zinc-700">Prefijo de código (opcional)<input value={form.prefijo_codigo} onChange={(e) => update("prefijo_codigo", e.target.value)} inputMode="numeric" maxLength={2} pattern="[0-9]{2}" className={fieldClass} /></label></>}
            {section === "modelo_corte" && <label className="text-xs font-medium text-zinc-700">Categoría<select required value={form.categoria_id} onChange={(e) => update("categoria_id", e.target.value)} className={fieldClass}><option value="">Selecciona una categoría</option>{parentOptions("categoria", form.categoria_id).map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactiva)" : ""}</option>)}</select></label>}
            {section === "escala_talla" && <label className="text-xs font-medium text-zinc-700">Tipo<select value={form.tipo} onChange={(e) => update("tipo", e.target.value)} className={fieldClass}><option value="DAMA">Dama</option><option value="VARON">Varón</option><option value="ALFABETICA">Alfabética</option><option value="UNICA">Única</option></select></label>}
            {section === "talla" && <><label className="text-xs font-medium text-zinc-700">Escala<select required value={form.escala_id} onChange={(e) => update("escala_id", e.target.value)} className={fieldClass}><option value="">Selecciona una escala</option>{parentOptions("escala_talla", form.escala_id).map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactiva)" : ""}</option>)}</select></label><label className="text-xs font-medium text-zinc-700">Orden<input type="number" required min="0" max="2147483647" step="1" value={form.orden} onChange={(e) => update("orden", e.target.value)} className={fieldClass} /></label></>}
            {section === "color" && <>
              <label className="text-xs font-medium text-zinc-700">Código<input required maxLength={50} value={form.codigo} onChange={(e) => { setCustomColorCode(true); update("codigo", e.target.value); }} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-zinc-500">Se sugiere con las tres primeras letras del nombre; puedes editarlo.</span></label>
              <div>
                <label htmlFor="color-hex" className="text-xs font-medium text-zinc-700">Color hexadecimal (opcional)</label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <input id="color-hex" value={form.hex} onChange={(e) => update("hex", e.target.value)} placeholder="#RRGGBB" pattern="#[0-9a-fA-F]{6}" maxLength={7} className="min-w-32 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950" />
                  <RgbPaletColor key={form.id ?? "nuevo"} value={form.hex} onChange={selectColor} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">El selector propone un nombre aproximado; puedes editarlo y ajustar el código.</p>
              </div>
            </>}
          </fieldset>
          <div className="mt-5 flex gap-3"><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{busy ? "Guardando…" : "Guardar"}</button><button type="button" disabled={busy} onClick={() => { setForm(null); setError(""); }} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50">Cancelar</button></div>
        </form>}
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500"><tr><th className="px-3 py-3">Nombre</th><th className="px-3 py-3">Detalle</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-zinc-100">{selected.map((item) => <tr key={item.id}><td className="px-3 py-3 font-medium text-zinc-900">{item.hex && /^#[0-9a-f]{6}$/i.test(item.hex) && <span aria-hidden="true" className="mr-2 inline-block h-4 w-4 rounded border border-zinc-400 align-middle" style={{ backgroundColor: item.hex }} />}{item.nombre || item.valor}</td>
            <td className="px-3 py-3 text-zinc-600">{section === "categoria" ? (item.padre_id ? parentName("categoria", item.padre_id) : "Categoría principal") + (item.prefijo_codigo ? ` · Prefijo ${item.prefijo_codigo}` : "") : section === "modelo_corte" ? parentName("categoria", item.categoria_id) : section === "talla" ? `${parentName("escala_talla", item.escala_id)} · Orden ${item.orden}` : section === "escala_talla" ? item.tipo : section === "color" ? item.codigo : "—"}</td>
            <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${item.activo ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${item.activo ? "bg-emerald-500" : "bg-zinc-400"}`} />{item.activo ? "Activo" : "Inactivo"}</span></td>
            <td className="px-3 py-3 text-right"><button type="button" disabled={busy} onClick={() => openEdit(item)} className="mr-3 font-medium text-zinc-700 underline hover:text-zinc-950">Editar</button><button type="button" disabled={busy} onClick={() => {
              if (!window.confirm(`¿${item.activo ? "Desactivar" : "Reactivar"} ${item.nombre || item.valor}?`)) return;
              const values = { ...emptyForm, ...item, nombre: item.nombre || "", valor: item.valor || "", codigo: item.codigo || "", hex: item.hex || "", tipo: item.tipo || "DAMA", orden: String(item.orden ?? 1), padre_id: String(item.padre_id ?? ""), categoria_id: String(item.categoria_id ?? ""), escala_id: String(item.escala_id ?? ""), prefijo_codigo: item.prefijo_codigo || "", activo: !item.activo };
              void save(values);
            }} className="font-medium text-zinc-700 underline hover:text-zinc-950 disabled:opacity-50">{item.activo ? "Desactivar" : "Reactivar"}</button></td></tr>)}</tbody></table>
          {!selected.length && <p className="py-8 text-center text-sm text-zinc-500">No hay registros para mostrar.</p>}</div>
      </section>
    </main>
  );
}
