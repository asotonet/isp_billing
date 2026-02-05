import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable, { type Column } from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useRouters, useDeleteRouter, useTestConnection } from "@/hooks/useRouters";
import { usePermissions } from "@/hooks/usePermissions";
import type { Router } from "@/types/router";

export default function RoutersListPage() {
  const { canWrite } = usePermissions();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useRouters({ page, page_size: 20 });
  const deleteMutation = useDeleteRouter();
  const testConnectionMutation = useTestConnection();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleTestConnection = (id: string, nombre: string) => {
    testConnectionMutation.mutate(id, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(result.message, {
            description: result.router_version
              ? `Versión: ${result.router_version}`
              : undefined,
          });
        } else {
          toast.error("Error de conexión", {
            description: result.message,
          });
        }
      },
      onError: () => {
        toast.error("Error al probar conexión");
      },
    });
  };

  const columns: Column<Router>[] = [
    { header: "Nombre", accessor: "nombre" },
    { header: "IP", accessor: "ip" },
    { header: "Usuario", accessor: "usuario" },
    {
      header: "Puerto",
      accessor: (row) => `${row.puerto}${row.ssl ? " (SSL)" : ""}`,
    },
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestConnection(row.id, row.nombre)}
            disabled={testConnectionMutation.isPending}
          >
            <Wifi className="h-4 w-4" />
            Probar
          </Button>
          {canWrite("routers") && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/routers/${row.id}/editar`}>Editar</Link>
              </Button>
              {row.is_active && (
                <Button variant="destructive" size="sm" onClick={() => setDeleteId(row.id)}>
                  Eliminar
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
        <h1 className="text-3xl font-bold">Routers MikroTik</h1>
        {canWrite("routers") && (
          <Button asChild>
            <Link to="/routers/nuevo">
              <Plus className="h-4 w-4" /> Nuevo Router
            </Link>
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} />

      <Pagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Router"
        description="¿Está seguro de eliminar este router? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => {
                toast.success("Router eliminado");
                setDeleteId(null);
              },
            });
          }
        }}
      />
    </div>
  );
}
