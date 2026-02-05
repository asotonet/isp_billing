import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ContratoForm from "@/components/contratos/ContratoForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useContrato, useUpdateContrato } from "@/hooks/useContratos";
import type { ContratoFormData } from "@/schemas/contrato";

export default function ContratoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contrato, isLoading } = useContrato(id!);
  const updateMutation = useUpdateContrato();

  if (isLoading) return <LoadingSpinner />;
  if (!contrato) return <p>Contrato no encontrado</p>;

  const handleSubmit = (data: ContratoFormData) => {
    const { cliente_id, ...updateData } = data;
    updateMutation.mutate(
      { id: id!, data: updateData },
      {
        onSuccess: () => {
          toast.success("Contrato actualizado");
          navigate("/contratos");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al actualizar");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Editar Contrato</h1>
      <p className="text-muted-foreground">{contrato.numero_contrato}</p>
      <Card>
        <CardHeader>
          <CardTitle>Información del Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <ContratoForm
            defaultValues={{
              cliente_id: contrato.cliente_id,
              plan_id: contrato.plan_id,
              fecha_inicio: contrato.fecha_inicio,
              estado: contrato.estado,
              dia_facturacion: contrato.dia_facturacion,
              notas: contrato.notas || undefined,
              ip_asignada: contrato.ip_asignada || undefined,
              router_id: contrato.router_id || undefined,
            }}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
