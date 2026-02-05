from sqlalchemy import Boolean, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Plan(BaseModel):
    __tablename__ = "planes"

    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    velocidad_bajada_mbps: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    velocidad_subida_mbps: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_mensual: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="CRC", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    contratos: Mapped[list["Contrato"]] = relationship(back_populates="plan")  # noqa: F821
