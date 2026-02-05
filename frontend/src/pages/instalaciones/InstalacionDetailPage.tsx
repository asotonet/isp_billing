import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { InstalacionStatusBadge } from "@/components/instalaciones/InstalacionStatusBadge";
import { InstalacionActivarDialog } from "@/components/instalaciones/InstalacionActivarDialog";
import { useInstalacion, useUpdateInstalacion } from "@/hooks/useInstalaciones";
import * as instalacionesApi from "@/api/instalaciones";
import { toast } from "sonner";

export default function InstalacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: instalacion, isLoading } = useInstalacion(id!);
  const updateMutation = useUpdateInstalacion();
  const [activarDialogOpen, setActivarDialogOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (!instalacion) return <p>Instalación no encontrada</p>;

  const handleDownloadPdf = async () => {
    try {
      const blob = await instalacionesApi.downloadPdfSolicitud(instalacion.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${instalacion.numero_instalacion}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF descargado exitosamente");
    } catch (error) {
      toast.error("Error al descargar PDF");
    }
  };

  const handleChangeEstado = (newEstado: string) => {
    updateMutation.mutate(
      {
        id: instalacion.id,
        data: { estado: newEstado as any },
      },
      {
        onSuccess: () => {
          toast.success("Estado actualizado exitosamente");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.detail || "Error al actualizar estado");
        },
      }
    );
  };

  const clienteName =
    instalacion.temp_razon_social ||
    `${instalacion.temp_nombre} ${instalacion.temp_apellido1 || ""}`.trim() ||
    "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{instalacion.numero_instalacion}</h1>
          <p className="text-muted-foreground">Instalación</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPdf} variant="outline">
            <Download className="h-4 w-4" /> Descargar PDF Solicitud
          </Button>
        </div>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <InstalacionStatusBadge estado={instalacion.estado} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{instalacion.plan.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {instalacion.plan.velocidad_bajada_mbps}Mbps /{" "}
                {instalacion.plan.velocidad_subida_mbps}Mbps
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha Programada</p>
              <p className="font-medium">
                {new Date(instalacion.fecha_programada).toLocaleDateString("es-CR")}
              </p>
            </div>
            {instalacion.fecha_completada && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha Completada</p>
                <p className="font-medium">
                  {new Date(instalacion.fecha_completada).toLocaleDateString("es-CR")}
                </p>
              </div>
            )}
            {instalacion.tecnico_asignado && (
              <div>
                <p className="text-sm text-muted-foreground">Técnico Asignado</p>
                <p className="font-medium">{instalacion.tecnico_asignado}</p>
              </div>
            )}
          </div>
          {instalacion.notas && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="mt-1">{instalacion.notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Client Data */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {instalacion.contrato_id ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Esta instalación ya fue activada. Los datos del cliente están en:
              </p>
              {instalacion.contrato && (
                <Button variant="outline" asChild>
                  <Link to={`/clientes/${instalacion.contrato.cliente_id}`}>
                    <FileText className="h-4 w-4" /> Ver Cliente
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo Identificación</p>
                  <p className="font-medium">{instalacion.temp_tipo_identificacion || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número Identificación</p>
                  <p className="font-medium">{instalacion.temp_numero_identificacion || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{clienteName}</p>
                </div>
                {instalacion.temp_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{instalacion.temp_email}</p>
                  </div>
                )}
                {instalacion.temp_telefono && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{instalacion.temp_telefono}</p>
                  </div>
                )}
                {instalacion.temp_provincia && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">
                      {instalacion.temp_provincia}
                      {instalacion.temp_canton && `, ${instalacion.temp_canton}`}
                      {instalacion.temp_distrito && `, ${instalacion.temp_distrito}`}
                    </p>
                  </div>
                )}
              </div>
              {instalacion.temp_direccion_exacta && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección Exacta</p>
                    <p className="mt-1">{instalacion.temp_direccion_exacta}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Info */}
      {instalacion.contrato && (
        <Card>
          <CardHeader>
            <CardTitle>Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Número de Contrato</p>
                <p className="font-medium">{instalacion.contrato.numero_contrato}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-medium">{instalacion.contrato.estado}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/contratos/${instalacion.contrato_id}`}>
                <FileText className="h-4 w-4" /> Ver Contrato
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {instalacion.estado === "solicitud" && (
              <>
                <Button onClick={() => handleChangeEstado("programada")}>
                  Marcar como Programada
                </Button>
                <Button
                  onClick={() => setActivarDialogOpen(true)}
                  variant="default"
                >
                  Activar Instalación
                </Button>
                <Button
                  onClick={() => handleChangeEstado("cancelada")}
                  variant="destructive"
                >
                  Cancelar
                </Button>
              </>
            )}

            {instalacion.estado === "programada" && (
              <>
                <Button onClick={() => handleChangeEstado("en_progreso")}>
                  Marcar como En Progreso
                </Button>
                <Button
                  onClick={() => setActivarDialogOpen(true)}
                  variant="default"
                >
                  Activar Instalación
                </Button>
                <Button
                  onClick={() => handleChangeEstado("cancelada")}
                  variant="destructive"
                >
                  Cancelar
                </Button>
              </>
            )}

            {instalacion.estado === "en_progreso" && (
              <>
                <Button
                  onClick={() => setActivarDialogOpen(true)}
                  variant="default"
                >
                  Activar Instalación
                </Button>
                <Button
                  onClick={() => handleChangeEstado("programada")}
                  variant="outline"
                >
                  Volver a Programada
                </Button>
                <Button
                  onClick={() => handleChangeEstado("cancelada")}
                  variant="destructive"
                >
                  Cancelar
                </Button>
              </>
            )}

            {instalacion.estado === "completada" && instalacion.contrato_id && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Instalación completada. Para cargar el PDF firmado, ir al contrato.
                </p>
                <Button variant="outline" asChild>
                  <Link to={`/contratos/${instalacion.contrato_id}`}>
                    Ver Contrato
                  </Link>
                </Button>
              </div>
            )}

            {instalacion.estado === "cancelada" && (
              <p className="text-muted-foreground">
                Esta instalación fue cancelada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <InstalacionActivarDialog
        instalacionId={instalacion.id}
        open={activarDialogOpen}
        onOpenChange={setActivarDialogOpen}
      />
    </div>
  );
}
