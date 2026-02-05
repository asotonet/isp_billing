export interface Plan {
  id: string;
  nombre: string;
  descripcion: string | null;
  velocidad_bajada_mbps: number;
  velocidad_subida_mbps: number;
  precio_mensual: number;
  moneda: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanCreate {
  nombre: string;
  descripcion?: string;
  velocidad_bajada_mbps: number;
  velocidad_subida_mbps: number;
  precio_mensual: number;
  moneda?: string;
}

export interface PlanUpdate {
  nombre?: string;
  descripcion?: string;
  velocidad_bajada_mbps?: number;
  velocidad_subida_mbps?: number;
  precio_mensual?: number;
  moneda?: string;
  is_active?: boolean;
}
