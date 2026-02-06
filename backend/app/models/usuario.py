import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class RolUsuario(str, enum.Enum):
    ADMIN = "ADMIN"  # Acceso total al sistema
    OPERADOR = "OPERADOR"  # Gestión de clientes, contratos, pagos
    TECNICO = "TECNICO"  # Gestión de instalaciones y soporte técnico
    AUDITOR = "AUDITOR"  # Solo lectura de reportes y auditoría
    SOPORTE = "SOPORTE"  # Atención al cliente, consultas básicas


class Usuario(BaseModel):
    __tablename__ = "usuarios"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario), nullable=False, default=RolUsuario.OPERADOR
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
