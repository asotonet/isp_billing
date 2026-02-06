import type { PaginatedResponse } from "@/types/common";
import type {
  ChangePasswordRequest,
  RolUsuario,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
} from "@/types/usuario";
import api from "./axios";

export async function getUsuarios(params: {
  page?: number;
  page_size?: number;
  search?: string;
  rol?: RolUsuario;
  is_active?: boolean;
}): Promise<PaginatedResponse<Usuario>> {
  const { data } = await api.get<PaginatedResponse<Usuario>>("/usuarios/", {
    params,
  });
  return data;
}

export async function getUsuario(id: string): Promise<Usuario> {
  const { data } = await api.get<Usuario>(`/usuarios/${id}`);
  return data;
}

export async function getCurrentUser(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/usuarios/me");
  return data;
}

export async function createUsuario(usuario: UsuarioCreate): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/usuarios/", usuario);
  return data;
}

export async function updateUsuario(
  id: string,
  usuario: UsuarioUpdate
): Promise<Usuario> {
  const { data } = await api.put<Usuario>(`/usuarios/${id}`, usuario);
  return data;
}

export async function changePassword(
  request: ChangePasswordRequest
): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/usuarios/me/change-password", request);
  return data;
}

export async function adminResetPassword(
  id: string,
  newPassword: string
): Promise<Usuario> {
  const { data } = await api.post<Usuario>(
    `/usuarios/${id}/reset-password`,
    null,
    {
      params: { new_password: newPassword },
    }
  );
  return data;
}

export async function deactivateUsuario(id: string): Promise<Usuario> {
  const { data } = await api.post<Usuario>(`/usuarios/${id}/deactivate`);
  return data;
}

export async function activateUsuario(id: string): Promise<Usuario> {
  const { data } = await api.post<Usuario>(`/usuarios/${id}/activate`);
  return data;
}
