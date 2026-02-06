import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Edit, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DataTable, { type Column } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useCliente, useDeactivateCliente, useActivateCliente } from "@/hooks/useClientes";
import { useContratos } from "@/hooks/useContratos";
import { usePagos } from "@/hooks/usePagos";
import { formatCRC, formatDate } from "@/lib/utils";
import type { Contrato } from "@/types/contrato";
import type { Pago } from "@/types/pago";

const contratoColumns: Column<Contrato>[] = [
  { header: "Contrato", accessor: "numero_contrato" },
  { header: "Plan", accessor: (row) => row.plan?.nombre ?? "-" },
  { header: "Inicio", accessor: (row) => formatDate(row.fecha_inicio) },
  {
    header: "Estado",
    accessor: (row) => {
      const v: Record<string, "success" | "warning" | "destructive" | "default"> = {
        activo: "success",
        suspendido: "warning",
        cancelado: "destructive",
        pendiente: "default",
      };
      return <Badge variant={v[row.estado]}>{row.estado}</Badge>;
    },
  },
];

const pagoColumns: Column<Pago>[] = [
  { header: "Fecha", accessor: (row) => formatDate(row.fecha_pago) },
  { header: "Monto", accessor: (row) => formatCRC(row.monto) },
  { header: "Periodo", accessor: "periodo_facturado" },
  {
    header: "Estado",
    accessor: (row) => {
      const v: Record<string, "success" | "warning" | "destructive"> = {
        pendiente: "warning",
        validado: "success",
        rechazado: "destructive",
      };
      return <Badge variant={v[row.estado]}>{row.estado}</Badge>;
    },
  },
];

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cliente, isLoading } = useCliente(id!);
  const { data: contratos } = useContratos({ cliente_id: id, page_size: 10 });
  const { data: pagos } = usePagos({ cliente_id: id, page_size: 10 });
  const deactivateMutation = useDeactivateCliente();
  const activateMutation = useActivateCliente();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleActivate = () => {
    activateMutation.mutate(id!, {
      onSuccess: () => {
        toast.success("Cliente reactivado exitosamente");
      },
      onError: () => {
        toast.error("Error al reactivar cliente");
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!cliente) return <p>Cliente no encontrado</p>;

  const fullName =
    cliente.razon_social ||
    `${cliente.nombre} ${cliente.apellido1 || ""} ${cliente.apellido2 || ""}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{fullName}</h1>
          <p className="text-muted-foreground">{cliente.numero_identificacion}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/clientes/${id}/editar`}>
              <Edit className="h-4 w-4" /> Editar
            </Link>
          </Button>
          {cliente.is_active ? (
            <Button variant="destructive" onClick={() => setShowConfirm(true)}>
              <Trash2 className="h-4 w-4" /> Desactivar
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleActivate}
              disabled={activateMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" />
              {activateMutation.isPending ? "Reactivando..." : "Reactivar"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Información General
            <Badge variant={cliente.is_active ? "success" : "secondary"}>
              {cliente.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{cliente.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p>{cliente.telefono || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ubicación</p>
              <p>
                {[cliente.provincia, cliente.canton, cliente.distrito].filter(Boolean).join(", ") ||
                  "-"}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Dirección Exacta</p>
              <p>{cliente.direccion_exacta || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={contratoColumns}
            data={contratos?.items ?? []}
            emptyMessage="Sin contratos"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={pagoColumns} data={pagos?.items ?? []} emptyMessage="Sin pagos" />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Desactivar Cliente"
        description="¿Está seguro de desactivar este cliente? Sus contratos seguirán activos."
        confirmLabel="Desactivar"
        destructive
        onConfirm={() => {
          deactivateMutation.mutate(id!, {
            onSuccess: () => {
              toast.success("Cliente desactivado");
              navigate("/clientes");
            },
          });
        }}
      />
    </div>
  );
}
