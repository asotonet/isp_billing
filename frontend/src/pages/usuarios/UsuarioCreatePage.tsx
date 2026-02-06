import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UsuarioForm from "@/components/usuarios/UsuarioForm";
import { useCreateUsuario } from "@/hooks/useUsuarios";
import type { UsuarioFormData } from "@/schemas/usuario";

export default function UsuarioCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateUsuario();

  const handleSubmit = (data: UsuarioFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Usuario creado exitosamente");
        navigate("/usuarios");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al crear usuario");
      },
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Nuevo Usuario</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <UsuarioForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
