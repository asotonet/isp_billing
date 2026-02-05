import { z } from "zod";

const phoneRegex = /^[2-8]\d{7}$/;

export const instalacionSolicitudSchema = z.object({
  plan_id: z.string().min(1, "Plan es requerido"),
  fecha_programada: z.string().min(1, "Fecha programada es requerida"),
  tecnico_asignado: z.string().optional(),
  notas: z.string().optional(),

  temp_tipo_identificacion: z.enum([
    "cedula_fisica",
    "cedula_juridica",
    "dimex",
    "nite",
  ]),
  temp_numero_identificacion: z
    .string()
    .min(1, "Número de identificación es requerido"),
  temp_nombre: z.string().min(1, "Nombre es requerido"),
  temp_apellido1: z.string().optional(),
  temp_apellido2: z.string().optional(),
  temp_razon_social: z.string().optional(),
  temp_email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  temp_telefono: z
    .string()
    .regex(phoneRegex, "Teléfono debe ser 8 dígitos (2-8)")
    .optional()
    .or(z.literal("")),
  temp_provincia: z.string().optional(),
  temp_canton: z.string().optional(),
  temp_distrito: z.string().optional(),
  temp_direccion_exacta: z.string().optional(),
});

export const instalacionActivarSchema = z.object({
  crear_cliente: z.boolean().default(true),
  cliente_id: z.string().optional(),
  fecha_inicio_contrato: z
    .string()
    .min(1, "Fecha de inicio es requerida"),
  dia_facturacion: z.coerce.number().min(1).max(28).default(1),
  estado_contrato: z
    .enum(["activo", "suspendido", "cancelado", "pendiente"])
    .default("activo"),
});

export type InstalacionSolicitudFormData = z.infer<
  typeof instalacionSolicitudSchema
>;
export type InstalacionActivarFormData = z.infer<
  typeof instalacionActivarSchema
>;
