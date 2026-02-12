import uuid
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.plan import Plan
from app.models.contrato import Contrato, TipoConexion
from app.models.router import Router
from app.schemas.common import PaginatedResponse
from app.schemas.plan import PlanCreate, PlanUpdate
from app.services.mikrotik import MikroTikService
from app.services.routers import decrypt_router_password
from app.utils.pagination import paginate

logger = logging.getLogger(__name__)


async def list_planes(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    is_active: bool | None = None,
) -> PaginatedResponse:
    query = select(Plan).order_by(Plan.precio_mensual)

    if is_active is not None:
        query = query.where(Plan.is_active == is_active)

    return await paginate(db, query, page, page_size)


async def get_plan(db: AsyncSession, plan_id: uuid.UUID) -> Plan:
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Plan no encontrado")
    return plan


async def create_plan(db: AsyncSession, data: PlanCreate) -> Plan:
    result = await db.execute(select(Plan).where(Plan.nombre == data.nombre))
    if result.scalar_one_or_none():
        raise ConflictError("Ya existe un plan con ese nombre")

    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return plan


async def update_plan(db: AsyncSession, plan_id: uuid.UUID, data: PlanUpdate) -> Plan:
    plan = await get_plan(db, plan_id)

    update_data = data.model_dump(exclude_unset=True)
    if "nombre" in update_data:
        result = await db.execute(
            select(Plan).where(Plan.nombre == update_data["nombre"], Plan.id != plan_id)
        )
        if result.scalar_one_or_none():
            raise ConflictError("Ya existe un plan con ese nombre")

    # Check if speeds are being updated
    speeds_updated = (
        "velocidad_bajada_mbps" in update_data or "velocidad_subida_mbps" in update_data
    )

    for key, value in update_data.items():
        setattr(plan, key, value)
    await db.flush()
    await db.refresh(plan)

    # If speeds were updated, update PPP profiles in all routers with PPPoE contracts using this plan
    if speeds_updated:
        await _update_ppp_profiles_for_plan(db, plan)

    return plan


async def _update_ppp_profiles_for_plan(db: AsyncSession, plan: Plan) -> None:
    """
    Update PPP profiles in all routers that have active PPPoE contracts using this plan
    """
    try:
        # Find all active PPPoE contracts using this plan
        result = await db.execute(
            select(Contrato)
            .where(Contrato.plan_id == plan.id)
            .where(Contrato.tipo_conexion == TipoConexion.PPPOE)
            .where(Contrato.router_id.isnot(None))
        )
        contratos = result.scalars().all()

        if not contratos:
            logger.info(f"No PPPoE contracts found for plan {plan.nombre}")
            return

        # Group contracts by router to avoid updating the same profile multiple times
        routers_to_update = {}
        for contrato in contratos:
            if contrato.router_id not in routers_to_update:
                routers_to_update[contrato.router_id] = True

        logger.info(
            f"Updating PPP profiles in {len(routers_to_update)} routers for plan {plan.nombre}"
        )

        # Update profile in each router
        for router_id in routers_to_update.keys():
            result = await db.execute(select(Router).where(Router.id == router_id))
            router = result.scalar_one_or_none()

            if not router or not router.is_active:
                logger.warning(f"Router {router_id} not found or inactive, skipping")
                continue

            try:
                # Decrypt router password
                password = decrypt_router_password(router)

                # Initialize MikroTik service
                mikrotik = MikroTikService(
                    host=router.ip,
                    username=router.usuario,
                    password=password,
                    port=router.puerto,
                    ssl=router.ssl,
                )

                # Generate profile name (convert to int to avoid decimals)
                profile_name = f"PLAN-{int(plan.velocidad_bajada_mbps)}MB"

                # Generate pool name based on router
                pool_name = f"pool-{router.nombre.lower().replace(' ', '-')}"

                # Parse CIDR ranges and ensure pool exists
                cidr_ranges = [cidr.strip() for cidr in router.cidr_disponibles.split(",") if cidr.strip()]
                if cidr_ranges:
                    pool_exists = await mikrotik.pool_exists(pool_name)
                    if not pool_exists:
                        logger.info(f"Creating IP pool {pool_name} for router {router.nombre}")
                        await mikrotik.create_or_update_ip_pool(pool_name, cidr_ranges)

                # Update profile with pool
                success = await mikrotik.create_or_update_ppp_profile(
                    profile_name,
                    plan.velocidad_bajada_mbps,
                    plan.velocidad_subida_mbps,
                    remote_address=pool_name if cidr_ranges else None
                )

                if success:
                    logger.info(
                        f"✓ Updated PPP profile {profile_name} in router {router.nombre} "
                        f"({plan.velocidad_subida_mbps}M/{plan.velocidad_bajada_mbps}M)"
                    )
                else:
                    logger.error(f"Failed to update PPP profile {profile_name} in router {router.nombre}")

            except Exception as e:
                logger.error(f"Error updating PPP profile in router {router.nombre}: {str(e)}")
                # Don't raise - continue with other routers

    except Exception as e:
        logger.error(f"Error updating PPP profiles for plan {plan.nombre}: {str(e)}")
        # Don't raise - plan update should succeed even if profile update fails


async def deactivate_plan(db: AsyncSession, plan_id: uuid.UUID) -> Plan:
    plan = await get_plan(db, plan_id)
    plan.is_active = False
    await db.flush()
    await db.refresh(plan)
    return plan


async def get_ppp_profiles_info(db: AsyncSession, plan_id: uuid.UUID) -> dict:
    """
    Get information about PPP profiles for this plan across all routers
    """
    plan = await get_plan(db, plan_id)

    # Find all PPPoE contracts using this plan
    result = await db.execute(
        select(Contrato, Router)
        .join(Router, Contrato.router_id == Router.id)
        .where(Contrato.plan_id == plan_id)
        .where(Contrato.tipo_conexion == TipoConexion.PPPOE)
        .where(Contrato.router_id.isnot(None))
    )
    rows = result.all()

    # Group by router
    routers_info = {}
    total_contracts = 0

    for contrato, router in rows:
        if router.id not in routers_info:
            routers_info[router.id] = {
                "router_id": str(router.id),
                "router_name": router.nombre,
                "router_ip": router.ip,
                "is_online": router.is_online,
                "is_active": router.is_active,
                "contracts_count": 0,
            }
        routers_info[router.id]["contracts_count"] += 1
        total_contracts += 1

    # Convert to int to avoid decimals (10.00 -> 10)
    profile_name = f"PLAN-{int(plan.velocidad_bajada_mbps)}MB"

    return {
        "plan_id": str(plan.id),
        "plan_name": plan.nombre,
        "profile_name": profile_name,
        "velocidad_bajada_mbps": int(plan.velocidad_bajada_mbps),
        "velocidad_subida_mbps": int(plan.velocidad_subida_mbps),
        "total_pppoe_contracts": total_contracts,
        "routers": list(routers_info.values()),
    }


async def sync_ppp_profiles_for_plan(db: AsyncSession, plan_id: uuid.UUID) -> None:
    """
    Manually sync PPP profiles for a plan (public wrapper for _update_ppp_profiles_for_plan)
    """
    plan = await get_plan(db, plan_id)
    await _update_ppp_profiles_for_plan(db, plan)
