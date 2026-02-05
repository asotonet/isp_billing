"""
MikroTik RouterOS integration service using librouteros
Manages address-lists for client access control
"""
import logging
from typing import Any

import librouteros
from librouteros.query import Key

from app.schemas.router import RouterTestConnectionResponse

logger = logging.getLogger(__name__)


class MikroTikService:
    """
    Service for interacting with MikroTik RouterOS API

    Address-list naming convention: ISP-{numero_contrato}
    Example: ISP-CTR-20260205-0001
    """

    def __init__(
        self,
        host: str,
        username: str,
        password: str,
        port: int = 8728,
        ssl: bool = False,
    ):
        self.host = host
        self.username = username
        self.password = password
        self.port = port
        self.ssl = ssl

    async def _connect(self) -> librouteros.Api:
        """
        Establish connection to MikroTik router

        Returns:
            librouteros.Api: Connected API instance

        Raises:
            Exception: If connection fails
        """
        try:
            if self.ssl:
                api = librouteros.connect(
                    host=self.host,
                    username=self.username,
                    password=self.password,
                    port=self.port,
                    ssl_wrapper=librouteros.api_ssl.SSLWrapper,
                    timeout=10,
                )
            else:
                api = librouteros.connect(
                    host=self.host,
                    username=self.username,
                    password=self.password,
                    port=self.port,
                    timeout=10,
                )
            return api
        except Exception as e:
            logger.error(f"Failed to connect to MikroTik {self.host}: {str(e)}")
            raise

    async def test_connection(self) -> RouterTestConnectionResponse:
        """
        Test connection to MikroTik and retrieve system identity

        Returns:
            RouterTestConnectionResponse with success status and router version
        """
        try:
            api = await self._connect()
            try:
                # Get system identity and version
                system = api.path("/system/identity")
                identity = list(system)[0]
                router_name = identity.get("name", "Unknown")

                resource = api.path("/system/resource")
                resource_info = list(resource)[0]
                version = resource_info.get("version", "Unknown")

                return RouterTestConnectionResponse(
                    success=True,
                    message=f"Conexión exitosa a {router_name}",
                    router_version=version,
                )
            finally:
                api.close()
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Connection test failed for {self.host}: {error_msg}")
            return RouterTestConnectionResponse(
                success=False,
                message=f"Error de conexión: {error_msg}",
                router_version=None,
            )

    async def add_address_list(
        self, list_name: str, address: str, disabled: bool = False, comment: str = None
    ) -> bool:
        """
        Add or update address-list entry on MikroTik

        Args:
            list_name: Name of the address-list (e.g., "ISP-ACTIVOS", "ISP-SUSPENDIDOS")
            address: IP address to add
            disabled: Whether the entry should be disabled (True for SUSPENDIDO)
            comment: Optional comment for the address-list entry

        Returns:
            True if successful, False otherwise
        """
        logger.warning(f"[MikroTik] add_address_list called: list={list_name}, address={address}, disabled={disabled}")
        try:
            logger.warning(f"[MikroTik] Connecting to {self.host}:{self.port}")
            api = await self._connect()
            try:
                firewall = api.path("/ip/firewall/address-list")

                # Get all entries and filter manually
                logger.warning(f"[MikroTik] Getting all entries to check for duplicates")
                all_entries = list(firewall)
                logger.warning(f"[MikroTik] Total entries: {len(all_entries)}")

                # Check if entry exists
                existing_list = [
                    e for e in all_entries
                    if e.get("list") == list_name and e.get("address") == address
                ]
                logger.warning(f"[MikroTik] Found {len(existing_list)} existing entries for list={list_name}, address={address}")

                if existing_list:
                    # Update existing entry
                    entry_id = existing_list[0][".id"]
                    update_data = {".id": entry_id, "disabled": "yes" if disabled else "no"}
                    if comment:
                        update_data["comment"] = comment
                    logger.warning(f"[MikroTik] Updating entry ID {entry_id}")
                    firewall.update(**update_data)
                    logger.warning(
                        f"[MikroTik] Updated address-list {list_name} for {address} (disabled={disabled})"
                    )
                else:
                    # Add new entry
                    add_data = {
                        "list": list_name,
                        "address": address,
                        "disabled": "yes" if disabled else "no",
                        "comment": comment or f"ISP Billing System",
                    }
                    logger.warning(f"[MikroTik] Adding new entry with data: {add_data}")
                    firewall.add(**add_data)
                    logger.warning(
                        f"[MikroTik] Added address-list {list_name} for {address} (disabled={disabled})"
                    )

                return True
            finally:
                api.close()
        except Exception as e:
            logger.exception(
                f"[MikroTik] Failed to add/update address-list {list_name} for {address}: {str(e)}"
            )
            return False

    async def update_address_list(
        self, list_name: str, address: str, disabled: bool
    ) -> bool:
        """
        Update existing address-list entry (change disabled status)

        Args:
            list_name: Name of the address-list
            address: IP address
            disabled: New disabled status

        Returns:
            True if successful, False otherwise
        """
        # Same implementation as add_address_list (it handles both add and update)
        return await self.add_address_list(list_name, address, disabled)

    async def remove_address_list(self, list_name: str, address: str) -> bool:
        """
        Remove address-list entry from MikroTik

        Args:
            list_name: Name of the address-list
            address: IP address to remove

        Returns:
            True if successful, False otherwise
        """
        try:
            api = await self._connect()
            try:
                firewall = api.path("/ip/firewall/address-list")

                # Find entries matching list name and address
                entries = firewall.select(Key("list") == list_name, Key("address") == address)
                entries_list = list(entries)

                logger.info(f"Found {len(entries_list)} entries for {list_name} with address {address}")

                if not entries_list:
                    logger.info(
                        f"No address-list entry to remove for {list_name} with address {address}"
                    )
                    return True  # Not an error if it doesn't exist

                # Remove all matching entries
                for entry in entries_list:
                    logger.info(f"Removing entry ID {entry['.id']} from {list_name}")
                    firewall.remove(entry[".id"])
                    logger.info(f"Successfully removed address-list {list_name} for {address}")

                return True
            finally:
                api.close()
        except Exception as e:
            logger.error(
                f"Failed to remove address-list {list_name} for {address}: {str(e)}"
            )
            return False

    async def remove_all_for_address(self, address: str) -> bool:
        """
        Remove all address-list entries for a given IP address (from all lists)

        Args:
            address: IP address to remove from all lists

        Returns:
            True if successful, False otherwise
        """
        logger.warning(f"[MikroTik] remove_all_for_address called for {address}")
        try:
            logger.warning(f"[MikroTik] Connecting to {self.host}:{self.port}")
            api = await self._connect()
            try:
                firewall = api.path("/ip/firewall/address-list")

                # Get ALL entries and filter manually
                logger.warning(f"[MikroTik] Getting all address-list entries")
                all_entries = list(firewall)
                logger.warning(f"[MikroTik] Total entries in firewall: {len(all_entries)}")

                # Filter by address
                matching_entries = [e for e in all_entries if e.get("address") == address]
                logger.warning(f"[MikroTik] Found {len(matching_entries)} entries matching address {address}")

                if not matching_entries:
                    logger.warning(f"[MikroTik] No entries to remove for address {address}")
                    return True

                # Remove all matching entries
                for entry in matching_entries:
                    list_name = entry.get("list", "unknown")
                    entry_id = entry.get(".id", "unknown")
                    logger.warning(f"[MikroTik] Removing {address} from list {list_name} (ID: {entry_id})")
                    firewall.remove(entry_id)

                logger.warning(f"[MikroTik] Successfully removed {len(matching_entries)} entries for address {address}")
                return True
            finally:
                api.close()
        except Exception as e:
            logger.exception(f"[MikroTik] Failed to remove all entries for {address}: {str(e)}")
            return False

    async def get_address_list(self, list_name: str) -> list[dict[str, Any]]:
        """
        Get all entries in an address-list

        Args:
            list_name: Name of the address-list

        Returns:
            List of address-list entries
        """
        try:
            api = await self._connect()
            try:
                firewall = api.path("/ip/firewall/address-list")
                entries = firewall.select(Key("list") == list_name)
                return list(entries)
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to get address-list {list_name}: {str(e)}")
            return []
