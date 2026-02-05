import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.usuario import RolUsuario


class UsuarioBase(BaseModel):
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario = RolUsuario.OPERADOR


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, description="Contraseña (mínimo 6 caracteres)")


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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, description="Nueva contraseña (mínimo 6 caracteres)")
