import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateInstalacion } from "@/hooks/useInstalaciones";
import { toast } from "sonner";

interface InstalacionCancelarDialogProps {
  instalacionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CancelarFormData {
  motivo_cancelacion: string;
}

export function InstalacionCancelarDialog({
  instalacionId,
  open,
  onOpenChange,
}: InstalacionCancelarDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CancelarFormData>();

  const updateMutation = useUpdateInstalacion();

  const onSubmit = (data: CancelarFormData) => {
    updateMutation.mutate(
      {
        id: instalacionId,
        data: {
          estado: "cancelada",
          motivo_cancelacion: data.motivo_cancelacion,
        },
      },
      {
        onSuccess: () => {
          toast.success("Instalación cancelada");
          reset();
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.detail || "Error al cancelar instalación"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Instalación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo de Cancelación *</Label>
            <Textarea
              {...register("motivo_cancelacion", {
                required: "El motivo de cancelación es requerido",
                minLength: {
                  value: 10,
                  message: "El motivo debe tener al menos 10 caracteres",
                },
              })}
              placeholder="Explica la razón de la cancelación..."
              rows={4}
            />
            {errors.motivo_cancelacion && (
              <p className="text-sm text-destructive">
                {errors.motivo_cancelacion.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? "Cancelando..."
                : "Confirmar Cancelación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
