import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UsuarioForm from "@/components/usuarios/UsuarioForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  useUsuario,
  useUpdateUsuario,
  useAdminResetPassword,
  useDeactivateUsuario,
  useActivateUsuario,
} from "@/hooks/useUsuarios";
import { useCurrentUser } from "@/hooks/useUsuarios";
import type { UsuarioFormData } from "@/schemas/usuario";

export default function UsuarioEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: usuario, isLoading } = useUsuario(id!);
  const { data: currentUser } = useCurrentUser();
  const updateMutation = useUpdateUsuario();
  const resetPasswordMutation = useAdminResetPassword();
  const deactivateMutation = useDeactivateUsuario();
  const activateMutation = useActivateUsuario();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (!usuario) return <p>Usuario no encontrado</p>;

  const isAdmin = currentUser?.rol === "ADMIN";
  const isSelfEdit = currentUser?.id === id;

  const handleSubmit = (data: UsuarioFormData) => {
    const cleanData = {
      email: data.email,
      nombre_completo: data.nombre_completo,
      rol: data.rol,
    };
    updateMutation.mutate(
      { id: id!, data: cleanData },
      {
        onSuccess: () => {
          toast.success("Usuario actualizado");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al actualizar");
        },
      }
    );
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    resetPasswordMutation.mutate(
      { id: id!, newPassword },
      {
        onSuccess: () => {
          toast.success("Contraseña actualizada exitosamente");
          setShowPasswordDialog(false);
          setNewPassword("");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al cambiar contraseña");
        },
      }
    );
  };

  const handleToggleActive = () => {
    if (usuario.is_active) {
      deactivateMutation.mutate(id!, {
        onSuccess: () => {
          toast.success("Usuario desactivado");
          setShowDeactivateDialog(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al desactivar usuario");
        },
      });
    } else {
      activateMutation.mutate(id!, {
        onSuccess: () => {
          toast.success("Usuario activado");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al activar usuario");
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Editar Usuario</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsuarioForm
            defaultValues={usuario}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            isEdit
          />

          {isAdmin && !isSelfEdit && (
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
                className="w-full"
              >
                Cambiar Contraseña
              </Button>
              <Button
                variant={usuario.is_active ? "destructive" : "default"}
                onClick={() => {
                  if (usuario.is_active) {
                    setShowDeactivateDialog(true);
                  } else {
                    handleToggleActive();
                  }
                }}
                className="w-full"
              >
                {usuario.is_active ? "Desactivar Usuario" : "Activar Usuario"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingrese la nueva contraseña para {usuario.nombre_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nueva Contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Guardando..." : "Cambiar Contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar Usuario</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea desactivar a {usuario.nombre_completo}? El usuario no podrá
              acceder al sistema hasta que sea reactivado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleToggleActive}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
