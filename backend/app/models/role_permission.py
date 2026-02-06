from sqlalchemy import Boolean, Enum, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.models.usuario import RolUsuario


class RolePermission(BaseModel):
    """
    Permisos dinámicos por rol y módulo.
    Permite configurar desde UI qué roles tienen acceso de lectura/escritura a cada módulo.
    """

    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("rol", "module", name="uq_rol_module"),)

    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario), nullable=False, index=True
    )
    module: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # ej: "clientes", "planes", "contratos"
    can_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_write: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )  # Descripción del módulo

    def __repr__(self):
        return f"<RolePermission(rol={self.rol}, module={self.module}, read={self.can_read}, write={self.can_write})>"
