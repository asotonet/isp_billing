import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class EstadoFactura(str, enum.Enum):
    BORRADOR = "borrador"
    EMITIDA = "emitida"
    ANULADA = "anulada"


class Factura(BaseModel):
    __tablename__ = "facturas"

    numero_factura: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    contrato_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=False
    )
    cliente_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clientes.id"), nullable=False
    )
    clave_numerica_fe: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    impuesto: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # IVA 13%
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="CRC", nullable=False)
    periodo: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    estado: Mapped[EstadoFactura] = mapped_column(
        Enum(EstadoFactura), default=EstadoFactura.BORRADOR, nullable=False
    )
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
