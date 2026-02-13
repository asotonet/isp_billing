export interface Settings {
  id: number;
  company_name: string;
  company_logo: string | null;
  razon_social: string | null;
  cedula_juridica: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsUpdate {
  company_name?: string;
  company_logo?: string | null;
  razon_social?: string | null;
  cedula_juridica?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}
