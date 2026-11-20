"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CamaraEscaneo } from "@/components/escaneo/camara";
import { EscanerOP1 } from "@/components/escaneo/op1";
import { EscanerOP2 } from "@/components/escaneo/op2";
import { EscanerOP3 } from "@/components/escaneo/op3";

type Origen = { id: string; nombre: string; tipo: string };
type Variante = { id: string; nombre: string; codigo_interno: string; talla: string; color: string };
type Linea = Variante & { cantidad: string };
const api = "/api/inventario/ingresos";
const campo = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const boton = "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50";
const panel = "rounded-2xl border border-zinc-200 bg-white p-5";
const descripcion = (v: Variante) => [v.nombre, v.codigo_interno, v.talla, v.color].join(" · ");

class DatosInvalidos extends Error {}

async function datos<T>(url: string, router: ReturnType<typeof useRouter>, opciones?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...opciones });
  if (res.status === 401 || res.redirected) {
    router.replace("/auth/sign-in");
    throw new Error("Inicia sesión para continuar.");
  }
  const body = await res.json();
  if (res.status === 400) throw new DatosInvalidos(body.error);
  if (!res.ok) throw new Error(body.error || "No se pudo completar la operación.");
  return body;
}

export default function Ingresos() {
  const router = useRouter();
  const [origenes, setOrigenes] = useState<Origen[]>([]);
  const [origen, setOrigen] = useState("");
  const [carga, setCarga] = useState("Cargando orígenes…");
  const [intento, setIntento] = useState(0);
  const [buscar, setBuscar] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [opcionEscaner, setOpcionEscaner] = useState<1 | 2 | 3 | null>(null);
  const [resultados, setResultados] = useState<Variante[]>([]);
  const [estadoBusqueda, setEstadoBusqueda] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [fase, setFase] = useState<"editar" | "revisar" | "enviar" | "listo">("editar");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState("");
  const clave = useRef("");
  const enviando = useRef(false);
  const EscanerSeleccionado = opcionEscaner === 1 ? EscanerOP1 : opcionEscaner === 2 ? EscanerOP2 : EscanerOP3;

  useEffect(() => {
    const ctrl = new AbortController();
    datos<Origen[]>(api, router, { signal: ctrl.signal }).then(items => {
      if (ctrl.signal.aborted) return;
      setOrigenes(items);
      setCarga(items.length ? "" : "Registra un origen de mercadería activo para poder recibir unidades.");
    }).catch(e => { if (!ctrl.signal.aborted) setCarga(e.message); });
    return () => ctrl.abort();
  }, [intento, router]);

  useEffect(() => {
    if (!buscar.trim() || fase !== "editar") return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      datos<Variante[]>(api + "?buscar=" + encodeURIComponent(buscar), router, { signal: ctrl.signal }).then(items => {
        if (ctrl.signal.aborted) return;
        setResultados(items);
        setEstadoBusqueda(items.length ? "" : "No se encontraron variantes activas.");
      }).catch(e => { if (!ctrl.signal.aborted) setEstadoBusqueda(e.message); });
    }, 250);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [buscar, fase, router]);

  async function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    setFase("enviar");
    setError("");
    try {
      const doc = await datos<{ numero: string }>(api, router, { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: clave.current, origen, lineas: lineas.map(l => ({ variante_id: l.id, cantidad: Number(l.cantidad) })) })
      });
      setNumero(doc.numero);
      setFase("listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reintenta la confirmación.");
      setFase(e instanceof DatosInvalidos ? "editar" : "revisar");
    } finally { enviando.current = false; }
  }

  return <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
    <header><Link href="/" className="text-sm text-zinc-600 hover:underline">Inicio</Link>
      <h1 className="mt-3 text-2xl font-bold">Ingresos de mercadería</h1>
      <p className="mt-1 text-sm text-zinc-600">Recepción en el almacén central</p></header>
    {fase === "listo" ? <section className={panel}>
      <h2 role="status" className="font-semibold">Ingreso registrado · {numero}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4"><Link href="/catalogo/productos" className="text-sm underline">Consultar existencias en Productos</Link>
      <button className={boton} onClick={() => { setLineas([]); setOrigen(""); setBuscar(""); setResultados([]); setFase("editar"); }}>Nuevo ingreso</button></div>
    </section> : <form className="space-y-5" onSubmit={e => {
      e.preventDefault();
      if (fase === "editar" && origen && lineas.length) {
        clave.current = crypto.randomUUID();
        setError(""); setFase("revisar");
      } else if (fase === "revisar") void confirmar();
    }}>
      <section className={panel}>
        {fase === "editar" ? <>
          <label className="block text-sm font-medium">Origen de la mercadería<select className={campo} required value={origen} onChange={e => setOrigen(e.target.value)}>
            <option value="">Seleccionar origen</option>{origenes.map(o => <option key={o.id} value={o.id}>{o.nombre} · {o.tipo === "PROVEEDOR" ? "Proveedor" : "Fábrica propia"}</option>)}</select></label>
          {carga && <p role="status" className="mt-2 text-sm">{carga} <button type="button" className="underline" onClick={() => setIntento(n => n + 1)}>Actualizar</button></p>}
          <label className="mt-5 block text-sm font-medium">Buscar variante<input className={campo} placeholder="Producto, código, talla o color" value={buscar}
            onChange={e => { setBuscar(e.target.value); setResultados([]); setEstadoBusqueda("Buscando…"); }} /></label>
          {escaneando ? <CamaraEscaneo onClose={() => setEscaneando(false)} onScan={codigo => {
            setBuscar(codigo); setResultados([]); setEstadoBusqueda("Buscando…"); setEscaneando(false);
          }} /> : <button type="button" className="mt-3 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium" onClick={() => setEscaneando(true)}>Escanear con esta cámara</button>}
          {opcionEscaner === null && <div className="mt-3 flex flex-wrap gap-2" aria-label="Escanear desde celular">
            <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={() => setOpcionEscaner(1)}>Celular · opción 1</button>
            <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={() => setOpcionEscaner(2)}>Celular · opción 2</button>
            <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={() => setOpcionEscaner(3)}>Celular · opción 3</button>
          </div>}
          {opcionEscaner !== null && <EscanerSeleccionado onClose={() => setOpcionEscaner(null)} onScan={codigo => {
              setBuscar(codigo); setResultados([]); setEstadoBusqueda("Buscando…"); setOpcionEscaner(null);
            }} />}
          {buscar.trim() && <><p role="status" className="mt-2 text-sm text-zinc-600">{estadoBusqueda}</p>
            <ul className="divide-y divide-zinc-100">{resultados.map(v => <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              {descripcion(v)}<button type="button" className="font-medium underline disabled:opacity-40" disabled={lineas.some(l => l.id === v.id)}
                onClick={() => setLineas(prev => [...prev, { ...v, cantidad: "1" }])}>Agregar</button></li>)}</ul></>}
        </> : <><h2 className="font-semibold">Revisar ingreso</h2><p className="mt-2 text-sm">Origen · {origenes.find(o => o.id === origen)?.nombre}</p></>}
      </section>
      <section className={panel}><h2 className="font-semibold">Mercadería recibida</h2>
        {!lineas.length && <p className="mt-2 text-sm text-zinc-600">Busca y agrega las variantes que recibiste.</p>}
        <ul className="divide-y divide-zinc-100">{lineas.map(l => <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <span>{descripcion(l)}</span>{fase === "editar" ? <div className="flex items-center gap-3">
            <label>Cantidad <input required type="number" min="1" max="2147483647" step="1" className="w-24 rounded-lg border border-zinc-300 p-2"
              value={l.cantidad} onChange={e => setLineas(prev => prev.map(item => item.id === l.id ? { ...item, cantidad: e.target.value } : item))} /></label>
            <button type="button" className="underline" onClick={() => setLineas(prev => prev.filter(item => item.id !== l.id))}>Quitar</button>
          </div> : <strong>{l.cantidad} uds.</strong>}</li>)}</ul>
      </section>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center justify-end gap-4">
        {fase === "revisar" && !error && <button type="button" className="text-sm underline" onClick={() => setFase("editar")}>Volver a editar</button>}
        <button className={boton} disabled={!origen || !lineas.length || fase === "enviar"}>{fase === "editar" ? "Revisar ingreso" : fase === "enviar" ? "Registrando…" : "Confirmar ingreso"}</button>
      </div>
    </form>}
  </main>;
}
