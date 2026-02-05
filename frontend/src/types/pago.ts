export type MetodoPago = "efectivo" | "transferencia" | "sinpe_movil" | "tarjeta" | "deposito";
export type EstadoPago = "pendiente" | "validado" | "rechazado";

export interface Pago {
  id: string;
  cliente_id: string;
  contrato_id: string;
  monto: number;
  moneda: string;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  referencia: string | null;
  periodo_facturado: string;
  estado: EstadoPago;
  validado_por: string | null;
  fecha_validacion: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PagoCreate {
  cliente_id: string;
  contrato_id: string;
  monto: number;
  moneda?: string;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  referencia?: string;
  periodo_facturado: string;
  notas?: string;
}

export interface PagoUpdate {
  monto?: number;
  fecha_pago?: string;
  metodo_pago?: MetodoPago;
  referencia?: string;
  notas?: string;
}

export interface PagoValidarRequest {
  accion: "validar" | "rechazar";
  notas?: string;
}
