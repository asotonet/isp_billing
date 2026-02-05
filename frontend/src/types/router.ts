export interface Router {
  id: string;
  nombre: string;
  ip: string;
  usuario: string;
  puerto: number;
  ssl: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouterCreate {
  nombre: string;
  ip: string;
  usuario: string;
  password: string;
  puerto?: number;
  ssl?: boolean;
  is_active?: boolean;
}

export interface RouterUpdate {
  nombre?: string;
  ip?: string;
  usuario?: string;
  password?: string;
  puerto?: number;
  ssl?: boolean;
  is_active?: boolean;
}

export interface RouterTestConnectionResponse {
  success: boolean;
  message: string;
  router_version?: string;
}
