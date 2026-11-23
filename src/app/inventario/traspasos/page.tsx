"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CamaraEscaneo } from "@/components/escaneo/camara";
import { EscanerOP2 } from "@/components/escaneo/op2";

type Almacen = { id: string; nombre: string };
type Variante = {
  id: string;
  nombre: string;
  codigo_interno: string;
  talla: string;
  color: string;
  disponible: number;
};
type Linea = {
  variante_id: string;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  disponible: number;
  buenas: number;
  danadas: number;
};
type Documento = {
  id: string;
  numero: string;
  origen: string;
  destino: string;
  registrado_en: string;
  recibido_en: string | null;
  motivo: string | null;
  puede_recibir: boolean;
  lineas: Linea[];
};
type EnvioPendiente = {
  clave: string;
  origen: string;
  destino: string;
  lineas: { variante_id: string; cantidad: number }[];
};
type Datos = {
  almacenes: Almacen[];
  variantes: Variante[];
  documentos: Documento[];
  acceso: { global: boolean; almacen_id: string | null };
};
const field =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900";
const button =
  "rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-text transition hover:bg-[#d7b876] disabled:opacity-50";

export default function TraspasosPage() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const origenEfectivo =
    datos?.acceso && !datos.acceso.global
      ? (datos.acceso.almacen_id ?? "")
      : origen;
  const [buscar, setBuscar] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [escaner, setEscaner] = useState<"camara" | "celular" | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendiente, setPendiente] = useState<EnvioPendiente | null>(null);
  const [storageListo, setStorageListo] = useState(false);
  const operando = useRef(false);
  const [recepcion, setRecepcion] = useState<{
    documento: string;
    motivo: string;
    lineas: { variante_id: string; buenas: number; danadas: number }[];
  } | null>(null);
  const [reportarDiferencias, setReportarDiferencias] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = sessionStorage.getItem("traspaso-pendiente");
        if (saved) setPendiente(JSON.parse(saved));
        setStorageListo(true);
      } catch {
        setError("No se pudo recuperar el envío pendiente.");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams({ origen: origenEfectivo, buscar });
      const res = await fetch(`/api/inventario/traspasos?${params}`, {
        signal,
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error || "No se pudo cargar la información.");
      setDatos(body);
    },
    [origenEfectivo, buscar],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      cargar(controller.signal).catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cargar]);
  async function operar(method: "POST" | "PATCH", body: unknown) {
    if (operando.current) return;
    operando.current = true;
    setBusy(true);
    setError("");
    setAviso("");
    try {
      const res = await fetch("/api/inventario/traspasos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        if (method === "POST" && res.status === 400) {
          sessionStorage.removeItem("traspaso-pendiente");
          setPendiente(null);
        }
        throw new Error(result.error || "No se pudo completar la operación.");
      }
      if (method === "POST") {
        sessionStorage.removeItem("traspaso-pendiente");
        setPendiente(null);
        setLineas([]);
        setAviso("Traspaso enviado. La mercadería está en tránsito.");
      } else {
        setRecepcion(null);
        setReportarDiferencias(false);
        setAviso("Recepción registrada.");
      }
      try {
        await cargar();
      } catch {
        setError(
          "La operación se registró, pero no se pudo actualizar el historial. Recarga la página.",
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      operando.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-950">
          Traspasos entre ubicaciones
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Envía mercadería y confirma su llegada a la ubicación de destino.
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {aviso && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {aviso}
        </p>
      )}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Nuevo traspaso</h2>
        {pendiente && (
          <div
            role="status"
            className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            <p>
              Hay un envío sin confirmar. Reinténtalo para recuperar su
              resultado antes de crear otro.
            </p>
            <button
              type="button"
              disabled={busy}
              className={`${button} mt-2`}
              onClick={() => void operar("POST", pendiente)}
            >
              Reintentar envío
            </button>
          </div>
        )}
        <fieldset disabled={!storageListo || busy || !!pendiente}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Origen
              <select
                className={`${field} mt-1`}
                value={origenEfectivo}
                disabled={!datos || !datos.acceso.global}
                onChange={(e) => {
                  setOrigen(e.target.value);
                  setDestino("");
                  setLineas([]);
                  setEscaner(null);
                }}
              >
                <option value="">Selecciona una ubicación</option>
                {datos?.almacenes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Destino
              <select
                className={`${field} mt-1`}
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              >
                <option value="">Selecciona una ubicación</option>
                {datos?.almacenes
                  .filter((a) => a.id !== origenEfectivo)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium">
            Buscar producto o código
            <input
              className={`${field} mt-1`}
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              disabled={!origenEfectivo}
              placeholder="Nombre, talla, color o código"
            />
          </label>
          {origenEfectivo && !busy && !pendiente && (
            <div className="mt-3 space-y-3">
              {!escaner && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
                    onClick={() => setEscaner("camara")}
                  >
                    Escanear con esta cámara
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
                    onClick={() => setEscaner("celular")}
                  >
                    Vincular celular con QR
                  </button>
                </div>
              )}
              {escaner === "camara" && (
                <CamaraEscaneo
                  onClose={() => setEscaner(null)}
                  onScan={(codigo) => {
                    setBuscar(codigo);
                    setEscaner(null);
                  }}
                />
              )}
              {escaner === "celular" && (
                <EscanerOP2
                  onClose={() => setEscaner(null)}
                  onScan={(codigo) => {
                    setBuscar(codigo);
                    setEscaner(null);
                  }}
                />
              )}
            </div>
          )}
          {buscar.trim() && (
            <ul className="mt-2 divide-y divide-zinc-100">
              {datos?.variantes.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    {v.nombre} · {v.color} · {v.talla}{" "}
                    <span className="text-zinc-500">
                      ({v.disponible} disponibles)
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={lineas.some((l) => l.variante_id === v.id)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 disabled:opacity-40"
                    onClick={() =>
                      setLineas([
                        ...lineas,
                        {
                          variante_id: v.id,
                          nombre: v.nombre,
                          color: v.color,
                          talla: v.talla,
                          cantidad: 1,
                          disponible: v.disponible,
                          buenas: 0,
                          danadas: 0,
                        },
                      ])
                    }
                  >
                    Agregar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 font-semibold">Productos seleccionados</h3>
          {!lineas.length && (
            <p className="mt-2 text-sm text-zinc-500">
              Agrega al menos una talla y color.
            </p>
          )}
          <ul className="divide-y divide-zinc-100">
            {lineas.map((l) => (
              <li
                key={l.variante_id}
                className="flex flex-wrap items-center gap-3 py-3 text-sm"
              >
                <span className="min-w-0 flex-1">
                  {l.nombre} · {l.color} · {l.talla}
                </span>
                <label>
                  Cantidad{" "}
                  <input
                    type="number"
                    min={1}
                    max={l.disponible}
                    value={l.cantidad}
                    onChange={(e) =>
                      setLineas(
                        lineas.map((x) =>
                          x.variante_id === l.variante_id
                            ? { ...x, cantidad: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                    className="w-20 rounded border border-zinc-300 p-2"
                  />
                </label>
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    setLineas(
                      lineas.filter((x) => x.variante_id !== l.variante_id),
                    )
                  }
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={
              busy ||
              !origenEfectivo ||
              !destino ||
              origenEfectivo === destino ||
              !lineas.length ||
              lineas.some(
                (l) =>
                  !Number.isInteger(l.cantidad) ||
                  l.cantidad < 1 ||
                  l.cantidad > l.disponible,
              )
            }
            className={`${button} mt-4`}
            onClick={() => {
              if (operando.current) return;
              if (
                window.confirm(
                  "¿Enviar este traspaso? Las unidades saldrán del origen y quedarán en tránsito.",
                )
              ) {
                const envio = {
                  clave: crypto.randomUUID(),
                  origen: origenEfectivo,
                  destino,
                  lineas: lineas.map((l) => ({
                    variante_id: l.variante_id,
                    cantidad: l.cantidad,
                  })),
                };
                try {
                  sessionStorage.setItem(
                    "traspaso-pendiente",
                    JSON.stringify(envio),
                  );
                  setPendiente(envio);
                  void operar("POST", envio);
                } catch {
                  setError(
                    "No se pudo guardar el envío para un reintento seguro.",
                  );
                }
              }
            }}
          >
            Enviar traspaso
          </button>
        </fieldset>
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Historial de traspasos</h2>
        <p className="mt-1 text-sm text-zinc-500">Últimos 100 traspasos.</p>
        {!datos ? (
          <p className="mt-4 text-sm">Cargando…</p>
        ) : !datos.documentos.length ? (
          <p className="mt-4 text-sm text-zinc-500">
            No hay traspasos registrados.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200">
            {datos.documentos.map((d) => (
              <li key={d.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{d.numero}</h3>
                    <p className="text-sm text-zinc-600">
                      {d.origen} → {d.destino}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(d.registrado_en).toLocaleString("es-BO")} ·{" "}
                      {d.recibido_en ? "Recibido" : "En tránsito"}
                    </p>
                  </div>
                  {d.puede_recibir && !d.recibido_en && !recepcion && (
                    <button
                      type="button"
                      className={button}
                      disabled={busy}
                      onClick={() =>
                        setRecepcion({
                          documento: d.id,
                          motivo: "",
                          lineas: d.lineas.map((l) => ({
                            variante_id: l.variante_id,
                            buenas: l.cantidad,
                            danadas: 0,
                          })),
                        })
                      }
                    >
                      Registrar recepción
                    </button>
                  )}
                </div>
                <ul className="mt-2 text-sm text-zinc-600">
                  {d.lineas.map((l, i) => (
                    <li key={`${l.variante_id}-${i}`}>
                      {l.nombre} · {l.color} · {l.talla}: {l.cantidad} enviadas
                      {d.recibido_en &&
                        ` · ${l.buenas} buenas · ${l.danadas} dañadas · ${l.cantidad - l.buenas - l.danadas} faltantes`}
                    </li>
                  ))}
                </ul>
                {d.motivo && (
                  <p className="mt-2 text-sm text-zinc-600">
                    Motivo: {d.motivo}
                  </p>
                )}
                {recepcion?.documento === d.id && (
                  <form
                    className="mt-4 space-y-4 rounded-xl bg-zinc-50 p-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        window.confirm(
                          "¿Confirmas la recepción? El traspaso quedará cerrado.",
                        )
                      )
                        void operar("PATCH", recepcion);
                    }}
                  >
                    <h4 className="font-semibold">Cantidades recibidas</h4>
                    {d.lineas.map((l) => {
                      const r = recepcion.lineas.find(
                        (x) => x.variante_id === l.variante_id,
                      )!;
                      return (
                        <div
                          key={l.variante_id}
                          className="grid gap-2 border-b border-zinc-200 pb-3 sm:grid-cols-3"
                        >
                          <p className="text-sm">
                            {l.nombre} · {l.color} · {l.talla}
                            <br />
                            Enviadas: {l.cantidad}
                            {reportarDiferencias && (
                              <>
                                {" "}
                                · Faltantes: {l.cantidad - r.buenas - r.danadas}
                              </>
                            )}
                          </p>
                          {(["buenas", "danadas"] as const)
                            .filter(
                              (campo) =>
                                campo === "buenas" || reportarDiferencias,
                            )
                            .map((campo) => (
                              <label key={campo} className="text-sm">
                                {campo === "buenas"
                                  ? "En buen estado"
                                  : "Dañadas"}
                                <input
                                  type="number"
                                  min="0"
                                  max={l.cantidad}
                                  required
                                  readOnly={!reportarDiferencias}
                                  value={r[campo]}
                                  className={`${field} mt-1`}
                                  onChange={(e) =>
                                    setRecepcion({
                                      ...recepcion,
                                      lineas: recepcion.lineas.map((x) =>
                                        x.variante_id === l.variante_id
                                          ? {
                                              ...x,
                                              [campo]:
                                                e.target.value === ""
                                                  ? -1
                                                  : Number(e.target.value),
                                            }
                                          : x,
                                      ),
                                    })
                                  }
                                />
                              </label>
                            ))}
                        </div>
                      );
                    })}
                    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          role="switch"
                          className="peer sr-only"
                          checked={reportarDiferencias}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setReportarDiferencias(checked);
                            if (!checked)
                              setRecepcion({
                                ...recepcion,
                                motivo: "",
                                lineas: d.lineas.map((l) => ({
                                  variante_id: l.variante_id,
                                  buenas: l.cantidad,
                                  danadas: 0,
                                })),
                              });
                          }}
                        />
                        <span
                          aria-hidden="true"
                          className="relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition-colors peer-checked:bg-brand-gold-dark peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold-dark peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                        />{" "}
                        Reportar faltantes o prendas dañadas
                      </label>
                    </div>
                    {reportarDiferencias && (
                      <label className="block text-sm">
                        Motivo de faltantes o daños
                        <textarea
                          className={`${field} mt-1`}
                          maxLength={1000}
                          value={recepcion.motivo}
                          onChange={(e) =>
                            setRecepcion({
                              ...recepcion,
                              motivo: e.target.value,
                            })
                          }
                        />
                      </label>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={button}
                        disabled={
                          busy ||
                          recepcion.lineas.some((r) => {
                            const l = d.lineas.find(
                              (x) => x.variante_id === r.variante_id,
                            )!;
                            return (
                              !Number.isInteger(r.buenas) ||
                              !Number.isInteger(r.danadas) ||
                              r.buenas < 0 ||
                              r.danadas < 0 ||
                              r.buenas + r.danadas > l.cantidad
                            );
                          }) ||
                          (!recepcion.motivo.trim() &&
                            recepcion.lineas.some((r) => {
                              const l = d.lineas.find(
                                (x) => x.variante_id === r.variante_id,
                              )!;
                              return (
                                r.danadas > 0 ||
                                r.buenas + r.danadas !== l.cantidad
                              );
                            }))
                        }
                      >
                        Confirmar recepción
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
                        onClick={() => {
                          setRecepcion(null);
                          setReportarDiferencias(false);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
