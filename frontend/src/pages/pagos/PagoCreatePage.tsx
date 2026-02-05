import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PagoForm from "@/components/pagos/PagoForm";
import { useCreatePago } from "@/hooks/usePagos";
import type { PagoFormData } from "@/schemas/pago";

export default function PagoCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePago();

  const handleSubmit = (data: PagoFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Pago registrado exitosamente");
        navigate("/pagos");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al registrar pago");
      },
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Nuevo Pago</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <PagoForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
