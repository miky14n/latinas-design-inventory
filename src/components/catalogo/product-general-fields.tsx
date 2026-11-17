"use client";

import {
  Marca,
  Categoria,
  ModeloCorte,
  Genero,
  ProductGeneralField,
  ProductGeneralFieldsData,
} from "./types";

interface ProductGeneralFieldsProps {
  codigoInterno: string;
  nombre: string;
  descripcion: string;
  marcaId: number | "";
  genero: Genero;
  categoriaId: number | "";
  modeloCorteId: number | "";
  marcas: Marca[];
  categorias: Categoria[];
  modelosCorte: ModeloCorte[];
  onChange: <Field extends ProductGeneralField>(
    field: Field,
    value: ProductGeneralFieldsData[Field],
  ) => void;
  errors?: Record<string, string>;
}

export function ProductGeneralFields({
  codigoInterno,
  nombre,
  descripcion,
  marcaId,
  genero,
  categoriaId,
  modeloCorteId,
  marcas,
  categorias,
  modelosCorte,
  onChange,
  errors = {},
}: ProductGeneralFieldsProps) {
  // Modelos filtrados por la categoría seleccionada
  const modelosFiltrados = categoriaId
    ? modelosCorte.filter((m) => m.categoria_id === Number(categoriaId))
    : [];

  return (
    <section aria-labelledby="general-info-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="border-b border-zinc-100 pb-4">
        <h2 id="general-info-heading" className="text-base font-semibold text-zinc-950">
          1. Datos Generales del Producto
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Información principal del producto de acuerdo con el catálogo.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Código Interno */}
        <div>
          <label htmlFor="codigo_interno" className="block text-xs font-medium text-zinc-700">
            Código interno <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="codigo_interno"
            value={codigoInterno}
            onChange={(e) => onChange("codigo_interno", e.target.value)}
            placeholder="ej. POLO-BAS-01"
            className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
              errors.codigo_interno ? "border-red-500 bg-red-50/30" : "border-zinc-300 bg-white"
            }`}
          />
          {errors.codigo_interno && (
            <p className="mt-1 text-xs text-red-600">{errors.codigo_interno}</p>
          )}
        </div>

        {/* Nombre del Producto */}
        <div>
          <label htmlFor="nombre" className="block text-xs font-medium text-zinc-700">
            Nombre del producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            placeholder="ej. Polo Clásico Cuello Redondo"
            className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
              errors.nombre ? "border-red-500 bg-red-50/30" : "border-zinc-300 bg-white"
            }`}
          />
          {errors.nombre && (
            <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* Marca */}
        <div>
          <label htmlFor="marca_id" className="block text-xs font-medium text-zinc-700">
            Marca <span className="text-red-500">*</span>
          </label>
          <select
            id="marca_id"
            value={marcaId}
            onChange={(e) => onChange("marca_id", e.target.value ? Number(e.target.value) : "")}
            className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
              errors.marca_id ? "border-red-500 bg-red-50/30" : "border-zinc-300 bg-white"
            }`}
          >
            <option value="">Selecciona una marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          {errors.marca_id && (
            <p className="mt-1 text-xs text-red-600">{errors.marca_id}</p>
          )}
        </div>

        {/* Género */}
        <div>
          <label htmlFor="genero" className="block text-xs font-medium text-zinc-700">
            Género <span className="text-red-500">*</span>
          </label>
          <select
            id="genero"
            value={genero}
            onChange={(e) => onChange("genero", e.target.value as Genero)}
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value="DAMA">Dama</option>
            <option value="VARON">Varón</option>
            <option value="UNISEX">Unisex</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="categoria_id" className="block text-xs font-medium text-zinc-700">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            id="categoria_id"
            value={categoriaId}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              onChange("categoria_id", val);
              // Reset modelo if category changes
              onChange("modelo_corte_id", "");
            }}
            className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
              errors.categoria_id ? "border-red-500 bg-red-50/30" : "border-zinc-300 bg-white"
            }`}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.prefijo_codigo ? `(Prefijo: ${c.prefijo_codigo})` : ""}
              </option>
            ))}
          </select>
          {errors.categoria_id && (
            <p className="mt-1 text-xs text-red-600">{errors.categoria_id}</p>
          )}
        </div>

        {/* Modelo / Corte (opcional) */}
        <div>
          <label htmlFor="modelo_corte_id" className="block text-xs font-medium text-zinc-700">
            Modelo / Corte <span className="text-zinc-400 font-normal">(Opcional)</span>
          </label>
          <select
            id="modelo_corte_id"
            value={modeloCorteId}
            disabled={!categoriaId || modelosFiltrados.length === 0}
            onChange={(e) => onChange("modelo_corte_id", e.target.value ? Number(e.target.value) : "")}
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          >
            <option value="">
              {!categoriaId
                ? "Primero elige categoría"
                : modelosFiltrados.length === 0
                ? "Sin modelos para esta categoría"
                : "Selecciona un modelo (opcional)"}
            </option>
            {modelosFiltrados.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción (ancho completo) */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="descripcion" className="block text-xs font-medium text-zinc-700">
            Descripción <span className="text-zinc-400 font-normal">(Opcional)</span>
          </label>
          <textarea
            id="descripcion"
            rows={2}
            value={descripcion}
            onChange={(e) => onChange("descripcion", e.target.value)}
            placeholder="Detalles del producto..."
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950"
          />
        </div>
      </div>
    </section>
  );
}
