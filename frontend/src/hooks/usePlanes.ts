import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as planesApi from "@/api/planes";
import type { PlanCreate, PlanUpdate } from "@/types/plan";

export function usePlanes(params: {
  page?: number;
  page_size?: number;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: ["planes", params],
    queryFn: () => planesApi.getPlanes(params),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ["planes", id],
    queryFn: () => planesApi.getPlan(id),
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanCreate) => planesApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planes"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlanUpdate }) =>
      planesApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planes"] });
    },
  });
}

export function useDeactivatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planesApi.deactivatePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planes"] });
    },
  });
}
