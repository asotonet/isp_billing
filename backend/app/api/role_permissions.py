import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.usuario import Usuario
from app.schemas.role_permission import (
    RolePermissionBulkUpdate,
    RolePermissionCreate,
    RolePermissionResponse,
    RolePermissionsMatrix,
    RolePermissionUpdate,
)
from app.services import role_permissions as permissions_service

router = APIRouter(prefix="/role-permissions", tags=["Role Permissions"])


@router.get("/matrix", response_model=RolePermissionsMatrix)
async def get_permissions_matrix(
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """
    Obtiene la matriz completa de permisos (todos los roles y módulos).
    Solo accesible por administradores.
    """
    return await permissions_service.get_permissions_matrix(db)


@router.get("/", response_model=list[RolePermissionResponse])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Lista todos los permisos (Admin only)"""
    return await permissions_service.list_permissions(db)


@router.get("/{permission_id}", response_model=RolePermissionResponse)
async def get_permission(
    permission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Obtiene un permiso específico (Admin only)"""
    return await permissions_service.get_permission(db, permission_id)


@router.post("/", response_model=RolePermissionResponse, status_code=201)
async def create_permission(
    data: RolePermissionCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Crea un nuevo permiso (Admin only)"""
    return await permissions_service.create_permission(db, data)


@router.put("/{permission_id}", response_model=RolePermissionResponse)
async def update_permission(
    permission_id: uuid.UUID,
    data: RolePermissionUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Actualiza un permiso existente (Admin only)"""
    return await permissions_service.update_permission(db, permission_id, data)


@router.post("/bulk-update", response_model=list[RolePermissionResponse])
async def bulk_update_permissions(
    data: RolePermissionBulkUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """
    Actualiza múltiples permisos a la vez.
    Útil para guardar toda la matriz de permisos de una sola vez.
    (Admin only)
    """
    return await permissions_service.bulk_update_permissions(db, data.permissions)


@router.delete("/{permission_id}", status_code=204)
async def delete_permission(
    permission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Elimina un permiso (Admin only)"""
    await permissions_service.delete_permission(db, permission_id)
    return None


@router.post("/initialize", status_code=200)
async def initialize_default_permissions(
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """
    Inicializa los permisos por defecto si la tabla está vacía.
    Solo ejecutar una vez o si se necesita resetear permisos.
    (Admin only)
    """
    await permissions_service.initialize_default_permissions(db)
    await db.commit()
    return {"message": "Permisos inicializados correctamente"}
