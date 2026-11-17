"use client";

import { UserDialog } from "./user-dialog";
import type { Dispatch, SetStateAction } from "react";
import type { Usuario } from "./types";

interface UserStatusDialogsProps {
  actionError: string | null;
  isSubmitting: boolean;
  deactivatingUser: Usuario | null;
  setDeactivatingUser: Dispatch<SetStateAction<Usuario | null>>;
  handleConfirmDeactivate: () => void;
  reactivatingUser: Usuario | null;
  setReactivatingUser: Dispatch<SetStateAction<Usuario | null>>;
  handleConfirmReactivate: () => void;
}

export function UserStatusDialogs(props: UserStatusDialogsProps) {
  const { isSubmitting, deactivatingUser, setDeactivatingUser, handleConfirmDeactivate, reactivatingUser, setReactivatingUser, handleConfirmReactivate } = props;
  return (
    <>
      {/* DIÁLOGO: Confirmar Desactivación Lógica */}
      {deactivatingUser && (
        <UserDialog titleId="deactivate-user-title" busy={isSubmitting} error={props.actionError} onClose={() => setDeactivatingUser(null)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 id="deactivate-user-title" className="mt-4 text-base font-bold text-zinc-950">
              ¿Desactivar acceso a este usuario?
            </h3>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              El usuario <strong className="text-zinc-950">{deactivatingUser.name || deactivatingUser.nombre || deactivatingUser.email}</strong> ya no podrá iniciar sesión en Latina&apos;s Design.
            </p>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
              <strong>Desactivación lógica segura:</strong> Los registros de ventas, traspasos y operaciones vinculados a este usuario se conservarán íntegros en el historial. Podrás reactivarlo cuando lo requieras.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeactivatingUser(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Desactivando...
                  </>
                ) : (
                  "Confirmar desactivación"
                )}
              </button>
            </div>
        </UserDialog>
      )}

      {/* DIÁLOGO: Confirmar Reactivación */}
      {reactivatingUser && (
        <UserDialog titleId="reactivate-user-title" busy={isSubmitting} error={props.actionError} onClose={() => setReactivatingUser(null)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 id="reactivate-user-title" className="mt-4 text-base font-bold text-zinc-950">
              ¿Reactivar usuario?
            </h3>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              El usuario <strong className="text-zinc-950">{reactivatingUser.name || reactivatingUser.nombre || reactivatingUser.email}</strong> volverá a tener acceso al sistema con su rol y tienda asignados.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReactivatingUser(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivate}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Reactivando...
                  </>
                ) : (
                  "Reactivar usuario"
                )}
              </button>
            </div>
        </UserDialog>
      )}
    </>
  );
}
