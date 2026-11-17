"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Rol, StatusFilter, Tienda, UserManagementStats } from "./types";

interface UserManagementFiltersProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  roleFilter: string;
  setRoleFilter: Dispatch<SetStateAction<string>>;
  storeFilter: string;
  setStoreFilter: Dispatch<SetStateAction<string>>;
  statusFilter: StatusFilter;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  roles: Rol[];
  tiendas: Tienda[];
  totalUsers: number;
  filteredCount: number;
  stats: UserManagementStats;
  onClearFilters: () => void;
}

export function UserManagementFilters(props: UserManagementFiltersProps) {
  const {
    searchQuery, setSearchQuery, roleFilter, setRoleFilter, storeFilter, setStoreFilter,
    statusFilter, setStatusFilter, roles, tiendas, totalUsers, filteredCount, stats, onClearFilters,
  } = props;

  return (
    <>
      {/* Barra de Filtros y Búsqueda */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Búsqueda por texto */}
          <div className="lg:col-span-1">
            <label htmlFor="search-input" className="block text-xs font-medium text-zinc-700 mb-1">
              Buscar usuario
            </label>
            <div className="relative">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o correo..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
              <svg
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtro por Rol */}
          <div>
            <label htmlFor="role-filter" className="block text-xs font-medium text-zinc-700 mb-1">
              Rol
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
            >
              <option value="todos">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tienda */}
          <div>
            <label htmlFor="store-filter" className="block text-xs font-medium text-zinc-700 mb-1">
              Tienda asignada
            </label>
            <select
              id="store-filter"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
            >
              <option value="todos">Todas las tiendas</option>
              <option value="none">Sin tienda asignada</option>
              {tiendas.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-zinc-700 mb-1">
              Estado
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
            >
              <option value="todos">Todos ({totalUsers})</option>
              <option value="activos">Solo activos ({stats.activos})</option>
              <option value="inactivos">Solo inactivos ({stats.inactivos})</option>
            </select>
          </div>
        </div>

        {/* Resumen de filtros aplicados */}
        {(searchQuery || roleFilter !== "todos" || storeFilter !== "todos" || statusFilter !== "todos") && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
            <span>
              Mostrando <strong className="font-semibold text-zinc-900">{filteredCount}</strong> de{" "}
              {totalUsers} usuario(s)
            </span>
            <button
              type="button"
              onClick={onClearFilters}
              className="font-medium text-zinc-950 hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>


    </>
  );
}
