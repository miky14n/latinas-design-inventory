import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "@neondatabase/serverless";
import { EscaneoError } from "./errors";

export async function crear(db: PoolClient, usuario: string, modalidad: string) {
  const id = randomUUID();
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  await db.query("SELECT set_config('app.usuario_id', $1, true)", [usuario]);
  const perfil = await db.query("SELECT 1 FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE u.id=$1 AND u.activo AND r.activo", [usuario]);
  if (!perfil.rowCount) throw new EscaneoError("La cuenta no está activa.");
  await db.query("INSERT INTO sesion_escaneo (id,usuario_id,token_hash,modalidad,expira_en) VALUES ($1,$2,$3,$4,now()+interval '5 minutes')", [id, usuario, hash, modalidad]);
  return { id, token };
}

export async function propietario(db: PoolClient, usuario: string, id: string) {
  await db.query("SELECT set_config('app.usuario_id', $1, true)", [usuario]);
  const result = await db.query(`SELECT s.modalidad, s.estado FROM sesion_escaneo s
    JOIN usuario u ON u.id=s.usuario_id AND u.activo JOIN rol r ON r.id=u.rol_id AND r.activo
    WHERE s.id=$1 AND s.usuario_id=$2 AND s.expira_en>now()
      AND s.estado IN ('PENDIENTE','CONECTADA','COMPLETADA') FOR UPDATE OF s`, [id, usuario]);
  if (!result.rowCount) throw new EscaneoError("La sesión de escaneo ya no está disponible.");
  return result.rows[0];
}

export async function consultarMensajes(db: PoolClient, id: string, cursor: string, lado: string) {
  const resultado = await db.query(
    "SELECT id::text,tipo,contenido FROM mensaje_escaneo WHERE sesion_id=$1 AND id>$2::bigint AND emisor<>$3 ORDER BY id LIMIT 30",
    [id, cursor, lado],
  );
  return resultado.rows;
}

export async function cerrar(db: PoolClient, id: string) {
  await db.query("UPDATE sesion_escaneo SET estado='CERRADA',cerrada_en=now() WHERE id=$1", [id]);
}

export async function guardarMensaje(db: PoolClient, id: string, lado: string, tipo: string, contenido: object) {
  await db.query("INSERT INTO mensaje_escaneo (sesion_id,emisor,tipo,contenido) VALUES ($1,$2,$3,$4::jsonb)", [id, lado, tipo, JSON.stringify(contenido)]);
  if (tipo === "CODIGO") {
    await db.query("UPDATE sesion_escaneo SET estado='COMPLETADA',cerrada_en=now() WHERE id=$1", [id]);
  }
}

export async function movil(db: PoolClient, id: string, token: string) {
  const hash = createHash("sha256").update(token).digest("hex");
  const result = await db.query(`SELECT s.modalidad, s.estado FROM sesion_escaneo s
    JOIN usuario u ON u.id=s.usuario_id AND u.activo JOIN rol r ON r.id=u.rol_id AND r.activo
    WHERE s.id=$1 AND s.token_hash=$2 AND s.expira_en>now()
      AND s.estado IN ('PENDIENTE','CONECTADA') FOR UPDATE OF s`, [id, hash]);
  if (!result.rowCount) throw new EscaneoError("El enlace de escaneo venció o ya fue utilizado.");
  return result.rows[0];
}
