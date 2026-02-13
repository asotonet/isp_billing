import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ContratoForm from "@/components/contratos/ContratoForm";
import { useCreateContrato } from "@/hooks/useContratos";
import type { ContratoFormData } from "@/schemas/contrato";

export default function ContratoCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateContrato();

  const handleSubmit = (data: ContratoFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Contrato creado exitosamente");
        navigate("/contratos");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al crear contrato");
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <ContratoForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
