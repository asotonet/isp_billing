import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClienteForm from "@/components/clientes/ClienteForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useCliente, useUpdateCliente } from "@/hooks/useClientes";
import type { ClienteFormData } from "@/schemas/cliente";

export default function ClienteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cliente, isLoading } = useCliente(id!);
  const updateMutation = useUpdateCliente();

  if (isLoading) return <LoadingSpinner />;
  if (!cliente) return <p>Cliente no encontrado</p>;

  const handleSubmit = (data: ClienteFormData) => {
    const cleanData = {
      nombre: data.nombre,
      apellido1: data.apellido1,
      apellido2: data.apellido2,
      razon_social: data.razon_social,
      email: data.email || undefined,
      telefono: data.telefono || undefined,
      provincia: data.provincia,
      canton: data.canton,
      distrito: data.distrito,
      direccion_exacta: data.direccion_exacta,
    };
    updateMutation.mutate(
      { id: id!, data: cleanData },
      {
        onSuccess: () => {
          toast.success("Cliente actualizado");
          navigate(`/clientes/${id}`);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al actualizar");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm
            defaultValues={cliente}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
