export type TipoIdentificacion = "cedula_fisica" | "cedula_juridica" | "dimex" | "nite";

export interface Cliente {
  id: string;
  tipo_identificacion: TipoIdentificacion;
  numero_identificacion: string;
  nombre: string;
  apellido1: string | null;
  apellido2: string | null;
  razon_social: string | null;
  email: string | null;
  telefono: string | null;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  direccion_exacta: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteCreate {
  tipo_identificacion: TipoIdentificacion;
  numero_identificacion: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  direccion_exacta?: string;
}

export interface ClienteUpdate {
  nombre?: string;
  apellido1?: string;
  apellido2?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  provincia?: string;
  canton?: string;
  distrito?: string;
  direccion_exacta?: string;
  is_active?: boolean;
}
