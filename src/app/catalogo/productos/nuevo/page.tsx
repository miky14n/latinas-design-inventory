"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CatalogoOptions,
  ProductFormData,
  ProductoCreatePayload,
  ProductGeneralField,
  ProductGeneralFieldsData,
  Talla,
} from "@/components/catalogo/types";
import { ProductGeneralFields } from "@/components/catalogo/product-general-fields";
import { ProductScalePicker } from "@/components/catalogo/product-scale-picker";
import { ProductPricingFields } from "@/components/catalogo/product-pricing-fields";
import { VariantMatrixTable } from "@/components/catalogo/variant-matrix-table";

const INITIAL_FORM_DATA: ProductFormData = {
  codigo_interno: "",
  nombre: "",
  descripcion: "",
  categoria_id: "",
  modelo_corte_id: "",
  escala_id: "",
  marca_id: "",
  genero: "DAMA",
  precios: {},
  selectedTallaIds: [],
  selectedColorIds: [],
  variants: {},
};

type OptionsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CatalogoOptions };

type SubmitState =
  | { status: "idle" | "submitting" }
  | { status: "success" | "error"; message: string };

function ensureVariants(
  variants: ProductFormData["variants"],
  colorIds: number[],
  tallaIds: number[],
): ProductFormData["variants"] {
  const result = { ...variants };
  for (const colorId of colorIds) {
    for (const tallaId of tallaIds) {
      const key = `${colorId}-${tallaId}`;
      result[key] ??= { color_id: colorId, talla_id: tallaId, activo: true, codigo: "" };
    }
  }
  return result;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const [optionsState, setOptionsState] = useState<OptionsState>({ status: "loading" });

  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  // Carga inicial de opciones desde GET /api/catalogo/productos
  const fetchOptions = useCallback(async (signal?: AbortSignal) => {
      try {
        const res = await fetch("/api/catalogo/productos", { signal });

        if (res.status === 401) {
          router.replace("/auth/sign-in");
          return;
        }
        if (res.status === 403) {
          throw new Error("Tu cuenta no tiene permiso para gestionar el catálogo.");
        }
        if (!res.ok) {
          throw new Error("No se pudieron cargar las opciones del catálogo.");
        }

        const responseBody = await res.json();
        const data: CatalogoOptions = responseBody.data;
        if (!data) throw new Error("No se pudieron cargar las opciones del catálogo.");
        if (!signal?.aborted) {
          // PostgreSQL entrega los IDs bigint como texto. El formulario usa IDs numéricos.
          const normalizarId = <T extends { id: number | string }>(opcion: T) => ({
            ...opcion,
            id: Number(opcion.id),
          });
          const normalizarTalla = (talla: Talla) => ({
            ...normalizarId(talla),
            escala_id: Number(talla.escala_id),
          });

          setOptionsState({
            status: "ready",
            data: {
              marcas: data.marcas.map(normalizarId),
              categorias: data.categorias.map((categoria) => ({
                ...normalizarId(categoria),
                padre_id: categoria.padre_id === null ? null : Number(categoria.padre_id),
              })),
              modelosCorte: (data.modelosCorte ?? []).map((modelo) => ({
                ...normalizarId(modelo),
                categoria_id: Number(modelo.categoria_id),
              })),
              escalas: data.escalas.map((escala) => ({
                ...normalizarId(escala),
                tallas: escala.tallas?.map(normalizarTalla),
              })),
              tallas: data.tallas?.map(normalizarTalla),
              colores: data.colores.map(normalizarId),
              listasPrecio: data.listasPrecio.map(normalizarId),
            },
          });
        }
      } catch (err: unknown) {
        if (!signal?.aborted) {
          setOptionsState({
            status: "error",
            message: err instanceof Error
              ? err.message
              : "No fue posible conectar con el servicio de catálogo.",
          });
        }
      }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    // La carga es asíncrona; los cambios de estado ocurren al resolver la petición.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOptions(controller.signal);
    return () => controller.abort();
  }, [fetchOptions]);

  // Handlers para datos generales
  const handleGeneralChange = <Field extends ProductGeneralField>(
    field: Field,
    value: ProductGeneralFieldsData[Field],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }) as ProductFormData);
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Cambio de escala (resetea tallas seleccionadas y matriz de variantes)
  const handleEscalaChange = (escalaId: number | "") => {
    if (escalaId === formData.escala_id) return;
    if (Object.values(formData.variants).some((variant) => variant.codigo.trim()) &&
      !window.confirm("Cambiar la escala eliminará los códigos de variantes ingresados. ¿Deseas continuar?")) return;
    setFormData((prev) => ({
      ...prev,
      escala_id: escalaId,
      selectedTallaIds: [],
      variants: {},
    }));
    setErrors((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => key !== "escala_id" && key !== "tallas" && key !== "variantes" && !key.startsWith("variant_code_")),
    ));
  };

  const clearVariantErrors = () => {
    setErrors((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => key !== "variantes" && !key.startsWith("variant_code_")),
    ));
  };

  // Toggle de talla individual
  const handleToggleTalla = (tallaId: number) => {
    clearVariantErrors();
    setFormData((prev) => {
      const exists = prev.selectedTallaIds.includes(tallaId);
      const newTallaIds = exists
        ? prev.selectedTallaIds.filter((id) => id !== tallaId)
        : [...prev.selectedTallaIds, tallaId];

      return {
        ...prev,
        selectedTallaIds: newTallaIds,
        variants: exists ? prev.variants : ensureVariants(prev.variants, prev.selectedColorIds, [tallaId]),
      };
    });
  };

  // Seleccionar todas las tallas de la escala
  const handleSelectAllTallas = (tallas: Talla[]) => {
    clearVariantErrors();
    const ids = tallas.map((t) => t.id);
    setFormData((prev) => {
      return {
        ...prev,
        selectedTallaIds: ids,
        variants: ensureVariants(prev.variants, prev.selectedColorIds, ids),
      };
    });
  };

  // Limpiar selección de tallas
  const handleClearTallas = () => {
    clearVariantErrors();
    setFormData((prev) => ({
      ...prev,
      selectedTallaIds: [],
    }));
  };

  // Toggle de color individual
  const handleToggleColor = (colorId: number) => {
    clearVariantErrors();
    setFormData((prev) => {
      const exists = prev.selectedColorIds.includes(colorId);
      const newColorIds = exists
        ? prev.selectedColorIds.filter((id) => id !== colorId)
        : [...prev.selectedColorIds, colorId];

      return {
        ...prev,
        selectedColorIds: newColorIds,
        variants: exists ? prev.variants : ensureVariants(prev.variants, [colorId], prev.selectedTallaIds),
      };
    });
  };

  // Limpiar selección de colores
  const handleClearColors = () => {
    clearVariantErrors();
    setFormData((prev) => ({
      ...prev,
      selectedColorIds: [],
    }));
  };

  // Toggle de celda en la matriz
  const handleToggleVariant = (colorId: number, tallaId: number) => {
    clearVariantErrors();
    const key = `${colorId}-${tallaId}`;
    setFormData((prev) => {
      const current = prev.variants[key] || {
        talla_id: tallaId,
        color_id: colorId,
        activo: false,
        codigo: "",
      };

      return {
        ...prev,
        variants: {
          ...prev.variants,
          [key]: {
            ...current,
            activo: !current.activo,
          },
        },
      };
    });
  };

  // Cambio de código manual (7 caracteres)
  const handleChangeVariantCode = (colorId: number, tallaId: number, code: string) => {
    clearVariantErrors();
    const key = `${colorId}-${tallaId}`;
    const truncatedCode = code.slice(0, 7);

    setFormData((prev) => {
      const current = prev.variants[key] || {
        talla_id: tallaId,
        color_id: colorId,
        activo: true,
        codigo: "",
      };

      return {
        ...prev,
        variants: {
          ...prev.variants,
          [key]: {
            ...current,
            codigo: truncatedCode,
          },
        },
      };
    });

  };

  // Actualiza únicamente las combinaciones visibles; conserva códigos anteriores.
  const setSelectedVariantsActive = (active: boolean) => {
    clearVariantErrors();
    setFormData((prev) => {
      const updated = { ...prev.variants };
      prev.selectedColorIds.forEach((cId) => {
        prev.selectedTallaIds.forEach((tId) => {
          const key = `${cId}-${tId}`;
          if (active || updated[key]) {
            updated[key] = {
              ...(updated[key] || { talla_id: tId, color_id: cId, codigo: "" }),
              activo: active,
            };
          }
        });
      });
      return { ...prev, variants: updated };
    });
  };

  // Aplicar prefijo de categoría a los códigos vacíos
  const handleApplyCategoryPrefix = (prefix: string) => {
    clearVariantErrors();
    setFormData((prev) => {
      const updated = { ...prev.variants };
      prev.selectedColorIds.forEach((cId) => {
        prev.selectedTallaIds.forEach((tId) => {
          const key = `${cId}-${tId}`;
          const current = updated[key];
          if (current?.activo && (!current.codigo || current.codigo.trim() === "")) {
            updated[key] = {
              ...current,
              codigo: prefix,
            };
          }
        });
      });
      return { ...prev, variants: updated };
    });
  };

  // Cambio de precio por lista
  const handleChangePrecio = (listaId: number, importe: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`precio_${listaId}`];
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      precios: {
        ...prev.precios,
        [listaId]: importe,
      },
    }));
  };

  // Validación y envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState.status === "submitting") return;
    setSubmitState({ status: "idle" });

    const newErrors: Record<string, string> = {};

    if (!formData.codigo_interno.trim()) {
      newErrors.codigo_interno = "El código interno es obligatorio.";
    } else if (formData.codigo_interno.trim().length > 100) {
      newErrors.codigo_interno = "El código interno no puede superar 100 caracteres.";
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del producto es obligatorio.";
    } else if (formData.nombre.trim().length > 200) {
      newErrors.nombre = "El nombre no puede superar 200 caracteres.";
    }
    if (!formData.marca_id) {
      newErrors.marca_id = "Debes seleccionar una marca.";
    }
    if (!formData.categoria_id) {
      newErrors.categoria_id = "Debes seleccionar una categoría.";
    }
    if (!formData.escala_id) {
      newErrors.escala_id = "Debes seleccionar una escala de tallas.";
    }

    // Variantes activas y verificación de códigos de 7 caracteres
    const activeVariantsList: { talla_id: number; color_id: number; codigo: string }[] = [];
    const codeKeys = new Map<string, string[]>();

    formData.selectedColorIds.forEach((cId) => {
      formData.selectedTallaIds.forEach((tId) => {
        const key = `${cId}-${tId}`;
        const v = formData.variants[key];
        if (v?.activo) {
          const code = (v.codigo || "").trim();
          if (code.length !== 7) {
            newErrors[`variant_code_${key}`] = "Debe tener 7 car.";
          } else {
            const normalizedCode = code.toUpperCase();
            codeKeys.set(normalizedCode, [...(codeKeys.get(normalizedCode) || []), key]);
          }
          activeVariantsList.push({
            talla_id: tId,
            color_id: cId,
            codigo: code,
          });
        }
      });
    });

    for (const keys of codeKeys.values()) {
      if (keys.length > 1) {
        keys.forEach((key) => { newErrors[`variant_code_${key}`] = "Código repetido."; });
      }
    }

    if (activeVariantsList.length === 0) {
      newErrors.variantes = "Debes activar al menos una variante con su código.";
    }

    // Validar precios opcionales
    const preciosList: { lista_id: number; importe: number }[] = [];
    Object.entries(formData.precios).forEach(([listaIdStr, val]) => {
      if (val && val.trim() !== "") {
        const num = Number(val);
        if (!Number.isFinite(num) || num < 0 || num > 999999999999.99) {
          newErrors[`precio_${listaIdStr}`] = "Importe inválido.";
        } else {
          preciosList.push({
            lista_id: Number(listaIdStr),
            importe: num,
          });
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitState({ status: "error", message: "Por favor revisa los campos señalados antes de guardar." });
      return;
    }

    setErrors({});
    setSubmitState({ status: "submitting" });

    const payload: ProductoCreatePayload = {
      codigo_interno: formData.codigo_interno.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      categoria_id: Number(formData.categoria_id),
      modelo_corte_id: formData.modelo_corte_id ? Number(formData.modelo_corte_id) : null,
      escala_id: Number(formData.escala_id),
      marca_id: Number(formData.marca_id),
      genero: formData.genero,
      precios: preciosList.length > 0 ? preciosList : undefined,
      variantes: activeVariantsList,
    };

    try {
      const res = await fetch("/api/catalogo/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error || "No se pudo guardar el producto. Inténtalo de nuevo."
        );
      }

      setSubmitState({
        status: "success",
        message: `Producto "${payload.nombre}" registrado con ${payload.variantes.length} combinaciones de talla y color.`,
      });
      // Reiniciar formulario
      setFormData(INITIAL_FORM_DATA);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setSubmitState({
        status: "error",
        message: err instanceof Error ? err.message : "Ocurrió un error inesperado al guardar.",
      });
    }
  };

  // Render en estado de carga de opciones
  if (optionsState.status === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
        <p className="mt-4 text-sm font-medium text-zinc-900">
          Cargando opciones del catálogo...
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Consultando marcas, categorías, escalas y colores.
        </p>
      </div>
      </main>
    );
  }

  // Render si falla la carga de opciones
  if (optionsState.status === "error") {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ⚠️
        </div>
        <h3 className="mt-3 text-base font-semibold text-red-900">
          No se pudieron cargar las opciones del catálogo
        </h3>
        <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">
          {optionsState.message}
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Si el problema continúa, consulta con la persona administradora.
        </p>
        <button
          type="button"
          onClick={() => {
            setOptionsState({ status: "loading" });
            void fetchOptions();
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Reintentar
        </button>
      </div>
      </main>
    );
  }

  // Tallas disponibles para la escala seleccionada
  const options = optionsState.data;
  const selectedCategoria = options.categorias.find(
    (c) => c.id === Number(formData.categoria_id)
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header>
        <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">Inicio</Link>
          <span>/</span>
          <span>Catálogo</span>
          <span>/</span>
          <span className="font-medium text-zinc-900">Registrar producto</span>
        </nav>
        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Registrar producto</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Registra el producto, sus tallas y colores. Para agregar unidades al inventario, registra una recepción de mercadería.
          </p>
          <Link href="/catalogo/configuracion" className="mt-3 inline-block text-sm font-medium text-zinc-700 underline hover:text-zinc-950">Configurar opciones del catálogo</Link>
        </div>
      </header>
      <form onSubmit={handleSubmit} onChange={() => setSubmitState((state) => state.status === "success" ? { status: "idle" } : state)} onClick={() => setSubmitState((state) => state.status === "success" ? { status: "idle" } : state)} className="space-y-8" noValidate>
      {/* Alertas globales de éxito y error */}
      {submitState.status === "success" && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span className="font-semibold">{submitState.message}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="font-medium underline hover:text-emerald-950"
            >
              Ir al inicio
            </Link>
            <span className="text-emerald-300">|</span>
            <button
              type="button"
              onClick={() => setSubmitState({ status: "idle" })}
              className="font-medium underline hover:text-emerald-950"
            >
              Registrar otro producto
            </button>
          </div>
        </div>
      )}

      {submitState.status === "error" && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="font-semibold">{submitState.message}</span>
          </div>
        </div>
      )}

      {/* Bloque 1: Datos Generales */}
      <ProductGeneralFields
        codigoInterno={formData.codigo_interno}
        nombre={formData.nombre}
        descripcion={formData.descripcion}
        marcaId={formData.marca_id}
        genero={formData.genero}
        categoriaId={formData.categoria_id}
        modeloCorteId={formData.modelo_corte_id}
        marcas={options.marcas || []}
        categorias={options.categorias || []}
        modelosCorte={options.modelosCorte || []}
        onChange={handleGeneralChange}
        errors={errors}
      />

      {/* Bloque 2: Escala, Tallas y Colores */}
      <ProductScalePicker
        escalaId={formData.escala_id}
        escalas={options.escalas || []}
        allTallas={options.tallas || []}
        selectedTallaIds={formData.selectedTallaIds}
        selectedColorIds={formData.selectedColorIds}
        colores={options.colores || []}
        onEscalaChange={handleEscalaChange}
        onToggleTalla={handleToggleTalla}
        onSelectAllTallas={handleSelectAllTallas}
        onClearTallas={handleClearTallas}
        onToggleColor={handleToggleColor}
        onClearColors={handleClearColors}
        errors={errors}
      />

      {/* Bloque 3: Precios Iniciales (Opcional) */}
      <ProductPricingFields
        listasPrecio={options.listasPrecio || []}
        precios={formData.precios}
        onChangePrecio={handleChangePrecio}
        errors={errors}
      />

      {/* Bloque 4: Matriz Combinada Talla-Color y Códigos Manuales (7 car.) */}
      <VariantMatrixTable
        tallas={
          options.escalas.find((e) => e.id === Number(formData.escala_id))?.tallas?.length
            ? options.escalas.find((e) => e.id === Number(formData.escala_id))!.tallas!
            : (options.tallas || []).filter((t) => t.escala_id === Number(formData.escala_id))
        }
        colores={options.colores || []}
        selectedTallaIds={formData.selectedTallaIds}
        selectedColorIds={formData.selectedColorIds}
        variants={formData.variants}
        selectedCategoria={selectedCategoria}
        onToggleVariant={handleToggleVariant}
        onChangeVariantCode={handleChangeVariantCode}
        onActivateAllVariants={() => setSelectedVariantsActive(true)}
        onDeactivateAllVariants={() => setSelectedVariantsActive(false)}
        onApplyCategoryPrefix={handleApplyCategoryPrefix}
        errors={errors}
      />

      {/* Barra de Acciones */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg sm:sticky sm:bottom-4 sm:z-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:backdrop-blur-md">
        <div className="text-xs text-zinc-500">
          <span>Campos marcados con </span>
          <span className="font-bold text-red-500">*</span>
          <span> son obligatorios. Las variantes requieren código de 7 caracteres.</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitState.status === "submitting"}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitState.status === "submitting" && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            )}
            <span>{submitState.status === "submitting" ? "Guardando producto..." : "Guardar producto, tallas y colores"}</span>
          </button>
        </div>
      </div>
      </form>
    </main>
  );
}
