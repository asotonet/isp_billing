import { Badge } from "@/components/ui/badge";
import type { EstadoInstalacion } from "@/types/instalacion";

const estadoConfig: Record<
  EstadoInstalacion,
  { variant: string; label: string }
> = {
  solicitud: { variant: "secondary", label: "Solicitud" },
  programada: { variant: "default", label: "Programada" },
  en_progreso: { variant: "default", label: "En Progreso" },
  completada: { variant: "success", label: "Completada" },
  cancelada: { variant: "destructive", label: "Cancelada" },
};

interface InstalacionStatusBadgeProps {
  estado: EstadoInstalacion;
}

export function InstalacionStatusBadge({
  estado,
}: InstalacionStatusBadgeProps) {
  const config = estadoConfig[estado];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
