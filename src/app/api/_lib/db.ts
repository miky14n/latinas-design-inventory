import "server-only";
import { Pool, type PoolClient } from "@neondatabase/serverless";

export async function withDatabaseTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada");
  const pool = new Pool({ connectionString, max: 1 });
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch { /* Conservar el error original. */ }
    }
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}
