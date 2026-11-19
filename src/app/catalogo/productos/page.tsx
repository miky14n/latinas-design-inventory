"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; codigo_interno: string; nombre: string; genero: string; activo: boolean; categoria: string; marca: string; variantes: number };
type Option = { id: string; nombre: string; activo: boolean };
type Listing = { productos: Product[]; total: number; categorias: Option[] | null; marcas: Option[] | null; pagina: number; porPagina: number };
type Ubicacion = {
  id: string;
  nombre: string;
  codigo: string;
  direccion: string | null;
  disponible: string;
  desglose: { fisicas: string; reservadas: string } | null;
};
type Detail = { ubicaciones: Ubicacion[]; producto: Product & { descripcion: string | null; escala: string; modelo: string | null }; variantes: { id: string; activo: boolean; talla: string; color: string; codigos: string[]; hex: string | null }[] };
type Load<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };
const inputClass = "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950";

export default function ProductosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [listing, setListing] = useState<Load<Listing>>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [options, setOptions] = useState<{ categorias: Option[]; marcas: Option[] }>({ categorias: [], marcas: [] });
  const optionsLoaded = useRef(false);
  const [selection, setSelection] = useState<string | null>(null);
  const [detailReload, setDetailReload] = useState(0);
  const [detail, setDetail] = useState<Load<Detail>>({ status: "loading" });
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);

  const fetchData = useCallback(async (params: URLSearchParams, signal: AbortSignal) => {
    const response = await fetch(`/api/catalogo/productos/listado?${params}`, { cache: "no-store", signal });
    if (response.status === 401) { router.replace("/auth/sign-in"); throw new Error("Inicia sesión para continuar."); }
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "No se pudo consultar el catálogo.");
    return body.data;
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ buscar: search, categoria: category, marca: brand, estado: status, pagina: String(page), opciones: optionsLoaded.current ? "0" : "1" });
      try { const result: Listing = await fetchData(params, controller.signal); if (!controller.signal.aborted) { if (result.categorias && result.marcas) { setOptions({ categorias: result.categorias, marcas: result.marcas }); optionsLoaded.current = true; } setListing({ status: "ready", data: result }); setRefreshing(false); } }
      catch (error) { if (!controller.signal.aborted) { setListing({ status: "error", message: error instanceof Error ? error.message : "No se pudo cargar el catálogo." }); setRefreshing(false); } }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, category, brand, status, page, reload, fetchData]);

  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    fetchData(new URLSearchParams({ id: selection }), controller.signal)
      .then((result) => { if (!controller.signal.aborted) setDetail({ status: "ready", data: result }); })
      .catch((error) => { if (!controller.signal.aborted) setDetail({ status: "error", message: error instanceof Error ? error.message : "No se pudo cargar el detalle." }); });
    return () => controller.abort();
  }, [selection, detailReload, fetchData]);
  useEffect(() => {
    if (selection) detailHeading.current?.focus();
  }, [selection]);

  function changeFilters(update: () => void) {
    setRefreshing(true); setSelection(null); setPage(1); update();
  }
  function closeDetail() { setSelection(null); detailTrigger.current?.focus(); }
  function showDetail(id: string, trigger: HTMLButtonElement) { if (selection === id) { closeDetail(); return; } detailTrigger.current = trigger; setDetail({ status: "loading" }); setSelection(id); }
  function retry() { setListing({ status: "loading" }); setReload((value) => value + 1); }
  const data = listing.status === "ready" ? listing.data : null;

  return <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><nav aria-label="Ruta de navegación" className="text-xs text-zinc-500"><Link href="/" className="hover:text-zinc-900">Inicio</Link> / Catálogo / Productos</nav>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Productos</h1>
        <p className="mt-1 text-sm text-zinc-600">Consulta los productos y sus variantes de talla y color.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/catalogo/configuracion" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Configurar catálogo</Link>
        <Link href="/catalogo/productos/nuevo" className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Nuevo producto</Link></div>
    </header>
    <section aria-label="Filtros de productos" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-zinc-700">Buscar por nombre o código<input value={search} onChange={(event) => changeFilters(() => setSearch(event.target.value))} placeholder="Nombre o código" className={inputClass} /></label>
        <label className="text-xs font-medium text-zinc-700">Categoría<select value={category} onChange={(event) => changeFilters(() => setCategory(event.target.value))} className={inputClass}><option value="">Todas las categorías</option>{options.categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactiva)" : ""}</option>)}</select></label>
        <label className="text-xs font-medium text-zinc-700">Marca<select value={brand} onChange={(event) => changeFilters(() => setBrand(event.target.value))} className={inputClass}><option value="">Todas las marcas</option>{options.marcas.map((item) => <option key={item.id} value={item.id}>{item.nombre}{!item.activo ? " (inactiva)" : ""}</option>)}</select></label>
        <label className="text-xs font-medium text-zinc-700">Estado<select value={status} onChange={(event) => changeFilters(() => setStatus(event.target.value))} className={inputClass}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select></label>
      </div>
      <button type="button" disabled={!search && !category && !brand && status === "todos" && page === 1} onClick={() => changeFilters(() => { setSearch(""); setCategory(""); setBrand(""); setStatus("todos"); })} className="mt-3 text-xs font-medium text-zinc-700 underline hover:text-zinc-950 disabled:opacity-40">Limpiar filtros</button>
    </section>
    {refreshing && <p role="status" className="text-sm text-zinc-500">Actualizando productos…</p>}
    {listing.status === "loading" && <div role="status" className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">Cargando productos…</div>}
    {listing.status === "error" && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"><p>{listing.message}</p><button type="button" onClick={retry} className="mt-4 rounded-lg bg-zinc-950 px-4 py-2 font-medium text-white">Reintentar</button></div>}
    {data && <section aria-label="Listado de productos" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
      <div className="border-b border-zinc-100 px-5 py-4 text-sm text-zinc-600">{data.total} {data.total === 1 ? "producto encontrado" : "productos encontrados"}</div>
      {data.productos.length === 0 ? <p className="p-10 text-center text-sm text-zinc-600">
        {data.total === 0 && !search.trim() && !category && !brand && status === "todos"
          ? <>Todavía no hay productos registrados. <Link href="/catalogo/productos/nuevo" className="font-medium text-zinc-900 underline">Crear el primer producto</Link></>
          : "No se encontraron productos con estos filtros."}
      </p> :
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600"><tr><th scope="col" className="px-5 py-3">Producto</th><th scope="col" className="px-4 py-3">Categoría</th><th scope="col" className="px-4 py-3">Marca</th><th scope="col" className="px-4 py-3">Variantes</th><th scope="col" className="px-4 py-3">Estado</th><th scope="col" className="px-5 py-3 text-right">Acción</th></tr></thead>
          <tbody className="divide-y divide-zinc-100">{data.productos.map((product) => <tr key={product.id} className="hover:bg-zinc-50"><td className="px-5 py-4"><p className="font-medium text-zinc-950">{product.nombre}</p><p className="text-xs text-zinc-500">{product.codigo_interno}</p></td><td className="px-4 py-4">{product.categoria}</td><td className="px-4 py-4">{product.marca}</td><td className="px-4 py-4 tabular-nums">{product.variantes}</td><td className="px-4 py-4"><span className={`rounded-full border px-2 py-1 text-xs font-medium ${product.activo ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}>{product.activo ? "Activo" : "Inactivo"}</span></td><td className="px-5 py-4 text-right"><button type="button" aria-label={`Ver detalle de ${product.nombre}`} onClick={(event) => showDetail(product.id, event.currentTarget)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950">Ver detalle</button></td></tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-4 text-xs text-zinc-600"><span>Página {data.pagina} de {Math.max(1, Math.ceil(data.total / data.porPagina))}</span><div className="flex gap-2"><button type="button" disabled={refreshing || page <= 1} onClick={() => { setRefreshing(true); setSelection(null); setPage(page - 1); }} className="rounded-lg border border-zinc-200 px-3 py-2 disabled:opacity-40">Anterior</button><button type="button" disabled={refreshing || page * data.porPagina >= data.total} onClick={() => { setRefreshing(true); setSelection(null); setPage(page + 1); }} className="rounded-lg border border-zinc-200 px-3 py-2 disabled:opacity-40">Siguiente</button></div></div>
    </section>}
    {selection && <section onKeyDown={(event) => { if (event.key === "Escape") closeDetail(); }} aria-labelledby="detail-title" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6"><div className="flex items-center justify-between gap-3"><h2 id="detail-title" ref={detailHeading} tabIndex={-1} className="text-lg font-semibold text-zinc-950">Detalle del producto</h2><button type="button" onClick={closeDetail} className="text-sm font-medium text-zinc-600 underline">Cerrar</button></div>
      {detail.status === "loading" && <p role="status" className="mt-4 text-sm text-zinc-500">Cargando detalle…</p>}
      {detail.status === "error" && <div role="alert" className="mt-4 text-sm text-red-700"><p>{detail.message}</p><button type="button" onClick={() => { setDetail({ status: "loading" }); setDetailReload((value) => value + 1); }} className="mt-2 font-medium underline">Reintentar</button></div>}
      {detail.status === "ready" && <><h3 className="mt-4 text-base font-semibold text-zinc-950">{detail.data.producto.nombre}</h3><p className="mt-1 text-sm text-zinc-600">{detail.data.producto.codigo_interno} · {detail.data.producto.marca} · {detail.data.producto.categoria}</p>{detail.data.producto.descripcion && <p className="mt-2 text-sm text-zinc-600">{detail.data.producto.descripcion}</p>}<p className="mt-2 text-xs text-zinc-500">Escala: {detail.data.producto.escala} · Género: {detail.data.producto.genero}{detail.data.producto.modelo ? ` · Modelo: ${detail.data.producto.modelo}` : ""}</p>
        <h4 className="mt-6 text-sm font-semibold text-zinc-900">Existencias por ubicación</h4>
        {detail.data.ubicaciones.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No hay ubicaciones activas.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.data.ubicaciones.map((ubicacion) => (
              <li key={ubicacion.id} className="rounded-xl border border-zinc-200 p-4">
                <h5 className="font-medium text-zinc-950">{ubicacion.nombre}</h5>
                <p className="mt-1 text-xs text-zinc-600">{ubicacion.codigo}{ubicacion.direccion && ` · ${ubicacion.direccion}`}</p>
                <dl className="mt-3 space-y-1 text-sm text-zinc-700">
                  <div className="flex justify-between gap-3 font-medium">
                    <dt>Disponible para vender</dt><dd className="tabular-nums">{ubicacion.disponible}</dd>
                  </div>
                  {ubicacion.desglose && <>
                    <div className="flex justify-between gap-3"><dt>Físicas en buen estado</dt><dd className="tabular-nums">{ubicacion.desglose.fisicas}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Reservadas</dt><dd className="tabular-nums">{ubicacion.desglose.reservadas}</dd></div>
                  </>}
                </dl>
              </li>
            ))}
          </ul>
        )}
        <h4 className="mt-6 text-sm font-semibold text-zinc-900">Variantes</h4>{detail.data.variantes.length === 0 ? <p className="mt-3 text-sm text-zinc-500">Este producto no tiene variantes registradas.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[450px] text-left text-sm"><thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500"><tr><th scope="col" className="px-3 py-2">Color</th><th scope="col" className="px-3 py-2">Talla</th><th scope="col" className="px-3 py-2">Códigos vigentes</th><th scope="col" className="px-3 py-2">Estado</th></tr></thead><tbody className="divide-y divide-zinc-100">{detail.data.variantes.map((variant) => <tr key={variant.id}><td className="px-3 py-3">{variant.hex && /^#[0-9a-f]{6}$/i.test(variant.hex) && <span aria-hidden="true" className="mr-2 inline-block h-4 w-4 rounded border border-zinc-300 align-middle" style={{ backgroundColor: variant.hex }} />}{variant.color}</td><td className="px-3 py-3">{variant.talla}</td><td className="px-3 py-3">{variant.codigos.join(", ") || "Sin código vigente"}</td><td className="px-3 py-3">{variant.activo ? "Activa" : "Inactiva"}</td></tr>)}</tbody></table></div>}</>}
    </section>}
  </main>;
}
