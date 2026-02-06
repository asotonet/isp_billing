import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.models.usuario import RolUsuario, Usuario
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from app.schemas.common import PaginatedResponse
from app.services import clientes as clientes_service

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/", response_model=PaginatedResponse[ClienteResponse])
async def list_clientes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await clientes_service.list_clientes(db, page, page_size, search, is_active)


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await clientes_service.get_cliente(db, cliente_id)


@router.post("/", response_model=ClienteResponse, status_code=201)
async def create_cliente(
    data: ClienteCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR)),
):
    """Create client (Admin and Operador only)"""
    return await clientes_service.create_cliente(db, data)


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(
    cliente_id: uuid.UUID,
    data: ClienteUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR)),
):
    """Update client (Admin and Operador only)"""
    return await clientes_service.update_cliente(db, cliente_id, data)


@router.delete("/{cliente_id}", response_model=ClienteResponse)
async def deactivate_cliente(
    cliente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR)),
):
    """Deactivate client (Admin and Operador only)"""
    return await clientes_service.deactivate_cliente(db, cliente_id)


@router.get("/check-identificacion/{numero_identificacion}")
async def check_numero_identificacion(
    numero_identificacion: str,
    exclude_cliente_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Check if numero_identificacion is available"""
    return await clientes_service.check_numero_identificacion_available(
        db, numero_identificacion, exclude_cliente_id
    )


@router.post("/{cliente_id}/activate", response_model=ClienteResponse)
async def activate_cliente(
    cliente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR)),
):
    """Reactivate client (Admin and Operador only)"""
    return await clientes_service.activate_cliente(db, cliente_id)
