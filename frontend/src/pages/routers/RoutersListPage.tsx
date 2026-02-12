import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Wifi, Activity } from "lucide-react";
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
  const [countdown, setCountdown] = useState(30);

  const { data, isLoading, dataUpdatedAt } = useRouters({
    page,
    page_size: 20,
    // Auto-refetch every 30 seconds for real-time status updates
    refetchInterval: 30000,
  });
  const deleteMutation = useDeleteRouter();
  const testConnectionMutation = useTestConnection();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Countdown timer for next refresh
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceUpdate = Math.floor((now - dataUpdatedAt) / 1000);
      const remaining = Math.max(0, 30 - timeSinceUpdate);
      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

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

  const getTimeSinceCheck = (lastCheck: string | null) => {
    if (!lastCheck) return null;
    const now = new Date();
    const checkTime = new Date(lastCheck);
    const diffSeconds = Math.floor((now.getTime() - checkTime.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    return `${Math.floor(diffSeconds / 3600)}h`;
  };

  const columns: Column<Router>[] = [
    {
      header: "Nombre",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.is_active && row.is_online !== null && (
            <Activity className={`h-4 w-4 ${row.is_online ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
          )}
          <span>{row.nombre}</span>
        </div>
      ),
    },
    {
      header: "Estado",
      accessor: (row) => {
        const timeSince = getTimeSinceCheck(row.last_check_at);

        if (!row.is_active) {
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="gap-1 w-fit">
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                Inactivo
              </Badge>
            </div>
          );
        }

        if (row.is_online === null) {
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="gap-1 w-fit">
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                Sin verificar
              </Badge>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-1">
            <Badge
              variant={row.is_online ? "success" : "destructive"}
              className="gap-1 w-fit"
            >
              <span className={`h-2 w-2 rounded-full ${row.is_online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {row.is_online ? "Online" : "Offline"}
            </Badge>
            {timeSince && (
              <span className="text-xs text-muted-foreground">
                Verificado hace {timeSince}
              </span>
            )}
          </div>
        );
      },
    },
    { header: "IP", accessor: "ip" },
    {
      header: "Puerto",
      accessor: (row) => `${row.puerto}${row.ssl ? " (SSL)" : ""}`,
    },
    { header: "Usuario", accessor: "usuario" },
    {
      header: "Identity",
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.identity || "-"}
        </span>
      ),
    },
    {
      header: "Versión RouterOS",
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.routeros_version || "-"}
        </span>
      ),
    },
    {
      header: "CIDR Disponibles",
      accessor: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {row.cidr_disponibles || "-"}
        </span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          Actualización automática en {countdown}s
        </span>
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
