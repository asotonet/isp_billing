import { z } from "zod";

export const usuarioSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre_completo: z.string().min(1, "Nombre completo es requerido"),
  rol: z.enum(["ADMIN", "OPERADOR", "TECNICO", "AUDITOR", "SOPORTE"]),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const usuarioUpdateSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  nombre_completo: z.string().min(1, "Nombre completo es requerido").optional(),
  rol: z.enum(["ADMIN", "OPERADOR", "TECNICO", "AUDITOR", "SOPORTE"]).optional(),
  is_active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Contraseña actual es requerida"),
  new_password: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirm_password: z.string().min(1, "Confirmar contraseña es requerida"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;
export type UsuarioUpdateFormData = z.infer<typeof usuarioUpdateSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
