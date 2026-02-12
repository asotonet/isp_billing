import uuid
import ipaddress
from typing import Set

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.encryption import encryption_service
from app.core.exceptions import ConflictError, NotFoundError, BadRequestError
from app.models.router import Router
from app.models.contrato import Contrato
from app.schemas.common import PaginatedResponse
from app.schemas.router import RouterCreate, RouterUpdate
from app.utils.pagination import paginate
from app.services.router_monitor import check_router_connectivity
from app.services.router_events import create_router_event


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

    # Test actual MikroTik API connection with credentials before saving
    from app.services.mikrotik import MikroTikService
    mikrotik = MikroTikService(
        host=data.ip,
        username=data.usuario,
        password=data.password,
        port=data.puerto,
        ssl=data.ssl,
    )

    connection_result = await mikrotik.test_connection()
    if not connection_result.success:
        raise BadRequestError(
            f"No se pudo conectar al router MikroTik: {connection_result.message}. "
            "Verifica las credenciales, IP, puerto y configuración SSL."
        )

    # Encrypt password
    encrypted_password = encryption_service.encrypt(data.password)

    # Create router with initial online status and identity/version from test
    from datetime import datetime
    router = Router(
        nombre=data.nombre,
        ip=data.ip,
        usuario=data.usuario,
        hashed_password=encrypted_password,
        puerto=data.puerto,
        ssl=data.ssl,
        is_active=data.is_active,
        cidr_disponibles=data.cidr_disponibles,
        is_online=True,  # Set as online since we just verified connectivity
        identity=connection_result.message.replace("Conexión exitosa a ", "").strip() if connection_result.message else None,
        routeros_version=connection_result.router_version,
        last_check_at=datetime.utcnow(),
        last_online_at=datetime.utcnow(),
    )
    db.add(router)
    await db.flush()
    await db.refresh(router)

    # Register creation event
    await create_router_event(
        db, router.id, "CREATED",
        f"Router {data.nombre} creado",
        {"ip": data.ip, "puerto": data.puerto, "identity": router.identity, "version": router.routeros_version}
    )

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

    # Register deletion event before deleting
    await create_router_event(
        db, router_id, "DELETED",
        f"Router {router.nombre} eliminado",
        {"ip": router.ip}
    )

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


async def get_used_ips_for_router(db: AsyncSession, router_id: uuid.UUID) -> Set[str]:
    """Get all IP addresses currently assigned to contracts for a specific router"""
    result = await db.execute(
        select(Contrato.ip_asignada)
        .where(Contrato.router_id == router_id)
        .where(Contrato.ip_asignada.isnot(None))
    )
    ips = result.scalars().all()
    return set(ips)


async def get_next_available_ip(db: AsyncSession, router_id: uuid.UUID) -> str:
    """
    Get next available IP address from router's CIDR ranges

    Returns the first available IP in ascending order from the configured CIDR ranges.
    Skips network address, broadcast address, and already assigned IPs.
    """
    router = await get_router(db, router_id)

    if not router.cidr_disponibles:
        raise BadRequestError("El router no tiene rangos CIDR configurados")

    # Parse CIDR ranges
    cidr_ranges = [cidr.strip() for cidr in router.cidr_disponibles.split(",")]

    # Get already used IPs
    used_ips = await get_used_ips_for_router(db, router_id)

    # Find first available IP across all CIDR ranges
    for cidr_str in cidr_ranges:
        try:
            network = ipaddress.ip_network(cidr_str, strict=False)

            # Iterate through all hosts in the network
            for ip in network.hosts():
                ip_str = str(ip)
                if ip_str not in used_ips:
                    return ip_str

        except ValueError as e:
            # Skip invalid CIDR notation
            continue

    raise BadRequestError("No hay direcciones IP disponibles en los rangos CIDR configurados")


async def check_ip_available(
    db: AsyncSession,
    router_id: uuid.UUID,
    ip_address: str,
    exclude_contrato_id: uuid.UUID | None = None
) -> dict:
    """
    Check if an IP address is available for assignment

    Returns:
        dict with keys:
            - available: bool
            - message: str
            - contrato_numero: str | None (if IP is in use)
    """
    # Validate IP format
    try:
        ipaddress.ip_address(ip_address)
    except ValueError:
        return {
            "available": False,
            "message": "Formato de IP inválido",
            "contrato_numero": None
        }

    # Check if IP is already assigned to another contract on this router
    query = (
        select(Contrato)
        .where(Contrato.router_id == router_id)
        .where(Contrato.ip_asignada == ip_address)
    )

    if exclude_contrato_id:
        query = query.where(Contrato.id != exclude_contrato_id)

    result = await db.execute(query)
    existing_contrato = result.scalar_one_or_none()

    if existing_contrato:
        return {
            "available": False,
            "message": f"IP ya asignada al contrato {existing_contrato.numero_contrato}",
            "contrato_numero": existing_contrato.numero_contrato
        }

    # Check if IP is within configured CIDR ranges
    router = await get_router(db, router_id)
    if router.cidr_disponibles:
        cidr_ranges = [cidr.strip() for cidr in router.cidr_disponibles.split(",")]
        ip_obj = ipaddress.ip_address(ip_address)

        in_range = False
        for cidr_str in cidr_ranges:
            try:
                network = ipaddress.ip_network(cidr_str, strict=False)
                if ip_obj in network:
                    in_range = True
                    break
            except ValueError:
                continue

        if not in_range:
            return {
                "available": True,
                "message": "⚠️ IP fuera de los rangos CIDR configurados",
                "contrato_numero": None
            }

    return {
        "available": True,
        "message": "IP disponible",
        "contrato_numero": None
    }


def get_local_address_from_cidrs(cidr_disponibles: str) -> str | None:
    """
    Get the first IP from the smallest CIDR range to use as local address (PPPoE gateway)

    Args:
        cidr_disponibles: Comma-separated CIDR ranges (e.g., "192.168.1.0/24,10.0.0.0/24")

    Returns:
        First usable IP from the smallest CIDR, or None if no valid CIDRs

    Example:
        "192.168.1.0/24,10.0.0.0/24" -> "10.0.0.1"
        "172.16.0.0/16" -> "172.16.0.1"
    """
    if not cidr_disponibles or not cidr_disponibles.strip():
        return None

    cidr_ranges = [cidr.strip() for cidr in cidr_disponibles.split(",") if cidr.strip()]

    if not cidr_ranges:
        return None

    # Parse all CIDRs and get their first IPs
    networks = []
    for cidr in cidr_ranges:
        try:
            network = ipaddress.ip_network(cidr, strict=False)
            networks.append(network)
        except ValueError:
            continue

    if not networks:
        return None

    # Sort by first IP address (numerically)
    networks.sort(key=lambda net: int(net.network_address))

    # Get first usable IP from the smallest CIDR
    smallest_network = networks[0]
    usable_ips = list(smallest_network.hosts())

    if usable_ips:
        return str(usable_ips[0])

    return None
