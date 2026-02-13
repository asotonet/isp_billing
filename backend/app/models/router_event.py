from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.models.base import BaseModel


class RouterEvent(BaseModel):
    """
    Router event history for monitoring and auditing
    """
    __tablename__ = "router_events"

    router_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("routers.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationship
    router: Mapped["Router"] = relationship("Router", back_populates="events")
