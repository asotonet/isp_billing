import uuid

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.redis import get_redis
from app.core.security import decode_token
from app.database import get_db
from app.models.usuario import RolUsuario, Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    payload = decode_token(token)
    if payload is None:
        raise UnauthorizedError("Token inválido")

    if payload.get("type") != "access":
        raise UnauthorizedError("Tipo de token inválido")

    # Check if token is blacklisted
    redis = get_redis()
    is_blacklisted = await redis.get(f"blacklist:{token}")
    if is_blacklisted:
        raise UnauthorizedError("Token revocado")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedError("Token inválido")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise UnauthorizedError("Token inválido")

    result = await db.execute(select(Usuario).where(Usuario.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedError("Usuario no encontrado")

    return user


async def get_current_active_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    if not current_user.is_active:
        raise ForbiddenError("Usuario inactivo")
    return current_user


async def require_admin(
    current_user: Usuario = Depends(get_current_active_user),
) -> Usuario:
    if current_user.rol != RolUsuario.ADMIN:
        raise ForbiddenError("Se requiere rol de administrador")
    return current_user


def require_role(*allowed_roles: RolUsuario):
    """
    Dependency factory that creates a dependency to check if user has one of the allowed roles.

    Usage:
        @router.get("/", dependencies=[Depends(require_role(RolUsuario.ADMIN, RolUsuario.OPERADOR))])
    """
    async def _check_role(
        current_user: Usuario = Depends(get_current_active_user),
    ) -> Usuario:
        if current_user.rol not in allowed_roles:
            roles_str = ", ".join([role.value for role in allowed_roles])
            raise ForbiddenError(f"Se requiere uno de los siguientes roles: {roles_str}")
        return current_user

    return _check_role


def require_permission(module: str, require_write: bool = False):
    """
    Dependency factory que verifica permisos dinámicos desde la base de datos.

    Reemplaza require_role para un sistema de permisos más flexible.

    Args:
        module: Nombre del módulo (ej: "clientes", "planes")
        require_write: Si True, requiere permiso de escritura; si False, solo lectura

    Usage:
        @router.get("/", dependencies=[Depends(require_permission("clientes"))])
        @router.post("/", dependencies=[Depends(require_permission("clientes", require_write=True))])
    """
    async def _check_permission(
        current_user: Usuario = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db),
    ) -> Usuario:
        # Importar aquí para evitar circular imports
        from app.services.role_permissions import check_permission

        has_permission = await check_permission(db, current_user.rol, module, require_write)

        if not has_permission:
            action = "escritura" if require_write else "lectura"
            raise ForbiddenError(
                f"No tiene permisos de {action} para el módulo '{module}'"
            )

        return current_user

    return _check_permission
