import type { PoolClient } from "@neondatabase/serverless";
import { withDatabaseTransaction } from "@/app/api/_lib/db";
import { IngresoError } from "./errors";
import type { leerIngreso } from "./service";

export function conAccesoCentral<T>(usuario: string, operacion: (db: PoolClient) => Promise<T>) {
  return withDatabaseTransaction(async db => {
    await db.query("SELECT set_config('app.usuario_id', $1, true)", [usuario]);
    const acceso = await db.query(`SELECT 1 FROM usuario u JOIN rol r ON r.id=u.rol_id
      WHERE u.id=$1 AND u.activo AND r.activo AND rol_tiene_permiso(r.id,'VER_TODAS_LAS_TIENDAS')`, [usuario]);
    if (!acceso.rowCount) throw new IngresoError("PERMISO", "Tu cuenta requiere acceso al almacén central.");
    return operacion(db);
  });
}

export async function consultar(db: PoolClient, buscar: string | null) {
  if (buscar === null) {
    return (await db.query("SELECT id::text, nombre, tipo FROM origen_mercaderia WHERE activo ORDER BY nombre, id")).rows;
  }
  return (await db.query(`SELECT v.id::text, p.nombre, p.codigo_interno, t.valor AS talla, c.nombre AS color
    FROM variante v JOIN producto p ON p.id=v.producto_id JOIN talla t ON t.id=v.talla_id
    JOIN color c ON c.id=v.color_id WHERE v.activo AND p.activo AND
    (strpos(lower(concat_ws(' ',p.nombre,p.codigo_interno,t.valor,c.nombre)),lower($1))>0 OR EXISTS
      (SELECT 1 FROM codigo_variante cv WHERE cv.variante_id=v.id AND cv.sustituido_en IS NULL
       AND strpos(lower(cv.codigo),lower($1))>0))
    ORDER BY p.nombre,c.nombre,t.orden,v.id LIMIT 30`, [buscar])).rows;
}

export async function registrar(db: PoolClient, ingreso: ReturnType<typeof leerIngreso>) {
  const referencia = "recepcion:" + ingreso.clave;
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [referencia]);
  const previo = await db.query(`SELECT numero FROM documento_inventario WHERE tipo='INGRESO'
    AND registrado_por=app_usuario() AND referencia=$1`, [referencia]);
  if (previo.rowCount) return previo.rows[0];
  const almacen = await db.query("SELECT id FROM almacen WHERE codigo='CENTRAL' AND tienda_id IS NULL AND activo FOR SHARE");
  if (!almacen.rowCount) throw new IngresoError("DATOS", "El almacén central debe estar activo.");
  const origen = await db.query("SELECT id FROM origen_mercaderia WHERE id=$1 AND activo FOR SHARE", [ingreso.origen]);
  if (!origen.rowCount) throw new IngresoError("DATOS", "Selecciona un origen activo.");
  const variantes = await db.query(`SELECT v.id FROM variante v JOIN producto p ON p.id=v.producto_id
    WHERE v.id=ANY($1::bigint[]) AND v.activo AND p.activo ORDER BY v.id FOR SHARE OF v,p`,
    [ingreso.lineas.map(l => l.variante_id)]);
  if (variantes.rowCount !== ingreso.lineas.length) throw new IngresoError("DATOS", "Una variante dejó de estar disponible. Revisa el detalle.");
  const documento = await db.query("SELECT registrar_ingreso($1,$2,$3,$4::jsonb) AS id",
    [almacen.rows[0].id, ingreso.origen, referencia, JSON.stringify(ingreso.lineas)]);
  return (await db.query("SELECT numero FROM documento_inventario WHERE id=$1", [documento.rows[0].id])).rows[0];
}
