import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePago, useValidarPago } from "@/hooks/usePagos";
import { formatCRC, formatDate } from "@/lib/utils";
import { useState } from "react";

const metodoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  sinpe_movil: "SINPE Móvil",
  tarjeta: "Tarjeta",
  deposito: "Depósito",
};

export default function PagoValidarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pago, isLoading } = usePago(id!);
  const validarMutation = useValidarPago();
  const [confirmAction, setConfirmAction] = useState<"validar" | "rechazar" | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (!pago) return <p>Pago no encontrado</p>;

  const handleAction = (accion: "validar" | "rechazar") => {
    validarMutation.mutate(
      { id: id!, data: { accion } },
      {
        onSuccess: () => {
          toast.success(accion === "validar" ? "Pago validado" : "Pago rechazado");
          navigate("/pagos");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al procesar");
        },
      }
    );
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Detalles del Pago
            <Badge
              variant={
                pago.estado === "pendiente"
                  ? "warning"
                  : pago.estado === "validado"
                  ? "success"
                  : "destructive"
              }
            >
              {pago.estado}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="text-lg font-bold">{formatCRC(pago.monto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Pago</p>
              <p>{formatDate(pago.fecha_pago)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Periodo</p>
              <p>{pago.periodo_facturado}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Método de Pago</p>
              <p>{metodoLabels[pago.metodo_pago] || pago.metodo_pago}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referencia</p>
              <p>{pago.referencia || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notas</p>
              <p>{pago.notas || "-"}</p>
            </div>
          </div>

          {pago.estado === "pendiente" && (
            <>
              <Separator />
              <div className="flex gap-4">
                <Button
                  onClick={() => setConfirmAction("validar")}
                  disabled={validarMutation.isPending}
                >
                  Validar Pago
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmAction("rechazar")}
                  disabled={validarMutation.isPending}
                >
                  Rechazar Pago
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction === "validar"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Validar Pago"
        description="¿Confirma que desea validar este pago?"
        confirmLabel="Validar"
        onConfirm={() => handleAction("validar")}
      />

      <ConfirmDialog
        open={confirmAction === "rechazar"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Rechazar Pago"
        description="¿Confirma que desea rechazar este pago?"
        confirmLabel="Rechazar"
        destructive
        onConfirm={() => handleAction("rechazar")}
      />
    </div>
  );
}
