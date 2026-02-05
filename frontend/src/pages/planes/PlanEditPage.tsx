import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlanForm from "@/components/planes/PlanForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePlan, useUpdatePlan } from "@/hooks/usePlanes";
import type { PlanFormData } from "@/schemas/plan";

export default function PlanEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlan(id!);
  const updateMutation = useUpdatePlan();

  if (isLoading) return <LoadingSpinner />;
  if (!plan) return <p>Plan no encontrado</p>;

  const handleSubmit = (data: PlanFormData) => {
    updateMutation.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          toast.success("Plan actualizado");
          navigate("/planes");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al actualizar");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Editar Plan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            defaultValues={plan}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
