from datetime import datetime
from sqlalchemy import Boolean, Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.router_event import RouterEvent


class Router(BaseModel):
    """
    MikroTik Router model for API integration
    """
    __tablename__ = "routers"

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    ip: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    usuario: Mapped[str] = mapped_column(String(50), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)  # Encrypted with Fernet
    puerto: Mapped[int] = mapped_column(Integer, default=8728, nullable=False)
    ssl: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    cidr_disponibles: Mapped[str] = mapped_column(Text, nullable=False)  # Comma-separated CIDR ranges

    # Uptime monitoring
    is_online: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=None)
    last_check_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_online_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Router information from API
    identity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    routeros_version: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    events: Mapped[list["RouterEvent"]] = relationship("RouterEvent", back_populates="router", cascade="all, delete-orphan")
