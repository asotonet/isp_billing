export type RolUsuario = "ADMIN" | "OPERADOR" | "TECNICO" | "AUDITOR" | "SOPORTE";

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol: RolUsuario;
  is_active: boolean;
  created_at: string;
}

export interface UsuarioCreate {
  email: string;
  nombre_completo: string;
  rol: RolUsuario;
  password: string;
}

export interface UsuarioUpdate {
  email?: string;
  nombre_completo?: string;
  rol?: RolUsuario;
  is_active?: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
