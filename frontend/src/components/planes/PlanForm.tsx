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
import { planSchema, type PlanFormData } from "@/schemas/plan";

interface PlanFormProps {
  defaultValues?: Partial<PlanFormData>;
  onSubmit: (data: PlanFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function PlanForm({ defaultValues, onSubmit, isLoading, isEdit }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      moneda: "CRC",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input {...register("nombre")} />
          {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input {...register("descripcion")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Velocidad Bajada (Mbps)</Label>
          <Input type="number" step="0.01" {...register("velocidad_bajada_mbps")} />
          {errors.velocidad_bajada_mbps && (
            <p className="text-sm text-destructive">{errors.velocidad_bajada_mbps.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Velocidad Subida (Mbps)</Label>
          <Input type="number" step="0.01" {...register("velocidad_subida_mbps")} />
          {errors.velocidad_subida_mbps && (
            <p className="text-sm text-destructive">{errors.velocidad_subida_mbps.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Precio Mensual</Label>
          <Input type="number" step="0.01" {...register("precio_mensual")} />
          {errors.precio_mensual && (
            <p className="text-sm text-destructive">{errors.precio_mensual.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Moneda</Label>
          <Select value={watch("moneda")} onValueChange={(v) => setValue("moneda", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRC">CRC (Colones)</SelectItem>
              <SelectItem value="USD">USD (Dólares)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Plan"}
      </Button>
    </form>
  );
}
