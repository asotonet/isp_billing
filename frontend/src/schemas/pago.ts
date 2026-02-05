import { z } from "zod";

export const pagoSchema = z
  .object({
    cliente_id: z.string().min(1, "Cliente es requerido"),
    contrato_id: z.string().min(1, "Contrato es requerido"),
    monto: z.coerce.number().positive("Monto debe ser mayor a 0"),
    moneda: z.string().default("CRC"),
    fecha_pago: z.string().min(1, "Fecha de pago es requerida"),
    metodo_pago: z.enum(["efectivo", "transferencia", "sinpe_movil", "tarjeta", "deposito"], {
      required_error: "Método de pago es requerido",
    }),
    referencia: z.string().optional(),
    periodo_facturado: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato debe ser YYYY-MM"),
    notas: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.metodo_pago === "sinpe_movil" && !data.referencia) {
        return false;
      }
      return true;
    },
    {
      message: "Referencia es requerida para pagos SINPE Móvil",
      path: ["referencia"],
    }
  );

export type PagoFormData = z.infer<typeof pagoSchema>;
