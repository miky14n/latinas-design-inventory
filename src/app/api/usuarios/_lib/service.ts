import "server-only";
import { UsuarioError } from "./errors";
import {
  currentUserId,
  createIdentity,
  requestPasswordReset,
  revokeIdentitySessions,
  updateIdentityName,
} from "./identity";
import { withUserManager, type UsuarioQueries } from "./repository";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseId(value: unknown, label: string): number {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new UsuarioError("VALIDATION", `${label} no es válido.`);
  return id;
}

function parseCreate(value: unknown) {
  if (!isRecord(value))
    throw new UsuarioError(
      "VALIDATION",
      "El cuerpo de la solicitud no es válido.",
    );
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const email =
    typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  if (!name || name.length > 120)
    throw new UsuarioError(
      "VALIDATION",
      "El nombre es obligatorio (máximo 120 caracteres).",
    );
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new UsuarioError(
      "VALIDATION",
      "Escribe un correo electrónico válido.",
    );
  const tienda_id =
    value.tienda_id == null || value.tienda_id === ""
      ? null
      : parseId(value.tienda_id, "La tienda");
  return { name, email, rol_id: parseId(value.rol_id, "El rol"), tienda_id };
}

function parseUpdate(value: unknown) {
  if (!isRecord(value) || typeof value.activo !== "boolean")
    throw new UsuarioError("VALIDATION", "Indica el estado activo o inactivo.");
  const name =
    value.name === undefined
      ? undefined
      : typeof value.name === "string"
        ? value.name.trim()
        : "";
  if (name !== undefined && (!name || name.length > 120))
    throw new UsuarioError(
      "VALIDATION",
      "El nombre es obligatorio (máximo 120 caracteres).",
    );
  const tienda_id =
    value.tienda_id == null || value.tienda_id === ""
      ? null
      : parseId(value.tienda_id, "La tienda");
  return {
    name,
    rol_id: parseId(value.rol_id, "El rol"),
    tienda_id,
    activo: value.activo,
  };
}

async function requireActor() {
  const id = await currentUserId();
  if (!id)
    throw new UsuarioError("UNAUTHENTICATED", "Inicia sesión para continuar.");
  return id;
}

async function validateAssignment(
  repository: UsuarioQueries,
  roleId: number,
  storeId: number | null,
) {
  const role = await repository.findActiveRole(roleId);
  if (!role) throw new UsuarioError("VALIDATION", "Selecciona un rol activo.");
  if (role.codigo === "DUENA")
    throw new UsuarioError(
      "CONFLICT",
      "El rol de dueña se reserva para la cuenta principal.",
    );
  if (["SUPERVISORA", "VENDEDORA"].includes(role.codigo) && storeId === null)
    throw new UsuarioError("VALIDATION", "Selecciona una tienda para este rol.");
  if (storeId !== null && !(await repository.hasActiveStore(storeId)))
    throw new UsuarioError(
      "VALIDATION",
      "Selecciona una tienda activa o deja el campo vacío.",
    );
}

export async function requireGestionUsuarios() {
  const actor = await requireActor();
  await withUserManager(actor, async () => undefined);
}

export async function listUsers() {
  const actor = await requireActor();
  return withUserManager(actor, async (repository) => {
    const [usuarios, roles, tiendas] = await Promise.all([
      repository.listUsers(),
      repository.listRoles(),
      repository.listStores(),
    ]);
    return { usuarios, roles, tiendas };
  });
}

export async function createUser(
  value: unknown,
  passwordSetupRedirect: string,
) {
  const actor = await requireActor();
  const input = parseCreate(value);
  const existingIdentity = await withUserManager(actor, async (repository) => {
    await validateAssignment(repository, input.rol_id, input.tienda_id);
    const identity = await repository.findAuthIdentityByEmail(input.email);
    if (!identity) return null;
    if (identity.role === "admin")
      throw new UsuarioError(
        "CONFLICT",
        "Ese correo ya tiene una cuenta administradora de Neon Auth y no se puede vincular desde aquí.",
      );
    if (await repository.profileExists(identity.id))
      throw new UsuarioError(
        "CONFLICT",
        "Ya existe una usuaria registrada con ese correo.",
      );
    return identity;
  });
  const identity =
    existingIdentity ??
    (await createIdentity({ email: input.email, name: input.name }));
  await withUserManager(actor, async (repository) => {
    await validateAssignment(repository, input.rol_id, input.tienda_id);
    if (await repository.profileExists(identity.id))
      throw new UsuarioError(
        "CONFLICT",
        "Ya existe un perfil para esa cuenta.",
      );
    await repository.createProfile(identity.id, input.rol_id, input.tienda_id);
  });
  const nameUpdated = existingIdentity
    ? await updateIdentityName(identity.id, input.name)
    : true;
  const passwordSetupSent = await requestPasswordReset(
    input.email,
    passwordSetupRedirect,
  );
  const warnings = [
    !nameUpdated
      ? "No se pudo actualizar el nombre de la identidad existente."
      : null,
    !passwordSetupSent
      ? "No se pudo enviar el enlace. Puede solicitarlo desde Restablecer contraseña."
      : null,
  ].filter((warning): warning is string => warning !== null);
  return {
    data: { id: identity.id },
    passwordSetupSent,
    aviso: warnings.length
      ? `Cuenta y perfil creados. ${warnings.join(" ")}`
      : "Cuenta creada. Se envió un enlace para configurar la contraseña.",
  };
}

export async function updateUser(id: string, value: unknown) {
  const actor = await requireActor();
  if (!id || id.length > 255)
    throw new UsuarioError(
      "VALIDATION",
      "La cuenta seleccionada no es válida.",
    );
  const input = parseUpdate(value);
  await withUserManager(actor, async (repository) => {
    await repository.lockOwnerChanges();
    const target = await repository.findProfileForUpdate(id);
    if (!target)
      throw new UsuarioError(
        "NOT_FOUND",
        "No se encontró la cuenta solicitada.",
      );
    const role = await repository.findActiveRole(input.rol_id);
    if (!role)
      throw new UsuarioError("VALIDATION", "Selecciona un rol activo.");
    if (role.codigo === "DUENA" && target.rol_id !== String(input.rol_id))
      throw new UsuarioError(
        "CONFLICT",
        "El rol de dueña se reserva para la cuenta principal.",
      );
    if (id === actor && target.rol_id !== String(input.rol_id))
      throw new UsuarioError(
        "CONFLICT",
        "No puedes cambiar tu propio rol desde este panel.",
      );
    if (["SUPERVISORA", "VENDEDORA"].includes(role.codigo) && input.tienda_id === null && input.activo)
      throw new UsuarioError("VALIDATION", "Selecciona una tienda para este rol.");
    if (
      input.tienda_id !== null &&
      !(await repository.hasActiveStore(input.tienda_id))
    )
      throw new UsuarioError(
        "VALIDATION",
        "Selecciona una tienda activa o deja el campo vacío.",
      );
    if (id === actor && !input.activo)
      throw new UsuarioError(
        "CONFLICT",
        "No puedes desactivar tu propia cuenta mientras tienes la sesión abierta.",
      );
    await repository.updateProfile(
      id,
      input.rol_id,
      input.tienda_id,
      input.activo,
    );
    if ((await repository.countActiveOwners()) < 1)
      throw new UsuarioError(
        "CONFLICT",
        "Debe quedar al menos una cuenta activa con rol de dueña.",
      );
  });
  const nameUpdated =
    input.name === undefined ? true : await updateIdentityName(id, input.name);
  const sessionsRevoked = input.activo
    ? true
    : await revokeIdentitySessions(id);
  const warnings = [
    !nameUpdated ? "No se pudo actualizar el nombre de la identidad." : null,
    !sessionsRevoked
      ? "El perfil quedó inactivo, pero no se pudieron cerrar sus sesiones activas."
      : null,
  ].filter((warning): warning is string => warning !== null);
  return {
    data: {
      id,
      rol_id: input.rol_id,
      tienda_id: input.tienda_id,
      activo: input.activo,
    },
    aviso: warnings.length ? warnings.join(" ") : null,
  };
}
