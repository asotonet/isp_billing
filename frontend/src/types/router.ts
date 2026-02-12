export interface Router {
  id: string;
  nombre: string;
  ip: string;
  usuario: string;
  puerto: number;
  ssl: boolean;
  is_active: boolean;
  cidr_disponibles: string;
  created_at: string;
  updated_at: string;
  is_online: boolean | null;
  last_check_at: string | null;
  last_online_at: string | null;
  identity: string | null;
  routeros_version: string | null;
}

export interface RouterCreate {
  nombre: string;
  ip: string;
  usuario: string;
  password: string;
  puerto?: number;
  ssl?: boolean;
  is_active?: boolean;
  cidr_disponibles?: string;
}

export interface RouterUpdate {
  nombre?: string;
  ip?: string;
  usuario?: string;
  password?: string;
  puerto?: number;
  ssl?: boolean;
  is_active?: boolean;
  cidr_disponibles?: string;
}

export interface RouterTestConnectionResponse {
  success: boolean;
  message: string;
  router_version?: string;
}
