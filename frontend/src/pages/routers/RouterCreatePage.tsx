import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RouterForm from "@/components/routers/RouterForm";
import { useCreateRouter } from "@/hooks/useRouters";
import type { RouterFormData } from "@/schemas/router";

export default function RouterCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateRouter();

  const handleSubmit = (data: RouterFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Router creado exitosamente");
        navigate("/routers");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al crear router");
      },
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Nuevo Router MikroTik</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Router</CardTitle>
        </CardHeader>
        <CardContent>
          <RouterForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
