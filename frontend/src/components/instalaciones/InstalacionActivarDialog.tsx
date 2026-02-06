import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClientes } from "@/hooks/useClientes";
import { useRouters } from "@/hooks/useRouters";
import { useActivarInstalacion } from "@/hooks/useInstalaciones";
import {
  instalacionActivarSchema,
  type InstalacionActivarFormData,
} from "@/schemas/instalacion";
import * as routersApi from "@/api/routers";
import { toast } from "sonner";

interface InstalacionActivarDialogProps {
  instalacionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const estadoContratoLabels = {
  activo: "Activo",
  pendiente: "Pendiente",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

export function InstalacionActivarDialog({
  instalacionId,
  open,
  onOpenChange,
}: InstalacionActivarDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstalacionActivarFormData>({
    resolver: zodResolver(instalacionActivarSchema),
    defaultValues: {
      crear_cliente: true,
      dia_facturacion: 1,
      estado_contrato: "activo",
    },
  });

  const crearCliente = watch("crear_cliente");
  const estadoContrato = watch("estado_contrato");
  const selectedRouterId = watch("router_id");
  const ipAsignada = watch("ip_asignada");

  const [ipCheckStatus, setIpCheckStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });

  const [suggestingIp, setSuggestingIp] = useState(false);

  const { data: clientesData } = useClientes({
    page: 1,
    page_size: 100,
    is_active: true,
  });

  const { data: routersData } = useRouters({
    page: 1,
    page_size: 100,
    is_active: true,
  });

  const activarMutation = useActivarInstalacion();

  // Get selected router details
  const selectedRouter = routersData?.items.find((r) => r.id === selectedRouterId);

  // Validate IP when it changes
  useEffect(() => {
    if (!selectedRouterId || !ipAsignada || ipAsignada.length < 7) {
      setIpCheckStatus({ checking: false, available: null, message: "" });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIpCheckStatus({ checking: true, available: null, message: "" });
      try {
        const result = await routersApi.checkIpAvailable(selectedRouterId, ipAsignada);
        setIpCheckStatus({
          checking: false,
          available: result.available,
          message: result.message,
        });
      } catch (error) {
        setIpCheckStatus({ checking: false, available: null, message: "" });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [selectedRouterId, ipAsignada]);

  const handleSuggestIp = async () => {
    if (!selectedRouterId) {
      toast.error("Primero selecciona un router");
      return;
    }

    setSuggestingIp(true);
    try {
      const result = await routersApi.getNextAvailableIp(selectedRouterId);
      setValue("ip_asignada", result.ip_address);
      toast.success(`IP sugerida: ${result.ip_address}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Error al obtener IP sugerida");
    } finally {
      setSuggestingIp(false);
    }
  };

  const onSubmit = (data: InstalacionActivarFormData) => {
    activarMutation.mutate(
      { id: instalacionId, data },
      {
        onSuccess: () => {
          toast.success("Instalación activada exitosamente");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.detail || "Error al activar instalación"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Activar Instalación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Cliente</Label>
            <Select
              value={crearCliente ? "nuevo" : "existente"}
              onValueChange={(val) =>
                setValue("crear_cliente", val === "nuevo")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Crear nuevo cliente</SelectItem>
                <SelectItem value="existente">
                  Usar cliente existente
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!crearCliente && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={watch("cliente_id") || ""}
                onValueChange={(val) => setValue("cliente_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesData?.items.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}{" "}
                      {cliente.apellido1 || cliente.razon_social || ""} -{" "}
                      {cliente.numero_identificacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cliente_id && (
                <p className="text-sm text-destructive">
                  {errors.cliente_id.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Fecha de Inicio del Contrato</Label>
            <Input type="date" {...register("fecha_inicio_contrato")} />
            {errors.fecha_inicio_contrato && (
              <p className="text-sm text-destructive">
                {errors.fecha_inicio_contrato.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Día de Facturación (1-28)</Label>
            <Input
              type="number"
              min="1"
              max="28"
              {...register("dia_facturacion")}
            />
            {errors.dia_facturacion && (
              <p className="text-sm text-destructive">
                {errors.dia_facturacion.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Estado del Contrato</Label>
            <Select
              value={estadoContrato}
              onValueChange={(val) =>
                setValue(
                  "estado_contrato",
                  val as InstalacionActivarFormData["estado_contrato"]
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(estadoContratoLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Router MikroTik</Label>
            <Select
              value={watch("router_id") || ""}
              onValueChange={(val) => setValue("router_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un router" />
              </SelectTrigger>
              <SelectContent>
                {routersData?.items.map((router) => (
                  <SelectItem key={router.id} value={router.id}>
                    {router.nombre} ({router.ip})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.router_id && (
              <p className="text-sm text-destructive">
                {errors.router_id.message}
              </p>
            )}
            {selectedRouter?.cidr_disponibles && (
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Rangos CIDR:</strong> {selectedRouter.cidr_disponibles}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>IP Asignada</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestIp}
                disabled={!selectedRouterId || suggestingIp}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {suggestingIp ? "Buscando..." : "Sugerir IP"}
              </Button>
            </div>
            <Input
              {...register("ip_asignada")}
              placeholder="192.168.1.100"
            />
            {errors.ip_asignada && (
              <p className="text-sm text-destructive">
                {errors.ip_asignada.message}
              </p>
            )}
            {ipCheckStatus.checking && (
              <p className="text-xs text-muted-foreground">Verificando disponibilidad...</p>
            )}
            {!ipCheckStatus.checking && ipCheckStatus.available === true && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {ipCheckStatus.message}
              </div>
            )}
            {!ipCheckStatus.checking && ipCheckStatus.available === false && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {ipCheckStatus.message}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={activarMutation.isPending}>
              {activarMutation.isPending ? "Activando..." : "Activar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
