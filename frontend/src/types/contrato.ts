import type { Cliente } from "./cliente";
import type { Plan } from "./plan";
import type { Router } from "./router";

export type EstadoContrato = "activo" | "suspendido" | "cancelado" | "pendiente";
export type TipoConexion = "ipoe" | "pppoe";

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
  tipo_conexion: TipoConexion;
  ip_asignada: string | null;
  router_id: string | null;
  pppoe_usuario: string | null;
  pppoe_password: string | null;
  pppoe_remote_address: string | null;
  created_at: string;
  updated_at: string;
  cliente: Cliente;
  plan: Plan;
  router?: Router;
}

export interface ContratoCreate {
  cliente_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  estado?: EstadoContrato;
  dia_facturacion?: number;
  notas?: string;
  tipo_conexion?: TipoConexion;
  ip_asignada?: string;
  router_id?: string;
  pppoe_usuario?: string;
  pppoe_password?: string;
  pppoe_remote_address?: string;
}

export interface ContratoUpdate {
  plan_id?: string;
  fecha_fin?: string;
  estado?: EstadoContrato;
  dia_facturacion?: number;
  notas?: string;
  tipo_conexion?: TipoConexion;
  ip_asignada?: string;
  router_id?: string;
  pppoe_usuario?: string;
  pppoe_password?: string;
  pppoe_remote_address?: string;
}
