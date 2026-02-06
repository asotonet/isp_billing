import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as clientesApi from "@/api/clientes";
import type { ClienteCreate, ClienteUpdate } from "@/types/cliente";

export function useClientes(params: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () => clientesApi.getClientes(params),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => clientesApi.getCliente(id),
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteCreate) => clientesApi.createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteUpdate }) =>
      clientesApi.updateCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDeactivateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.deactivateCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useActivateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.activateCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
