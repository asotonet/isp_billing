import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MetodoPago(str, enum.Enum):
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    SINPE_MOVIL = "sinpe_movil"
    TARJETA = "tarjeta"
    DEPOSITO = "deposito"


class EstadoPago(str, enum.Enum):
    PENDIENTE = "pendiente"
    VALIDADO = "validado"
    RECHAZADO = "rechazado"


class Pago(BaseModel):
    __tablename__ = "pagos"

    cliente_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=False
    )
    contrato_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=False
    )
    monto: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="CRC", nullable=False)
    fecha_pago: Mapped[date] = mapped_column(Date, nullable=False)
    metodo_pago: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago), nullable=False)
    referencia: Mapped[str | None] = mapped_column(String(100), nullable=True)
    periodo_facturado: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    estado: Mapped[EstadoPago] = mapped_column(
        Enum(EstadoPago), default=EstadoPago.PENDIENTE, nullable=False
    )
    validado_por: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    fecha_validacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)

    cliente: Mapped["Cliente"] = relationship(back_populates="pagos")  # noqa: F821
    contrato: Mapped["Contrato"] = relationship(back_populates="pagos")  # noqa: F821
    validador: Mapped["Usuario"] = relationship()  # noqa: F821
