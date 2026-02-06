import type { Cliente, TipoIdentificacion } from "./cliente";
import type { Contrato } from "./contrato";
import type { Plan } from "./plan";

export type EstadoInstalacion =
  | "solicitud"
  | "programada"
  | "en_progreso"
  | "completada"
  | "cancelada";

export interface Instalacion {
  id: string;
  numero_instalacion: string;
  contrato_id: string | null;
  plan_id: string;
  fecha_programada: string;
  fecha_completada: string | null;
  tecnico_asignado: string | null;
  estado: EstadoInstalacion;
  notas: string | null;
  motivo_cancelacion: string | null;

  temp_tipo_identificacion: TipoIdentificacion | null;
  temp_numero_identificacion: string | null;
  temp_nombre: string | null;
  temp_apellido1: string | null;
  temp_apellido2: string | null;
  temp_razon_social: string | null;
  temp_email: string | null;
  temp_telefono: string | null;
  temp_provincia: string | null;
  temp_canton: string | null;
  temp_distrito: string | null;
  temp_direccion_exacta: string | null;

  pdf_solicitud_path: string | null;

  created_at: string;
  updated_at: string;

  plan: Plan;
  contrato: Contrato | null;
}

export interface InstalacionSolicitudCreate {
  plan_id: string;
  fecha_programada: string;
  tecnico_asignado?: string;
  notas?: string;

  temp_tipo_identificacion: TipoIdentificacion;
  temp_numero_identificacion: string;
  temp_nombre: string;
  temp_apellido1?: string;
  temp_apellido2?: string;
  temp_razon_social?: string;
  temp_email?: string;
  temp_telefono?: string;
  temp_provincia?: string;
  temp_canton?: string;
  temp_distrito?: string;
  temp_direccion_exacta?: string;
}

export interface InstalacionUpdate {
  fecha_programada?: string;
  fecha_completada?: string;
  tecnico_asignado?: string;
  estado?: EstadoInstalacion;
  notas?: string;
  motivo_cancelacion?: string;
}

export interface InstalacionActivarRequest {
  crear_cliente?: boolean;
  cliente_id?: string;
  fecha_inicio_contrato: string;
  dia_facturacion?: number;
  estado_contrato?: "activo" | "suspendido" | "cancelado" | "pendiente";
  router_id: string;
  ip_asignada: string;
}
