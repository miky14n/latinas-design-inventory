"use client";

import { useState } from "react";
import { EscalaTalla, Talla, Color } from "./types";

interface ProductScalePickerProps {
  escalaId: number | "";
  escalas: EscalaTalla[];
  allTallas?: Talla[];
  selectedTallaIds: number[];
  selectedColorIds: number[];
  colores: Color[];
  onEscalaChange: (escalaId: number | "") => void;
  onToggleTalla: (tallaId: number) => void;
  onSelectAllTallas: (tallas: Talla[]) => void;
  onClearTallas: () => void;
  onToggleColor: (colorId: number) => void;
  onClearColors: () => void;
  errors?: Record<string, string>;
}

export function ProductScalePicker({
  escalaId,
  escalas,
  allTallas = [],
  selectedTallaIds,
  selectedColorIds,
  colores,
  onEscalaChange,
  onToggleTalla,
  onSelectAllTallas,
  onClearTallas,
  onToggleColor,
  onClearColors,
  errors = {},
}: ProductScalePickerProps) {
  const [colorSearch, setColorSearch] = useState("");

  // Determine current active scale
  const currentEscala = escalas.find((e) => e.id === Number(escalaId));

  // Determine tallas for current scale: either embedded in escala.tallas or filtered from allTallas
  const availableTallas: Talla[] = currentEscala?.tallas?.length
    ? currentEscala.tallas
    : allTallas.filter((t) => t.escala_id === Number(escalaId));

  // Sort tallas by orden
  const sortedTallas = [...availableTallas].sort((a, b) => a.orden - b.orden);

  // Filter colors by search
  const filteredColores = colores.filter((c) =>
    c.nombre.toLowerCase().includes(colorSearch.toLowerCase()) ||
    c.codigo.toLowerCase().includes(colorSearch.toLowerCase())
  );

  return (
    <section aria-labelledby="scale-colors-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="border-b border-zinc-100 pb-4">
        <h2 id="scale-colors-heading" className="text-base font-semibold text-zinc-950">
          2. Escala, Tallas y Colores
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Elige la escala de tallas y selecciona qué tallas y colores conformarán las variantes del producto.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Selector de Escala */}
        <div>
          <label htmlFor="escala_id" className="block text-xs font-medium text-zinc-700">
            Escala de tallas <span className="text-red-500">*</span>
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="escala_id"
              aria-invalid={!!errors.escala_id}
              aria-describedby={errors.escala_id ? "escala-error" : undefined}
              value={escalaId}
              onChange={(e) => onEscalaChange(e.target.value ? Number(e.target.value) : "")}
              className={`block w-full max-w-md rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
                errors.escala_id ? "border-red-500 bg-red-50/30" : "border-zinc-300 bg-white"
              }`}
            >
              <option value="">Selecciona una escala de tallas</option>
              {escalas.map((esc) => (
                <option key={esc.id} value={esc.id}>
                  {esc.nombre} ({esc.tipo})
                </option>
              ))}
            </select>

            {currentEscala && (
              <span className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                Tipo: {currentEscala.tipo}
              </span>
            )}
          </div>
          {errors.escala_id && (
            <p id="escala-error" className="mt-1 text-xs text-red-600">{errors.escala_id}</p>
          )}
        </div>

        {/* Tallas disponibles de la escala seleccionada */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-zinc-900">
                Tallas disponibles de la escala
              </span>
              <span className="ml-2 text-xs text-zinc-500">
                ({selectedTallaIds.length} de {sortedTallas.length} seleccionadas)
              </span>
            </div>

            {sortedTallas.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAllTallas(sortedTallas)}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Seleccionar todas
                </button>
                <button
                  type="button"
                  onClick={onClearTallas}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          {!escalaId ? (
            <p className="mt-3 text-xs text-zinc-400 italic">
              Selecciona una escala arriba para ver las tallas asociadas.
            </p>
          ) : sortedTallas.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">
              Esta escala no tiene tallas configuradas en el catálogo.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {sortedTallas.map((talla) => {
                const isSelected = selectedTallaIds.includes(talla.id);
                return (
                  <button
                    key={talla.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToggleTalla(talla.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <span>{talla.valor}</span>
                    {isSelected && (
                      <span className="text-[10px] text-zinc-300">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {errors.tallas && (
            <p className="mt-2 text-xs text-red-600">{errors.tallas}</p>
          )}
        </div>

        {/* Selección de Colores */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-zinc-900">
                Colores para el producto
              </span>
              <span className="ml-2 text-xs text-zinc-500">
                ({selectedColorIds.length} seleccionados)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filtrar colores..."
                aria-label="Filtrar colores"
                value={colorSearch}
                onChange={(e) => setColorSearch(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
              {selectedColorIds.length > 0 && (
                <button
                  type="button"
                  onClick={onClearColors}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredColores.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No se encontraron colores con ese filtro.</p>
            ) : (
              filteredColores.map((color) => {
                const isSelected = selectedColorIds.includes(color.id);
                return (
                  <button
                    key={color.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToggleColor(color.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                        : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400"
                    }`}
                  >
                    {color.hex && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.hex.trim()) && (
                      <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded border border-zinc-400" style={{ backgroundColor: color.hex.trim() }} />
                    )}
                    <span>{color.nombre}</span>
                    <span className={`text-[11px] ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                      ({color.codigo})
                    </span>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })
            )}
          </div>
          {errors.colores && (
            <p className="mt-2 text-xs text-red-600">{errors.colores}</p>
          )}
        </div>
      </div>
    </section>
  );
}
