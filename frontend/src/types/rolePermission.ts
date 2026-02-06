import type { RolUsuario } from "./usuario";

export interface RolePermission {
  id: string;
  rol: RolUsuario;
  module: string;
  can_read: boolean;
  can_write: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionCreate {
  rol: RolUsuario;
  module: string;
  can_read: boolean;
  can_write: boolean;
  description?: string | null;
}

export interface RolePermissionUpdate {
  can_read?: boolean;
  can_write?: boolean;
  description?: string | null;
}

export interface RolePermissionsMatrix {
  modules: string[];
  roles: RolUsuario[];
  permissions: Record<string, Record<RolUsuario, { can_read: boolean; can_write: boolean }>>;
}
