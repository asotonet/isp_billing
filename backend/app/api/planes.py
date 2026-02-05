import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from app.services import planes as planes_service

router = APIRouter(prefix="/planes", tags=["Planes"])


@router.get("/", response_model=PaginatedResponse[PlanResponse])
async def list_planes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await planes_service.list_planes(db, page, page_size, is_active)


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await planes_service.get_plan(db, plan_id)


@router.post("/", response_model=PlanResponse, status_code=201)
async def create_plan(
    data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await planes_service.create_plan(db, data)


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    data: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await planes_service.update_plan(db, plan_id, data)


@router.delete("/{plan_id}", response_model=PlanResponse)
async def deactivate_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await planes_service.deactivate_plan(db, plan_id)
