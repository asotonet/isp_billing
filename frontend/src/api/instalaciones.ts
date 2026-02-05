import type {
  EstadoInstalacion,
  Instalacion,
  InstalacionActivarRequest,
  InstalacionSolicitudCreate,
  InstalacionUpdate,
} from "@/types/instalacion";
import type { PaginatedResponse } from "@/types/common";
import api from "./axios";

export async function getInstalaciones(params: {
  page?: number;
  page_size?: number;
  estado?: EstadoInstalacion;
  plan_id?: string;
}): Promise<PaginatedResponse<Instalacion>> {
  const { data } = await api.get<PaginatedResponse<Instalacion>>(
    "/instalaciones/",
    { params }
  );
  return data;
}

export async function getInstalacion(id: string): Promise<Instalacion> {
  const { data } = await api.get<Instalacion>(`/instalaciones/${id}`);
  return data;
}

export async function createSolicitud(
  solicitud: InstalacionSolicitudCreate
): Promise<Instalacion> {
  const { data } = await api.post<Instalacion>(
    "/instalaciones/solicitud",
    solicitud
  );
  return data;
}

export async function updateInstalacion(
  id: string,
  update: InstalacionUpdate
): Promise<Instalacion> {
  const { data } = await api.put<Instalacion>(
    `/instalaciones/${id}`,
    update
  );
  return data;
}

export async function activarInstalacion(
  id: string,
  request: InstalacionActivarRequest
): Promise<Instalacion> {
  const { data } = await api.post<Instalacion>(
    `/instalaciones/${id}/activar`,
    request
  );
  return data;
}

export async function downloadPdfSolicitud(id: string): Promise<Blob> {
  const { data } = await api.get(`/instalaciones/${id}/pdf-solicitud`, {
    responseType: "blob",
  });
  return data;
}
