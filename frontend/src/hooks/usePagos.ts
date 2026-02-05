import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as pagosApi from "@/api/pagos";
import type { EstadoPago, PagoCreate, PagoUpdate, PagoValidarRequest } from "@/types/pago";

export function usePagos(params: {
  page?: number;
  page_size?: number;
  cliente_id?: string;
  contrato_id?: string;
  estado?: EstadoPago;
  periodo?: string;
}) {
  return useQuery({
    queryKey: ["pagos", params],
    queryFn: () => pagosApi.getPagos(params),
  });
}

export function usePago(id: string) {
  return useQuery({
    queryKey: ["pagos", id],
    queryFn: () => pagosApi.getPago(id),
    enabled: !!id,
  });
}

export function useCreatePago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PagoCreate) => pagosApi.createPago(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
    },
  });
}

export function useUpdatePago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PagoUpdate }) =>
      pagosApi.updatePago(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
    },
  });
}

export function useValidarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PagoValidarRequest }) =>
      pagosApi.validarPago(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
    },
  });
}
