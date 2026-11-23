"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponseData, CreateFormData, EditFormData, Rol, StatusFilter, Tienda, Usuario } from "@/components/usuarios/types";
import { UserManagementFilters } from "@/components/usuarios/user-management-filters";
import { UserDirectory } from "@/components/usuarios/user-directory";
import { UserManagementDialogs } from "@/components/usuarios/user-management-dialogs";

type UserDialogState =
  | { type: "create" }
  | { type: "edit" | "deactivate" | "reactivate"; user: Usuario }
  | null;

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [storeFilter, setStoreFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  // Notificaciones y retroalimentación
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modales
  const [dialog, setDialog] = useState<UserDialogState>(null);
  const editingUser = dialog?.type === "edit" ? dialog.user : null;

  // Estados de formulario
  const [createData, setCreateData] = useState<CreateFormData>({
    name: "",
    email: "",
    rol_id: "",
    tienda_id: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [editData, setEditData] = useState<EditFormData>({
    rol_id: "",
    tienda_id: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Carga de datos desde GET /api/usuarios
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        router.replace("/auth/sign-in");
        return;
      }
      if (res.status === 403) {
        router.replace("/");
        return;
      }

      if (!res.ok) {
        throw new Error(`Error al consultar usuarios (código HTTP ${res.status})`);
      }

      const body = await res.json();
      const payload: ApiResponseData = body?.data ?? body ?? {};

      setLoadError(null);
      setUsuarios(Array.isArray(payload.usuarios) ? payload.usuarios : []);
      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
      setTiendas(Array.isArray(payload.tiendas) ? payload.tiendas : []);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servicio de usuarios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // La carga es asíncrona; los cambios de estado ocurren al resolver la petición.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  // Mapas para resolución de nombres de roles y tiendas
  const rolesMap = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((r) => map.set(String(r.id), r.nombre));
    return map;
  }, [roles]);

  const tiendasMap = useMemo(() => {
    const map = new Map<string, string>();
    tiendas.forEach((t) => map.set(String(t.id), t.nombre));
    return map;
  }, [tiendas]);

  // Filtrado reactivo de usuarios
  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const displayName = (user.name || user.nombre || "").toLowerCase();
      const userEmail = (user.email || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      if (query && !displayName.includes(query) && !userEmail.includes(query)) {
        return false;
      }

      if (roleFilter !== "todos" && String(user.rol_id) !== String(roleFilter)) {
        return false;
      }

      if (storeFilter !== "todos") {
        if (storeFilter === "none" && user.tienda_id !== null) return false;
        if (storeFilter !== "none" && String(user.tienda_id) !== String(storeFilter)) {
          return false;
        }
      }

      if (statusFilter === "activos" && !user.activo) return false;
      if (statusFilter === "inactivos" && user.activo) return false;

      return true;
    });
  }, [usuarios, searchQuery, roleFilter, storeFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("todos");
    setStoreFilter("todos");
    setStatusFilter("todos");
  };
  // Contadores
  const stats = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.activo).length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [usuarios]);

  // Apertura modal de edición
  const handleOpenEdit = (user: Usuario) => {
    setActionError(null);
    setEditErrors({});
    setDialog({ type: "edit", user });
    setEditData({
      rol_id: String(user.rol_id ?? ""),
      tienda_id: user.tienda_id !== null && user.tienda_id !== undefined ? String(user.tienda_id) : "",
    });
  };

  // Apertura modal de creación
  const handleOpenCreate = () => {
    setActionError(null);
    setCreateErrors({});
    const firstAssignableRole = roles.find((role) => role.codigo !== "DUENA");
    setCreateData({
      name: "",
      email: "",
      rol_id: firstAssignableRole ? String(firstAssignableRole.id) : "",
      tienda_id: "",
    });
    setDialog({ type: "create" });
  };

  // Envío de POST /api/usuarios
  const handleSubmitCreate = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!createData.name.trim()) {
      errors.name = "El nombre completo es obligatorio.";
    }
    if (!createData.email.trim()) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createData.email.trim())) {
      errors.email = "Ingresa un correo electrónico válido.";
    }
    if (!createData.rol_id) {
      errors.rol_id = "Debes seleccionar un rol para el usuario.";
    }
    if (["SUPERVISORA", "VENDEDORA"].includes(roles.find(r => String(r.id) === createData.rol_id)?.codigo ?? "") && !createData.tienda_id) {
      errors.tienda_id = "Selecciona la tienda asignada.";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setCreateErrors({});

    try {
      const payload = {
        name: createData.name.trim(),
        email: createData.email.trim().toLowerCase(),
        rol_id: createData.rol_id,
        tienda_id: createData.tienda_id ? Number(createData.tienda_id) : null,
      };

      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resBody = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resBody?.error || `Error al crear usuario (código HTTP ${res.status})`);
      }

      setDialog(null);
      setActionSuccess(resBody?.aviso || `Usuario "${payload.name}" registrado correctamente.`);
      await fetchUsers();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado al registrar el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Envío de PATCH /api/usuarios/[id] para edición
  const handleSubmitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editData.rol_id) {
      setEditErrors({ rol_id: "El rol es obligatorio." });
      return;
    }
    if (["SUPERVISORA", "VENDEDORA"].includes(roles.find(r => String(r.id) === editData.rol_id)?.codigo ?? "") && !editData.tienda_id) {
      setEditErrors({ tienda_id: "Selecciona la tienda asignada." });
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setEditErrors({});

    try {
      const payload = {
        rol_id: editData.rol_id,
        tienda_id: editData.tienda_id ? Number(editData.tienda_id) : null,
        activo: editingUser.activo,
      };

      const res = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resBody = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resBody?.error || `Error al actualizar usuario (código HTTP ${res.status})`);
      }

      setDialog(null);
      setActionSuccess(`Perfil de "${editingUser.name || editingUser.nombre || editingUser.email}" actualizado correctamente.`);
      await fetchUsers();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado al actualizar el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ambas acciones conservan rol y tienda y solo cambian el estado de acceso.
  const changeUserStatus = async (user: Usuario | null, active: boolean) => {
    if (!user) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol_id: user.rol_id, tienda_id: user.tienda_id, activo: active }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "No se pudo actualizar el acceso del usuario.");
      const name = user.name || user.nombre || user.email;
      setDialog(null);
      setActionSuccess(body?.aviso || (active
        ? `El usuario "${name}" fue reactivado exitosamente.`
        : `El usuario "${name}" fue desactivado lógicamente. Su acceso ha sido revocado.`));
      await fetchUsers();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar el acceso del usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStatus = () => {
    if (dialog?.type === "deactivate" || dialog?.type === "reactivate") {
      void changeUserStatus(dialog.user, dialog.type === "reactivate");
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Configuración · Acceso exclusivo de la dueña</p>
      <div className="w-full space-y-6">
      {/* Encabezado y acción principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Administra cuentas de acceso, asignación de roles operativos y vinculación con tiendas.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas de métricas rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Usuarios</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{stats.total}</p>
            <span className="text-xs text-zinc-400">Registrados</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Usuarios Activos</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">{stats.activos}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Con acceso
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Desactivados (Lógicos)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-zinc-600 tabular-nums">{stats.inactivos}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 border border-zinc-200">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
              Acceso revocado
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de acción global (Éxito / Error) */}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-emerald-600">✓</span>
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-950 underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-red-600">⚠️</span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-medium text-red-700 hover:text-red-950 underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      <UserManagementFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        storeFilter={storeFilter}
        setStoreFilter={setStoreFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roles={roles}
        tiendas={tiendas}
        totalUsers={usuarios.length}
        filteredCount={filteredUsers.length}
        stats={stats}
        onClearFilters={handleClearFilters}
      />
      <UserDirectory
        isLoading={isLoading}
        loadError={loadError}
        onRetry={() => { setIsLoading(true); setLoadError(null); void fetchUsers(); }}
        usuarios={usuarios}
        filteredUsers={filteredUsers}
        rolesMap={rolesMap}
        tiendasMap={tiendasMap}
        setSearchQuery={setSearchQuery}
        setRoleFilter={setRoleFilter}
        setStoreFilter={setStoreFilter}
        setStatusFilter={setStatusFilter}
        onEditUser={handleOpenEdit}
        onDeactivateUser={(user) => { setActionError(null); setDialog({ type: "deactivate", user }); }}
        onReactivateUser={(user) => { setActionError(null); setDialog({ type: "reactivate", user }); }}
      />
      <UserManagementDialogs
        actionError={actionError}
        roles={roles}
        tiendas={tiendas}
        isSubmitting={isSubmitting}
        dialog={dialog}
        onClose={() => setDialog(null)}
        createData={createData}
        setCreateData={setCreateData}
        createErrors={createErrors}
        setCreateErrors={setCreateErrors}
        handleSubmitCreate={handleSubmitCreate}
        editData={editData}
        setEditData={setEditData}
        editErrors={editErrors}
        setEditErrors={setEditErrors}
        handleSubmitEdit={handleSubmitEdit}
        onConfirmStatus={handleConfirmStatus}
      />
      </div>
    </main>
  );
}
