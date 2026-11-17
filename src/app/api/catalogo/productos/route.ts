import { NextResponse } from "next/server";
import type { PoolClient } from "@neondatabase/serverless";
import { auth } from "@/lib/server/auth";
import { withDatabaseTransaction } from "@/app/api/_lib/db";

const CATALOG_PERMISSION = "GESTIONAR_CATALOGO";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type VariantInput = { talla_id: number; color_id: number; codigo: string };
type PriceInput = { lista_id: number; importe: number };
type ProductInput = {
  codigo_interno: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  modelo_corte_id?: number | null;
  escala_id: number;
  marca_id: number;
  genero: "DAMA" | "VARON" | "UNISEX";
  variantes: VariantInput[];
  precios?: PriceInput[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string")
    throw new ApiError(`${label} es obligatorio.`, 400);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength)
    throw new ApiError(
      `${label} es obligatorio y debe tener como máximo ${maxLength} caracteres.`,
      400,
    );
  return normalized;
}

function positiveId(value: unknown, label: string): number {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new ApiError(`${label} no es válido.`, 400);
  return id;
}

function parseProductInput(value: unknown): ProductInput {
  if (!isRecord(value))
    throw new ApiError("El cuerpo de la solicitud no es válido.", 400);
  const gender = value.genero;
  if (gender !== "DAMA" && gender !== "VARON" && gender !== "UNISEX")
    throw new ApiError("El género no es válido.", 400);
  const rawVariants = value.variantes;
  if (
    !Array.isArray(rawVariants) ||
    rawVariants.length === 0 ||
    rawVariants.length > 500
  )
    throw new ApiError(
      "Agrega al menos una variante y revisa el máximo permitido.",
      400,
    );
  const variants = rawVariants.map((item, index): VariantInput => {
    if (!isRecord(item))
      throw new ApiError(`La variante ${index + 1} no es válida.`, 400);
    const code = requiredText(
      item.codigo,
      `El código de la variante ${index + 1}`,
      7,
    );
    if (code.length !== 7)
      throw new ApiError(
        `El código de la variante ${index + 1} debe tener 7 caracteres.`,
        400,
      );
    return {
      talla_id: positiveId(
        item.talla_id,
        `La talla de la variante ${index + 1}`,
      ),
      color_id: positiveId(
        item.color_id,
        `El color de la variante ${index + 1}`,
      ),
      codigo: code,
    };
  });
  const variantKeys = new Set<string>();
  const variantCodes = new Set<string>();
  for (const variant of variants) {
    const key = `${variant.talla_id}:${variant.color_id}`;
    if (variantKeys.has(key))
      throw new ApiError("No repitas combinaciones de talla y color.", 400);
    if (variantCodes.has(variant.codigo))
      throw new ApiError("No repitas códigos de variante.", 400);
    variantKeys.add(key);
    variantCodes.add(variant.codigo);
  }
  const rawPrices = value.precios ?? [];
  if (!Array.isArray(rawPrices) || rawPrices.length > 20)
    throw new ApiError("La lista de precios no es válida.", 400);
  const prices = rawPrices.map((item, index): PriceInput => {
    if (!isRecord(item))
      throw new ApiError(`El precio ${index + 1} no es válido.`, 400);
    const amount =
      typeof item.importe === "number" ? item.importe : Number(item.importe);
    if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999.99)
      throw new ApiError(
        `El importe del precio ${index + 1} no es válido.`,
        400,
      );
    return {
      lista_id: positiveId(item.lista_id, `La lista del precio ${index + 1}`),
      importe: Math.round(amount * 100) / 100,
    };
  });
  if (new Set(prices.map((price) => price.lista_id)).size !== prices.length)
    throw new ApiError("Solo puedes registrar un precio por lista.", 400);
  const description = value.descripcion;
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  )
    throw new ApiError("La descripción no es válida.", 400);
  return {
    codigo_interno: requiredText(
      value.codigo_interno,
      "El código interno",
      100,
    ),
    nombre: requiredText(value.nombre, "El nombre", 200),
    descripcion:
      typeof description === "string"
        ? description.trim() || undefined
        : undefined,
    categoria_id: positiveId(value.categoria_id, "La categoría"),
    modelo_corte_id:
      value.modelo_corte_id == null
        ? null
        : positiveId(value.modelo_corte_id, "El modelo"),
    escala_id: positiveId(value.escala_id, "La escala de tallas"),
    marca_id: positiveId(value.marca_id, "La marca"),
    genero: gender,
    variantes: variants,
    precios: prices,
  };
}

async function getSessionUserId(): Promise<string> {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id)
    throw new ApiError("Inicia sesión para continuar.", 401);
  return data.user.id;
}

async function requireCatalogPermission(client: PoolClient, userId: string) {
  await client.query("SELECT set_config('app.usuario_id', $1, true)", [userId]);
  const profile = await client.query<{ id: string; rol_id: string }>(
    `SELECT u.id, u.rol_id FROM usuario u JOIN rol r ON r.id = u.rol_id AND r.activo WHERE u.id = $1 AND u.activo`,
    [userId],
  );
  const currentUser = profile.rows[0];
  if (!currentUser)
    throw new ApiError(
      "Tu perfil no está activo o no tiene acceso al sistema.",
      403,
    );
  const permission = await client.query<{ permitido: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM rol_permiso rp JOIN permiso p ON p.id = rp.permiso_id WHERE rp.rol_id = $1 AND p.codigo = $2) AS permitido`,
    [currentUser.rol_id, CATALOG_PERMISSION],
  );
  if (!permission.rows[0]?.permitido)
    throw new ApiError(
      "Tu rol no tiene permiso para gestionar el catálogo.",
      403,
    );
  return currentUser;
}

function errorResponse(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (isRecord(error) && error.code === "23505") {
    const messages: Record<string, string> = {
      producto_codigo_interno_uk:
        "Ya existe un producto con ese código interno.",
      codigo_variante_vigente_uk:
        "Uno de los códigos de variante ya está registrado.",
      variante_uk:
        "Ya existe esa combinación de talla y color para el producto.",
      precio_producto_vigencia_uk:
        "Ya existe un precio para esa lista y fecha.",
    };
    return NextResponse.json(
      {
        error:
          typeof error.constraint === "string"
            ? (messages[error.constraint] ?? "El registro ya existe.")
            : "El registro ya existe.",
      },
      { status: 409 },
    );
  }
  if (isRecord(error) && (error.code === "23503" || error.code === "23514"))
    return NextResponse.json(
      { error: "Revisa las opciones y los datos ingresados." },
      { status: 400 },
    );
  console.error("Error en API de catálogo", error);
  return NextResponse.json(
    { error: "No se pudo completar la operación." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    const data = await withDatabaseTransaction(async (client) => {
      await requireCatalogPermission(client, userId);
      const [
        marcas,
        categorias,
        modelosCorte,
        escalas,
        tallas,
        colores,
        listasPrecio,
      ] = await Promise.all([
        client.query(
          "SELECT id, nombre FROM marca WHERE activo ORDER BY nombre",
        ),
        client.query(
          "SELECT id, padre_id, nombre, prefijo_codigo FROM categoria WHERE activo ORDER BY nombre",
        ),
        client.query(
          "SELECT id, categoria_id, nombre FROM modelo_corte WHERE activo ORDER BY nombre",
        ),
        client.query(
          "SELECT id, nombre, tipo FROM escala_talla WHERE activo ORDER BY nombre",
        ),
        client.query(
          "SELECT id, escala_id, valor, orden FROM talla WHERE activo ORDER BY escala_id, orden, valor",
        ),
        client.query(
          "SELECT id, codigo, nombre, hex FROM color WHERE activo ORDER BY nombre",
        ),
        client.query(
          "SELECT id, codigo, nombre, moneda FROM lista_precio WHERE activo ORDER BY nombre",
        ),
      ]);
      return {
        marcas: marcas.rows,
        categorias: categorias.rows,
        modelosCorte: modelosCorte.rows,
        escalas: escalas.rows,
        tallas: tallas.rows,
        colores: colores.rows,
        listasPrecio: listasPrecio.rows,
      };
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("El cuerpo debe ser JSON válido.", 400);
    }
    const input = parseProductInput(body);
    const result = await withDatabaseTransaction(async (client) => {
      await requireCatalogPermission(client, userId);
      const references = await client.query<{
        categoria: boolean;
        modelo: boolean;
        escala: boolean;
        marca: boolean;
      }>(
        `SELECT EXISTS (SELECT 1 FROM categoria WHERE id = $1 AND activo) AS categoria,
                ($2::bigint IS NULL OR EXISTS (SELECT 1 FROM modelo_corte WHERE id = $2 AND categoria_id = $1 AND activo)) AS modelo,
                EXISTS (SELECT 1 FROM escala_talla WHERE id = $3 AND activo) AS escala,
                EXISTS (SELECT 1 FROM marca WHERE id = $4 AND activo) AS marca`,
        [
          input.categoria_id,
          input.modelo_corte_id,
          input.escala_id,
          input.marca_id,
        ],
      );
      const reference = references.rows[0];
      if (
        !reference?.categoria ||
        !reference.modelo ||
        !reference.escala ||
        !reference.marca
      )
        throw new ApiError(
          "Una categoría, modelo, escala o marca seleccionada ya no está disponible.",
          400,
        );
      const sizeIds = [
        ...new Set(input.variantes.map((variant) => variant.talla_id)),
      ];
      const colorIds = [
        ...new Set(input.variantes.map((variant) => variant.color_id)),
      ];
      const [sizes, colors, priceLists] = await Promise.all([
        client.query(
          "SELECT id FROM talla WHERE escala_id = $1 AND activo AND id = ANY($2::bigint[])",
          [input.escala_id, sizeIds],
        ),
        client.query(
          "SELECT id FROM color WHERE activo AND id = ANY($1::bigint[])",
          [colorIds],
        ),
        input.precios?.length
          ? client.query(
              "SELECT id FROM lista_precio WHERE activo AND id = ANY($1::bigint[])",
              [input.precios.map((price) => price.lista_id)],
            )
          : Promise.resolve({ rows: [] as { id: string }[] }),
      ]);
      if (sizes.rows.length !== sizeIds.length)
        throw new ApiError(
          "Una talla no pertenece a la escala elegida o está inactiva.",
          400,
        );
      if (colors.rows.length !== colorIds.length)
        throw new ApiError("Un color seleccionado no está disponible.", 400);
      if (priceLists.rows.length !== (input.precios?.length ?? 0))
        throw new ApiError("Una lista de precio no está disponible.", 400);
      const productResult = await client.query<{
        id: string;
        codigo_interno: string;
      }>(
        `INSERT INTO producto (codigo_interno, nombre, descripcion, categoria_id, modelo_corte_id, escala_id, marca_id, genero)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, codigo_interno`,
        [
          input.codigo_interno,
          input.nombre,
          input.descripcion ?? null,
          input.categoria_id,
          input.modelo_corte_id,
          input.escala_id,
          input.marca_id,
          input.genero,
        ],
      );
      const product = productResult.rows[0];
      for (const variant of input.variantes) {
        const insertedVariant = await client.query<{ id: string }>(
          "INSERT INTO variante (producto_id, talla_id, color_id) VALUES ($1, $2, $3) RETURNING id",
          [product.id, variant.talla_id, variant.color_id],
        );
        await client.query(
          "INSERT INTO codigo_variante (variante_id, codigo, tipo, categoria_emision_id, emitido_por) VALUES ($1, $2, 'NUEVO', $3, $4)",
          [
            insertedVariant.rows[0].id,
            variant.codigo,
            input.categoria_id,
            userId,
          ],
        );
      }
      if (input.precios?.length)
        for (const price of input.precios) {
          await client.query(
            "INSERT INTO precio_producto (producto_id, lista_id, importe, vigente_desde, registrado_por, motivo) VALUES ($1, $2, $3, fecha_local(now()), $4, 'Alta inicial del producto')",
            [product.id, price.lista_id, price.importe, userId],
          );
        }
      return {
        id: product.id,
        codigo_interno: product.codigo_interno,
        variantes_creadas: input.variantes.length,
        precios_creados: input.precios?.length ?? 0,
      };
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
