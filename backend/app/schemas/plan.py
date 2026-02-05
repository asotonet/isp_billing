import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PlanBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    velocidad_bajada_mbps: float = Field(gt=0)
    velocidad_subida_mbps: float = Field(gt=0)
    precio_mensual: float = Field(gt=0)
    moneda: str = "CRC"


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    velocidad_bajada_mbps: float | None = Field(None, gt=0)
    velocidad_subida_mbps: float | None = Field(None, gt=0)
    precio_mensual: float | None = Field(None, gt=0)
    moneda: str | None = None
    is_active: bool | None = None


class PlanResponse(PlanBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
