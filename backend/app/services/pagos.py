import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.cliente import Cliente
from app.models.contrato import Contrato
from app.models.pago import EstadoPago, Pago
from app.schemas.common import PaginatedResponse
from app.schemas.pago import PagoCreate, PagoUpdate
from app.utils.pagination import paginate


async def list_pagos(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    cliente_id: uuid.UUID | None = None,
    contrato_id: uuid.UUID | None = None,
    estado: EstadoPago | None = None,
    periodo: str | None = None,
) -> PaginatedResponse:
    query = select(Pago).order_by(Pago.created_at.desc())

    if cliente_id:
        query = query.where(Pago.cliente_id == cliente_id)
    if contrato_id:
        query = query.where(Pago.contrato_id == contrato_id)
    if estado:
        query = query.where(Pago.estado == estado)
    if periodo:
        query = query.where(Pago.periodo_facturado == periodo)

    return await paginate(db, query, page, page_size)


async def get_pago(db: AsyncSession, pago_id: uuid.UUID) -> Pago:
    result = await db.execute(select(Pago).where(Pago.id == pago_id))
    pago = result.scalar_one_or_none()
    if not pago:
        raise NotFoundError("Pago no encontrado")
    return pago


async def create_pago(db: AsyncSession, data: PagoCreate) -> Pago:
    # Validate client
    result = await db.execute(select(Cliente).where(Cliente.id == data.cliente_id))
    if not result.scalar_one_or_none():
        raise BadRequestError("Cliente no encontrado")

    # Validate contract
    result = await db.execute(select(Contrato).where(Contrato.id == data.contrato_id))
    contrato = result.scalar_one_or_none()
    if not contrato:
        raise BadRequestError("Contrato no encontrado")
    if str(contrato.cliente_id) != str(data.cliente_id):
        raise BadRequestError("El contrato no pertenece al cliente indicado")

    pago = Pago(**data.model_dump())
    db.add(pago)
    await db.flush()
    await db.refresh(pago)
    return pago


async def update_pago(db: AsyncSession, pago_id: uuid.UUID, data: PagoUpdate) -> Pago:
    pago = await get_pago(db, pago_id)
    if pago.estado != EstadoPago.PENDIENTE:
        raise BadRequestError("Solo se pueden editar pagos pendientes")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pago, key, value)
    await db.flush()
    await db.refresh(pago)
    return pago


async def validar_pago(
    db: AsyncSession,
    pago_id: uuid.UUID,
    accion: str,
    validador_id: uuid.UUID,
    notas: str | None = None,
) -> Pago:
    pago = await get_pago(db, pago_id)
    if pago.estado != EstadoPago.PENDIENTE:
        raise BadRequestError("Solo se pueden validar pagos pendientes")

    if accion == "validar":
        pago.estado = EstadoPago.VALIDADO
    else:
        pago.estado = EstadoPago.RECHAZADO

    pago.validado_por = validador_id
    pago.fecha_validacion = datetime.now(timezone.utc)
    if notas:
        pago.notas = notas

    await db.flush()
    await db.refresh(pago)
    return pago
