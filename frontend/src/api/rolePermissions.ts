import type {
  RolePermission,
  RolePermissionCreate,
  RolePermissionsMatrix,
} from "@/types/rolePermission";
import api from "./axios";

export async function getPermissionsMatrix(): Promise<RolePermissionsMatrix> {
  const { data } = await api.get<RolePermissionsMatrix>("/role-permissions/matrix");
  return data;
}

export async function getPermissions(): Promise<RolePermission[]> {
  const { data} = await api.get<RolePermission[]>("/role-permissions/");
  return data;
}

export async function bulkUpdatePermissions(
  permissions: RolePermissionCreate[]
): Promise<RolePermission[]> {
  const { data } = await api.post<RolePermission[]>("/role-permissions/bulk-update", {
    permissions,
  });
  return data;
}

export async function initializeDefaultPermissions(): Promise<void> {
  await api.post("/role-permissions/initialize");
}
