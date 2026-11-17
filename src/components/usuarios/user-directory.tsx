"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StatusFilter, Usuario } from "./types";

interface UserDirectoryProps {
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
  usuarios: Usuario[];
  filteredUsers: Usuario[];
  rolesMap: Map<string, string>;
  tiendasMap: Map<string, string>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setRoleFilter: Dispatch<SetStateAction<string>>;
  setStoreFilter: Dispatch<SetStateAction<string>>;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  onEditUser: (user: Usuario) => void;
  onDeactivateUser: (user: Usuario) => void;
  onReactivateUser: (user: Usuario) => void;
}

export function UserDirectory(props: UserDirectoryProps) {
  const {
    isLoading, loadError, onRetry, usuarios, filteredUsers, rolesMap, tiendasMap,
    setSearchQuery, setRoleFilter, setStoreFilter, setStatusFilter,
    onEditUser, onDeactivateUser, onReactivateUser,
  } = props;

  return (
    <>
      {/* Estado de carga */}
      {isLoading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
          <p className="mt-4 text-sm font-medium text-zinc-900">Cargando directorio de usuarios...</p>
          <p className="mt-1 text-xs text-zinc-500">Consultando usuarios y opciones disponibles.</p>
        </div>
      )}

      {/* Estado de error de carga */}
      {!isLoading && loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            ⚠️
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-900">
            No se pudo cargar la información de usuarios
          </h3>
          <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={() => onRetry()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
          >
            Reintentar carga
          </button>
        </div>
      )}

      {/* Tabla de Usuarios */}
      {!isLoading && !loadError && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">No se encontraron usuarios</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                {usuarios.length === 0
                  ? "Aún no hay usuarios registrados. Comienza agregando uno con el botón 'Nuevo Usuario'."
                  : "No hay usuarios que coincidan con los criterios de búsqueda o filtros seleccionados."}
              </p>
              {usuarios.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("todos");
                    setStoreFilter("todos");
                    setStatusFilter("todos");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Usuario</th>
                    <th className="px-4 py-3.5">Rol operativo</th>
                    <th className="px-4 py-3.5">Tienda asignada</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredUsers.map((user) => {
                    const displayName = user.name || user.nombre || "Usuario";
                    const roleName = user.rol_nombre || rolesMap.get(String(user.rol_id)) || `Rol #${user.rol_id}`;
                    const storeName =
                      user.tienda_id !== null && user.tienda_id !== undefined
                        ? user.tienda_nombre || tiendasMap.get(String(user.tienda_id)) || `Tienda #${user.tienda_id}`
                        : "Sin tienda asignada";

                    const initials = displayName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join("") || "U";

                    return (
                      <tr key={user.id} className="hover:bg-zinc-50/60 transition-colors">
                        {/* Usuario (Nombre + Correo) */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold border ${
                                user.activo
                                  ? "bg-zinc-900 text-white border-zinc-900"
                                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
                              }`}
                              aria-hidden="true"
                            >
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-950 truncate">{displayName}</p>
                              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800">
                            {roleName}
                          </span>
                        </td>

                        {/* Tienda */}
                        <td className="px-4 py-4 text-xs">
                          {user.tienda_id ? (
                            <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                              </svg>
                              {storeName}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Global / Sin tienda</span>
                          )}
                        </td>

                        {/* Estado (Activo / Inactivo) */}
                        <td className="px-4 py-4">
                          {user.activo ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
                              Inactivo
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEditUser(user)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                            >
                              <svg className="h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              Editar
                            </button>

                            {/* Desactivar / Reactivar (Desactivación lógica únicamente, sin borrado) */}
                            {user.activo ? (
                              <button
                                type="button"
                                onClick={() => onDeactivateUser(user)}
                                title="Desactivar acceso (lógico)"
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
                              >
                                <svg className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                Desactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onReactivateUser(user)}
                                title="Reactivar acceso al sistema"
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-900"
                              >
                                <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                                Reactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
