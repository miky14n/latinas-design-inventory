"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CreateFormData, EditFormData, Rol, Tienda, Usuario } from "./types";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { UserStatusDialogs } from "./user-status-dialogs";

interface UserManagementDialogsProps {
  dialog: { type: "create" } | { type: "edit" | "deactivate" | "reactivate"; user: Usuario } | null;
  onClose: () => void;
  actionError: string | null;
  roles: Rol[];
  tiendas: Tienda[];
  isSubmitting: boolean;
  createData: CreateFormData;
  setCreateData: Dispatch<SetStateAction<CreateFormData>>;
  createErrors: Record<string, string>;
  setCreateErrors: Dispatch<SetStateAction<Record<string, string>>>;
  handleSubmitCreate: (event: FormEvent) => void;
  editData: EditFormData;
  setEditData: Dispatch<SetStateAction<EditFormData>>;
  editErrors: Record<string, string>;
  setEditErrors: Dispatch<SetStateAction<Record<string, string>>>;
  handleSubmitEdit: (event: FormEvent) => void;
  onConfirmStatus: () => void;
}

export function UserManagementDialogs(props: UserManagementDialogsProps) {
  const { dialog } = props;
  if (!dialog) return null;
  if (dialog.type === "create") {
    return <CreateUserDialog {...props} onSubmit={props.handleSubmitCreate} />;
  }
  if (dialog.type === "edit") {
    return <EditUserDialog {...props} editingUser={dialog.user} onSubmit={props.handleSubmitEdit} />;
  }
  return <UserStatusDialogs {...props} user={dialog.user} active={dialog.type === "reactivate"} onConfirm={props.onConfirmStatus} />;
}
