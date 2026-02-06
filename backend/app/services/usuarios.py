import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.security import hash_password, verify_password
from app.models.usuario import RolUsuario, Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.usuario import ChangePasswordRequest, UsuarioCreate, UsuarioUpdate
from app.utils.pagination import paginate


async def list_usuarios(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    rol: RolUsuario | None = None,
    is_active: bool | None = None,
) -> PaginatedResponse:
    """List users with pagination and filters"""
    query = select(Usuario).order_by(Usuario.created_at.desc())

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Usuario.nombre_completo.ilike(search_filter),
                Usuario.email.ilike(search_filter),
            )
        )

    if rol:
        query = query.where(Usuario.rol == rol)

    if is_active is not None:
        query = query.where(Usuario.is_active == is_active)

    return await paginate(db, query, page, page_size)


async def get_usuario(db: AsyncSession, usuario_id: uuid.UUID) -> Usuario:
    """Get user by ID"""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise NotFoundError("Usuario no encontrado")
    return usuario


async def get_usuario_by_email(db: AsyncSession, email: str) -> Usuario | None:
    """Get user by email"""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def create_usuario(db: AsyncSession, data: UsuarioCreate) -> Usuario:
    """Create new user with hashed password"""
    # Check if email already exists
    existing_user = await get_usuario_by_email(db, data.email)
    if existing_user:
        raise ConflictError("Ya existe un usuario con ese email")

    # Hash password
    hashed_password = hash_password(data.password)

    # Create user
    usuario = Usuario(
        email=data.email,
        nombre_completo=data.nombre_completo,
        rol=data.rol,
        hashed_password=hashed_password,
    )
    db.add(usuario)
    await db.flush()
    await db.refresh(usuario)
    return usuario


async def update_usuario(
    db: AsyncSession, usuario_id: uuid.UUID, data: UsuarioUpdate
) -> Usuario:
    """Update user information"""
    usuario = await get_usuario(db, usuario_id)
    update_data = data.model_dump(exclude_unset=True)

    # Check email uniqueness if being updated
    if "email" in update_data and update_data["email"] != usuario.email:
        existing_user = await get_usuario_by_email(db, update_data["email"])
        if existing_user:
            raise ConflictError("Ya existe un usuario con ese email")

    for key, value in update_data.items():
        setattr(usuario, key, value)

    await db.flush()
    await db.refresh(usuario)
    return usuario


async def change_password(
    db: AsyncSession,
    usuario_id: uuid.UUID,
    data: ChangePasswordRequest,
) -> Usuario:
    """Change user password"""
    usuario = await get_usuario(db, usuario_id)

    # Verify current password
    if not verify_password(data.current_password, usuario.hashed_password):
        raise BadRequestError("Contraseña actual incorrecta")

    # Hash and set new password
    usuario.hashed_password = hash_password(data.new_password)
    await db.flush()
    await db.refresh(usuario)
    return usuario


async def admin_reset_password(
    db: AsyncSession,
    usuario_id: uuid.UUID,
    new_password: str,
) -> Usuario:
    """Admin resets user password (no current password verification)"""
    usuario = await get_usuario(db, usuario_id)
    usuario.hashed_password = hash_password(new_password)
    await db.flush()
    await db.refresh(usuario)
    return usuario


async def deactivate_usuario(db: AsyncSession, usuario_id: uuid.UUID) -> Usuario:
    """Deactivate user (soft delete)"""
    usuario = await get_usuario(db, usuario_id)
    usuario.is_active = False
    await db.flush()
    await db.refresh(usuario)
    return usuario


async def activate_usuario(db: AsyncSession, usuario_id: uuid.UUID) -> Usuario:
    """Reactivate user"""
    usuario = await get_usuario(db, usuario_id)
    usuario.is_active = True
    await db.flush()
    await db.refresh(usuario)
    return usuario
