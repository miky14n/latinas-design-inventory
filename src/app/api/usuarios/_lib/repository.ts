import "server-only";
import type { PoolClient } from "@neondatabase/serverless";
import { withDatabaseTransaction } from "@/app/api/_lib/db";
import { UsuarioError } from "./errors";

export type UsuarioRole = { id: string; codigo: string; nombre: string };
export type UsuarioStore = { id: string; codigo: string; nombre: string };
export type UsuarioProfile = {
  id: string;
  rol_id: string;
  tienda_id: string | null;
  activo: boolean;
};
export type AuthIdentityRecord = { id: string; role: string | null };

export class UsuarioQueries {
  constructor(private readonly client: PoolClient) {}

  async listUsers() {
    const result = await this.client.query(
      `SELECT p.id, a.name, a.email, a."emailVerified" AS email_verified,
              p.rol_id, r.codigo AS rol_codigo, r.nombre AS rol_nombre,
              p.tienda_id, t.nombre AS tienda_nombre, p.activo
         FROM usuario p JOIN rol r ON r.id = p.rol_id
         LEFT JOIN tienda t ON t.id = p.tienda_id
         JOIN neon_auth."user" a ON a.id::text = p.id
        ORDER BY p.activo DESC, a.name, a.email`,
    );
    return result.rows;
  }

  async listRoles() {
    return (
      await this.client.query<UsuarioRole>(
        "SELECT id::text AS id, codigo, nombre FROM rol WHERE activo ORDER BY nombre",
      )
    ).rows;
  }

  async listStores() {
    return (
      await this.client.query<UsuarioStore>(
        "SELECT id::text AS id, codigo, nombre FROM tienda WHERE activo ORDER BY nombre",
      )
    ).rows;
  }

  async findActiveRole(id: number) {
    return (
      (
        await this.client.query<UsuarioRole>(
          "SELECT id::text AS id, codigo, nombre FROM rol WHERE id = $1 AND activo",
          [id],
        )
      ).rows[0] ?? null
    );
  }

  async hasActiveStore(id: number) {
    const result = await this.client.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM tienda WHERE id = $1 AND activo) AS exists",
      [id],
    );
    return result.rows[0]?.exists === true;
  }

  async findAuthIdentityByEmail(email: string) {
    return (
      (
        await this.client.query<AuthIdentityRecord>(
          `SELECT id::text AS id, role FROM neon_auth."user" WHERE lower(email) = lower($1) LIMIT 1`,
          [email],
        )
      ).rows[0] ?? null
    );
  }

  async profileExists(id: string) {
    const result = await this.client.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM usuario WHERE id = $1) AS exists",
      [id],
    );
    return result.rows[0]?.exists === true;
  }

  async findProfileForUpdate(id: string) {
    return (
      (
        await this.client.query<UsuarioProfile>(
          `SELECT id, rol_id::text AS rol_id, tienda_id::text AS tienda_id, activo FROM usuario WHERE id = $1 FOR UPDATE`,
          [id],
        )
      ).rows[0] ?? null
    );
  }

  async createProfile(id: string, roleId: number, storeId: number | null) {
    await this.client.query("SELECT guardar_perfil_usuario($1, $2, $3, true)", [
      id,
      roleId,
      storeId,
    ]);
  }

  async lockOwnerChanges() {
    await this.client.query("SELECT pg_advisory_xact_lock(610202611)");
  }

  async updateProfile(
    id: string,
    roleId: number,
    storeId: number | null,
    active: boolean,
  ) {
    await this.client.query("SELECT guardar_perfil_usuario($1, $2, $3, $4)", [
      id,
      roleId,
      storeId,
      active,
    ]);
  }

  async countActiveOwners() {
    const result = await this.client.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM usuario u JOIN rol r ON r.id = u.rol_id AND r.activo WHERE u.activo AND r.codigo = 'DUENA'`,
    );
    return result.rows[0]?.total ?? 0;
  }
}

export function withOwner<T>(
  actorId: string,
  operation: (repository: UsuarioQueries) => Promise<T>,
) {
  return withDatabaseTransaction(async (client) => {
    await client.query("SELECT set_config('app.usuario_id', $1, true)", [
      actorId,
    ]);
    const owner = await client.query<{ id: string }>(
      `SELECT u.id FROM usuario u JOIN rol r ON r.id = u.rol_id AND r.activo WHERE u.id = $1 AND u.activo AND r.codigo = 'DUENA'`,
      [actorId],
    );
    if (!owner.rows[0])
      throw new UsuarioError(
        "FORBIDDEN",
        "Solo la dueña puede gestionar usuarios.",
      );
    return operation(new UsuarioQueries(client));
  });
}
