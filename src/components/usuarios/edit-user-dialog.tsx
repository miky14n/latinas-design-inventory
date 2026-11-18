"use client";

import { UserDialog } from "./user-dialog";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { EditFormData, Rol, Tienda, Usuario } from "./types";

interface EditUserDialogProps {
  actionError: string | null;
  roles: Rol[];
  tiendas: Tienda[];
  isSubmitting: boolean;
  editingUser: Usuario;
  onClose: () => void;
  editData: EditFormData;
  setEditData: Dispatch<SetStateAction<EditFormData>>;
  editErrors: Record<string, string>;
  setEditErrors: Dispatch<SetStateAction<Record<string, string>>>;
  onSubmit: (event: FormEvent) => void;
}

export function EditUserDialog(props: EditUserDialogProps) {
  const { roles, tiendas, isSubmitting, editingUser, onClose, editData, setEditData, editErrors, setEditErrors, onSubmit } = props;
  return (
    <>
      {/* MODAL: Editar Usuario (PATCH /api/usuarios/[id]) */}
      {editingUser && (
        <UserDialog titleId="edit-user-title" busy={isSubmitting} error={props.actionError} onClose={() => onClose()}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h2 id="edit-user-title" className="text-lg font-bold text-zinc-950">Editar Usuario</h2>
                <p className="text-xs text-zinc-500">Modifica el rol, tienda asignada o estado del usuario.</p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Ficha de identidad fija */}
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="text-xs font-semibold text-zinc-900">{editingUser.name || editingUser.nombre || "Usuario"}</p>
              <p className="text-xs text-zinc-500">{editingUser.email}</p>
              <span className="mt-2 inline-block text-[11px] text-zinc-400">ID: {editingUser.id}</span>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
              {/* Rol */}
              <div>
                <label htmlFor="edit-rol" className="block text-xs font-medium text-zinc-700">
                  Rol operativo <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-rol"
                  required
                  value={editData.rol_id}
                  onChange={(e) => {
                    setEditData((prev) => ({ ...prev, rol_id: e.target.value }));
                    if (editErrors.rol_id) setEditErrors((prev) => ({ ...prev, rol_id: "" }));
                  }}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 ${
                    editErrors.rol_id ? "border-red-500 bg-red-50/20" : "border-zinc-300 bg-white"
                  }`}
                >
                  {roles.filter((r) => r.codigo !== "DUENA" || editingUser?.rol_codigo === "DUENA").map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.nombre} {r.descripcion ? `— ${r.descripcion}` : ""}
                    </option>
                  ))}
                </select>
                {editErrors.rol_id && <p className="mt-1 text-xs text-red-600">{editErrors.rol_id}</p>}
              </div>

              {/* Tienda asignada */}
              <div>
                <label htmlFor="edit-tienda" className="block text-xs font-medium text-zinc-700">
                  Tienda asignada
                </label>
                <select
                  id="edit-tienda"
                  value={editData.tienda_id}
                  onChange={(e) => setEditData((prev) => ({ ...prev, tienda_id: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                >
                  <option value="">Sin tienda específica (Global)</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.nombre} {t.codigo ? `(${t.codigo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => onClose()}
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
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </div>
            </form>
        </UserDialog>
      )}


    </>
  );
}
