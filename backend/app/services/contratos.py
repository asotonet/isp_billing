import logging
import os
import uuid
import unicodedata
from datetime import date

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.encryption import encryption_service
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.cliente import Cliente
from app.models.contrato import Contrato, EstadoContrato, TipoConexion
from app.models.plan import Plan
from app.models.router import Router
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoCreate, ContratoUpdate
from app.services.mikrotik import MikroTikService
from app.services.routers import decrypt_router_password, get_local_address_from_cidrs
from app.utils.pagination import paginate

logger = logging.getLogger(__name__)


def normalize_for_mikrotik(text: str) -> str:
    """
    Normalize text to ASCII-safe characters for MikroTik comments

    Removes accents and converts to ASCII:
    - á, é, í, ó, ú → a, e, i, o, u
    - ñ → n
    - ü → u
    - Non-ASCII chars → removed

    Args:
        text: Input text with potential unicode characters

    Returns:
        ASCII-safe string
    """
    # Normalize unicode characters (decompose accents)
    normalized = unicodedata.normalize('NFD', text)
    # Remove combining characters (accents)
    ascii_text = ''.join(char for char in normalized if unicodedata.category(char) != 'Mn')
    # Keep only ASCII printable characters
    ascii_safe = ''.join(char for char in ascii_text if ord(char) < 128)
    return ascii_safe


async def _generate_numero_contrato(db: AsyncSession) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"CTR-{today}-"
    result = await db.execute(
        select(func.count())
        .select_from(Contrato)
        .where(Contrato.numero_contrato.like(f"{prefix}%"))
    )
    count = (result.scalar() or 0) + 1
    return f"{prefix}{count:04d}"


async def _sync_ipoe(
    mikrotik: MikroTikService,
    contrato: Contrato,
    nombre_cliente: str,
    comment: str,
    router: Router
) -> None:
    """Synchronize IPoE contract with MikroTik using address-lists"""
    list_activos = "ISP-ACTIVOS"
    list_suspendidos = "ISP-SUSPENDIDOS"

    if contrato.estado == EstadoContrato.CANCELADO:
        logger.warning(f"[IPoE-CANCELADO] Removing {contrato.ip_asignada} from all lists")
        await mikrotik.remove_all_for_address(contrato.ip_asignada)
        logger.warning(f"MikroTik sync: Removed {contrato.ip_asignada} from all lists")

    elif contrato.estado == EstadoContrato.SUSPENDIDO:
        logger.warning(f"[IPoE-SUSPENDIDO] Cleaning and adding to {list_suspendidos}")
        await mikrotik.remove_all_for_address(contrato.ip_asignada)
        success = await mikrotik.add_address_list(
            list_suspendidos, contrato.ip_asignada, disabled=False, comment=comment
        )
        if not success:
            raise BadRequestError(
                f"Error al sincronizar IPoE con MikroTik: No se pudo suspender la IP {contrato.ip_asignada}."
            )
        logger.warning(f"✓ IPoE sync SUCCESS: Suspended {contrato.ip_asignada}")

    elif contrato.estado in [EstadoContrato.ACTIVO, EstadoContrato.PENDIENTE]:
        logger.warning(f"[IPoE-ACTIVO] Cleaning and adding to {list_activos}")
        await mikrotik.remove_all_for_address(contrato.ip_asignada)
        success = await mikrotik.add_address_list(
            list_activos, contrato.ip_asignada, disabled=False, comment=comment
        )
        if not success:
            raise BadRequestError(
                f"Error al sincronizar IPoE con MikroTik: No se pudo activar la IP {contrato.ip_asignada}."
            )
        logger.warning(f"✓ IPoE sync SUCCESS: Activated {contrato.ip_asignada}")


async def _sync_pppoe(
    mikrotik: MikroTikService,
    contrato: Contrato,
    plan: Plan,
    nombre_cliente: str,
    comment: str,
    router: Router
) -> None:
    """Synchronize PPPoE contract with MikroTik using PPP profiles and secrets"""
    # Generate profile name based on plan (convert to int to avoid decimals)
    profile_name = f"PLAN-{int(plan.velocidad_bajada_mbps)}MB"

    # Calculate local address from router CIDRs (first IP of smallest CIDR)
    local_address = get_local_address_from_cidrs(router.cidr_disponibles)

    # Determine pool for profile (always use pool in profile, it's shared)
    pool_name = f"pool-{router.nombre.lower().replace(' ', '-')}"
    profile_remote_address = None
    cidr_ranges = [cidr.strip() for cidr in router.cidr_disponibles.split(",") if cidr.strip()]

    # Ensure IP pool exists in MikroTik for profile
    if cidr_ranges:
        pool_exists = await mikrotik.pool_exists(pool_name)
        if not pool_exists:
            logger.info(f"Creating IP pool {pool_name} with CIDRs: {cidr_ranges}")
            pool_created = await mikrotik.create_or_update_ip_pool(pool_name, cidr_ranges)
            if pool_created:
                profile_remote_address = pool_name
                logger.info(f"Created pool for profile: {profile_remote_address}")
        else:
            profile_remote_address = pool_name
            logger.info(f"Using existing pool for profile: {profile_remote_address}")
    else:
        logger.warning(f"Router {router.nombre} has no CIDR ranges configured")

    # Determine remote address for SECRET (user-specific)
    # This is where we use the fixed IP if specified
    secret_remote_address = contrato.pppoe_remote_address  # Will be IP or None
    if secret_remote_address:
        logger.info(f"User will get fixed IP: {secret_remote_address}")
    else:
        logger.info(f"User will get IP from pool automatically")

    # Decrypt PPPoE password
    pppoe_password = encryption_service.decrypt(contrato.pppoe_password)

    if contrato.estado == EstadoContrato.CANCELADO:
        logger.warning(f"[PPPoE-CANCELADO] Removing PPP secret for {contrato.pppoe_usuario}")
        await mikrotik.remove_ppp_secret(contrato.pppoe_usuario)
        logger.warning(f"MikroTik sync: Removed PPP secret for {contrato.pppoe_usuario}")

    elif contrato.estado == EstadoContrato.SUSPENDIDO:
        logger.warning(f"[PPPoE-SUSPENDIDO] Disabling PPP secret for {contrato.pppoe_usuario}")
        # Create/update profile first (with pool for shared use)
        await mikrotik.create_or_update_ppp_profile(
            profile_name,
            plan.velocidad_bajada_mbps,
            plan.velocidad_subida_mbps,
            local_address=local_address,
            remote_address=profile_remote_address
        )
        # Disable the secret (suspend) with optional fixed IP
        success = await mikrotik.add_ppp_secret(
            contrato.pppoe_usuario,
            pppoe_password,
            profile_name,
            disabled=True,
            comment=comment,
            remote_address=secret_remote_address
        )
        if not success:
            raise BadRequestError(
                f"Error al sincronizar PPPoE con MikroTik: No se pudo suspender el usuario {contrato.pppoe_usuario}."
            )
        logger.warning(f"✓ PPPoE sync SUCCESS: Suspended user {contrato.pppoe_usuario}")

    elif contrato.estado in [EstadoContrato.ACTIVO, EstadoContrato.PENDIENTE]:
        logger.warning(f"[PPPoE-ACTIVO] Creating/updating PPP profile and secret for {contrato.pppoe_usuario}")
        # Create/update profile (with pool for shared use)
        profile_ok = await mikrotik.create_or_update_ppp_profile(
            profile_name,
            plan.velocidad_bajada_mbps,
            plan.velocidad_subida_mbps,
            local_address=local_address,
            remote_address=profile_remote_address
        )
        if not profile_ok:
            raise BadRequestError(
                f"Error al crear perfil PPP '{profile_name}' en MikroTik."
            )

        # Create/update secret (enabled) with optional fixed IP
        secret_ok = await mikrotik.add_ppp_secret(
            contrato.pppoe_usuario,
            pppoe_password,
            profile_name,
            disabled=False,
            comment=comment,
            remote_address=secret_remote_address
        )
        if not secret_ok:
            raise BadRequestError(
                f"Error al sincronizar PPPoE con MikroTik: No se pudo activar el usuario {contrato.pppoe_usuario}."
            )
        logger.warning(f"✓ PPPoE sync SUCCESS: Activated user {contrato.pppoe_usuario} with profile {profile_name}")


async def _sync_mikrotik(db: AsyncSession, contrato: Contrato) -> None:
    """
    Synchronize contract state with MikroTik router using generic address-lists

    Address-list strategy:
    - ISP-ACTIVOS: Active clients (disabled=no) - allow internet access via firewall rule
    - ISP-SUSPENDIDOS: Suspended clients (disabled=no) - block internet access via firewall rule

    Note: Both lists use disabled=no so firewall rules can match them.
    The firewall rules determine if traffic is allowed or blocked.

    Actions based on estado:
    - ACTIVO/PENDIENTE: Add to ISP-ACTIVOS, remove from ISP-SUSPENDIDOS
    - SUSPENDIDO: Add to ISP-SUSPENDIDOS, remove from ISP-ACTIVOS
    - CANCELADO: Remove from both lists

    Raises BadRequestError if router is offline/inactive and IP is assigned
    """
    logger.warning(
        f">>> _SYNC_MIKROTIK START <<< contract {contrato.numero_contrato}, "
        f"router_id={contrato.router_id}, ip_asignada={contrato.ip_asignada}, estado={contrato.estado}"
    )

    # Skip if no router assigned
    if not contrato.router_id:
        logger.warning(f">>> SKIPPING SYNC <<< contract {contrato.numero_contrato} (no router)")
        return

    # For IPoE, IP is required. For PPPoE, username/password are required
    if contrato.tipo_conexion == TipoConexion.IPOE:
        if not contrato.ip_asignada:
            logger.warning(f">>> SKIPPING SYNC <<< IPoE contract {contrato.numero_contrato} (no IP)")
            return
    elif contrato.tipo_conexion == TipoConexion.PPPOE:
        if not contrato.pppoe_usuario or not contrato.pppoe_password:
            logger.warning(
                f">>> SKIPPING SYNC <<< PPPoE contract {contrato.numero_contrato} "
                "(missing username or password)"
            )
            return

    # Load router
    result = await db.execute(select(Router).where(Router.id == contrato.router_id))
    router = result.scalar_one_or_none()
    if not router:
        raise BadRequestError(
            f"Router {contrato.router_id} no encontrado. "
            "No se puede sincronizar el contrato con MikroTik."
        )

    # Check if router is active
    if not router.is_active:
        raise BadRequestError(
            f"El router '{router.nombre}' está inactivo. "
            "Actívalo antes de asignar contratos."
        )

    # Check if router is online
    if router.is_online is False:
        raise BadRequestError(
            f"El router '{router.nombre}' está desconectado (offline). "
            "Verifica la conectividad del router antes de continuar."
        )

    try:

        # Load cliente if not already loaded
        if not hasattr(contrato, 'cliente') or not contrato.cliente:
            result = await db.execute(select(Cliente).where(Cliente.id == contrato.cliente_id))
            cliente = result.scalar_one_or_none()
        else:
            cliente = contrato.cliente

        # Build client name for comment
        if cliente:
            if cliente.razon_social:
                nombre_cliente = cliente.razon_social
            else:
                nombre_cliente = f"{cliente.nombre} {cliente.apellido1 or ''} {cliente.apellido2 or ''}".strip()
        else:
            nombre_cliente = "Cliente desconocido"

        # Build comment with client name and contract number
        # Normalize to ASCII to avoid encoding errors with MikroTik
        comment = normalize_for_mikrotik(f"{nombre_cliente} - {contrato.numero_contrato}")

        # Decrypt password
        password = decrypt_router_password(router)

        # Initialize MikroTik service
        mikrotik = MikroTikService(
            host=router.ip,
            username=router.usuario,
            password=password,
            port=router.puerto,
            ssl=router.ssl,
        )

        # Load plan for PPPoE (to get speeds for profile)
        if contrato.tipo_conexion == TipoConexion.PPPOE:
            if not hasattr(contrato, 'plan') or not contrato.plan:
                result = await db.execute(select(Plan).where(Plan.id == contrato.plan_id))
                plan = result.scalar_one_or_none()
                if not plan:
                    raise BadRequestError(f"Plan {contrato.plan_id} no encontrado")
            else:
                plan = contrato.plan

        # Sync based on connection type
        logger.warning(f"Tipo conexión: {contrato.tipo_conexion}, Estado: {contrato.estado}")

        if contrato.tipo_conexion == TipoConexion.IPOE:
            # ========== IPoE: Use address-lists ==========
            await _sync_ipoe(mikrotik, contrato, nombre_cliente, comment, router)

        elif contrato.tipo_conexion == TipoConexion.PPPOE:
            # ========== PPPoE: Use PPP profiles and secrets ==========
            await _sync_pppoe(mikrotik, contrato, plan, nombre_cliente, comment, router)


        logger.warning(f">>> _SYNC_MIKROTIK END <<<")

    except BadRequestError:
        # Re-raise BadRequestError to propagate to user
        raise
    except Exception as e:
        # Convert other exceptions to BadRequestError with user-friendly message
        logger.exception(
            f"Unexpected error during MikroTik sync for contract "
            f"{contrato.numero_contrato}: {str(e)}"
        )
        raise BadRequestError(
            f"Error inesperado al sincronizar con MikroTik: {str(e)}. "
            "Verifica que el router esté accesible y configurado correctamente."
        )


async def list_contratos(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    cliente_id: uuid.UUID | None = None,
    estado: EstadoContrato | None = None,
) -> PaginatedResponse:
    query = (
        select(Contrato)
        .options(selectinload(Contrato.cliente), selectinload(Contrato.plan))
        .order_by(Contrato.created_at.desc())
    )

    if cliente_id:
        query = query.where(Contrato.cliente_id == cliente_id)
    if estado:
        query = query.where(Contrato.estado == estado)

    result = await paginate(db, query, page, page_size)

    # Decrypt PPPoE passwords for display in frontend (admin users only)
    for contrato in result.items:
        if contrato.pppoe_password:
            try:
                # Try to decrypt (handles Fernet-encrypted passwords)
                contrato.pppoe_password = encryption_service.decrypt(contrato.pppoe_password)
            except Exception:
                # If decryption fails, password might be in plain text (old records)
                # Keep as-is and let frontend display it
                pass

    return result


async def get_contrato(db: AsyncSession, contrato_id: uuid.UUID) -> Contrato:
    result = await db.execute(
        select(Contrato)
        .options(selectinload(Contrato.cliente), selectinload(Contrato.plan))
        .where(Contrato.id == contrato_id)
    )
    contrato = result.scalar_one_or_none()
    if not contrato:
        raise NotFoundError("Contrato no encontrado")

    # Decrypt PPPoE password for display in frontend (admin users only)
    if contrato.pppoe_password:
        try:
            # Try to decrypt (handles Fernet-encrypted passwords)
            contrato.pppoe_password = encryption_service.decrypt(contrato.pppoe_password)
        except Exception:
            # If decryption fails, password might be in plain text (old records)
            # Keep as-is and let frontend display it
            pass

    return contrato


async def create_contrato(db: AsyncSession, data: ContratoCreate) -> Contrato:
    # Validate client exists
    result = await db.execute(select(Cliente).where(Cliente.id == data.cliente_id))
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise BadRequestError("Cliente no encontrado")
    if not cliente.is_active:
        raise BadRequestError("Cliente inactivo")

    # Validate plan exists
    result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise BadRequestError("Plan no encontrado")
    if not plan.is_active:
        raise BadRequestError("Plan inactivo")

    # Validate router exists if specified
    if data.router_id:
        result = await db.execute(select(Router).where(Router.id == data.router_id))
        router = result.scalar_one_or_none()
        if not router:
            raise BadRequestError("Router no encontrado")

    # Validate connection type requirements
    if data.tipo_conexion == TipoConexion.IPOE:
        if data.router_id and not data.ip_asignada:
            raise BadRequestError("Para IPoE con router asignado, la IP es requerida")
    elif data.tipo_conexion == TipoConexion.PPPOE:
        if not data.pppoe_usuario or not data.pppoe_password:
            raise BadRequestError("Para PPPoE, el usuario y contraseña son requeridos")
        # Validate PPPoE username is not already in use
        if data.router_id:
            result = await db.execute(
                select(Contrato)
                .where(Contrato.router_id == data.router_id)
                .where(Contrato.pppoe_usuario == data.pppoe_usuario)
                .where(Contrato.tipo_conexion == TipoConexion.PPPOE)
            )
            existing_pppoe = result.scalar_one_or_none()
            if existing_pppoe:
                raise BadRequestError(
                    f"El usuario PPPoE '{data.pppoe_usuario}' ya está en uso en el contrato {existing_pppoe.numero_contrato}"
                )

    # Validate IP is not already assigned to another contract on the same router (IPoE)
    if data.tipo_conexion == TipoConexion.IPOE and data.router_id and data.ip_asignada:
        result = await db.execute(
            select(Contrato)
            .where(Contrato.router_id == data.router_id)
            .where(Contrato.ip_asignada == data.ip_asignada)
        )
        existing_contrato = result.scalar_one_or_none()
        if existing_contrato:
            raise BadRequestError(
                f"La IP {data.ip_asignada} ya está asignada al contrato {existing_contrato.numero_contrato}"
            )

    numero_contrato = await _generate_numero_contrato(db)

    # Prepare contract data
    contrato_data = data.model_dump()

    # Encrypt PPPoE password if provided
    if data.tipo_conexion == TipoConexion.PPPOE and data.pppoe_password:
        contrato_data['pppoe_password'] = encryption_service.encrypt(data.pppoe_password)

    contrato = Contrato(
        **contrato_data,
        numero_contrato=numero_contrato,
    )
    db.add(contrato)
    await db.flush()
    await db.refresh(contrato)

    # Sync with MikroTik (will raise exception if router is offline/inactive)
    await _sync_mikrotik(db, contrato)

    # Reload with relationships
    return await get_contrato(db, contrato.id)


async def update_contrato(
    db: AsyncSession, contrato_id: uuid.UUID, data: ContratoUpdate
) -> Contrato:
    logger.warning(f"=== UPDATE_CONTRATO START === ID: {contrato_id}")
    contrato = await get_contrato(db, contrato_id)
    logger.warning(f"Before update - router_id: {contrato.router_id}, ip_asignada: {contrato.ip_asignada}, estado: {contrato.estado}")

    update_data = data.model_dump(exclude_unset=True)
    logger.warning(f"Update data: {update_data}")

    if "plan_id" in update_data:
        result = await db.execute(select(Plan).where(Plan.id == update_data["plan_id"]))
        plan = result.scalar_one_or_none()
        if not plan:
            raise BadRequestError("Plan no encontrado")

    # Validate router exists if specified
    if "router_id" in update_data and update_data["router_id"]:
        result = await db.execute(select(Router).where(Router.id == update_data["router_id"]))
        router = result.scalar_one_or_none()
        if not router:
            raise BadRequestError("Router no encontrado")

    # Determine final values after update
    final_router_id = update_data.get("router_id", contrato.router_id)
    final_ip_asignada = update_data.get("ip_asignada", contrato.ip_asignada)
    final_tipo_conexion = update_data.get("tipo_conexion", contrato.tipo_conexion)
    final_pppoe_usuario = update_data.get("pppoe_usuario", contrato.pppoe_usuario)

    # Validate connection type requirements
    if final_tipo_conexion == TipoConexion.IPOE:
        # Validate IP is not already assigned to another contract on the same router
        if final_router_id and final_ip_asignada:
            result = await db.execute(
                select(Contrato)
                .where(Contrato.router_id == final_router_id)
                .where(Contrato.ip_asignada == final_ip_asignada)
                .where(Contrato.id != contrato_id)
            )
            existing_contrato = result.scalar_one_or_none()
            if existing_contrato:
                raise BadRequestError(
                    f"La IP {final_ip_asignada} ya está asignada al contrato {existing_contrato.numero_contrato}"
                )

    elif final_tipo_conexion == TipoConexion.PPPOE:
        # Validate PPPoE username is not already in use
        if final_router_id and final_pppoe_usuario:
            result = await db.execute(
                select(Contrato)
                .where(Contrato.router_id == final_router_id)
                .where(Contrato.pppoe_usuario == final_pppoe_usuario)
                .where(Contrato.tipo_conexion == TipoConexion.PPPOE)
                .where(Contrato.id != contrato_id)
            )
            existing_pppoe = result.scalar_one_or_none()
            if existing_pppoe:
                raise BadRequestError(
                    f"El usuario PPPoE '{final_pppoe_usuario}' ya está en uso en el contrato {existing_pppoe.numero_contrato}"
                )

    # Encrypt PPPoE password if being updated
    if "pppoe_password" in update_data and update_data["pppoe_password"]:
        update_data["pppoe_password"] = encryption_service.encrypt(update_data["pppoe_password"])

    # ========== CLEANUP LOGIC: Detect changes that require MikroTik cleanup ==========

    # Detect various types of changes
    tipo_conexion_changed = "tipo_conexion" in update_data and update_data["tipo_conexion"] != contrato.tipo_conexion
    router_changed = "router_id" in update_data and update_data["router_id"] != contrato.router_id
    ip_changed = "ip_asignada" in update_data and update_data["ip_asignada"] != contrato.ip_asignada
    pppoe_usuario_changed = "pppoe_usuario" in update_data and update_data["pppoe_usuario"] != contrato.pppoe_usuario

    was_pppoe = contrato.tipo_conexion == TipoConexion.PPPOE
    was_ipoe = contrato.tipo_conexion == TipoConexion.IPOE
    now_ipoe = final_tipo_conexion == TipoConexion.IPOE
    now_pppoe = final_tipo_conexion == TipoConexion.PPPOE

    # Get old router if it exists and is active (for cleanup)
    old_router = None
    old_mikrotik = None
    if contrato.router_id:
        result = await db.execute(select(Router).where(Router.id == contrato.router_id))
        old_router = result.scalar_one_or_none()
        if old_router and old_router.is_active:
            try:
                password = decrypt_router_password(old_router)
                old_mikrotik = MikroTikService(
                    host=old_router.ip,
                    username=old_router.usuario,
                    password=password,
                    port=old_router.puerto,
                    ssl=old_router.ssl,
                )
            except Exception as e:
                logger.error(f"Failed to connect to old router for cleanup: {str(e)}")

    # Execute cleanup operations
    try:
        if old_mikrotik:
            # Case 1: Connection type changed (PPPoE ↔ IPoE)
            if tipo_conexion_changed:
                if was_pppoe and now_ipoe and contrato.pppoe_usuario:
                    logger.warning(f"[TYPE_CHANGE] PPPoE → IPoE: Removing PPP secret {contrato.pppoe_usuario}")
                    await old_mikrotik.remove_ppp_secret(contrato.pppoe_usuario)
                    logger.warning(f"✓ Removed PPP secret {contrato.pppoe_usuario}")

                elif was_ipoe and now_pppoe and contrato.ip_asignada:
                    logger.warning(f"[TYPE_CHANGE] IPoE → PPPoE: Removing address-list entries for {contrato.ip_asignada}")
                    await old_mikrotik.remove_all_for_address(contrato.ip_asignada)
                    logger.warning(f"✓ Removed address-list entries for {contrato.ip_asignada}")

            # Case 2: IP changed (IPoE only, same connection type)
            elif not tipo_conexion_changed and was_ipoe and ip_changed and contrato.ip_asignada:
                logger.warning(f"[IP_CHANGE] IPoE: Removing old IP {contrato.ip_asignada} from address-lists")
                await old_mikrotik.remove_all_for_address(contrato.ip_asignada)
                logger.warning(f"✓ Removed old IP {contrato.ip_asignada} from address-lists")

            # Case 3: PPPoE usuario changed (PPPoE only, same connection type)
            elif not tipo_conexion_changed and was_pppoe and pppoe_usuario_changed and contrato.pppoe_usuario:
                logger.warning(f"[USER_CHANGE] PPPoE: Removing old secret {contrato.pppoe_usuario}")
                await old_mikrotik.remove_ppp_secret(contrato.pppoe_usuario)
                logger.warning(f"✓ Removed old PPP secret {contrato.pppoe_usuario}")

            # Case 4: Router changed (remove from old router, will add to new in sync)
            if router_changed:
                if was_ipoe and contrato.ip_asignada:
                    logger.warning(f"[ROUTER_CHANGE] IPoE: Removing IP {contrato.ip_asignada} from old router")
                    await old_mikrotik.remove_all_for_address(contrato.ip_asignada)
                    logger.warning(f"✓ Removed IP from old router")

                elif was_pppoe and contrato.pppoe_usuario:
                    logger.warning(f"[ROUTER_CHANGE] PPPoE: Removing secret {contrato.pppoe_usuario} from old router")
                    await old_mikrotik.remove_ppp_secret(contrato.pppoe_usuario)
                    logger.warning(f"✓ Removed secret from old router")

    except Exception as e:
        logger.error(f"Failed to clean up old MikroTik config: {str(e)}")
        # Don't fail the update, just log the error

    for key, value in update_data.items():
        setattr(contrato, key, value)
    await db.flush()
    await db.refresh(contrato)

    logger.warning(f"After update - router_id: {contrato.router_id}, ip_asignada: {contrato.ip_asignada}, estado: {contrato.estado}")
    logger.warning(f"Calling _sync_mikrotik...")

    # Sync with MikroTik (will raise exception if router is offline/inactive)
    await _sync_mikrotik(db, contrato)

    logger.warning(f"=== UPDATE_CONTRATO END ===")
    return await get_contrato(db, contrato_id)


async def upload_pdf_firmado(
    db: AsyncSession, contrato_id: uuid.UUID, file: UploadFile
) -> Contrato:
    """Upload signed PDF for contract"""
    contrato = await get_contrato(db, contrato_id)

    # Validate PDF file
    if not file.filename.endswith(".pdf"):
        raise BadRequestError("El archivo debe ser PDF")

    # Create directory if not exists
    upload_dir = "/app/uploads/contratos/firmados"
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_path = f"{upload_dir}/{contrato.numero_contrato}_firmado.pdf"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Update contrato
    contrato.pdf_firmado_path = file_path
    await db.flush()

    return contrato
