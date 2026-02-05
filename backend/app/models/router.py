from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


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
