import { z } from "zod";

export const clienteSchema = z.object({
  tipo_identificacion: z.enum(["cedula_fisica", "cedula_juridica", "dimex", "nite"], {
    required_error: "Tipo de identificación es requerido",
  }),
  numero_identificacion: z.string().min(1, "Número de identificación es requerido"),
  nombre: z.string().min(1, "Nombre es requerido"),
  apellido1: z.string().optional(),
  apellido2: z.string().optional(),
  razon_social: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z
    .string()
    .regex(/^[2-8]\d{7}$/, "Teléfono debe ser 8 dígitos (ej: 88881234)")
    .optional()
    .or(z.literal("")),
  provincia: z.string().optional(),
  canton: z.string().optional(),
  distrito: z.string().optional(),
  direccion_exacta: z.string().optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
