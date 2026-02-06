import type { Cliente, ClienteCreate, ClienteUpdate } from "@/types/cliente";
import type { PaginatedResponse } from "@/types/common";
import api from "./axios";

export async function getClientes(params: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}): Promise<PaginatedResponse<Cliente>> {
  const { data } = await api.get<PaginatedResponse<Cliente>>("/clientes/", { params });
  return data;
}

export async function getCliente(id: string): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
}

export async function createCliente(cliente: ClienteCreate): Promise<Cliente> {
  const { data } = await api.post<Cliente>("/clientes/", cliente);
  return data;
}

export async function updateCliente(id: string, cliente: ClienteUpdate): Promise<Cliente> {
  const { data } = await api.put<Cliente>(`/clientes/${id}`, cliente);
  return data;
}

export async function deactivateCliente(id: string): Promise<Cliente> {
  const { data } = await api.delete<Cliente>(`/clientes/${id}`);
  return data;
}

export async function activateCliente(id: string): Promise<Cliente> {
  const { data } = await api.post<Cliente>(`/clientes/${id}/activate`);
  return data;
}

export async function checkNumeroIdentificacion(
  numeroIdentificacion: string,
  excludeClienteId?: string
): Promise<{
  available: boolean;
  message: string;
  cliente_nombre: string | null;
}> {
  const params = excludeClienteId ? { exclude_cliente_id: excludeClienteId } : {};
  const { data } = await api.get(
    `/clientes/check-identificacion/${numeroIdentificacion}`,
    { params }
  );
  return data;
}
