import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { routerSchema, routerUpdateSchema, type RouterFormData } from "@/schemas/router";

interface RouterFormProps {
  defaultValues?: Partial<RouterFormData>;
  onSubmit: (data: RouterFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function RouterForm({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit,
}: RouterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RouterFormData>({
    resolver: zodResolver(isEdit ? routerUpdateSchema : routerSchema),
    defaultValues: {
      puerto: 8728,
      ssl: false,
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input {...register("nombre")} placeholder="RouterOS Principal" />
          {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Dirección IP</Label>
          <Input {...register("ip")} placeholder="192.168.88.1" />
          {errors.ip && <p className="text-sm text-destructive">{errors.ip.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Usuario API</Label>
          <Input {...register("usuario")} placeholder="admin" />
          {errors.usuario && <p className="text-sm text-destructive">{errors.usuario.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Contraseña API</Label>
          <Input
            type="password"
            {...register("password")}
            placeholder={isEdit ? "Dejar vacío para no cambiar" : ""}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rangos CIDR Disponibles</Label>
        <Input
          {...register("cidr_disponibles")}
          placeholder="192.168.1.0/24, 10.0.0.0/24, 172.16.0.0/16"
        />
        {errors.cidr_disponibles && (
          <p className="text-sm text-destructive">{errors.cidr_disponibles.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Ingresa los rangos CIDR separados por comas (ej: 192.168.1.0/24, 10.0.0.0/24)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Puerto API</Label>
          <Input type="number" {...register("puerto")} placeholder="8728" />
          {errors.puerto && <p className="text-sm text-destructive">{errors.puerto.message}</p>}
          <p className="text-xs text-muted-foreground">
            API: 8728 | API-SSL: 8729
          </p>
        </div>
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between">
            <Label htmlFor="ssl">Usar SSL/TLS</Label>
            <Switch
              id="ssl"
              checked={watch("ssl")}
              onCheckedChange={(checked) => setValue("ssl", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Router Activo</Label>
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? "Guardando..." : isEdit ? "Actualizar Router" : "Crear Router"}
      </Button>
    </form>
  );
}
