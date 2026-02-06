import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin, require_role
from app.models.usuario import RolUsuario, Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.usuario import (
    ChangePasswordRequest,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.services import usuarios as usuarios_service

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=PaginatedResponse[UsuarioResponse])
async def list_usuarios(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    rol: RolUsuario | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.AUDITOR)),
):
    """List users (Admin and Auditor only)"""
    return await usuarios_service.list_usuarios(db, page, page_size, search, rol, is_active)


@router.get("/me", response_model=UsuarioResponse)
async def get_current_user_info(
    current_user: Usuario = Depends(get_current_active_user),
):
    """Get current authenticated user information"""
    return current_user


@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def get_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.AUDITOR)),
):
    """Get user by ID (Admin and Auditor only)"""
    return await usuarios_service.get_usuario(db, usuario_id)


@router.post("/", response_model=UsuarioResponse, status_code=201)
async def create_usuario(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Create new user (Admin only)"""
    return await usuarios_service.create_usuario(db, data)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def update_usuario(
    usuario_id: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Update user (Admin only)"""
    return await usuarios_service.update_usuario(db, usuario_id, data)


@router.post("/me/change-password", response_model=UsuarioResponse)
async def change_own_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """Change current user's password"""
    return await usuarios_service.change_password(db, current_user.id, data)


@router.post("/{usuario_id}/reset-password", response_model=UsuarioResponse)
async def admin_reset_password(
    usuario_id: uuid.UUID,
    new_password: str = Query(..., min_length=6),
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Admin resets user password (Admin only)"""
    return await usuarios_service.admin_reset_password(db, usuario_id, new_password)


@router.post("/{usuario_id}/deactivate", response_model=UsuarioResponse)
async def deactivate_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Deactivate user (Admin only)"""
    return await usuarios_service.deactivate_usuario(db, usuario_id)


@router.post("/{usuario_id}/activate", response_model=UsuarioResponse)
async def activate_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_admin),
):
    """Activate user (Admin only)"""
    return await usuarios_service.activate_usuario(db, usuario_id)
