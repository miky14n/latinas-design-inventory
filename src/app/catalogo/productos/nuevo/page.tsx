"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function NuevoProductoPage() {
  const [options, setOptions] = useState<CatalogoOptions | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Carga inicial de opciones desde GET /api/catalogo/productos
  useEffect(() => {
    let active = true;

    async function fetchOptions() {
      try {
        setIsLoadingOptions(true);
        setOptionsError(null);
        const res = await fetch("/api/catalogo/productos");

        if (!res.ok) {
          throw new Error(
            `Error al consultar opciones del catálogo (código HTTP ${res.status})`
          );
        }

        const responseBody = await res.json();
        const data: CatalogoOptions = responseBody.data;
        if (active) {
          setOptions(data);
        }
      } catch (err: unknown) {
        if (active) {
          setOptionsError(
            err instanceof Error
              ? err.message
              : "No fue posible conectar con /api/catalogo/productos"
          );
        }
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    }

    fetchOptions();

    return () => {
      active = false;
    };
  }, []);

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
    setFormData((prev) => ({
      ...prev,
      escala_id: escalaId,
      selectedTallaIds: [],
      variants: {},
    }));
    if (errors.escala_id) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.escala_id;
        delete copy.tallas;
        return copy;
      });
    }
  };

  // Toggle de talla individual
  const handleToggleTalla = (tallaId: number) => {
    setFormData((prev) => {
      const exists = prev.selectedTallaIds.includes(tallaId);
      const newTallaIds = exists
        ? prev.selectedTallaIds.filter((id) => id !== tallaId)
        : [...prev.selectedTallaIds, tallaId];

      // Inicializar variantes si se agrega
      const newVariants = { ...prev.variants };
      if (!exists) {
        prev.selectedColorIds.forEach((cId) => {
          const key = `${cId}-${tallaId}`;
          if (!newVariants[key]) {
            newVariants[key] = {
              talla_id: tallaId,
              color_id: cId,
              activo: true,
              codigo: "",
            };
          }
        });
      }

      return {
        ...prev,
        selectedTallaIds: newTallaIds,
        variants: newVariants,
      };
    });
  };

  // Seleccionar todas las tallas de la escala
  const handleSelectAllTallas = (tallas: Talla[]) => {
    const ids = tallas.map((t) => t.id);
    setFormData((prev) => {
      const newVariants = { ...prev.variants };
      prev.selectedColorIds.forEach((cId) => {
        ids.forEach((tId) => {
          const key = `${cId}-${tId}`;
          if (!newVariants[key]) {
            newVariants[key] = {
              talla_id: tId,
              color_id: cId,
              activo: true,
              codigo: "",
            };
          }
        });
      });
      return {
        ...prev,
        selectedTallaIds: ids,
        variants: newVariants,
      };
    });
  };

  // Limpiar selección de tallas
  const handleClearTallas = () => {
    setFormData((prev) => ({
      ...prev,
      selectedTallaIds: [],
    }));
  };

  // Toggle de color individual
  const handleToggleColor = (colorId: number) => {
    setFormData((prev) => {
      const exists = prev.selectedColorIds.includes(colorId);
      const newColorIds = exists
        ? prev.selectedColorIds.filter((id) => id !== colorId)
        : [...prev.selectedColorIds, colorId];

      const newVariants = { ...prev.variants };
      if (!exists) {
        prev.selectedTallaIds.forEach((tId) => {
          const key = `${colorId}-${tId}`;
          if (!newVariants[key]) {
            newVariants[key] = {
              talla_id: tId,
              color_id: colorId,
              activo: true,
              codigo: "",
            };
          }
        });
      }

      return {
        ...prev,
        selectedColorIds: newColorIds,
        variants: newVariants,
      };
    });
  };

  // Limpiar selección de colores
  const handleClearColors = () => {
    setFormData((prev) => ({
      ...prev,
      selectedColorIds: [],
    }));
  };

  // Toggle de celda en la matriz
  const handleToggleVariant = (colorId: number, tallaId: number) => {
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

    // Limpiar error de esa celda si ya se corrigió
    const errorKey = `variant_code_${key}`;
    if (errors[errorKey] && truncatedCode.trim().length === 7) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  // Activar todas las variantes de la matriz
  const handleActivateAllVariants = () => {
    setFormData((prev) => {
      const updated = { ...prev.variants };
      prev.selectedColorIds.forEach((cId) => {
        prev.selectedTallaIds.forEach((tId) => {
          const key = `${cId}-${tId}`;
          updated[key] = {
            ...(updated[key] || { talla_id: tId, color_id: cId, codigo: "" }),
            activo: true,
          };
        });
      });
      return { ...prev, variants: updated };
    });
  };

  // Desactivar todas las variantes de la matriz
  const handleDeactivateAllVariants = () => {
    setFormData((prev) => {
      const updated = { ...prev.variants };
      prev.selectedColorIds.forEach((cId) => {
        prev.selectedTallaIds.forEach((tId) => {
          const key = `${cId}-${tId}`;
          if (updated[key]) {
            updated[key] = {
              ...updated[key],
              activo: false,
            };
          }
        });
      });
      return { ...prev, variants: updated };
    });
  };

  // Aplicar prefijo de categoría a los códigos vacíos
  const handleApplyCategoryPrefix = (prefix: string) => {
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
    setSubmitSuccess(null);
    setSubmitError(null);

    const newErrors: Record<string, string> = {};

    if (!formData.codigo_interno.trim()) {
      newErrors.codigo_interno = "El código interno es obligatorio.";
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del producto es obligatorio.";
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

    formData.selectedColorIds.forEach((cId) => {
      formData.selectedTallaIds.forEach((tId) => {
        const key = `${cId}-${tId}`;
        const v = formData.variants[key];
        if (v?.activo) {
          const code = (v.codigo || "").trim();
          if (code.length !== 7) {
            newErrors[`variant_code_${key}`] = "Debe tener 7 car.";
          }
          activeVariantsList.push({
            talla_id: tId,
            color_id: cId,
            codigo: code,
          });
        }
      });
    });

    if (activeVariantsList.length === 0) {
      newErrors.variantes = "Debes activar al menos una variante con su código.";
    }

    // Validar precios opcionales
    const preciosList: { lista_id: number; importe: number }[] = [];
    Object.entries(formData.precios).forEach(([listaIdStr, val]) => {
      if (val && val.trim() !== "") {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
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
      setSubmitError("Por favor revisa los campos señalados antes de guardar.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

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
          errJson?.error || `Error al guardar el producto (HTTP ${res.status})`
        );
      }

      setSubmitSuccess(
        `Producto "${payload.nombre}" registrado exitosamente con ${payload.variantes.length} variante(s).`
      );
      // Reiniciar formulario
      setFormData(INITIAL_FORM_DATA);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado al guardar."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render en estado de carga de opciones
  if (isLoadingOptions) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
        <p className="mt-4 text-sm font-medium text-zinc-900">
          Cargando opciones del catálogo...
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Consultando marcas, categorías, escalas y colores en /api/catalogo/productos
        </p>
      </div>
    );
  }

  // Render si falla la carga de opciones
  if (optionsError || !options) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ⚠️
        </div>
        <h3 className="mt-3 text-base font-semibold text-red-900">
          No se pudieron cargar las opciones del catálogo
        </h3>
        <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">
          {optionsError}
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Verifica que el servidor esté activo y que el endpoint GET /api/catalogo/productos responda el contrato esperado.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Tallas disponibles para la escala seleccionada
  const selectedCategoria = options.categorias.find(
    (c) => c.id === Number(formData.categoria_id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Alertas globales de éxito y error */}
      {submitSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span className="font-semibold">{submitSuccess}</span>
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
              onClick={() => setSubmitSuccess(null)}
              className="font-medium underline hover:text-emerald-950"
            >
              Registrar otro producto
            </button>
          </div>
        </div>
      )}

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="font-semibold">{submitError}</span>
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
        onActivateAllVariants={handleActivateAllVariants}
        onDeactivateAllVariants={handleDeactivateAllVariants}
        onApplyCategoryPrefix={handleApplyCategoryPrefix}
        errors={errors}
      />

      {/* Barra de Acciones */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-xs text-zinc-500">
          <span>Campos marcados con </span>
          <span className="font-bold text-red-500">*</span>
          <span> son obligatorios. Las variantes requieren código de 7 caracteres.</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSubmitting && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            )}
            <span>{isSubmitting ? "Guardando producto..." : "Guardar Producto y Variantes"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
