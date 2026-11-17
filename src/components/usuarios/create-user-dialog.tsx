"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CreateFormData, Rol, Tienda } from "./types";

interface CreateUserDialogProps {
  roles: Rol[];
  tiendas: Tienda[];
  isSubmitting: boolean;
  isCreateOpen: boolean;
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>;
  createData: CreateFormData;
  setCreateData: Dispatch<SetStateAction<CreateFormData>>;
  createErrors: Record<string, string>;
  setCreateErrors: Dispatch<SetStateAction<Record<string, string>>>;
  onSubmit: (event: FormEvent) => void;
}

export function CreateUserDialog(props: CreateUserDialogProps) {
  const { roles, tiendas, isSubmitting, isCreateOpen, setIsCreateOpen, createData, setCreateData, createErrors, setCreateErrors, onSubmit } = props;
  return (
    <>
      {/* MODAL: Crear Usuario (POST /api/usuarios) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Nuevo Usuario</h2>
                <p className="text-xs text-zinc-500">Crea el acceso y asigna el rol y tienda operativa.</p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsCreateOpen(false)}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Aviso informativo de configuración de contraseña */}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
              <div className="flex items-start gap-2">
                <span className="text-sm font-bold text-blue-600">ℹ️</span>
                <div>
                  <strong className="font-semibold">Configuración de credenciales:</strong>
                  <p className="mt-0.5 text-blue-800">
                    Por seguridad, no se define contraseña manual aquí. El usuario recibirá un correo con un enlace seguro para establecer su contraseña y activar su cuenta.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
              {/* Nombre completo */}
              <div>
                <label htmlFor="create-name" className="block text-xs font-medium text-zinc-700">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-name"
                  type="text"
                  required
                  value={createData.name}
                  onChange={(e) => {
                    setCreateData((prev) => ({ ...prev, name: e.target.value }));
                    if (createErrors.name) setCreateErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="ej. Maria Pérez"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
                    createErrors.name ? "border-red-500 bg-red-50/20" : "border-zinc-300 bg-white"
                  }`}
                />
                {createErrors.name && <p className="mt-1 text-xs text-red-600">{createErrors.name}</p>}
              </div>

              {/* Correo electrónico */}
              <div>
                <label htmlFor="create-email" className="block text-xs font-medium text-zinc-700">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-email"
                  type="email"
                  required
                  value={createData.email}
                  onChange={(e) => {
                    setCreateData((prev) => ({ ...prev, email: e.target.value }));
                    if (createErrors.email) setCreateErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="maria@latinasdesign.com"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
                    createErrors.email ? "border-red-500 bg-red-50/20" : "border-zinc-300 bg-white"
                  }`}
                />
                {createErrors.email && <p className="mt-1 text-xs text-red-600">{createErrors.email}</p>}
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="create-rol" className="block text-xs font-medium text-zinc-700">
                  Rol operativo <span className="text-red-500">*</span>
                </label>
                <select
                  id="create-rol"
                  required
                  value={createData.rol_id}
                  onChange={(e) => {
                    setCreateData((prev) => ({ ...prev, rol_id: e.target.value }));
                    if (createErrors.rol_id) setCreateErrors((prev) => ({ ...prev, rol_id: "" }));
                  }}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
                    createErrors.rol_id ? "border-red-500 bg-red-50/20" : "border-zinc-300 bg-white"
                  }`}
                >
                  <option value="" disabled>
                    Selecciona un rol...
                  </option>
                  {roles.filter((r) => r.codigo !== "DUENA").map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.nombre} {r.descripcion ? `— ${r.descripcion}` : ""}
                    </option>
                  ))}
                </select>
                {createErrors.rol_id && <p className="mt-1 text-xs text-red-600">{createErrors.rol_id}</p>}
              </div>

              {/* Tienda asignada */}
              <div>
                <label htmlFor="create-tienda" className="block text-xs font-medium text-zinc-700">
                  Tienda asignada (opcional)
                </label>
                <select
                  id="create-tienda"
                  value={createData.tienda_id}
                  onChange={(e) => setCreateData((prev) => ({ ...prev, tienda_id: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                >
                  <option value="">Sin tienda específica (Global)</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.nombre} {t.codigo ? `(${t.codigo})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Aplica principalmente a roles de venta o atención en sucursal física.
                </p>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Registrando...
                    </>
                  ) : (
                    "Crear usuario y enviar invitación"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </>
  );
}
