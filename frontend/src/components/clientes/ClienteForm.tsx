import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import UbicacionSelector from "@/components/common/UbicacionSelector";
import { clienteSchema, type ClienteFormData } from "@/schemas/cliente";
import type { Cliente } from "@/types/cliente";

interface ClienteFormProps {
  defaultValues?: Partial<ClienteFormData>;
  onSubmit: (data: ClienteFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const tipoIdLabels = {
  cedula_fisica: "Cédula Física",
  cedula_juridica: "Cédula Jurídica",
  dimex: "DIMEX",
  nite: "NITE",
};

export default function ClienteForm({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_identificacion: "cedula_fisica",
      ...defaultValues,
    },
  });

  const tipoId = watch("tipo_identificacion");
  const isJuridica = tipoId === "cedula_juridica";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de Identificación</Label>
          <Select
            value={tipoId}
            onValueChange={(val: ClienteFormData["tipo_identificacion"]) =>
              setValue("tipo_identificacion", val)
            }
            disabled={isEdit}
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
          <Input {...register("numero_identificacion")} disabled={isEdit} />
          {errors.numero_identificacion && (
            <p className="text-sm text-destructive">{errors.numero_identificacion.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input {...register("nombre")} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </div>

        {isJuridica ? (
          <div className="space-y-2">
            <Label>Razón Social</Label>
            <Input {...register("razon_social")} />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Primer Apellido</Label>
              <Input {...register("apellido1")} />
            </div>
          </>
        )}
      </div>

      {!isJuridica && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Segundo Apellido</Label>
            <Input {...register("apellido2")} />
          </div>
          <div />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input {...register("telefono")} placeholder="88881234" />
          {errors.telefono && (
            <p className="text-sm text-destructive">{errors.telefono.message}</p>
          )}
        </div>
      </div>

      <UbicacionSelector
        provincia={watch("provincia") || ""}
        canton={watch("canton") || ""}
        distrito={watch("distrito") || ""}
        onProvinciaChange={(v) => setValue("provincia", v)}
        onCantonChange={(v) => setValue("canton", v)}
        onDistritoChange={(v) => setValue("distrito", v)}
      />

      <div className="space-y-2">
        <Label>Dirección Exacta</Label>
        <Input {...register("direccion_exacta")} />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Cliente"}
      </Button>
    </form>
  );
}
