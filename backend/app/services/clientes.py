import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate
from app.schemas.common import PaginatedResponse
from app.utils.cedula import validate_identificacion
from app.utils.pagination import paginate


async def list_clientes(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
) -> PaginatedResponse:
    query = select(Cliente).order_by(Cliente.created_at.desc())

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Cliente.nombre.ilike(search_filter),
                Cliente.apellido1.ilike(search_filter),
                Cliente.apellido2.ilike(search_filter),
                Cliente.razon_social.ilike(search_filter),
                Cliente.numero_identificacion.ilike(search_filter),
                Cliente.email.ilike(search_filter),
            )
        )

    if is_active is not None:
        query = query.where(Cliente.is_active == is_active)

    return await paginate(db, query, page, page_size)


async def get_cliente(db: AsyncSession, cliente_id: uuid.UUID) -> Cliente:
    result = await db.execute(select(Cliente).where(Cliente.id == cliente_id))
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise NotFoundError("Cliente no encontrado")
    return cliente


async def create_cliente(db: AsyncSession, data: ClienteCreate) -> Cliente:
    # Validate identification
    if not validate_identificacion(data.tipo_identificacion.value, data.numero_identificacion):
        from app.core.exceptions import BadRequestError

        raise BadRequestError("Número de identificación inválido para el tipo seleccionado")

    # Check uniqueness
    result = await db.execute(
        select(Cliente).where(Cliente.numero_identificacion == data.numero_identificacion)
    )
    if result.scalar_one_or_none():
        raise ConflictError("Ya existe un cliente con ese número de identificación")

    cliente = Cliente(**data.model_dump())
    db.add(cliente)
    await db.flush()
    await db.refresh(cliente)
    return cliente


async def update_cliente(
    db: AsyncSession, cliente_id: uuid.UUID, data: ClienteUpdate
) -> Cliente:
    cliente = await get_cliente(db, cliente_id)
    update_data = data.model_dump(exclude_unset=True)

    # Validate identification format if being updated
    if "tipo_identificacion" in update_data or "numero_identificacion" in update_data:
        tipo_identificacion = update_data.get("tipo_identificacion", cliente.tipo_identificacion)
        numero_identificacion = update_data.get("numero_identificacion", cliente.numero_identificacion)

        if not validate_identificacion(tipo_identificacion.value if hasattr(tipo_identificacion, 'value') else tipo_identificacion, numero_identificacion):
            from app.core.exceptions import BadRequestError
            raise BadRequestError("Número de identificación inválido para el tipo seleccionado")

    # Validate uniqueness of numero_identificacion if being updated
    if "numero_identificacion" in update_data and update_data["numero_identificacion"] != cliente.numero_identificacion:
        result = await db.execute(
            select(Cliente)
            .where(Cliente.numero_identificacion == update_data["numero_identificacion"])
            .where(Cliente.id != cliente_id)  # Exclude current client
        )
        if result.scalar_one_or_none():
            raise ConflictError("Ya existe un cliente con ese número de identificación")

    for key, value in update_data.items():
        setattr(cliente, key, value)
    await db.flush()
    await db.refresh(cliente)
    return cliente


async def check_numero_identificacion_available(
    db: AsyncSession,
    numero_identificacion: str,
    exclude_cliente_id: uuid.UUID | None = None
) -> dict:
    """
    Check if a numero_identificacion is available for use

    Returns:
        dict with keys:
            - available: bool
            - message: str
            - cliente_nombre: str | None (if numero_identificacion is in use)
    """
    # Check if numero_identificacion is already assigned to another client
    query = select(Cliente).where(Cliente.numero_identificacion == numero_identificacion)

    if exclude_cliente_id:
        query = query.where(Cliente.id != exclude_cliente_id)

    result = await db.execute(query)
    existing_cliente = result.scalar_one_or_none()

    if existing_cliente:
        nombre_completo = existing_cliente.razon_social or f"{existing_cliente.nombre} {existing_cliente.apellido1 or ''}".strip()
        return {
            "available": False,
            "message": f"Número de identificación ya registrado para {nombre_completo}",
            "cliente_nombre": nombre_completo
        }

    return {
        "available": True,
        "message": "Número de identificación disponible",
        "cliente_nombre": None
    }


async def deactivate_cliente(db: AsyncSession, cliente_id: uuid.UUID) -> Cliente:
    cliente = await get_cliente(db, cliente_id)
    cliente.is_active = False
    await db.flush()
    await db.refresh(cliente)
    return cliente


async def activate_cliente(db: AsyncSession, cliente_id: uuid.UUID) -> Cliente:
    """Reactivate an inactive client"""
    cliente = await get_cliente(db, cliente_id)
    cliente.is_active = True
    await db.flush()
    await db.refresh(cliente)
    return cliente
