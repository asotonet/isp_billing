import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlanForm from "@/components/planes/PlanForm";
import { useCreatePlan } from "@/hooks/usePlanes";
import type { PlanFormData } from "@/schemas/plan";

export default function PlanCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePlan();

  const handleSubmit = (data: PlanFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Plan creado exitosamente");
        navigate("/planes");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al crear plan");
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
