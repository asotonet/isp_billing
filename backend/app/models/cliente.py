import enum

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class TipoIdentificacion(str, enum.Enum):
    CEDULA_FISICA = "cedula_fisica"
    CEDULA_JURIDICA = "cedula_juridica"
    DIMEX = "dimex"
    NITE = "nite"


class Cliente(BaseModel):
    __tablename__ = "clientes"

    tipo_identificacion: Mapped[TipoIdentificacion] = mapped_column(
        Enum(TipoIdentificacion), nullable=False
    )
    numero_identificacion: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido1: Mapped[str | None] = mapped_column(String(100), nullable=True)
    apellido2: Mapped[str | None] = mapped_column(String(100), nullable=True)
    razon_social: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    provincia: Mapped[str | None] = mapped_column(String(50), nullable=True)
    canton: Mapped[str | None] = mapped_column(String(50), nullable=True)
    distrito: Mapped[str | None] = mapped_column(String(50), nullable=True)
    direccion_exacta: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    contratos: Mapped[list["Contrato"]] = relationship(back_populates="cliente")  # noqa: F821
    pagos: Mapped[list["Pago"]] = relationship(back_populates="cliente")  # noqa: F821
