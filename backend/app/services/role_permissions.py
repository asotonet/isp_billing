import uuid
from typing import Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.role_permission import RolePermission
from app.models.usuario import RolUsuario
from app.schemas.role_permission import (
    RolePermissionCreate,
    RolePermissionUpdate,
    RolePermissionsMatrix,
)

# Caché en memoria para permisos (se actualiza cuando cambian)
_permissions_cache: Dict[str, Dict[str, bool]] = {}  # {f"{rol}:{module}": {can_read, can_write}}


# Módulos disponibles en el sistema
AVAILABLE_MODULES = [
    "dashboard",
    "clientes",
    "planes",
    "contratos",
    "pagos",
    "instalaciones",
    "routers",
    "usuarios",
    "roles",  # El módulo de gestión de roles
]

# Permisos por defecto para cada rol (solo se usan si no hay permisos en DB)
DEFAULT_PERMISSIONS = {
    "ADMIN": {
        "dashboard": {"can_read": True, "can_write": True},
        "clientes": {"can_read": True, "can_write": True},
        "planes": {"can_read": True, "can_write": True},
        "contratos": {"can_read": True, "can_write": True},
        "pagos": {"can_read": True, "can_write": True},
        "instalaciones": {"can_read": True, "can_write": True},
        "routers": {"can_read": True, "can_write": True},
        "usuarios": {"can_read": True, "can_write": True},
        "roles": {"can_read": True, "can_write": True},
    },
    "OPERADOR": {
        "dashboard": {"can_read": True, "can_write": False},
        "clientes": {"can_read": True, "can_write": True},
        "planes": {"can_read": True, "can_write": True},
        "contratos": {"can_read": True, "can_write": True},
        "pagos": {"can_read": True, "can_write": True},
        "instalaciones": {"can_read": True, "can_write": True},
        "routers": {"can_read": True, "can_write": False},
        "usuarios": {"can_read": False, "can_write": False},
        "roles": {"can_read": False, "can_write": False},
    },
    "TECNICO": {
        "dashboard": {"can_read": True, "can_write": False},
        "clientes": {"can_read": True, "can_write": False},
        "planes": {"can_read": True, "can_write": False},
        "contratos": {"can_read": True, "can_write": False},
        "pagos": {"can_read": True, "can_write": False},
        "instalaciones": {"can_read": True, "can_write": True},
        "routers": {"can_read": True, "can_write": False},
        "usuarios": {"can_read": False, "can_write": False},
        "roles": {"can_read": False, "can_write": False},
    },
    "AUDITOR": {
        "dashboard": {"can_read": True, "can_write": False},
        "clientes": {"can_read": True, "can_write": False},
        "planes": {"can_read": True, "can_write": False},
        "contratos": {"can_read": True, "can_write": False},
        "pagos": {"can_read": True, "can_write": False},
        "instalaciones": {"can_read": True, "can_write": False},
        "routers": {"can_read": True, "can_write": False},
        "usuarios": {"can_read": True, "can_write": False},
        "roles": {"can_read": False, "can_write": False},
    },
    "SOPORTE": {
        "dashboard": {"can_read": True, "can_write": False},
        "clientes": {"can_read": True, "can_write": False},
        "planes": {"can_read": True, "can_write": False},
        "contratos": {"can_read": True, "can_write": False},
        "pagos": {"can_read": True, "can_write": True},
        "instalaciones": {"can_read": True, "can_write": False},
        "routers": {"can_read": False, "can_write": False},
        "usuarios": {"can_read": False, "can_write": False},
        "roles": {"can_read": False, "can_write": False},
    },
}


async def initialize_default_permissions(db: AsyncSession) -> None:
    """Inicializa permisos por defecto si la tabla está vacía"""
    result = await db.execute(select(RolePermission).limit(1))
    if result.scalar_one_or_none():
        return  # Ya hay permisos, no inicializar

    for rol_str, modules in DEFAULT_PERMISSIONS.items():
        for module, perms in modules.items():
            permission = RolePermission(
                rol=RolUsuario[rol_str],
                module=module,
                can_read=perms["can_read"],
                can_write=perms["can_write"],
                description=f"Permiso para {module}",
            )
            db.add(permission)

    await db.flush()
    await _load_permissions_to_cache(db)


async def _load_permissions_to_cache(db: AsyncSession) -> None:
    """Carga todos los permisos a la caché en memoria"""
    global _permissions_cache
    _permissions_cache = {}

    result = await db.execute(select(RolePermission))
    permissions = result.scalars().all()

    for perm in permissions:
        cache_key = f"{perm.rol.value}:{perm.module}"
        _permissions_cache[cache_key] = {
            "can_read": perm.can_read,
            "can_write": perm.can_write,
        }


async def check_permission(
    db: AsyncSession, rol: RolUsuario, module: str, require_write: bool = False
) -> bool:
    """
    Verifica si un rol tiene permiso para acceder a un módulo.

    Args:
        rol: Rol del usuario
        module: Módulo a verificar
        require_write: Si True, verifica permiso de escritura; si False, solo lectura

    Returns:
        True si tiene permiso, False si no
    """
    # Verificar caché primero
    cache_key = f"{rol.value}:{module}"

    if cache_key in _permissions_cache:
        perms = _permissions_cache[cache_key]
        if require_write:
            return perms["can_write"]
        return perms["can_read"]

    # Si no está en caché, cargar desde DB
    await _load_permissions_to_cache(db)

    # Verificar de nuevo en caché
    if cache_key in _permissions_cache:
        perms = _permissions_cache[cache_key]
        if require_write:
            return perms["can_write"]
        return perms["can_read"]

    # Si aún no existe, usar valor por defecto (denegar acceso)
    return False


async def get_permissions_matrix(db: AsyncSession) -> RolePermissionsMatrix:
    """Obtiene la matriz completa de permisos para todos los roles y módulos"""
    result = await db.execute(select(RolePermission))
    all_permissions = result.scalars().all()

    # Construir matriz
    permissions_dict: Dict[str, Dict[RolUsuario, Dict[str, bool]]] = {}

    for module in AVAILABLE_MODULES:
        permissions_dict[module] = {}
        for rol in RolUsuario:
            permissions_dict[module][rol] = {"can_read": False, "can_write": False}

    # Llenar con datos reales
    for perm in all_permissions:
        if perm.module not in permissions_dict:
            permissions_dict[perm.module] = {}
        permissions_dict[perm.module][perm.rol] = {
            "can_read": perm.can_read,
            "can_write": perm.can_write,
        }

    return RolePermissionsMatrix(
        modules=AVAILABLE_MODULES,
        roles=list(RolUsuario),
        permissions=permissions_dict,
    )


async def list_permissions(db: AsyncSession) -> List[RolePermission]:
    """Lista todos los permisos"""
    result = await db.execute(select(RolePermission).order_by(RolePermission.rol, RolePermission.module))
    return list(result.scalars().all())


async def get_permission(db: AsyncSession, permission_id: uuid.UUID) -> RolePermission:
    """Obtiene un permiso por ID"""
    result = await db.execute(select(RolePermission).where(RolePermission.id == permission_id))
    permission = result.scalar_one_or_none()
    if not permission:
        raise NotFoundError("Permiso no encontrado")
    return permission


async def create_permission(db: AsyncSession, data: RolePermissionCreate) -> RolePermission:
    """Crea un nuevo permiso"""
    # Verificar si ya existe
    result = await db.execute(
        select(RolePermission).where(
            RolePermission.rol == data.rol, RolePermission.module == data.module
        )
    )
    if result.scalar_one_or_none():
        raise ConflictError(f"Ya existe un permiso para {data.rol.value}:{data.module}")

    permission = RolePermission(
        rol=data.rol,
        module=data.module,
        can_read=data.can_read,
        can_write=data.can_write,
        description=data.description,
    )
    db.add(permission)
    await db.flush()
    await db.refresh(permission)

    # Actualizar caché
    await _load_permissions_to_cache(db)

    return permission


async def update_permission(
    db: AsyncSession, permission_id: uuid.UUID, data: RolePermissionUpdate
) -> RolePermission:
    """Actualiza un permiso existente"""
    permission = await get_permission(db, permission_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(permission, key, value)

    await db.flush()
    await db.refresh(permission)

    # Actualizar caché
    await _load_permissions_to_cache(db)

    return permission


async def update_or_create_permission(
    db: AsyncSession, rol: RolUsuario, module: str, can_read: bool, can_write: bool
) -> RolePermission:
    """Actualiza un permiso si existe, o lo crea si no existe"""
    result = await db.execute(
        select(RolePermission).where(
            RolePermission.rol == rol, RolePermission.module == module
        )
    )
    permission = result.scalar_one_or_none()

    if permission:
        permission.can_read = can_read
        permission.can_write = can_write
    else:
        permission = RolePermission(
            rol=rol, module=module, can_read=can_read, can_write=can_write
        )
        db.add(permission)

    await db.flush()
    await db.refresh(permission)

    # Actualizar caché
    await _load_permissions_to_cache(db)

    return permission


async def bulk_update_permissions(
    db: AsyncSession, permissions: List[RolePermissionCreate]
) -> List[RolePermission]:
    """Actualiza múltiples permisos a la vez"""
    updated_permissions = []

    for perm_data in permissions:
        perm = await update_or_create_permission(
            db, perm_data.rol, perm_data.module, perm_data.can_read, perm_data.can_write
        )
        updated_permissions.append(perm)

    return updated_permissions


async def delete_permission(db: AsyncSession, permission_id: uuid.UUID) -> None:
    """Elimina un permiso"""
    permission = await get_permission(db, permission_id)
    await db.delete(permission)
    await db.flush()

    # Actualizar caché
    await _load_permissions_to_cache(db)
