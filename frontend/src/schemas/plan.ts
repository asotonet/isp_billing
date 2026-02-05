import { z } from "zod";

export const planSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional(),
  velocidad_bajada_mbps: z.coerce.number().positive("Debe ser mayor a 0"),
  velocidad_subida_mbps: z.coerce.number().positive("Debe ser mayor a 0"),
  precio_mensual: z.coerce.number().positive("Debe ser mayor a 0"),
  moneda: z.string().default("CRC"),
});

export type PlanFormData = z.infer<typeof planSchema>;
