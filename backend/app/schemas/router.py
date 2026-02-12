import uuid
from datetime import datetime

from pydantic import BaseModel, Field, IPvAnyAddress


class RouterBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del router")
    ip: str = Field(..., description="Dirección IP del router")
    usuario: str = Field(..., min_length=1, max_length=50, description="Usuario API del router")
    puerto: int = Field(default=8728, ge=1, le=65535, description="Puerto de API")
    ssl: bool = Field(default=False, description="Usar SSL/TLS para la conexión")
    is_active: bool = Field(default=True, description="Router activo")
    cidr_disponibles: str = Field(..., min_length=1, description="Rangos CIDR disponibles separados por comas (ej: 192.168.1.0/24,10.0.0.0/24)")


class RouterCreate(RouterBase):
    password: str = Field(..., min_length=1, description="Contraseña del usuario API")


class RouterUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=100)
    ip: str | None = None
    usuario: str | None = Field(None, min_length=1, max_length=50)
    password: str | None = Field(None, min_length=1, description="Nueva contraseña (dejar vacío para no cambiar)")
    puerto: int | None = Field(None, ge=1, le=65535)
    ssl: bool | None = None
    is_active: bool | None = None
    cidr_disponibles: str | None = Field(None, min_length=1)


class RouterResponse(RouterBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_online: bool | None = None
    last_check_at: datetime | None = None
    last_online_at: datetime | None = None
    identity: str | None = None
    routeros_version: str | None = None

    model_config = {"from_attributes": True}


class RouterTestConnectionResponse(BaseModel):
    success: bool
    message: str
    router_version: str | None = None
