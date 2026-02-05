import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UbicacionSelector from "@/components/common/UbicacionSelector";
import { usePlanes } from "@/hooks/usePlanes";
import {
  instalacionSolicitudSchema,
  type InstalacionSolicitudFormData,
} from "@/schemas/instalacion";

interface InstalacionSolicitudFormProps {
  onSubmit: (data: InstalacionSolicitudFormData) => void;
  isLoading?: boolean;
}

const tipoIdLabels = {
  cedula_fisica: "Cédula Física",
  cedula_juridica: "Cédula Jurídica",
  dimex: "DIMEX",
  nite: "NITE",
};

export default function InstalacionSolicitudForm({
  onSubmit,
  isLoading,
}: InstalacionSolicitudFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstalacionSolicitudFormData>({
    resolver: zodResolver(instalacionSolicitudSchema),
    defaultValues: {
      temp_tipo_identificacion: "cedula_fisica",
    },
  });

  const tipoId = watch("temp_tipo_identificacion");
  const isJuridica = tipoId === "cedula_juridica";
  const planId = watch("plan_id");

  const { data: planesData } = usePlanes({
    page: 1,
    page_size: 100,
    is_active: true,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plan Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Plan a Instalar</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={planId}
              onValueChange={(val) => setValue("plan_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {planesData?.items.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nombre} - {plan.velocidad_bajada_mbps}Mbps -{" "}
                    {plan.moneda} {plan.precio_mensual}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.plan_id && (
              <p className="text-sm text-destructive">
                {errors.plan_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha Programada</Label>
            <Input type="date" {...register("fecha_programada")} />
            {errors.fecha_programada && (
              <p className="text-sm text-destructive">
                {errors.fecha_programada.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Técnico Asignado (Opcional)</Label>
            <Input {...register("tecnico_asignado")} />
          </div>
        </div>
      </div>

      {/* Client Temporary Data */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Datos del Cliente</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de Identificación</Label>
            <Select
              value={tipoId}
              onValueChange={(
                val: InstalacionSolicitudFormData["temp_tipo_identificacion"]
              ) => setValue("temp_tipo_identificacion", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tipoIdLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Número de Identificación</Label>
            <Input {...register("temp_numero_identificacion")} />
            {errors.temp_numero_identificacion && (
              <p className="text-sm text-destructive">
                {errors.temp_numero_identificacion.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input {...register("temp_nombre")} />
            {errors.temp_nombre && (
              <p className="text-sm text-destructive">
                {errors.temp_nombre.message}
              </p>
            )}
          </div>

          {isJuridica ? (
            <div className="space-y-2">
              <Label>Razón Social</Label>
              <Input {...register("temp_razon_social")} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Primer Apellido</Label>
                <Input {...register("temp_apellido1")} />
              </div>
            </>
          )}
        </div>

        {!isJuridica && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Segundo Apellido</Label>
              <Input {...register("temp_apellido2")} />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("temp_email")} />
            {errors.temp_email && (
              <p className="text-sm text-destructive">
                {errors.temp_email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...register("temp_telefono")} placeholder="88887777" />
            {errors.temp_telefono && (
              <p className="text-sm text-destructive">
                {errors.temp_telefono.message}
              </p>
            )}
          </div>
        </div>

        <UbicacionSelector
          provincia={watch("temp_provincia")}
          canton={watch("temp_canton")}
          distrito={watch("temp_distrito")}
          onProvinciaChange={(val) => {
            setValue("temp_provincia", val);
            setValue("temp_canton", "");
            setValue("temp_distrito", "");
          }}
          onCantonChange={(val) => {
            setValue("temp_canton", val);
            setValue("temp_distrito", "");
          }}
          onDistritoChange={(val) => setValue("temp_distrito", val)}
        />

        <div className="space-y-2">
          <Label>Dirección Exacta</Label>
          <Textarea
            {...register("temp_direccion_exacta")}
            placeholder="100 metros norte de..."
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notas de Instalación (Opcional)</Label>
        <Textarea
          {...register("notas")}
          placeholder="Instrucciones especiales para el técnico..."
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creando solicitud..." : "Crear Solicitud de Instalación"}
      </Button>
    </form>
  );
}
