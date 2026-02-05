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


class RouterResponse(RouterBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RouterTestConnectionResponse(BaseModel):
    success: bool
    message: str
    router_version: str | None = None
