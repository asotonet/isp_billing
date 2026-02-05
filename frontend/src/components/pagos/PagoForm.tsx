import { useEffect } from "react";
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
import { pagoSchema, type PagoFormData } from "@/schemas/pago";
import { useClientes } from "@/hooks/useClientes";
import { useContratos } from "@/hooks/useContratos";

interface PagoFormProps {
  onSubmit: (data: PagoFormData) => void;
  isLoading?: boolean;
}

const metodoLabels = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  sinpe_movil: "SINPE Móvil",
  tarjeta: "Tarjeta",
  deposito: "Depósito",
};

export default function PagoForm({ onSubmit, isLoading }: PagoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PagoFormData>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      moneda: "CRC",
      fecha_pago: new Date().toISOString().split("T")[0],
    },
  });

  const clienteId = watch("cliente_id");
  const metodoPago = watch("metodo_pago");

  const { data: clientesData } = useClientes({ page_size: 100, is_active: true });
  const { data: contratosData } = useContratos({
    page_size: 100,
    cliente_id: clienteId || undefined,
    estado: "activo",
  });

  // Auto-fill monto from contract plan
  const contratoId = watch("contrato_id");
  useEffect(() => {
    if (contratoId && contratosData?.items) {
      const contrato = contratosData.items.find((c) => c.id === contratoId);
      if (contrato?.plan) {
        setValue("monto", contrato.plan.precio_mensual);
      }
    }
  }, [contratoId, contratosData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={(v) => { setValue("cliente_id", v); setValue("contrato_id", ""); }}>
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
          <Label>Contrato</Label>
          <Select
            value={watch("contrato_id")}
            onValueChange={(v) => setValue("contrato_id", v)}
            disabled={!clienteId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar contrato" />
            </SelectTrigger>
            <SelectContent>
              {contratosData?.items.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.numero_contrato} - {c.plan?.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.contrato_id && (
            <p className="text-sm text-destructive">{errors.contrato_id.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Monto</Label>
          <Input type="number" step="0.01" {...register("monto")} />
          {errors.monto && <p className="text-sm text-destructive">{errors.monto.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Fecha de Pago</Label>
          <Input type="date" {...register("fecha_pago")} />
          {errors.fecha_pago && (
            <p className="text-sm text-destructive">{errors.fecha_pago.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Periodo Facturado</Label>
          <Input type="month" {...register("periodo_facturado")} />
          {errors.periodo_facturado && (
            <p className="text-sm text-destructive">{errors.periodo_facturado.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Método de Pago</Label>
          <Select
            value={metodoPago}
            onValueChange={(v: PagoFormData["metodo_pago"]) => setValue("metodo_pago", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar método" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(metodoLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.metodo_pago && (
            <p className="text-sm text-destructive">{errors.metodo_pago.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Referencia {metodoPago === "sinpe_movil" && <span className="text-destructive">*</span>}
          </Label>
          <Input {...register("referencia")} placeholder="Número de referencia" />
          {errors.referencia && (
            <p className="text-sm text-destructive">{errors.referencia.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Input {...register("notas")} />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Registrar Pago"}
      </Button>
    </form>
  );
}
