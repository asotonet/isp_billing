import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.plan import Plan
from app.schemas.common import PaginatedResponse
from app.schemas.plan import PlanCreate, PlanUpdate
from app.utils.pagination import paginate


async def list_planes(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    is_active: bool | None = None,
) -> PaginatedResponse:
    query = select(Plan).order_by(Plan.precio_mensual)

    if is_active is not None:
        query = query.where(Plan.is_active == is_active)

    return await paginate(db, query, page, page_size)


async def get_plan(db: AsyncSession, plan_id: uuid.UUID) -> Plan:
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Plan no encontrado")
    return plan


async def create_plan(db: AsyncSession, data: PlanCreate) -> Plan:
    result = await db.execute(select(Plan).where(Plan.nombre == data.nombre))
    if result.scalar_one_or_none():
        raise ConflictError("Ya existe un plan con ese nombre")

    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return plan


async def update_plan(db: AsyncSession, plan_id: uuid.UUID, data: PlanUpdate) -> Plan:
    plan = await get_plan(db, plan_id)

    update_data = data.model_dump(exclude_unset=True)
    if "nombre" in update_data:
        result = await db.execute(
            select(Plan).where(Plan.nombre == update_data["nombre"], Plan.id != plan_id)
        )
        if result.scalar_one_or_none():
            raise ConflictError("Ya existe un plan con ese nombre")

    for key, value in update_data.items():
        setattr(plan, key, value)
    await db.flush()
    await db.refresh(plan)
    return plan


async def deactivate_plan(db: AsyncSession, plan_id: uuid.UUID) -> Plan:
    plan = await get_plan(db, plan_id)
    plan.is_active = False
    await db.flush()
    await db.refresh(plan)
    return plan
