import type { PaginatedResponse } from "@/types/common";
import type { Plan, PlanCreate, PlanUpdate } from "@/types/plan";
import api from "./axios";

export async function getPlanes(params: {
  page?: number;
  page_size?: number;
  is_active?: boolean;
}): Promise<PaginatedResponse<Plan>> {
  const { data } = await api.get<PaginatedResponse<Plan>>("/planes/", { params });
  return data;
}

export async function getPlan(id: string): Promise<Plan> {
  const { data } = await api.get<Plan>(`/planes/${id}`);
  return data;
}

export async function createPlan(plan: PlanCreate): Promise<Plan> {
  const { data } = await api.post<Plan>("/planes/", plan);
  return data;
}

export async function updatePlan(id: string, plan: PlanUpdate): Promise<Plan> {
  const { data } = await api.put<Plan>(`/planes/${id}`, plan);
  return data;
}

export async function deactivatePlan(id: string): Promise<Plan> {
  const { data } = await api.delete<Plan>(`/planes/${id}`);
  return data;
}

export async function getPppProfiles(planId: string): Promise<{
  plan_id: string;
  plan_name: string;
  profile_name: string;
  velocidad_bajada_mbps: number;
  velocidad_subida_mbps: number;
  total_pppoe_contracts: number;
  routers: Array<{
    router_id: string;
    router_name: string;
    router_ip: string;
    is_online: boolean;
    is_active: boolean;
    contracts_count: number;
  }>;
}> {
  const { data } = await api.get(`/planes/${planId}/ppp-profiles`);
  return data;
}

export async function syncPppProfiles(planId: string): Promise<{ message: string }> {
  const { data } = await api.post(`/planes/${planId}/sync-ppp-profiles`);
  return data;
}
