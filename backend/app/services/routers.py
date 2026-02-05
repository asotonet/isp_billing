import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.encryption import encryption_service
from app.core.exceptions import ConflictError, NotFoundError
from app.models.router import Router
from app.schemas.common import PaginatedResponse
from app.schemas.router import RouterCreate, RouterUpdate
from app.utils.pagination import paginate


async def list_routers(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
) -> PaginatedResponse:
    """List routers with pagination and filters"""
    query = select(Router).order_by(Router.created_at.desc())

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Router.nombre.ilike(search_filter),
                Router.ip.ilike(search_filter),
            )
        )

    if is_active is not None:
        query = query.where(Router.is_active == is_active)

    return await paginate(db, query, page, page_size)


async def get_router(db: AsyncSession, router_id: uuid.UUID) -> Router:
    """Get router by ID"""
    result = await db.execute(select(Router).where(Router.id == router_id))
    router = result.scalar_one_or_none()
    if not router:
        raise NotFoundError("Router no encontrado")
    return router


async def get_router_by_ip(db: AsyncSession, ip: str) -> Router | None:
    """Get router by IP address"""
    result = await db.execute(select(Router).where(Router.ip == ip))
    return result.scalar_one_or_none()


async def create_router(db: AsyncSession, data: RouterCreate) -> Router:
    """Create new router with encrypted password"""
    # Check if IP already exists
    existing_router = await get_router_by_ip(db, data.ip)
    if existing_router:
        raise ConflictError("Ya existe un router con esa dirección IP")

    # Encrypt password
    encrypted_password = encryption_service.encrypt(data.password)

    # Create router
    router = Router(
        nombre=data.nombre,
        ip=data.ip,
        usuario=data.usuario,
        hashed_password=encrypted_password,
        puerto=data.puerto,
        ssl=data.ssl,
        is_active=data.is_active,
    )
    db.add(router)
    await db.flush()
    await db.refresh(router)
    return router


async def update_router(
    db: AsyncSession, router_id: uuid.UUID, data: RouterUpdate
) -> Router:
    """Update router information"""
    router = await get_router(db, router_id)
    update_data = data.model_dump(exclude_unset=True)

    # Check IP uniqueness if being updated
    if "ip" in update_data and update_data["ip"] != router.ip:
        existing_router = await get_router_by_ip(db, update_data["ip"])
        if existing_router:
            raise ConflictError("Ya existe un router con esa dirección IP")

    # Encrypt password if provided
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = encryption_service.encrypt(update_data["password"])
        del update_data["password"]
    elif "password" in update_data:
        # If password is empty string, don't update it
        del update_data["password"]

    for key, value in update_data.items():
        setattr(router, key, value)

    await db.flush()
    await db.refresh(router)
    return router


async def delete_router(db: AsyncSession, router_id: uuid.UUID) -> None:
    """Delete router (hard delete)"""
    router = await get_router(db, router_id)
    await db.delete(router)
    await db.flush()


async def deactivate_router(db: AsyncSession, router_id: uuid.UUID) -> Router:
    """Deactivate router (soft delete)"""
    router = await get_router(db, router_id)
    router.is_active = False
    await db.flush()
    await db.refresh(router)
    return router


async def activate_router(db: AsyncSession, router_id: uuid.UUID) -> Router:
    """Reactivate router"""
    router = await get_router(db, router_id)
    router.is_active = True
    await db.flush()
    await db.refresh(router)
    return router


def decrypt_router_password(router: Router) -> str:
    """Decrypt router password for MikroTik connection"""
    return encryption_service.decrypt(router.hashed_password)
