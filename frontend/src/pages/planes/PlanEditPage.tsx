import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { RefreshCw, Server, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlanForm from "@/components/planes/PlanForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePlan, useUpdatePlan, usePppProfiles, useSyncPppProfiles } from "@/hooks/usePlanes";
import type { PlanFormData } from "@/schemas/plan";

export default function PlanEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlan(id!);
  const { data: pppProfiles, isLoading: loadingProfiles } = usePppProfiles(id!);
  const updateMutation = useUpdatePlan();
  const syncMutation = useSyncPppProfiles();

  if (isLoading) return <LoadingSpinner />;
  if (!plan) return <p>Plan no encontrado</p>;

  const handleSubmit = (data: PlanFormData) => {
    // Check if speeds changed
    const speedsChanged =
      data.velocidad_bajada_mbps !== plan.velocidad_bajada_mbps ||
      data.velocidad_subida_mbps !== plan.velocidad_subida_mbps;

    updateMutation.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          if (speedsChanged && pppProfiles && pppProfiles.total_pppoe_contracts > 0) {
            toast.success(
              `Plan actualizado. Se actualizarán ${pppProfiles.routers.length} perfiles PPP automáticamente.`,
              { duration: 5000 }
            );
          } else {
            toast.success("Plan actualizado");
          }
          navigate("/planes");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al actualizar");
        },
      }
    );
  };

  const handleSyncProfiles = () => {
    syncMutation.mutate(id!, {
      onSuccess: () => {
        toast.success("Perfiles PPP sincronizados correctamente");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || "Error al sincronizar perfiles");
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm
            defaultValues={plan}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </CardContent>
      </Card>

      {/* PPP Profiles Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Perfiles PPPoE (MikroTik)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Perfiles PPP configurados para este plan en los routers
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncProfiles}
              disabled={syncMutation.isPending || !pppProfiles || pppProfiles.routers.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Sincronizar Perfiles
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProfiles ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : !pppProfiles || pppProfiles.total_pppoe_contracts === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay contratos PPPoE activos con este plan</p>
              <p className="text-xs mt-2">Los perfiles PPP se crean automáticamente al crear contratos PPPoE</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Nombre del Perfil</p>
                  <p className="text-lg font-mono">{pppProfiles.profile_name}</p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-sm font-medium">Velocidad</p>
                  <p className="text-lg">
                    {pppProfiles.velocidad_subida_mbps}M ↑ / {pppProfiles.velocidad_bajada_mbps}M ↓
                  </p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-sm font-medium">Contratos PPPoE</p>
                  <p className="text-lg font-semibold">{pppProfiles.total_pppoe_contracts}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Routers con este perfil:</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pppProfiles.routers.map((router) => (
                    <div
                      key={router.router_id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{router.router_name}</p>
                          {router.is_online ? (
                            <Wifi className="h-3 w-3 text-green-600" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{router.router_ip}</p>
                      </div>
                      <Badge variant="secondary">{router.contracts_count} contratos</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
