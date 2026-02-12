import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contratoSchema, type ContratoFormData } from "@/schemas/contrato";
import { useClientes } from "@/hooks/useClientes";
import { usePlanes } from "@/hooks/usePlanes";
import { useRouters } from "@/hooks/useRouters";

interface ContratoFormProps {
  defaultValues?: Partial<ContratoFormData>;
  onSubmit: (data: ContratoFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const estadoLabels = {
  activo: "Activo",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
  pendiente: "Pendiente",
};

export default function ContratoForm({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit,
}: ContratoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      estado: "activo",
      dia_facturacion: 1,
      tipo_conexion: "ipoe",
      ...defaultValues,
    },
  });

  const { data: clientesData } = useClientes({ page_size: 100, is_active: true });
  const { data: planesData } = usePlanes({ page_size: 100, is_active: true });
  const { data: routersData } = useRouters({ page_size: 100, is_active: true });

  const tipoConexion = watch("tipo_conexion");

  // State for PPPoE IP assignment mode (auto vs fixed)
  const [useFixedIP, setUseFixedIP] = useState(!!defaultValues?.pppoe_remote_address);

  // Update toggle state when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues?.pppoe_remote_address) {
      setUseFixedIP(true);
    }
  }, [defaultValues?.pppoe_remote_address]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select
            value={watch("cliente_id")}
            onValueChange={(v) => setValue("cliente_id", v)}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientesData?.items.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.razon_social || `${c.nombre} ${c.apellido1 || ""}`} - {c.numero_identificacion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cliente_id && (
            <p className="text-sm text-destructive">{errors.cliente_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Plan</Label>
          <Select value={watch("plan_id")} onValueChange={(v) => setValue("plan_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plan" />
            </SelectTrigger>
            <SelectContent>
              {planesData?.items.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} - {p.velocidad_bajada_mbps}Mbps
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.plan_id && (
            <p className="text-sm text-destructive">{errors.plan_id.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Fecha de Inicio</Label>
          <Input type="date" {...register("fecha_inicio")} />
          {errors.fecha_inicio && (
            <p className="text-sm text-destructive">{errors.fecha_inicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Día de Facturación</Label>
          <Input type="number" min="1" max="28" {...register("dia_facturacion")} />
          {errors.dia_facturacion && (
            <p className="text-sm text-destructive">{errors.dia_facturacion.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={watch("estado")}
            onValueChange={(v: ContratoFormData["estado"]) => setValue("estado", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(estadoLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tipo de Conexión */}
      <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Tipo de Conexión</Label>
            <p className="text-sm text-muted-foreground">
              {tipoConexion === "ipoe" ? "IPoE (IP estática con address-list)" : "PPPoE (Autenticación con usuario/contraseña)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${tipoConexion === "ipoe" ? "font-semibold" : "text-muted-foreground"}`}>
              IPoE
            </span>
            <Switch
              checked={tipoConexion === "pppoe"}
              onCheckedChange={(checked) => setValue("tipo_conexion", checked ? "pppoe" : "ipoe")}
            />
            <span className={`text-sm ${tipoConexion === "pppoe" ? "font-semibold" : "text-muted-foreground"}`}>
              PPPoE
            </span>
          </div>
        </div>

        {/* Router Selection (common for both) */}
        <div className="space-y-2">
          <Label>Router MikroTik (opcional)</Label>
          <Select
            value={watch("router_id") || undefined}
            onValueChange={(v) => setValue("router_id", v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin router" />
            </SelectTrigger>
            <SelectContent>
              {routersData?.items.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nombre} ({r.ip})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.router_id && (
            <p className="text-sm text-destructive">{errors.router_id.message}</p>
          )}
        </div>

        {/* IPoE Fields */}
        {tipoConexion === "ipoe" && (
          <div className="space-y-2">
            <Label>IP Asignada</Label>
            <Input {...register("ip_asignada")} placeholder="192.168.1.100" />
            {errors.ip_asignada && (
              <p className="text-sm text-destructive">{errors.ip_asignada.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              IP que se agregará al address-list del MikroTik
            </p>
          </div>
        )}

        {/* PPPoE Fields */}
        {tipoConexion === "pppoe" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Usuario PPPoE</Label>
                <Input {...register("pppoe_usuario")} placeholder="cliente@isp" />
                {errors.pppoe_usuario && (
                  <p className="text-sm text-destructive">{errors.pppoe_usuario.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Usuario para autenticación PPPoE en MikroTik
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contraseña PPPoE</Label>
                <Input
                  type="text"
                  {...register("pppoe_password")}
                  placeholder="Contraseña visible para administradores"
                  autoComplete="off"
                />
                {errors.pppoe_password && (
                  <p className="text-sm text-destructive">{errors.pppoe_password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Contraseña visible (solo para usuarios administrativos)
                </p>
              </div>
            </div>

            {/* Remote Address Assignment */}
            <div className="space-y-2">
              <Label>Asignación de IP Remota</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${!useFixedIP ? "font-semibold" : "text-muted-foreground"}`}>
                  Auto (Pool)
                </span>
                <Switch
                  checked={useFixedIP}
                  onCheckedChange={(checked) => {
                    setUseFixedIP(checked);
                    if (!checked) {
                      // Switched to Auto - clear the IP
                      setValue("pppoe_remote_address", "");
                    }
                  }}
                />
                <span className={`text-sm ${useFixedIP ? "font-semibold" : "text-muted-foreground"}`}>
                  IP Fija
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto: Asigna IP automáticamente desde el pool del router. IP Fija: Especifica una IP fija del CIDR.
              </p>
            </div>

            {/* Fixed IP Field (only if IP Fija selected) */}
            {useFixedIP && (
              <div className="space-y-2">
                <Label>IP Remota Fija</Label>
                <Input {...register("pppoe_remote_address")} placeholder="192.168.1.100" />
                {errors.pppoe_remote_address && (
                  <p className="text-sm text-destructive">{errors.pppoe_remote_address.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  IP del CIDR del router que se asignará al cliente PPPoE (local-address se calcula automáticamente)
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Input {...register("notas")} />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Contrato"}
      </Button>
    </form>
  );
}
