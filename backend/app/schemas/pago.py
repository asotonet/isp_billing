import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.pago import EstadoPago, MetodoPago


class PagoBase(BaseModel):
    cliente_id: uuid.UUID
    contrato_id: uuid.UUID
    monto: float = Field(gt=0)
    moneda: str = "CRC"
    fecha_pago: date
    metodo_pago: MetodoPago
    referencia: str | None = None
    periodo_facturado: str  # YYYY-MM
    notas: str | None = None

    @field_validator("periodo_facturado")
    @classmethod
    def validate_periodo(cls, v: str) -> str:
        import re

        if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v):
            raise ValueError("Periodo debe tener formato YYYY-MM")
        return v

    @model_validator(mode="after")
    def validate_sinpe_referencia(self):
        if self.metodo_pago == MetodoPago.SINPE_MOVIL and not self.referencia:
            raise ValueError("Referencia es requerida para pagos SINPE Móvil")
        return self


class PagoCreate(PagoBase):
    pass


class PagoUpdate(BaseModel):
    monto: float | None = Field(None, gt=0)
    fecha_pago: date | None = None
    metodo_pago: MetodoPago | None = None
    referencia: str | None = None
    notas: str | None = None


class PagoResponse(PagoBase):
    id: uuid.UUID
    estado: EstadoPago
    validado_por: uuid.UUID | None = None
    fecha_validacion: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PagoValidarRequest(BaseModel):
    accion: str  # "validar" or "rechazar"
    notas: str | None = None

    @field_validator("accion")
    @classmethod
    def validate_accion(cls, v: str) -> str:
        if v not in ("validar", "rechazar"):
            raise ValueError("Acción debe ser 'validar' o 'rechazar'")
        return v
