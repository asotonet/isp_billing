import type { PaginatedResponse } from "@/types/common";
import type {
  Router,
  RouterCreate,
  RouterTestConnectionResponse,
  RouterUpdate,
} from "@/types/router";
import api from "./axios";

export async function getRouters(params: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}): Promise<PaginatedResponse<Router>> {
  const { data } = await api.get<PaginatedResponse<Router>>("/routers/", { params });
  return data;
}

export async function getRouter(id: string): Promise<Router> {
  const { data } = await api.get<Router>(`/routers/${id}`);
  return data;
}

export async function createRouter(router: RouterCreate): Promise<Router> {
  const { data } = await api.post<Router>("/routers/", router);
  return data;
}

export async function updateRouter(id: string, router: RouterUpdate): Promise<Router> {
  const { data } = await api.put<Router>(`/routers/${id}`, router);
  return data;
}

export async function deleteRouter(id: string): Promise<void> {
  await api.delete(`/routers/${id}`);
}

export async function testConnection(id: string): Promise<RouterTestConnectionResponse> {
  const { data } = await api.post<RouterTestConnectionResponse>(
    `/routers/${id}/test-connection`
  );
  return data;
}

export async function deactivateRouter(id: string): Promise<Router> {
  const { data } = await api.post<Router>(`/routers/${id}/deactivate`);
  return data;
}

export async function activateRouter(id: string): Promise<Router> {
  const { data } = await api.post<Router>(`/routers/${id}/activate`);
  return data;
}

export async function getNextAvailableIp(routerId: string): Promise<{ ip_address: string }> {
  const { data } = await api.get<{ ip_address: string }>(
    `/routers/${routerId}/next-available-ip`
  );
  return data;
}

export async function checkIpAvailable(
  routerId: string,
  ipAddress: string,
  excludeContratoId?: string
): Promise<{
  available: boolean;
  message: string;
  contrato_numero: string | null;
}> {
  const params = excludeContratoId ? { exclude_contrato_id: excludeContratoId } : {};
  const { data } = await api.get(
    `/routers/${routerId}/check-ip/${ipAddress}`,
    { params }
  );
  return data;
}
