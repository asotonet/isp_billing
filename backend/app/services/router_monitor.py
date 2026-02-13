"""
Router uptime monitoring service.
Checks router connectivity periodically and updates status in database.
"""
import asyncio
import logging
from datetime import datetime
from typing import List, Tuple, Optional
import socket
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.router import Router
from app.services.mikrotik import MikroTikService
from app.core.encryption import encryption_service
from app.services.router_events import create_router_event

logger = logging.getLogger(__name__)

# Monitoring interval in seconds (default: 30 seconds)
MONITOR_INTERVAL = 30

# Ping timeout in seconds
PING_TIMEOUT = 5


def check_router_connectivity(ip: str, port: int, timeout: int = PING_TIMEOUT) -> bool:
    """
    Check if router is reachable by attempting a TCP connection.
    Returns True if connection successful, False otherwise.
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((ip, port))
        sock.close()
        return result == 0
    except Exception as e:
        logger.debug(f"Connection check failed for {ip}:{port} - {str(e)}")
        return False


async def get_router_info(router_obj: Router) -> Tuple[Optional[str], Optional[str]]:
    """
    Get router identity and version from MikroTik API.
    Returns tuple of (identity, version) or (None, None) if failed.
    """
    try:
        password = encryption_service.decrypt(router_obj.hashed_password)
        mikrotik = MikroTikService(
            router_obj.ip,
            router_obj.usuario,
            password,
            router_obj.puerto,
            router_obj.ssl
        )

        # Test connection which returns identity and version
        result = await mikrotik.test_connection()
        if result.success:
            # Extract identity and version from the response
            # The identity is typically in the message, and version in router_version field
            identity = None
            if result.message:
                # Remove common prefixes to extract just the router identity
                identity = result.message
                for prefix in ["Conexión exitosa con ", "Conexión exitosa a ", "Conectado a "]:
                    if identity.startswith(prefix):
                        identity = identity[len(prefix):].strip()
                        break
            version = result.router_version
            return identity, version
        else:
            return None, None
    except Exception as e:
        logger.debug(f"Failed to get router info from API: {str(e)}")
        return None, None


async def check_single_router(router_id: uuid.UUID, router_ip: str, router_puerto: int, router_nombre: str) -> None:
    """Check a single router's connectivity and update database."""
    try:
        # Check connectivity
        is_online = check_router_connectivity(router_ip, router_puerto)
        now = datetime.utcnow()

        logger.debug(f"Checked router {router_nombre}: {'ONLINE' if is_online else 'OFFLINE'}, updating database...")

        # Update in database with a fresh session
        async with async_session() as db:
            result = await db.execute(select(Router).where(Router.id == router_id))
            router = result.scalar_one_or_none()

            if router:
                # Store previous values to detect changes
                old_is_online = router.is_online
                old_identity = router.identity
                old_version = router.routeros_version

                router.is_online = is_online
                router.last_check_at = now

                # Track state change (online/offline)
                if old_is_online is not None and old_is_online != is_online:
                    if is_online:
                        await create_router_event(
                            db, router_id, "ONLINE",
                            f"Router {router_nombre} se conectó",
                            {"ip": router_ip}
                        )
                        logger.info(f"Router {router_nombre} ({router_ip}) came ONLINE")
                    else:
                        await create_router_event(
                            db, router_id, "OFFLINE",
                            f"Router {router_nombre} se desconectó",
                            {"ip": router_ip}
                        )
                        logger.warning(f"Router {router_nombre} ({router_ip}) went OFFLINE")

                if is_online:
                    router.last_online_at = now

                    # Get router info from API (identity and version)
                    identity, version = await get_router_info(router)

                    if identity or version:
                        router.identity = identity
                        router.routeros_version = version

                        # Log and record if identity changed
                        if old_identity and identity and old_identity != identity:
                            await create_router_event(
                                db, router_id, "IDENTITY_CHANGED",
                                f"Cambio de identity: {old_identity} → {identity}",
                                {"old_value": old_identity, "new_value": identity}
                            )
                            logger.warning(f"Router {router_nombre} identity CHANGED: {old_identity} -> {identity}")

                        # Log and record if version changed
                        if old_version and version and old_version != version:
                            await create_router_event(
                                db, router_id, "VERSION_CHANGED",
                                f"Actualización RouterOS: {old_version} → {version}",
                                {"old_value": old_version, "new_value": version}
                            )
                            logger.warning(f"Router {router_nombre} version CHANGED: {old_version} -> {version}")

                    logger.info(f"Router {router_nombre} ({router_ip}) is ONLINE - Identity: {identity}, Version: {version}")
                else:
                    logger.warning(f"Router {router_nombre} ({router_ip}) is OFFLINE")

                await db.commit()
                logger.debug(f"Router {router_nombre} status committed to database")
            else:
                logger.error(f"Router {router_id} not found in database")

    except Exception as e:
        logger.error(f"Error checking router {router_nombre}: {str(e)}", exc_info=True)


async def monitor_routers() -> None:
    """
    Main monitoring loop that checks all active routers periodically.
    """
    logger.info(f"Starting router monitoring service (interval: {MONITOR_INTERVAL}s)")

    while True:
        try:
            async with async_session() as db:
                # Get all active routers
                result = await db.execute(
                    select(Router).where(Router.is_active == True)
                )
                routers = result.scalars().all()

                if not routers:
                    logger.debug("No active routers to monitor")
                else:
                    logger.info(f"Checking {len(routers)} routers...")

                    # Check all routers in parallel
                    tasks = []
                    for router in routers:
                        # Pass router info, not the object itself, to avoid session issues
                        tasks.append(check_single_router(
                            router.id,  # Already a UUID, don't convert to string
                            router.ip,
                            router.puerto,
                            router.nombre
                        ))

                    # Wait for all checks to complete
                    if tasks:
                        results = await asyncio.gather(*tasks, return_exceptions=True)
                        # Log any exceptions that occurred
                        for i, result in enumerate(results):
                            if isinstance(result, Exception):
                                logger.error(f"Task {i} failed with exception: {result}", exc_info=result)

                    logger.info(f"Completed checking {len(routers)} routers")

        except Exception as e:
            logger.error(f"Error in monitoring loop: {str(e)}", exc_info=True)

        # Wait before next check
        await asyncio.sleep(MONITOR_INTERVAL)


async def start_monitoring() -> None:
    """Start the monitoring service in the background."""
    asyncio.create_task(monitor_routers())
    logger.info("Router monitoring task started")
