import { useAuth } from "@/context/AuthContext";
import { hasAccess, canWrite } from "@/utils/permissions";
import type { RolUsuario } from "@/types/usuario";

export function usePermissions() {
  const { user } = useAuth();

  const checkAccess = (module: string): boolean => {
    if (!user) return false;
    return hasAccess(user.rol, module);
  };

  const checkCanWrite = (module: string): boolean => {
    if (!user) return false;
    return canWrite(user.rol, module);
  };

  const isReadOnly = (): boolean => {
    return user?.rol === "AUDITOR";
  };

  const isAdmin = (): boolean => {
    return user?.rol === "ADMIN";
  };

  const isTecnico = (): boolean => {
    return user?.rol === "TECNICO";
  };

  const isSoporte = (): boolean => {
    return user?.rol === "SOPORTE";
  };

  return {
    user,
    hasAccess: checkAccess,
    canWrite: checkCanWrite,
    isReadOnly,
    isAdmin,
    isTecnico,
    isSoporte,
  };
}
