import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as instalacionesApi from "@/api/instalaciones";
import type {
  EstadoInstalacion,
  InstalacionActivarRequest,
  InstalacionSolicitudCreate,
  InstalacionUpdate,
} from "@/types/instalacion";

export function useInstalaciones(params: {
  page?: number;
  page_size?: number;
  estado?: EstadoInstalacion;
  plan_id?: string;
}) {
  return useQuery({
    queryKey: ["instalaciones", params],
    queryFn: () => instalacionesApi.getInstalaciones(params),
  });
}

export function useInstalacion(id: string) {
  return useQuery({
    queryKey: ["instalaciones", id],
    queryFn: () => instalacionesApi.getInstalacion(id),
    enabled: !!id,
  });
}

export function useCreateSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InstalacionSolicitudCreate) =>
      instalacionesApi.createSolicitud(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });
}

export function useUpdateInstalacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InstalacionUpdate }) =>
      instalacionesApi.updateInstalacion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
    },
  });
}

export function useActivarInstalacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: InstalacionActivarRequest;
    }) => instalacionesApi.activarInstalacion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalaciones"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
