import logging
import os
import uuid
from datetime import date

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.cliente import Cliente
from app.models.contrato import Contrato, EstadoContrato
from app.models.plan import Plan
from app.models.router import Router
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoCreate, ContratoUpdate
from app.services.mikrotik import MikroTikService
from app.services.routers import decrypt_router_password
from app.utils.pagination import paginate

logger = logging.getLogger(__name__)


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

    Failures are logged but do not raise exceptions (graceful degradation)
    """
    logger.warning(
        f">>> _SYNC_MIKROTIK START <<< contract {contrato.numero_contrato}, "
        f"router_id={contrato.router_id}, ip_asignada={contrato.ip_asignada}, estado={contrato.estado}"
    )

    # Skip if no router or IP assigned
    if not contrato.router_id or not contrato.ip_asignada:
        logger.warning(
            f">>> SKIPPING SYNC <<< contract {contrato.numero_contrato} "
            f"(router_id={contrato.router_id}, ip_asignada={contrato.ip_asignada})"
        )
        return

    try:
        # Load router
        result = await db.execute(select(Router).where(Router.id == contrato.router_id))
        router = result.scalar_one_or_none()
        if not router:
            logger.error(
                f"Router {contrato.router_id} not found for contract {contrato.numero_contrato}"
            )
            return

        if not router.is_active:
            logger.warning(
                f"Router {router.nombre} is inactive, skipping MikroTik sync "
                f"for contract {contrato.numero_contrato}"
            )
            return

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
        comment = f"{nombre_cliente} - {contrato.numero_contrato}"

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

        # Generic address-list names
        list_activos = "ISP-ACTIVOS"
        list_suspendidos = "ISP-SUSPENDIDOS"

        # Sync based on contract state
        logger.warning(f"Estado detected: {contrato.estado}")

        if contrato.estado == EstadoContrato.CANCELADO:
            # Remove from all lists
            logger.warning(f"[CANCELADO] Removing {contrato.ip_asignada} from all lists")
            await mikrotik.remove_all_for_address(contrato.ip_asignada)
            logger.warning(
                f"MikroTik sync: Removed {contrato.ip_asignada} from all lists "
                f"({nombre_cliente} - {contrato.numero_contrato} cancelled)"
            )
        elif contrato.estado == EstadoContrato.SUSPENDIDO:
            # First remove from ALL lists to ensure clean state
            logger.warning(f"[SUSPENDIDO] Cleaning {contrato.ip_asignada} from all lists")
            removed = await mikrotik.remove_all_for_address(contrato.ip_asignada)
            logger.warning(f"Removed result: {removed}")

            # Now add to suspendidos (disabled=no so firewall rule can match)
            logger.warning(f"[SUSPENDIDO] Adding {contrato.ip_asignada} to {list_suspendidos}")
            success = await mikrotik.add_address_list(
                list_suspendidos, contrato.ip_asignada, disabled=False,
                comment=comment
            )
            logger.warning(f"Add result: {success}")

            if success:
                logger.warning(
                    f"✓ MikroTik sync SUCCESS: Suspended {contrato.ip_asignada} "
                    f"({nombre_cliente} - {contrato.numero_contrato})"
                )
            else:
                logger.error(
                    f"✗ MikroTik sync FAILED: Could not suspend {contrato.ip_asignada}"
                )
        elif contrato.estado in [EstadoContrato.ACTIVO, EstadoContrato.PENDIENTE]:
            # First remove from ALL lists to ensure clean state
            logger.warning(f"[ACTIVO] Cleaning {contrato.ip_asignada} from all lists")
            removed = await mikrotik.remove_all_for_address(contrato.ip_asignada)
            logger.warning(f"Removed result: {removed}")

            # Now add to activos
            logger.warning(f"[ACTIVO] Adding {contrato.ip_asignada} to {list_activos}")
            success = await mikrotik.add_address_list(
                list_activos, contrato.ip_asignada, disabled=False,
                comment=comment
            )
            logger.warning(f"Add result: {success}")

            if success:
                logger.warning(
                    f"✓ MikroTik sync SUCCESS: Activated {contrato.ip_asignada} "
                    f"({nombre_cliente} - {contrato.numero_contrato})"
                )
            else:
                logger.error(
                    f"✗ MikroTik sync FAILED: Could not activate {contrato.ip_asignada}"
                )

        logger.warning(f">>> _SYNC_MIKROTIK END <<<")

    except Exception as e:
        logger.exception(
            f"Unexpected error during MikroTik sync for contract "
            f"{contrato.numero_contrato}: {str(e)}"
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

    return await paginate(db, query, page, page_size)


async def get_contrato(db: AsyncSession, contrato_id: uuid.UUID) -> Contrato:
    result = await db.execute(
        select(Contrato)
        .options(selectinload(Contrato.cliente), selectinload(Contrato.plan))
        .where(Contrato.id == contrato_id)
    )
    contrato = result.scalar_one_or_none()
    if not contrato:
        raise NotFoundError("Contrato no encontrado")
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

    # Validate IP is not already assigned to another contract on the same router
    if data.router_id and data.ip_asignada:
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

    contrato = Contrato(
        **data.model_dump(),
        numero_contrato=numero_contrato,
    )
    db.add(contrato)
    await db.flush()
    await db.refresh(contrato)

    # Sync with MikroTik (non-blocking, errors logged)
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

    # Determine final router_id and ip_asignada after update
    final_router_id = update_data.get("router_id", contrato.router_id)
    final_ip_asignada = update_data.get("ip_asignada", contrato.ip_asignada)

    # Validate IP is not already assigned to another contract on the same router
    if final_router_id and final_ip_asignada:
        result = await db.execute(
            select(Contrato)
            .where(Contrato.router_id == final_router_id)
            .where(Contrato.ip_asignada == final_ip_asignada)
            .where(Contrato.id != contrato_id)  # Exclude current contract
        )
        existing_contrato = result.scalar_one_or_none()
        if existing_contrato:
            raise BadRequestError(
                f"La IP {final_ip_asignada} ya está asignada al contrato {existing_contrato.numero_contrato}"
            )

    for key, value in update_data.items():
        setattr(contrato, key, value)
    await db.flush()
    await db.refresh(contrato)

    logger.warning(f"After update - router_id: {contrato.router_id}, ip_asignada: {contrato.ip_asignada}, estado: {contrato.estado}")
    logger.warning(f"Calling _sync_mikrotik...")

    # Sync with MikroTik (non-blocking, errors logged)
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
