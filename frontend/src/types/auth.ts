export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  nombre_completo: string;
  rol: "admin" | "operador" | "lectura";
  is_active: boolean;
  created_at: string;
}
