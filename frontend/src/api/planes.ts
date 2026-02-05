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
