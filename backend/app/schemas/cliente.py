import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.cliente import TipoIdentificacion


class ClienteBase(BaseModel):
    tipo_identificacion: TipoIdentificacion
    numero_identificacion: str
    nombre: str
    apellido1: str | None = None
    apellido2: str | None = None
    razon_social: str | None = None
    email: EmailStr | None = None
    telefono: str | None = None
    provincia: str | None = None
    canton: str | None = None
    distrito: str | None = None
    direccion_exacta: str | None = None

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, v: str | None) -> str | None:
        if v is not None:
            import re

            if not re.match(r"^[2-8]\d{7}$", v):
                raise ValueError("Teléfono debe ser 8 dígitos comenzando con 2-8")
        return v


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    apellido1: str | None = None
    apellido2: str | None = None
    razon_social: str | None = None
    email: EmailStr | None = None
    telefono: str | None = None
    provincia: str | None = None
    canton: str | None = None
    distrito: str | None = None
    direccion_exacta: str | None = None
    is_active: bool | None = None

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, v: str | None) -> str | None:
        if v is not None:
            import re

            if not re.match(r"^[2-8]\d{7}$", v):
                raise ValueError("Teléfono debe ser 8 dígitos comenzando con 2-8")
        return v


class ClienteResponse(ClienteBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
