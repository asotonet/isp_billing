export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

import type { RolUsuario } from "./usuario";

export interface User {
  id: string;
  email: string;
  nombre_completo: string;
  rol: RolUsuario;
  is_active: boolean;
  created_at: string;
}
