import os
import uuid
from datetime import date

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.cliente import Cliente
from app.models.contrato import Contrato, EstadoContrato
from app.models.plan import Plan
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoCreate, ContratoUpdate
from app.utils.pagination import paginate


async def _generate_numero_contrato(db: AsyncSession) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"CTR-{today}-"
    result = await db.execute(
        select(func.count())
        .select_from(Contrato)
        .where(Contrato.numero_contrato.like(f"{prefix}%"))
    )
    count = (result.scalar() or 0) + 1
    return f"{prefix}{count:04d}"


async def list_contratos(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    cliente_id: uuid.UUID | None = None,
    estado: EstadoContrato | None = None,
) -> PaginatedResponse:
    query = (
        select(Contrato)
        .options(selectinload(Contrato.cliente), selectinload(Contrato.plan))
        .order_by(Contrato.created_at.desc())
    )

    if cliente_id:
        query = query.where(Contrato.cliente_id == cliente_id)
    if estado:
        query = query.where(Contrato.estado == estado)

    return await paginate(db, query, page, page_size)


async def get_contrato(db: AsyncSession, contrato_id: uuid.UUID) -> Contrato:
    result = await db.execute(
        select(Contrato)
        .options(selectinload(Contrato.cliente), selectinload(Contrato.plan))
        .where(Contrato.id == contrato_id)
    )
    contrato = result.scalar_one_or_none()
    if not contrato:
        raise NotFoundError("Contrato no encontrado")
    return contrato


async def create_contrato(db: AsyncSession, data: ContratoCreate) -> Contrato:
    # Validate client exists
    result = await db.execute(select(Cliente).where(Cliente.id == data.cliente_id))
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise BadRequestError("Cliente no encontrado")
    if not cliente.is_active:
        raise BadRequestError("Cliente inactivo")

    # Validate plan exists
    result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise BadRequestError("Plan no encontrado")
    if not plan.is_active:
        raise BadRequestError("Plan inactivo")

    numero_contrato = await _generate_numero_contrato(db)

    contrato = Contrato(
        **data.model_dump(),
        numero_contrato=numero_contrato,
    )
    db.add(contrato)
    await db.flush()

    # Reload with relationships
    return await get_contrato(db, contrato.id)


async def update_contrato(
    db: AsyncSession, contrato_id: uuid.UUID, data: ContratoUpdate
) -> Contrato:
    contrato = await get_contrato(db, contrato_id)
    update_data = data.model_dump(exclude_unset=True)

    if "plan_id" in update_data:
        result = await db.execute(select(Plan).where(Plan.id == update_data["plan_id"]))
        plan = result.scalar_one_or_none()
        if not plan:
            raise BadRequestError("Plan no encontrado")

    for key, value in update_data.items():
        setattr(contrato, key, value)
    await db.flush()

    return await get_contrato(db, contrato_id)


async def upload_pdf_firmado(
    db: AsyncSession, contrato_id: uuid.UUID, file: UploadFile
) -> Contrato:
    """Upload signed PDF for contract"""
    contrato = await get_contrato(db, contrato_id)

    # Validate PDF file
    if not file.filename.endswith(".pdf"):
        raise BadRequestError("El archivo debe ser PDF")

    # Create directory if not exists
    upload_dir = "/app/uploads/contratos/firmados"
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_path = f"{upload_dir}/{contrato.numero_contrato}_firmado.pdf"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Update contrato
    contrato.pdf_firmado_path = file_path
    await db.flush()

    return contrato
