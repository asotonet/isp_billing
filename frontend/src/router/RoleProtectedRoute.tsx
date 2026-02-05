import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasAccess } from "@/utils/permissions";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  module: string;
}

export default function RoleProtectedRoute({ children, module }: RoleProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(user.rol, module)) {
    // Redirigir al dashboard si no tiene acceso
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
