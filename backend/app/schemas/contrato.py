import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.contrato import EstadoContrato, TipoConexion
from app.schemas.cliente import ClienteResponse
from app.schemas.plan import PlanResponse


class ContratoBase(BaseModel):
    cliente_id: uuid.UUID
    plan_id: uuid.UUID
    fecha_inicio: date
    fecha_fin: date | None = None
    estado: EstadoContrato = EstadoContrato.ACTIVO
    dia_facturacion: int = Field(1, ge=1, le=28)
    notas: str | None = None
    tipo_conexion: TipoConexion = TipoConexion.IPOE
    ip_asignada: str | None = None
    router_id: uuid.UUID | None = None
    # PPPoE fields (only used when tipo_conexion=PPPOE)
    pppoe_usuario: str | None = None
    pppoe_password: str | None = None
    pppoe_remote_address: str | None = None  # Fixed IP or null for auto-assignment from pool


class ContratoCreate(ContratoBase):
    pass


class ContratoUpdate(BaseModel):
    plan_id: uuid.UUID | None = None
    fecha_fin: date | None = None
    estado: EstadoContrato | None = None
    dia_facturacion: int | None = Field(None, ge=1, le=28)
    notas: str | None = None
    tipo_conexion: TipoConexion | None = None
    ip_asignada: str | None = None
    router_id: uuid.UUID | None = None
    pppoe_usuario: str | None = None
    pppoe_password: str | None = None
    pppoe_remote_address: str | None = None


class ContratoResponse(ContratoBase):
    id: uuid.UUID
    numero_contrato: str
    pdf_firmado_path: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContratoDetailResponse(ContratoResponse):
    cliente: ClienteResponse
    plan: PlanResponse
