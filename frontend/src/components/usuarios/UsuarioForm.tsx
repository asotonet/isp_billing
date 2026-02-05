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
import { usuarioSchema, type UsuarioFormData } from "@/schemas/usuario";

interface UsuarioFormProps {
  defaultValues?: Partial<UsuarioFormData>;
  onSubmit: (data: UsuarioFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const rolLabels = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  TECNICO: "Técnico",
  AUDITOR: "Auditor",
  SOPORTE: "Soporte",
};

const rolDescriptions = {
  ADMIN: "Acceso total al sistema",
  OPERADOR: "Gestión de clientes, contratos y pagos",
  TECNICO: "Gestión de instalaciones y soporte técnico",
  AUDITOR: "Solo lectura de reportes y auditoría",
  SOPORTE: "Atención al cliente y consultas básicas",
};

export default function UsuarioForm({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit,
}: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      rol: "OPERADOR",
      ...defaultValues,
    },
  });

  const rol = watch("rol");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre Completo</Label>
          <Input {...register("nombre_completo")} />
          {errors.nombre_completo && (
            <p className="text-sm text-destructive">
              {errors.nombre_completo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register("email")} disabled={isEdit} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rol</Label>
        <Select value={rol} onValueChange={(val) => setValue("rol", val as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(rolLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    {rolDescriptions[value as keyof typeof rolDescriptions]}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.rol && (
          <p className="text-sm text-destructive">{errors.rol.message}</p>
        )}
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label>Contraseña</Label>
          <Input type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Guardando..." : isEdit ? "Actualizar Usuario" : "Crear Usuario"}
      </Button>
    </form>
  );
}
