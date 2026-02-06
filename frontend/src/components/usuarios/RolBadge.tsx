import { Badge } from "@/components/ui/badge";
import type { RolUsuario } from "@/types/usuario";

const rolConfig: Record<
  RolUsuario,
  { variant: string; label: string }
> = {
  ADMIN: { variant: "destructive", label: "Admin" },
  OPERADOR: { variant: "default", label: "Operador" },
  TECNICO: { variant: "default", label: "Técnico" },
  AUDITOR: { variant: "secondary", label: "Auditor" },
  SOPORTE: { variant: "secondary", label: "Soporte" },
};

interface RolBadgeProps {
  rol: RolUsuario;
}

export function RolBadge({ rol }: RolBadgeProps) {
  const config = rolConfig[rol];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
