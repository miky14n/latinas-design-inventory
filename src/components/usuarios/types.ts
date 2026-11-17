export interface Rol {
  id: string | number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
}

export interface Tienda {
  id: number | string;
  nombre: string;
  codigo?: string;
  direccion?: string;
}

export interface Usuario {
  id: string;
  name?: string;
  nombre?: string;
  email: string;
  rol_id: string | number;
  rol_codigo?: string;
  rol_nombre?: string;
  tienda_id: number | string | null;
  tienda_nombre?: string | null;
  activo: boolean;
  creado_en?: string;
  created_at?: string;
  ultimo_acceso?: string | null;
}

export type StatusFilter = "todos" | "activos" | "inactivos";

export interface CreateFormData {
  name: string;
  email: string;
  rol_id: string;
  tienda_id: string;
}

export interface EditFormData {
  rol_id: string;
  tienda_id: string;
}

export interface UserManagementStats {
  total: number;
  activos: number;
  inactivos: number;
}

export interface ApiResponseData {
  usuarios?: Usuario[];
  roles?: Rol[];
  tiendas?: Tienda[];
}
