import { z } from "zod";

// IPv4 regex pattern
const ipv4Pattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

// CIDR validation: accepts single CIDR or comma-separated list
const cidrPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})(,\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})*$/;

export const routerSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido").max(100),
  ip: z
    .string()
    .min(1, "IP es requerida")
    .regex(ipv4Pattern, "Debe ser una dirección IPv4 válida"),
  usuario: z.string().min(1, "Usuario es requerido").max(50),
  password: z.string().min(1, "Contraseña es requerida"),
  puerto: z.coerce.number().int().min(1).max(65535).default(8728),
  ssl: z.boolean().default(false),
  is_active: z.boolean().default(true),
  cidr_disponibles: z
    .string()
    .min(1, "CIDR es requerido")
    .regex(cidrPattern, "Formato CIDR inválido (ej: 192.168.1.0/24 o 192.168.1.0/24,10.0.0.0/24)"),
});

export const routerUpdateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  ip: z.string().regex(ipv4Pattern, "Debe ser una dirección IPv4 válida").optional(),
  usuario: z.string().min(1).max(50).optional(),
  password: z.string().min(1).optional().or(z.literal("")),
  puerto: z.coerce.number().int().min(1).max(65535).optional(),
  ssl: z.boolean().optional(),
  is_active: z.boolean().optional(),
  cidr_disponibles: z.string().optional().or(z.literal("")),
});

export type RouterFormData = z.infer<typeof routerSchema>;
export type RouterUpdateFormData = z.infer<typeof routerUpdateSchema>;
