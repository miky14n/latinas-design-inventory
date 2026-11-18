import type { PoolClient } from "@neondatabase/serverless";
import { CatalogError } from "./errors";
export const fields = {
  marca: ["nombre"], categoria: ["nombre", "padre_id", "prefijo_codigo"],
  modelo_corte: ["nombre", "categoria_id"], escala_talla: ["nombre", "tipo"],
  talla: ["valor", "escala_id", "orden"], color: ["nombre", "codigo", "hex"],
} as const;
export type Kind = keyof typeof fields;
export type Values = Record<string, string | number | boolean | null>;

export async function authorize(client: PoolClient, userId: string) {
  await client.query("SELECT set_config('app.usuario_id', $1, true)", [userId]);
  const result = await client.query(`SELECT 1 FROM usuario u JOIN rol r ON r.id = u.rol_id AND r.activo
    JOIN rol_permiso rp ON rp.rol_id = r.id JOIN permiso p ON p.id = rp.permiso_id
    WHERE u.id = $1 AND u.activo AND p.codigo = 'GESTIONAR_CATALOGO'`, [userId]);
  if (!result.rows.length) throw new CatalogError("FORBIDDEN", "Tu cuenta no tiene permiso para gestionar el catálogo.");
}
export async function list(client: PoolClient) {
  const results = await Promise.all((Object.keys(fields) as Kind[]).map(async (kind) => {
    const result = await client.query(`SELECT id::text AS id, ${fields[kind].join(", ")}, activo FROM ${kind} ORDER BY id`);
    return [kind, result.rows] as const;
  }));
  return Object.fromEntries(results);
}
async function exists(client: PoolClient, sql: string, params: unknown[]) {
  const result = await client.query<{ present: boolean }>(sql, params);
  return result.rows[0].present;
}
export async function save(client: PoolClient, kind: Kind, id: string | null, values: Values) {
  await client.query("LOCK TABLE marca, categoria, modelo_corte, escala_talla, talla, color, producto, variante IN SHARE ROW EXCLUSIVE MODE");
  let current: Record<string, unknown> | undefined;
  if (id) {
    const row = await client.query(`SELECT id::text AS id, ${fields[kind].join(", ")}, activo FROM ${kind} WHERE id = $1`, [id]);
    current = row.rows[0];
    if (!current) throw new CatalogError("NOT_FOUND", "El registro ya no existe.");
  }
  const active = values.activo as boolean;
  const parent = kind === "categoria" ? values.padre_id : kind === "modelo_corte" ? values.categoria_id : kind === "talla" ? values.escala_id : null;
  if (parent && active) {
    const table = kind === "talla" ? "escala_talla" : "categoria";
    if (!await exists(client, `SELECT EXISTS(SELECT 1 FROM ${table} WHERE id = $1 AND activo) AS present`, [parent]))
      throw new CatalogError("INVALID", "Selecciona un elemento superior activo.");
  }
  if (kind === "categoria" && parent && id && await exists(client,
    `WITH RECURSIVE ancestors AS (SELECT id, padre_id FROM categoria WHERE id = $1
      UNION SELECT c.id, c.padre_id FROM categoria c JOIN ancestors a ON c.id = a.padre_id)
      SELECT EXISTS(SELECT 1 FROM ancestors WHERE id = $2) AS present`, [parent, id]))
    throw new CatalogError("INVALID", "La categoría no puede depender de sí misma ni de una de sus subcategorías.");
  if (id && !active && current?.activo) {
    if (kind === "categoria" && await exists(client,
      "SELECT EXISTS(SELECT 1 FROM categoria WHERE padre_id = $1 AND activo UNION ALL SELECT 1 FROM modelo_corte WHERE categoria_id = $1 AND activo) AS present", [id]))
      throw new CatalogError("CONFLICT", "Desactiva primero las subcategorías y cortes activos.");
    if (kind === "escala_talla" && await exists(client, "SELECT EXISTS(SELECT 1 FROM talla WHERE escala_id = $1 AND activo) AS present", [id]))
      throw new CatalogError("CONFLICT", "Desactiva primero las tallas activas de esta escala.");
  }
  if (current && id) {
    if (kind === "modelo_corte" && String(current.categoria_id) !== String(values.categoria_id) &&
      await exists(client, "SELECT EXISTS(SELECT 1 FROM producto WHERE modelo_corte_id = $1) AS present", [id]))
      throw new CatalogError("CONFLICT", "No se puede cambiar la categoría de un corte utilizado en productos.");
    if (kind === "talla" && String(current.escala_id) !== String(values.escala_id) &&
      await exists(client, "SELECT EXISTS(SELECT 1 FROM variante WHERE talla_id = $1) AS present", [id]))
      throw new CatalogError("CONFLICT", "No se puede cambiar la escala de una talla utilizada en variantes.");
  }
  const nameField = kind === "talla" ? "valor" : "nombre";
  const scope = kind === "categoria" ? " AND padre_id IS NOT DISTINCT FROM $3::bigint" : kind === "modelo_corte" ? " AND categoria_id = $3" : kind === "talla" ? " AND escala_id = $3" : "";
  const params: unknown[] = [values[nameField], id];
  if (scope) params.push(parent);
  if (await exists(client, `SELECT EXISTS(SELECT 1 FROM ${kind} WHERE lower(btrim(${nameField})) = lower(btrim($1)) AND id IS DISTINCT FROM $2::bigint${scope}) AS present`, params))
    throw new CatalogError("CONFLICT", "Ya existe un registro con ese nombre en esta sección.");
  const columns: string[] = [...fields[kind], "activo"];
  const args = columns.map((column) => values[column]);
  if (id) {
    args.push(id);
    await client.query(`UPDATE ${kind} SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(", ")} WHERE id = $${args.length}`, args);
  } else {
    await client.query(`INSERT INTO ${kind} (${columns.join(", ")}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(", ")})`, args);
  }
}
