import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.instalacion import EstadoInstalacion
from app.models.cliente import TipoIdentificacion
from app.models.contrato import EstadoContrato

if TYPE_CHECKING:
    from app.schemas.plan import PlanResponse
    from app.schemas.contrato import ContratoDetailResponse


class InstalacionBase(BaseModel):
    plan_id: uuid.UUID
    fecha_programada: date
    tecnico_asignado: str | None = None
    notas: str | None = None


class InstalacionSolicitudCreate(InstalacionBase):
    temp_tipo_identificacion: TipoIdentificacion
    temp_numero_identificacion: str = Field(..., min_length=1, max_length=20)
    temp_nombre: str = Field(..., min_length=1, max_length=100)
    temp_apellido1: str | None = Field(None, max_length=100)
    temp_apellido2: str | None = Field(None, max_length=100)
    temp_razon_social: str | None = Field(None, max_length=255)
    temp_email: EmailStr | None = None
    temp_telefono: str | None = Field(None, max_length=20)
    temp_provincia: str | None = Field(None, max_length=50)
    temp_canton: str | None = Field(None, max_length=50)
    temp_distrito: str | None = Field(None, max_length=50)
    temp_direccion_exacta: str | None = None

    @field_validator("temp_telefono")
    @classmethod
    def validate_telefono(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not v.isdigit() or len(v) != 8:
            raise ValueError("Teléfono debe ser 8 dígitos")
        if v[0] not in "2345678":
            raise ValueError("Teléfono debe iniciar con dígito del 2 al 8")
        return v


class InstalacionUpdate(BaseModel):
    fecha_programada: date | None = None
    fecha_completada: date | None = None
    tecnico_asignado: str | None = None
    estado: EstadoInstalacion | None = None
    notas: str | None = None


class InstalacionResponse(BaseModel):
    id: uuid.UUID
    numero_instalacion: str
    contrato_id: uuid.UUID | None
    plan_id: uuid.UUID
    fecha_programada: date
    fecha_completada: date | None
    tecnico_asignado: str | None
    estado: EstadoInstalacion
    notas: str | None

    temp_tipo_identificacion: str | None
    temp_numero_identificacion: str | None
    temp_nombre: str | None
    temp_apellido1: str | None
    temp_apellido2: str | None
    temp_razon_social: str | None
    temp_email: str | None
    temp_telefono: str | None
    temp_provincia: str | None
    temp_canton: str | None
    temp_distrito: str | None
    temp_direccion_exacta: str | None

    pdf_solicitud_path: str | None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InstalacionDetailResponse(InstalacionResponse):
    plan: "PlanResponse"
    contrato: "ContratoDetailResponse | None" = None


class InstalacionActivarRequest(BaseModel):
    crear_cliente: bool = True
    cliente_id: uuid.UUID | None = None
    fecha_inicio_contrato: date
    dia_facturacion: int = Field(default=1, ge=1, le=28)
    estado_contrato: EstadoContrato = EstadoContrato.ACTIVO


# Resolve forward references
def _resolve_forward_refs():
    """Resolve forward references after all schemas are defined"""
    try:
        from app.schemas.plan import PlanResponse
        from app.schemas.contrato import ContratoDetailResponse

        InstalacionDetailResponse.model_rebuild()
    except ImportError:
        # Schemas not yet available, will be resolved later
        pass


_resolve_forward_refs()
