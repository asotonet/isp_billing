import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rolePermissionsApi from "@/api/rolePermissions";
import type { RolePermissionCreate } from "@/types/rolePermission";

export function usePermissionsMatrix() {
  return useQuery({
    queryKey: ["role-permissions", "matrix"],
    queryFn: () => rolePermissionsApi.getPermissionsMatrix(),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => rolePermissionsApi.getPermissions(),
  });
}

export function useBulkUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissions: RolePermissionCreate[]) =>
      rolePermissionsApi.bulkUpdatePermissions(permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}

export function useInitializeDefaultPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rolePermissionsApi.initializeDefaultPermissions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}
