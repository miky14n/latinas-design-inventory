"use client";

import { ListaPrecio } from "./types";

interface ProductPricingFieldsProps {
  listasPrecio: ListaPrecio[];
  precios: Record<number, string>; // lista_id -> importe
  onChangePrecio: (listaId: number, importe: string) => void;
  errors?: Record<string, string>;
}

export function ProductPricingFields({
  listasPrecio,
  precios,
  onChangePrecio,
  errors = {},
}: ProductPricingFieldsProps) {
  if (listasPrecio.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="pricing-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="border-b border-zinc-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="pricing-heading" className="text-base font-semibold text-zinc-950">
              3. Precios Iniciales de Venta
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Opcional. Puedes ingresar el precio vigente inicial de venta por lista de precio. No se incluyen costos ni imágenes.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            Opcional
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listasPrecio.map((lista) => {
          const val = precios[lista.id] || "";
          const errorMsg = errors[`precio_${lista.id}`];

          return (
            <div key={lista.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <label htmlFor={`precio-${lista.id}`} className="block text-xs font-medium text-zinc-900">
                Lista: {lista.nombre}
              </label>
              <span className="text-[11px] text-zinc-500">
                Moneda: {lista.moneda || "BOB"}
              </span>

              <div className="mt-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999999999.99"
                  id={`precio-${lista.id}`}
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? `precio-error-${lista.id}` : undefined}
                  value={val}
                  onChange={(e) => onChangePrecio(lista.id, e.target.value)}
                  placeholder="0.00"
                  className={`block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
                    errorMsg ? "border-red-500 bg-red-50/30" : "border-zinc-300 bg-white"
                  }`}
                />
              </div>
              {errorMsg && (
                <p id={`precio-error-${lista.id}`} className="mt-1 text-xs text-red-600">{errorMsg}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
