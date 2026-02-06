import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RouterForm from "@/components/routers/RouterForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouter, useUpdateRouter } from "@/hooks/useRouters";
import type { RouterFormData } from "@/schemas/router";

export default function RouterEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: router, isLoading } = useRouter(id!);
  const updateMutation = useUpdateRouter();

  if (isLoading) return <LoadingSpinner />;
  if (!router) return <p>Router no encontrado</p>;

  const handleSubmit = (data: RouterFormData) => {
    // Si password está vacío en edición, no enviarlo
    const submitData = { ...data };
    if (submitData.password === "") {
      delete submitData.password;
    }

    updateMutation.mutate(
      { id: id!, data: submitData },
      {
        onSuccess: () => {
          toast.success("Router actualizado");
          navigate("/routers");
        },
        onError: (err: any) => {
          const errorDetail = err.response?.data?.detail;
          let errorMessage = "Error al actualizar";

          if (typeof errorDetail === "string") {
            errorMessage = errorDetail;
          } else if (Array.isArray(errorDetail)) {
            errorMessage = errorDetail.map((e: any) => e.msg).join(", ");
          }

          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Editar Router</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Router</CardTitle>
        </CardHeader>
        <CardContent>
          <RouterForm
            defaultValues={router}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
