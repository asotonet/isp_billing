import type { PaginatedResponse } from "@/types/common";
import type { Contrato, ContratoCreate, ContratoUpdate, EstadoContrato } from "@/types/contrato";
import api from "./axios";

export async function getContratos(params: {
  page?: number;
  page_size?: number;
  cliente_id?: string;
  estado?: EstadoContrato;
}): Promise<PaginatedResponse<Contrato>> {
  const { data } = await api.get<PaginatedResponse<Contrato>>("/contratos/", { params });
  return data;
}

export async function getContrato(id: string): Promise<Contrato> {
  const { data } = await api.get<Contrato>(`/contratos/${id}`);
  return data;
}

export async function createContrato(contrato: ContratoCreate): Promise<Contrato> {
  const { data } = await api.post<Contrato>("/contratos/", contrato);
  return data;
}

export async function updateContrato(id: string, contrato: ContratoUpdate): Promise<Contrato> {
  const { data } = await api.put<Contrato>(`/contratos/${id}`, contrato);
  return data;
}

export async function uploadPdfFirmado(
  id: string,
  file: File
): Promise<Contrato> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<Contrato>(
    `/contratos/${id}/pdf-firmado`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}

export async function downloadPdfFirmado(id: string): Promise<Blob> {
  const { data } = await api.get(`/contratos/${id}/pdf-firmado`, {
    responseType: "blob",
  });
  return data;
}
