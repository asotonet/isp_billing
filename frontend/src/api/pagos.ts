import type { PaginatedResponse } from "@/types/common";
import type { EstadoPago, Pago, PagoCreate, PagoUpdate, PagoValidarRequest } from "@/types/pago";
import api from "./axios";

export async function getPagos(params: {
  page?: number;
  page_size?: number;
  cliente_id?: string;
  contrato_id?: string;
  estado?: EstadoPago;
  periodo?: string;
}): Promise<PaginatedResponse<Pago>> {
  const { data } = await api.get<PaginatedResponse<Pago>>("/pagos/", { params });
  return data;
}

export async function getPago(id: string): Promise<Pago> {
  const { data } = await api.get<Pago>(`/pagos/${id}`);
  return data;
}

export async function createPago(pago: PagoCreate): Promise<Pago> {
  const { data } = await api.post<Pago>("/pagos/", pago);
  return data;
}

export async function updatePago(id: string, pago: PagoUpdate): Promise<Pago> {
  const { data } = await api.put<Pago>(`/pagos/${id}`, pago);
  return data;
}

export async function validarPago(id: string, body: PagoValidarRequest): Promise<Pago> {
  const { data } = await api.put<Pago>(`/pagos/${id}/validar`, body);
  return data;
}
