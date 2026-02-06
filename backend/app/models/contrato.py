import enum
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class EstadoContrato(str, enum.Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    CANCELADO = "cancelado"
    PENDIENTE = "pendiente"


class Contrato(BaseModel):
    __tablename__ = "contratos"

    numero_contrato: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    cliente_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=False
    )
    plan_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("planes.id"), nullable=False
    )
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado: Mapped[EstadoContrato] = mapped_column(
        Enum(EstadoContrato), default=EstadoContrato.ACTIVO, nullable=False
    )
    dia_facturacion: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_firmado_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # MikroTik integration fields
    ip_asignada: Mapped[str | None] = mapped_column(String(50), nullable=True)
    router_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("routers.id", ondelete="SET NULL"), nullable=True
    )

    cliente: Mapped["Cliente"] = relationship(back_populates="contratos")  # noqa: F821
    plan: Mapped["Plan"] = relationship(back_populates="contratos")  # noqa: F821
    pagos: Mapped[list["Pago"]] = relationship(back_populates="contrato")  # noqa: F821
    router: Mapped["Router"] = relationship()  # noqa: F821
