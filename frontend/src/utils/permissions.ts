import type { RolUsuario } from "@/types/usuario";

export interface Permission {
  roles: RolUsuario[];
}

// Define qué roles pueden acceder a cada módulo
export const PERMISSIONS: Record<string, Permission> = {
  dashboard: {
    roles: ["ADMIN", "OPERADOR", "TECNICO", "AUDITOR", "SOPORTE"],
  },
  clientes: {
    roles: ["ADMIN", "OPERADOR", "TECNICO", "AUDITOR", "SOPORTE"],
  },
  contratos: {
    roles: ["ADMIN", "OPERADOR", "TECNICO", "AUDITOR", "SOPORTE"],
  },
  planes: {
    roles: ["ADMIN", "OPERADOR", "AUDITOR", "SOPORTE"],
  },
  routers: {
    roles: ["ADMIN", "OPERADOR"],
  },
  instalaciones: {
    roles: ["ADMIN", "OPERADOR", "TECNICO", "AUDITOR"],
  },
  pagos: {
    roles: ["ADMIN", "OPERADOR", "AUDITOR", "SOPORTE"],
  },
  usuarios: {
    roles: ["ADMIN", "AUDITOR"],
  },
  roles: {
    roles: ["ADMIN"],
  },
};

// Verifica si el usuario tiene acceso a un módulo
export function hasAccess(userRole: RolUsuario, module: string): boolean {
  const permission = PERMISSIONS[module];
  if (!permission) return false;
  return permission.roles.includes(userRole);
}

// Verifica si el usuario puede escribir (crear/editar) en un módulo
export function canWrite(userRole: RolUsuario, module: string): boolean {
  // AUDITOR solo puede leer
  if (userRole === "AUDITOR") return false;

  // ADMIN puede escribir en todo
  if (userRole === "ADMIN") return true;

  // Matriz de permisos de escritura
  const writePermissions: Record<string, RolUsuario[]> = {
    clientes: ["ADMIN", "OPERADOR"],
    planes: ["ADMIN", "OPERADOR"],
    contratos: ["ADMIN", "OPERADOR"],
    routers: ["ADMIN"],
    pagos: ["ADMIN", "OPERADOR", "SOPORTE"],
    instalaciones: ["ADMIN", "OPERADOR", "TECNICO"],
    usuarios: ["ADMIN"],
    roles: ["ADMIN"],
  };

  const permission = writePermissions[module];
  if (!permission) return false;
  return permission.includes(userRole);
}
