import "server-only";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/server/auth";
import { UsuarioError } from "./errors";

export async function currentUserId() {
  const { data, error } = await auth.getSession();
  if (error)
    throw new UsuarioError(
      "AUTH_UNAVAILABLE",
      "No se pudo verificar la sesión de Neon Auth.",
    );
  return data?.user?.id ?? null;
}

export async function createIdentity(input: { email: string; name: string }) {
  try {
    const result = await auth.admin.createUser({
      email: input.email,
      name: input.name,
      password: randomBytes(36).toString("base64url"),
    });
    if (result.error || !result.data?.user?.id) {
      const code = result.error?.code ?? "";
      if (code.includes("USER_ALREADY_EXISTS") || result.error?.status === 409)
        throw new UsuarioError(
          "CONFLICT",
          "Ya existe una cuenta con ese correo.",
        );
      throw new UsuarioError(
        "IDENTITY_PROVIDER",
        "Neon Auth no pudo crear la cuenta.",
      );
    }
    return { id: result.data.user.id };
  } catch (error) {
    if (error instanceof UsuarioError) throw error;
    throw new UsuarioError(
      "IDENTITY_PROVIDER",
      "No se pudo conectar con Neon Auth para crear la cuenta.",
    );
  }
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  try {
    return !(await auth.requestPasswordReset({ email, redirectTo })).error;
  } catch {
    return false;
  }
}

export async function updateIdentityName(id: string, name: string) {
  try {
    return !(await auth.admin.updateUser({ userId: id, data: { name } })).error;
  } catch {
    return false;
  }
}

export async function revokeIdentitySessions(id: string) {
  try {
    return !(await auth.admin.revokeUserSessions({ userId: id })).error;
  } catch {
    return false;
  }
}
