import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin, require_permission
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.router import (
    RouterCreate,
    RouterResponse,
    RouterTestConnectionResponse,
    RouterUpdate,
)
from app.services import routers as routers_service
from app.services.mikrotik import MikroTikService

router = APIRouter(prefix="/routers", tags=["Routers"])


@router.get("/", response_model=PaginatedResponse[RouterResponse])
async def list_routers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers")),
):
    """List routers (requires read permission on routers module)"""
    return await routers_service.list_routers(db, page, page_size, search, is_active)


@router.get("/{router_id}", response_model=RouterResponse)
async def get_router(
    router_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers")),
):
    """Get router by ID (requires read permission on routers module)"""
    return await routers_service.get_router(db, router_id)


@router.post("/", response_model=RouterResponse, status_code=201)
async def create_router(
    data: RouterCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers", require_write=True)),
):
    """Create new router (requires write permission on routers module)"""
    return await routers_service.create_router(db, data)


@router.put("/{router_id}", response_model=RouterResponse)
async def update_router(
    router_id: uuid.UUID,
    data: RouterUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers", require_write=True)),
):
    """Update router (requires write permission on routers module)"""
    return await routers_service.update_router(db, router_id, data)


@router.delete("/{router_id}", status_code=204)
async def delete_router(
    router_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers", require_write=True)),
):
    """Delete router (requires write permission on routers module)"""
    await routers_service.delete_router(db, router_id)


@router.post("/{router_id}/test-connection", response_model=RouterTestConnectionResponse)
async def test_router_connection(
    router_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers")),
):
    """
    Test connection to MikroTik router

    Attempts to connect to the router and retrieve system identity
    to verify credentials and connectivity.
    """
    router_obj = await routers_service.get_router(db, router_id)
    password = routers_service.decrypt_router_password(router_obj)

    mikrotik_service = MikroTikService(
        host=router_obj.ip,
        username=router_obj.usuario,
        password=password,
        port=router_obj.puerto,
        ssl=router_obj.ssl,
    )

    return await mikrotik_service.test_connection()


@router.post("/{router_id}/deactivate", response_model=RouterResponse)
async def deactivate_router(
    router_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers", require_write=True)),
):
    """Deactivate router (requires write permission on routers module)"""
    return await routers_service.deactivate_router(db, router_id)


@router.post("/{router_id}/activate", response_model=RouterResponse)
async def activate_router(
    router_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers", require_write=True)),
):
    """Activate router (requires write permission on routers module)"""
    return await routers_service.activate_router(db, router_id)


@router.get("/{router_id}/next-available-ip")
async def get_next_available_ip(
    router_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers")),
):
    """Get next available IP address from router's CIDR ranges"""
    ip_address = await routers_service.get_next_available_ip(db, router_id)
    return {"ip_address": ip_address}


@router.get("/{router_id}/check-ip/{ip_address}")
async def check_ip_available(
    router_id: uuid.UUID,
    ip_address: str,
    exclude_contrato_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_permission("routers")),
):
    """Check if IP address is available for assignment (Admin and Operador only)"""
    return await routers_service.check_ip_available(db, router_id, ip_address, exclude_contrato_id)
