import enum
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class EstadoInstalacion(str, enum.Enum):
    SOLICITUD = "solicitud"
    PROGRAMADA = "programada"
    EN_PROGRESO = "en_progreso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class Instalacion(BaseModel):
    __tablename__ = "instalaciones"

    numero_instalacion: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    contrato_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=True
    )   
    plan_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("planes.id"), nullable=False
    )
    fecha_programada: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_completada: Mapped[date | None] = mapped_column(Date, nullable=True)
    tecnico_asignado: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estado: Mapped[EstadoInstalacion] = mapped_column(
        Enum(
            EstadoInstalacion,
            name="estadoinstalacion",
            create_constraint=False,
            native_enum=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=EstadoInstalacion.SOLICITUD,
        nullable=False
    )
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    motivo_cancelacion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Temporary client data - used until installation is activated
    temp_tipo_identificacion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    temp_numero_identificacion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    temp_nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    temp_apellido1: Mapped[str | None] = mapped_column(String(100), nullable=True)
    temp_apellido2: Mapped[str | None] = mapped_column(String(100), nullable=True)
    temp_razon_social: Mapped[str | None] = mapped_column(String(255), nullable=True)
    temp_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    temp_telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    temp_provincia: Mapped[str | None] = mapped_column(String(50), nullable=True)
    temp_canton: Mapped[str | None] = mapped_column(String(50), nullable=True)
    temp_distrito: Mapped[str | None] = mapped_column(String(50), nullable=True)
    temp_direccion_exacta: Mapped[str | None] = mapped_column(Text, nullable=True)

    # PDF path for unsigned installation request
    pdf_solicitud_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    plan: Mapped["Plan"] = relationship()  # noqa: F821
    contrato: Mapped["Contrato"] = relationship()  # noqa: F821
