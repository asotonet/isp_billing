import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.router_event import RouterEventResponse
from app.services.router_events import list_router_events, get_recent_events

router = APIRouter(prefix="/router-events", tags=["router-events"])


@router.get("/", response_model=PaginatedResponse[RouterEventResponse])
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    router_id: uuid.UUID | None = None,
    event_type: str | None = None,
    hours: int | None = Query(None, ge=1, le=720),  # Max 30 days
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """List router events with pagination and filters"""
    result = await list_router_events(
        db, page=page, page_size=page_size,
        router_id=router_id, event_type=event_type, hours=hours
    )

    # Enrich response with router info
    items_with_router = []
    for event in result.items:
        event_dict = {
            "id": event.id,
            "router_id": event.router_id,
            "event_type": event.event_type,
            "description": event.description,
            "event_metadata": event.event_metadata,
            "created_at": event.created_at,
            "router_nombre": event.router.nombre if event.router else None,
            "router_ip": event.router.ip if event.router else None,
        }
        items_with_router.append(RouterEventResponse(**event_dict))

    return PaginatedResponse(
        items=items_with_router,
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@router.get("/recent", response_model=list[RouterEventResponse])
async def get_recent_router_events(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Get most recent router events for dashboard"""
    events = await get_recent_events(db, limit=limit)

    return [
        RouterEventResponse(
            id=event.id,
            router_id=event.router_id,
            event_type=event.event_type,
            description=event.description,
            event_metadata=event.event_metadata,
            created_at=event.created_at,
            router_nombre=event.router.nombre if event.router else None,
            router_ip=event.router.ip if event.router else None,
        )
        for event in events
    ]
