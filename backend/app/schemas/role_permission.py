from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.usuario import RolUsuario


class RolePermissionBase(BaseModel):
    rol: RolUsuario
    module: str = Field(..., max_length=50)
    can_read: bool = False
    can_write: bool = False
    description: str | None = Field(None, max_length=255)


class RolePermissionCreate(RolePermissionBase):
    pass


class RolePermissionUpdate(BaseModel):
    can_read: bool | None = None
    can_write: bool | None = None
    description: str | None = None


class RolePermissionResponse(RolePermissionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RolePermissionBulkUpdate(BaseModel):
    """Para actualizar múltiples permisos a la vez"""

    permissions: list[RolePermissionCreate]


class ModulePermissions(BaseModel):
    """Permisos de todos los roles para un módulo específico"""

    module: str
    description: str | None = None
    roles: dict[RolUsuario, dict[str, bool]]  # {rol: {can_read: bool, can_write: bool}}


class RolePermissionsMatrix(BaseModel):
    """Matriz completa de permisos: todos los módulos y todos los roles"""

    modules: list[str]
    roles: list[RolUsuario]
    permissions: dict[str, dict[RolUsuario, dict[str, bool]]]
    # {module: {rol: {can_read: bool, can_write: bool}}}
