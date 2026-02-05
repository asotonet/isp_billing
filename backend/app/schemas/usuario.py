import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.usuario import RolUsuario


class UsuarioBase(BaseModel):
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario = RolUsuario.OPERADOR


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    email: EmailStr | None = None
    nombre_completo: str | None = None
    rol: RolUsuario | None = None
    is_active: bool | None = None


class UsuarioResponse(UsuarioBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
