import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as contratosApi from "@/api/contratos";
import type { ContratoCreate, ContratoUpdate, EstadoContrato } from "@/types/contrato";

export function useContratos(params: {
  page?: number;
  page_size?: number;
  cliente_id?: string;
  estado?: EstadoContrato;
}) {
  return useQuery({
    queryKey: ["contratos", params],
    queryFn: () => contratosApi.getContratos(params),
  });
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: ["contratos", id],
    queryFn: () => contratosApi.getContrato(id),
    enabled: !!id,
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContratoCreate) => contratosApi.createContrato(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContratoUpdate }) =>
      contratosApi.updateContrato(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useUploadPdfFirmado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      contratosApi.uploadPdfFirmado(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
