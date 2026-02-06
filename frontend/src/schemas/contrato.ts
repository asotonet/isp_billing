import { z } from "zod";

// IPv4 regex pattern
const ipv4Pattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export const contratoSchema = z.object({
  cliente_id: z.string().min(1, "Cliente es requerido"),
  plan_id: z.string().min(1, "Plan es requerido"),
  fecha_inicio: z.string().min(1, "Fecha de inicio es requerida"),
  fecha_fin: z.string().optional(),
  estado: z.enum(["activo", "suspendido", "cancelado", "pendiente"]).default("activo"),
  dia_facturacion: z.coerce.number().min(1).max(28).default(1),
  notas: z.string().optional(),
  ip_asignada: z
    .string()
    .regex(ipv4Pattern, "Debe ser una dirección IPv4 válida")
    .optional()
    .or(z.literal("")),
  router_id: z.string().optional().or(z.literal("")),
});

export type ContratoFormData = z.infer<typeof contratoSchema>;
