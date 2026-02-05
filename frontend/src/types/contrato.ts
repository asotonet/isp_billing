import type { Cliente } from "./cliente";
import type { Plan } from "./plan";

export type EstadoContrato = "activo" | "suspendido" | "cancelado" | "pendiente";

export interface Contrato {
  id: string;
  numero_contrato: string;
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoContrato;
  dia_facturacion: number;
  notas: string | null;
  pdf_firmado_path: string | null;
  created_at: string;
  updated_at: string;
  cliente: Cliente;
  plan: Plan;
}

export interface ContratoCreate {
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  estado?: EstadoContrato;
  dia_facturacion?: number;
  notas?: string;
}

export interface ContratoUpdate {
  plan_id?: string;
  fecha_fin?: string;
  estado?: EstadoContrato;
  dia_facturacion?: number;
  notas?: string;
}
