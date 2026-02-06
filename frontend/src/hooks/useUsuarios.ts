import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usuariosApi from "@/api/usuarios";
import type {
  ChangePasswordRequest,
  RolUsuario,
  UsuarioCreate,
  UsuarioUpdate,
} from "@/types/usuario";

export function useUsuarios(params: {
  page?: number;
  page_size?: number;
  search?: string;
  rol?: RolUsuario;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: ["usuarios", params],
    queryFn: () => usuariosApi.getUsuarios(params),
  });
}

export function useUsuario(id: string) {
  return useQuery({
    queryKey: ["usuarios", id],
    queryFn: () => usuariosApi.getUsuario(id),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["usuarios", "me"],
    queryFn: () => usuariosApi.getCurrentUser(),
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UsuarioCreate) => usuariosApi.createUsuario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UsuarioUpdate }) =>
      usuariosApi.updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      usuariosApi.changePassword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "me"] });
    },
  });
}

export function useAdminResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usuariosApi.adminResetPassword(id, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useDeactivateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuariosApi.deactivateUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useActivateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuariosApi.activateUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
