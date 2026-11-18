import { auth } from "@/lib/server/auth";
import { withDatabaseTransaction } from "@/app/api/_lib/db";
import { CatalogError } from "./errors";
import { authorize, fields, list, save, type Kind, type Values } from "./repository";

async function sessionId() {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id) throw new CatalogError("UNAUTHENTICATED", "Inicia sesión para continuar.");
  return data.user.id;
}

export async function readCatalog() {
  const id = await sessionId();
  return withDatabaseTransaction(async (client) => { await authorize(client, id); return list(client); });
}

function parseId(value: unknown, optional = false): string | null {
  if (optional && (value === null || value === "" || value === undefined)) return null;
  const text = String(value ?? "");
  if (!/^[1-9]\d{0,18}$/.test(text) || (text.length === 19 && text > "9223372036854775807"))
    throw new CatalogError("INVALID", "Selecciona una opción válida.");
  return text;
}
function text(value: unknown, label: string, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new CatalogError("INVALID", `${label} es obligatorio y debe tener como máximo ${max} caracteres.`);
  return value.trim();
}
export function validate(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new CatalogError("INVALID", "Datos inválidos.");
  const body = input as Record<string, unknown>;
  if (typeof body.kind !== "string" || !Object.hasOwn(fields, body.kind)) throw new CatalogError("INVALID", "Sección inválida.");
  const kind = body.kind as Kind;
  const id = parseId(body.id, true);
  if (typeof body.activo !== "boolean") throw new CatalogError("INVALID", "Estado inválido.");
  const values: Values = { activo: body.activo };
  if (kind === "talla") values.valor = text(body.valor, "La talla", 50);
  else values.nombre = text(body.nombre, "El nombre");
  if (kind === "categoria") {
    values.padre_id = parseId(body.padre_id, true);
    const prefix = typeof body.prefijo_codigo === "string" ? body.prefijo_codigo.trim() : "";
    if (prefix && !/^\d{2}$/.test(prefix)) throw new CatalogError("INVALID", "El prefijo debe tener dos dígitos.");
    values.prefijo_codigo = prefix || null;
  }
  if (kind === "modelo_corte") values.categoria_id = parseId(body.categoria_id);
  if (kind === "escala_talla") {
    if (!["DAMA", "VARON", "ALFABETICA", "UNICA"].includes(String(body.tipo))) throw new CatalogError("INVALID", "El tipo de escala no es válido.");
    values.tipo = String(body.tipo);
  }
  if (kind === "talla") {
    values.escala_id = parseId(body.escala_id);
    const order = Number(body.orden);
    if (!Number.isInteger(order) || order < 0 || order > 2147483647 || body.orden === "") throw new CatalogError("INVALID", "El orden debe ser un número entero no negativo.");
    values.orden = order;
  }
  if (kind === "color") {
    values.codigo = text(body.codigo, "El código", 50).toUpperCase();
    const hex = typeof body.hex === "string" ? body.hex.trim() : "";
    if (hex && !/^#[0-9a-f]{6}$/i.test(hex)) throw new CatalogError("INVALID", "El color debe tener el formato #RRGGBB.");
    values.hex = hex ? hex.toUpperCase() : null;
  }
  return { kind, id, values };
}
export async function writeCatalog(input: unknown, editing: boolean) {
  const userId = await sessionId();
  const { kind, id, values } = validate(input);
  if (editing !== !!id) throw new CatalogError("INVALID", "Identificador inválido.");
  return withDatabaseTransaction(async (client) => { await authorize(client, userId); await save(client, kind, id, values); });
}
