import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as routersApi from "@/api/routers";
import type { RouterCreate, RouterUpdate } from "@/types/router";

export function useRouters(params: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  refetchInterval?: number;
}) {
  const { refetchInterval, ...apiParams } = params;
  return useQuery({
    queryKey: ["routers", apiParams],
    queryFn: () => routersApi.getRouters(apiParams),
    refetchInterval: refetchInterval,
  });
}

export function useRouter(id: string) {
  return useQuery({
    queryKey: ["routers", id],
    queryFn: () => routersApi.getRouter(id),
    enabled: !!id,
  });
}

export function useCreateRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RouterCreate) => routersApi.createRouter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
    },
  });
}

export function useUpdateRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RouterUpdate }) =>
      routersApi.updateRouter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
    },
  });
}

export function useDeleteRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routersApi.deleteRouter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => routersApi.testConnection(id),
  });
}

export function useDeactivateRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routersApi.deactivateRouter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
    },
  });
}

export function useActivateRouter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routersApi.activateRouter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
    },
  });
}
