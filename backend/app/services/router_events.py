import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.router_event import RouterEvent
from app.models.router import Router
from app.schemas.common import PaginatedResponse
from app.utils.pagination import paginate


async def create_router_event(
    db: AsyncSession,
    router_id: uuid.UUID,
    event_type: str,
    description: str,
    event_metadata: dict | None = None
) -> RouterEvent:
    """Create a new router event"""
    event = RouterEvent(
        router_id=router_id,
        event_type=event_type,
        description=description,
        event_metadata=event_metadata
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


async def list_router_events(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 50,
    router_id: uuid.UUID | None = None,
    event_type: str | None = None,
    hours: int | None = None,
) -> PaginatedResponse:
    """
    List router events with pagination and filters

    Args:
        db: Database session
        page: Page number
        page_size: Items per page
        router_id: Filter by specific router
        event_type: Filter by event type
        hours: Only show events from last N hours
    """
    query = (
        select(RouterEvent)
        .options(joinedload(RouterEvent.router))
        .order_by(desc(RouterEvent.created_at))
    )

    if router_id:
        query = query.where(RouterEvent.router_id == router_id)

    if event_type:
        query = query.where(RouterEvent.event_type == event_type)

    if hours:
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        query = query.where(RouterEvent.created_at >= cutoff_time)

    return await paginate(db, query, page, page_size)


async def get_recent_events(db: AsyncSession, limit: int = 20) -> list[RouterEvent]:
    """Get most recent router events for dashboard"""
    result = await db.execute(
        select(RouterEvent)
        .options(joinedload(RouterEvent.router))
        .order_by(desc(RouterEvent.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def delete_old_events(db: AsyncSession, days: int = 30) -> int:
    """Delete events older than specified days (for cleanup)"""
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(RouterEvent).where(RouterEvent.created_at < cutoff_time)
    )
    events = result.scalars().all()
    count = len(events)

    for event in events:
        await db.delete(event)

    await db.flush()
    return count
