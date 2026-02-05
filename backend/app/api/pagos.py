import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_role
from app.models.pago import EstadoPago
from app.models.usuario import RolUsuario, Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.pago import PagoCreate, PagoResponse, PagoUpdate, PagoValidarRequest
from app.services import pagos as pagos_service

router = APIRouter(prefix="/pagos", tags=["Pagos"])


@router.get("/", response_model=PaginatedResponse[PagoResponse])
async def list_pagos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    cliente_id: uuid.UUID | None = None,
    contrato_id: uuid.UUID | None = None,
    estado: EstadoPago | None = None,
    periodo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await pagos_service.list_pagos(
        db, page, page_size, cliente_id, contrato_id, estado, periodo
    )


@router.get("/{pago_id}", response_model=PagoResponse)
async def get_pago(
    pago_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await pagos_service.get_pago(db, pago_id)


@router.post("/", response_model=PagoResponse, status_code=201)
async def create_pago(
    data: PagoCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR, RolUsuario.SOPORTE)),
):
    """Create payment (Admin, Operador, and Soporte)"""
    return await pagos_service.create_pago(db, data)


@router.put("/{pago_id}", response_model=PagoResponse)
async def update_pago(
    pago_id: uuid.UUID,
    data: PagoUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR)),
):
    """Update payment (Admin and Operador only)"""
    return await pagos_service.update_pago(db, pago_id, data)


@router.put("/{pago_id}/validar", response_model=PagoResponse)
async def validar_pago(
    pago_id: uuid.UUID,
    data: PagoValidarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR)),
):
    """Validate payment (Admin and Operador only)"""
    return await pagos_service.validar_pago(
        db, pago_id, data.accion, current_user.id, data.notas
    )
