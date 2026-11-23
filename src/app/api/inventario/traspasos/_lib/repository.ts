import type { PoolClient } from "@neondatabase/serverless";
import { withDatabaseTransaction } from "@/app/api/_lib/db";
import { TraspasoError } from "./errors";
import type { leerEnvio, leerRecepcion } from "./service";

type Acceso = { global: boolean; tienda_id: string | null; almacen_id: string | null };

export async function conAcceso<T>(user: string, run: (db: PoolClient, acceso: Acceso) => Promise<T>) {
  return withDatabaseTransaction(async db => {
    await db.query("SELECT set_config('app.usuario_id', $1, true)", [user]);
    const access = await db.query<Acceso>(`SELECT rol_tiene_permiso(r.id,'VER_TODAS_LAS_TIENDAS') AS global, u.tienda_id::text AS tienda_id, a.id::text AS almacen_id
      FROM usuario u JOIN rol r ON r.id=u.rol_id LEFT JOIN tienda t ON t.id=u.tienda_id AND t.activo
      LEFT JOIN almacen a ON a.tienda_id=t.id AND a.activo
      WHERE u.id=$1 AND u.activo AND r.activo AND (rol_tiene_permiso(r.id,'VER_TODAS_LAS_TIENDAS') OR (r.codigo IN ('VENDEDORA','SUPERVISORA') AND t.id IS NOT NULL AND a.id IS NOT NULL))`, [user]);
    if (!access.rowCount) throw new TraspasoError("PERMISO", "Tu cuenta no tiene acceso a los traspasos de una tienda activa.");
    return run(db, access.rows[0]);
  });
}
export async function consultar(db: PoolClient, acceso: Acceso, origen: string | null, buscar: string) {
  if (origen && !acceso.global && origen !== acceso.almacen_id) throw new TraspasoError("PERMISO", "Solo puedes consultar el stock de tu tienda.");
  const almacenes = await db.query(`SELECT a.id::text, coalesce(t.nombre,a.nombre) AS nombre FROM almacen a LEFT JOIN tienda t ON t.id=a.tienda_id WHERE a.activo AND (a.tienda_id IS NULL OR t.activo) ORDER BY nombre`);
  const documentos = await db.query(`SELECT d.id::text,d.numero,d.registrado_en,d.recibido_en,d.motivo,coalesce(toi.nombre,ao.nombre) AS origen,coalesce(td.nombre,ad.nombre) AS destino,
    ($1::boolean OR ad.tienda_id=$2::bigint) AS puede_recibir,
    json_agg(json_build_object('variante_id',m.variante_id::text,'nombre',p.nombre,'talla',t.valor,'color',c.nombre,'cantidad',-m.cantidad_delta,
      'buenas',coalesce((SELECT sum(r.cantidad_delta) FROM movimiento_stock r WHERE r.documento_id=d.id AND r.variante_id=m.variante_id AND r.cantidad_delta>0 AND r.condicion='DISPONIBLE'),0),
      'danadas',coalesce((SELECT sum(r.cantidad_delta) FROM movimiento_stock r WHERE r.documento_id=d.id AND r.variante_id=m.variante_id AND r.cantidad_delta>0 AND r.condicion='DANADO'),0)) ORDER BY p.nombre,c.nombre,t.orden) AS lineas
    FROM documento_inventario d JOIN almacen ao ON ao.id=d.almacen_id JOIN almacen ad ON ad.id=d.almacen_destino_id LEFT JOIN tienda toi ON toi.id=ao.tienda_id LEFT JOIN tienda td ON td.id=ad.tienda_id
    JOIN movimiento_stock m ON m.documento_id=d.id AND m.cantidad_delta<0 JOIN variante v ON v.id=m.variante_id JOIN producto p ON p.id=v.producto_id JOIN talla t ON t.id=v.talla_id JOIN color c ON c.id=v.color_id
    WHERE d.tipo='TRASPASO' AND ($1::boolean OR ao.tienda_id=$2::bigint OR ad.tienda_id=$2::bigint) GROUP BY d.id,ao.nombre,ad.nombre,ad.tienda_id,toi.nombre,td.nombre ORDER BY d.registrado_en DESC LIMIT 100`, [acceso.global, acceso.tienda_id]);
  const variantes = origen && /^\d+$/.test(origen) && buscar.trim() ? await db.query(`SELECT v.id::text,p.nombre,p.codigo_interno,t.valor AS talla,c.nombre AS color,s.disponible::integer AS disponible FROM v_stock_disponible s JOIN variante v ON v.id=s.variante_id JOIN producto p ON p.id=v.producto_id JOIN talla t ON t.id=v.talla_id JOIN color c ON c.id=v.color_id WHERE s.almacen_id=$1 AND s.disponible>0 AND v.activo AND p.activo AND (strpos(lower(concat_ws(' ',p.nombre,p.codigo_interno,t.valor,c.nombre)),lower($2))>0 OR EXISTS (SELECT 1 FROM codigo_variante cv WHERE cv.variante_id=v.id AND cv.sustituido_en IS NULL AND strpos(lower(cv.codigo),lower($2))>0)) ORDER BY p.nombre,c.nombre,t.orden LIMIT 30`, [origen,buscar.trim()]) : { rows: [] };
  return { almacenes: almacenes.rows, documentos: documentos.rows, variantes: variantes.rows, acceso: { global: acceso.global, almacen_id: acceso.almacen_id } };
}
export async function enviar(db: PoolClient, acceso: Acceso, envio: ReturnType<typeof leerEnvio>) {
  if (!acceso.global && envio.origen !== acceso.almacen_id) throw new TraspasoError("PERMISO", "Solo puedes enviar desde tu tienda.");
  const contenido = JSON.stringify({ origen: envio.origen, destino: envio.destino, lineas: envio.lineas });
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [envio.clave]);
  const previo = await db.query("SELECT documento_id::text AS id, usuario_id=app_usuario() AND contenido=$2::jsonb AS coincide FROM solicitud_traspaso WHERE clave=$1::uuid", [envio.clave, contenido]);
  if (previo.rowCount) {
    if (!previo.rows[0].coincide) throw new TraspasoError("DATOS", "La clave de envío ya fue utilizada con otros datos.");
    return { id: previo.rows[0].id };
  }
  const ubicaciones = await db.query(`SELECT a.id FROM almacen a LEFT JOIN tienda t ON t.id=a.tienda_id WHERE a.id=ANY($1::bigint[]) AND a.activo AND (a.tienda_id IS NULL OR t.activo) ORDER BY a.id FOR SHARE OF a`, [[envio.origen,envio.destino]]);
  if (ubicaciones.rowCount !== 2) throw new TraspasoError("DATOS", "Una ubicación dejó de estar activa.");
  const compatibles = await db.query(`SELECT v.id FROM variante v JOIN producto p ON p.id=v.producto_id JOIN almacen a ON a.id=$2 LEFT JOIN tienda t ON t.id=a.tienda_id WHERE v.id=ANY($1::bigint[]) AND v.activo AND p.activo AND (t.marca_id IS NULL OR t.marca_id=p.marca_id)`, [envio.lineas.map(l=>l.variante_id),envio.destino]);
  if (compatibles.rowCount !== envio.lineas.length) throw new TraspasoError("DATOS", "Hay productos inactivos o no admitidos en la ubicación de destino.");
  const result = await db.query("SELECT enviar_traspaso($1,$2,$3::jsonb)::text AS id", [envio.origen,envio.destino,JSON.stringify(envio.lineas)]);
  await db.query("INSERT INTO solicitud_traspaso (clave,usuario_id,contenido,documento_id) VALUES ($1::uuid,app_usuario(),$2::jsonb,$3)", [envio.clave,contenido,result.rows[0].id]);
  return result.rows[0];
}
export async function recibir(db: PoolClient, acceso: Acceso, recepcion: ReturnType<typeof leerRecepcion>) {
  const doc = await db.query("SELECT d.id FROM documento_inventario d JOIN almacen a ON a.id=d.almacen_destino_id WHERE d.id=$1 AND d.tipo='TRASPASO' AND d.recibido_en IS NULL AND ($2::boolean OR a.tienda_id=$3::bigint) FOR UPDATE OF d", [recepcion.documento, acceso.global, acceso.tienda_id]);
  if (!doc.rowCount) throw new TraspasoError("DATOS", "El traspaso ya fue recibido o no existe.");
  const enviadas = await db.query("SELECT variante_id::text, sum(-cantidad_delta)::integer AS cantidad FROM movimiento_stock WHERE documento_id=$1 AND cantidad_delta<0 GROUP BY variante_id ORDER BY variante_id", [recepcion.documento]);
  if (enviadas.rows.length !== recepcion.lineas.length) throw new TraspasoError("DATOS", "Revisa todas las variantes enviadas.");
  const movimientos: { variante_id: string; cantidad: number; condicion: string }[] = [];
  let diferencia = false;
  for (const enviada of enviadas.rows) {
    const linea = recepcion.lineas.find(l => l.variante_id === enviada.variante_id);
    if (!linea || linea.buenas + linea.danadas > enviada.cantidad) throw new TraspasoError("DATOS", "La cantidad recibida no puede superar la enviada.");
    if (linea.danadas || linea.buenas + linea.danadas !== enviada.cantidad) diferencia = true;
    if (linea.buenas) movimientos.push({ variante_id: linea.variante_id, cantidad: linea.buenas, condicion: "DISPONIBLE" });
    if (linea.danadas) movimientos.push({ variante_id: linea.variante_id, cantidad: linea.danadas, condicion: "DANADO" });
  }
  if (diferencia && !recepcion.motivo) throw new TraspasoError("DATOS", "Indica el motivo de los faltantes o daños.");
  await db.query("SELECT recibir_traspaso($1,$2::jsonb,$3)", [recepcion.documento,JSON.stringify(movimientos),recepcion.motivo || null]);
}
