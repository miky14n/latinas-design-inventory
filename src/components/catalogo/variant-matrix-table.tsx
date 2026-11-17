"use client";

import { Talla, Color, VariantCellState, Categoria } from "./types";

interface VariantMatrixTableProps {
  tallas: Talla[];
  colores: Color[];
  selectedTallaIds: number[];
  selectedColorIds: number[];
  variants: Record<string, VariantCellState>;
  selectedCategoria?: Categoria;
  onToggleVariant: (colorId: number, tallaId: number) => void;
  onChangeVariantCode: (colorId: number, tallaId: number, code: string) => void;
  onActivateAllVariants: () => void;
  onDeactivateAllVariants: () => void;
  onApplyCategoryPrefix: (prefix: string) => void;
  errors?: Record<string, string>;
}

export function VariantMatrixTable({
  tallas,
  colores,
  selectedTallaIds,
  selectedColorIds,
  variants,
  selectedCategoria,
  onToggleVariant,
  onChangeVariantCode,
  onActivateAllVariants,
  onDeactivateAllVariants,
  onApplyCategoryPrefix,
  errors = {},
}: VariantMatrixTableProps) {
  const activeTallas = tallas
    .filter((t) => selectedTallaIds.includes(t.id))
    .sort((a, b) => a.orden - b.orden);

  const activeColores = colores.filter((c) => selectedColorIds.includes(c.id));

  if (activeTallas.length === 0 || activeColores.length === 0) {
    return (
      <section aria-labelledby="variants-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="border-b border-zinc-100 pb-4">
          <h2 id="variants-heading" className="text-base font-semibold text-zinc-950">
            4. Matriz de Variantes y Códigos (7 caracteres)
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Genera las combinaciones talla-color y asigna el código manual de 7 caracteres para cada variante.
          </p>
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
          <p className="text-sm font-medium text-zinc-700">
            Selecciona al menos una talla y un color en el paso anterior.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Al seleccionar tallas y colores, se desplegará la grilla de combinaciones para ingresar códigos de 7 caracteres.
          </p>
        </div>
      </section>
    );
  }

  // Calculate statistics
  let totalActivas = 0;
  let totalConCodigoCompleto = 0;

  activeColores.forEach((c) => {
    activeTallas.forEach((t) => {
      const key = `${c.id}-${t.id}`;
      const state = variants[key];
      if (state?.activo) {
        totalActivas++;
        if (state.codigo && state.codigo.trim().length === 7) {
          totalConCodigoCompleto++;
        }
      }
    });
  });

  const categoryPrefix = selectedCategoria?.prefijo_codigo || null;

  return (
    <section aria-labelledby="variants-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="border-b border-zinc-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="variants-heading" className="text-base font-semibold text-zinc-950">
              4. Matriz de Variantes y Códigos
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Activa las combinaciones y escribe el código manual de exactamente 7 caracteres para cada una.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categoryPrefix && (
              <button
                type="button"
                onClick={() => onApplyCategoryPrefix(categoryPrefix)}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                title="Pega el prefijo de 2 dígitos de la categoría en códigos vacíos"
              >
                Insertar prefijo ({categoryPrefix}...)
              </button>
            )}
            <button
              type="button"
              onClick={onActivateAllVariants}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Activar todas
            </button>
            <button
              type="button"
              onClick={onDeactivateAllVariants}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Desactivar todas
            </button>
          </div>
        </div>
      </div>

      {errors.variantes && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errors.variantes}
        </div>
      )}

      {/* Grid Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-max border-collapse text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-800">
            <tr>
              <th className="sticky left-0 z-10 border-r border-zinc-200 bg-zinc-50 px-4 py-3 min-w-44">
                Color \ Talla
              </th>
              {activeTallas.map((talla) => (
                <th key={talla.id} className="border-r border-zinc-200 px-3 py-3 text-center min-w-36">
                  <span className="block font-bold text-zinc-900">{talla.valor}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {activeColores.map((color) => (
              <tr key={color.id} className="hover:bg-zinc-50/50">
                {/* Fixed Color Column */}
                <td className="sticky left-0 z-10 border-r border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-900">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-300 bg-zinc-200" />
                    <span className="truncate">{color.nombre}</span>
                    <span className="text-[11px] text-zinc-400">({color.codigo})</span>
                    {color.hex && <span className="text-[11px] text-zinc-400">{color.hex}</span>}
                  </div>
                </td>

                {/* Talla Cells */}
                {activeTallas.map((talla) => {
                  const key = `${color.id}-${talla.id}`;
                  const cell = variants[key] || {
                    talla_id: talla.id,
                    color_id: color.id,
                    activo: true,
                    codigo: "",
                  };
                  const isActivo = cell.activo;
                  const codeLen = (cell.codigo || "").trim().length;
                  const isComplete = codeLen === 7;
                  const errorKey = `variant_code_${key}`;
                  const hasError = !!errors[errorKey];

                  return (
                    <td key={talla.id} className="border-r border-zinc-200 p-2.5 align-top">
                      <div className="flex flex-col gap-1.5">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActivo}
                            onChange={() => onToggleVariant(color.id, talla.id)}
                            className="h-3.5 w-3.5 rounded-sm border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                          />
                          <span className={`text-[11px] font-medium ${isActivo ? "text-zinc-900" : "text-zinc-400"}`}>
                            {isActivo ? "Incluida" : "Omitida"}
                          </span>
                        </label>

                        {isActivo && (
                          <div className="space-y-1">
                            <input
                              type="text"
                              maxLength={7}
                              value={cell.codigo}
                              onChange={(e) =>
                                onChangeVariantCode(color.id, talla.id, e.target.value.toUpperCase())
                              }
                              placeholder="7 caracteres"
                              className={`w-full rounded-md border px-2 py-1 text-xs font-mono uppercase tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 ${
                                hasError
                                  ? "border-red-500 bg-red-50/50"
                                  : isComplete
                                  ? "border-emerald-500 bg-emerald-50/30"
                                  : "border-zinc-300 bg-white"
                              }`}
                            />
                            <div className="flex items-center justify-between text-[10px]">
                              <span
                                className={
                                  isComplete
                                    ? "font-semibold text-emerald-700"
                                    : codeLen > 0
                                    ? "text-amber-600"
                                    : "text-zinc-400"
                                }
                              >
                                {codeLen}/7 car.
                              </span>
                              {isComplete && <span className="text-emerald-700">✓ Listo</span>}
                            </div>
                            {hasError && (
                              <p className="text-[10px] text-red-600">{errors[errorKey]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 flex flex-col gap-2 rounded-xl bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-zinc-500">Combinaciones activas: </span>
            <span className="font-semibold text-zinc-900">{totalActivas}</span>
          </div>
          <div>
            <span className="text-zinc-500">Códigos completos (7 car.): </span>
            <span
              className={`font-semibold ${
                totalActivas > 0 && totalConCodigoCompleto === totalActivas
                  ? "text-emerald-700"
                  : "text-amber-600"
              }`}
            >
              {totalConCodigoCompleto} de {totalActivas}
            </span>
          </div>
        </div>

        {totalActivas > totalConCodigoCompleto && (
          <p className="text-xs text-amber-700">
            ⚠️ Hay {totalActivas - totalConCodigoCompleto} variante(s) activa(s) con código incompleto.
          </p>
        )}
      </div>
    </section>
  );
}
