"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CreateFormData, EditFormData, Rol, Tienda, Usuario } from "./types";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { UserStatusDialogs } from "./user-status-dialogs";

interface UserManagementDialogsProps {
  roles: Rol[];
  tiendas: Tienda[];
  isSubmitting: boolean;
  isCreateOpen: boolean;
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>;
  createData: CreateFormData;
  setCreateData: Dispatch<SetStateAction<CreateFormData>>;
  createErrors: Record<string, string>;
  setCreateErrors: Dispatch<SetStateAction<Record<string, string>>>;
  handleSubmitCreate: (event: FormEvent) => void;
  editingUser: Usuario | null;
  setEditingUser: Dispatch<SetStateAction<Usuario | null>>;
  editData: EditFormData;
  setEditData: Dispatch<SetStateAction<EditFormData>>;
  editErrors: Record<string, string>;
  setEditErrors: Dispatch<SetStateAction<Record<string, string>>>;
  handleSubmitEdit: (event: FormEvent) => void;
  deactivatingUser: Usuario | null;
  setDeactivatingUser: Dispatch<SetStateAction<Usuario | null>>;
  handleConfirmDeactivate: () => void;
  reactivatingUser: Usuario | null;
  setReactivatingUser: Dispatch<SetStateAction<Usuario | null>>;
  handleConfirmReactivate: () => void;
}

export function UserManagementDialogs(props: UserManagementDialogsProps) {
  return (
    <>
      <CreateUserDialog {...props} onSubmit={props.handleSubmitCreate} />
      <EditUserDialog {...props} onSubmit={props.handleSubmitEdit} />
      <UserStatusDialogs {...props} />
    </>
  );
}
