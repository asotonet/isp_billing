import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InstalacionSolicitudForm from "@/components/instalaciones/InstalacionSolicitudForm";
import { useCreateSolicitud } from "@/hooks/useInstalaciones";
import type { InstalacionSolicitudFormData } from "@/schemas/instalacion";
import { toast } from "sonner";

export default function InstalacionSolicitudCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateSolicitud();

  const handleSubmit = (data: InstalacionSolicitudFormData) => {
    createMutation.mutate(data, {
      onSuccess: (instalacion) => {
        toast.success("Solicitud de instalación creada exitosamente");
        navigate(`/instalaciones/${instalacion.id}`);
      },
      onError: (err: any) => {
        toast.error(
          err.response?.data?.detail || "Error al crear solicitud"
        );
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Solicitud</CardTitle>
        </CardHeader>
        <CardContent>
          <InstalacionSolicitudForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
