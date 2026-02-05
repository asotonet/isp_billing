import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClienteForm from "@/components/clientes/ClienteForm";
import { useCreateCliente } from "@/hooks/useClientes";
import type { ClienteFormData } from "@/schemas/cliente";

export default function ClienteCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCliente();

  const handleSubmit = (data: ClienteFormData) => {
    const cleanData = {
      ...data,
      email: data.email || undefined,
      telefono: data.telefono || undefined,
    };
    createMutation.mutate(cleanData, {
      onSuccess: () => {
        toast.success("Cliente creado exitosamente");
        navigate("/clientes");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al crear cliente");
      },
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
