import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable, { type Column } from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { usePlanes, useDeactivatePlan } from "@/hooks/usePlanes";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCRC } from "@/lib/utils";
import type { Plan } from "@/types/plan";

export default function PlanesListPage() {
  const navigate = useNavigate();
  const { canWrite } = usePermissions();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePlanes({ page, page_size: 20 });
  const deactivateMutation = useDeactivatePlan();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: Column<Plan>[] = [
    { header: "Nombre", accessor: "nombre" },
    { header: "Bajada", accessor: (row) => `${row.velocidad_bajada_mbps} Mbps` },
    { header: "Subida", accessor: (row) => `${row.velocidad_subida_mbps} Mbps` },
    { header: "Precio", accessor: (row) => formatCRC(row.precio_mensual) },
    {
      header: "Estado",
      accessor: (row) => (
        <Badge variant={row.is_active ? "success" : "secondary"}>
          {row.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      accessor: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {canWrite("planes") && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/planes/${row.id}/editar`}>Editar</Link>
              </Button>
              {row.is_active && (
                <Button variant="destructive" size="sm" onClick={() => setDeleteId(row.id)}>
                  Desactivar
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Planes</h1>
        {canWrite("planes") && (
          <Button asChild>
            <Link to="/planes/nuevo">
              <Plus className="h-4 w-4" /> Nuevo Plan
            </Link>
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} />

      <Pagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Desactivar Plan"
        description="¿Está seguro de desactivar este plan?"
        confirmLabel="Desactivar"
        destructive
        onConfirm={() => {
          if (deleteId) {
            deactivateMutation.mutate(deleteId, {
              onSuccess: () => {
                toast.success("Plan desactivado");
                setDeleteId(null);
              },
            });
          }
        }}
      />
    </div>
  );
}
