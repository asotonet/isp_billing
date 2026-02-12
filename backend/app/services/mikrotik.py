"""
MikroTik RouterOS integration service using librouteros
Manages address-lists for client access control
"""
import ipaddress
import logging
import ssl
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
                # Create SSL context for secure connection to MikroTik
                # MikroTik RouterOS 6.43+ supports TLS 1.2+
                ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                # Set TLS 1.2 as minimum (MikroTik requirement)
                ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
                # Allow all cipher suites at security level 0 for MikroTik compatibility
                # MikroTik may use older cipher suites that require lower security level
                ssl_context.set_ciphers('ALL:@SECLEVEL=0')

                api = librouteros.connect(
                    host=self.host,
                    username=self.username,
                    password=self.password,
                    port=self.port,
                    ssl_wrapper=ssl_context.wrap_socket,
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

    # ========== IP Pool Management ==========

    async def create_or_update_ip_pool(
        self,
        pool_name: str,
        cidr_ranges: list[str]
    ) -> bool:
        """
        Create or update IP pool from CIDR ranges

        Args:
            pool_name: Name of the pool (e.g., "pool-router-nombre")
            cidr_ranges: List of CIDR ranges (e.g., ["192.168.1.0/24", "10.0.0.0/24"])

        Returns:
            True if successful, False otherwise
        """
        try:
            api = await self._connect()
            try:
                ip_pool = api.path("/ip/pool")

                # Check if pool exists
                all_pools = list(ip_pool)
                existing_pool = [p for p in all_pools if p.get("name") == pool_name]

                # Convert CIDR ranges to IP ranges for MikroTik
                # Example: 192.168.1.0/24 -> 192.168.1.2-192.168.1.254
                ip_ranges = []
                for cidr in cidr_ranges:
                    try:
                        network = ipaddress.ip_network(cidr, strict=False)
                        # Skip network and broadcast addresses
                        usable_ips = list(network.hosts())
                        if usable_ips:
                            first_ip = str(usable_ips[0])
                            last_ip = str(usable_ips[-1])
                            ip_ranges.append(f"{first_ip}-{last_ip}")
                    except ValueError as e:
                        logger.error(f"Invalid CIDR {cidr}: {str(e)}")
                        continue

                if not ip_ranges:
                    logger.error(f"No valid IP ranges generated from CIDRs: {cidr_ranges}")
                    return False

                # Join ranges with comma
                ranges_str = ",".join(ip_ranges)

                if existing_pool:
                    # Update existing pool
                    pool_id = existing_pool[0][".id"]
                    ip_pool.update(**{
                        ".id": pool_id,
                        "ranges": ranges_str
                    })
                    logger.info(f"Updated IP pool {pool_name} with ranges: {ranges_str}")
                else:
                    # Create new pool
                    ip_pool.add(**{
                        "name": pool_name,
                        "ranges": ranges_str,
                        "comment": "ISP Billing System - Auto-generated from CIDR"
                    })
                    logger.info(f"Created IP pool {pool_name} with ranges: {ranges_str}")

                return True
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to create/update IP pool {pool_name}: {str(e)}")
            return False

    async def pool_exists(self, pool_name: str) -> bool:
        """
        Check if IP pool exists in MikroTik

        Args:
            pool_name: Name of the pool

        Returns:
            True if pool exists, False otherwise
        """
        try:
            api = await self._connect()
            try:
                ip_pool = api.path("/ip/pool")
                all_pools = list(ip_pool)
                return any(p.get("name") == pool_name for p in all_pools)
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to check pool {pool_name}: {str(e)}")
            return False

    # ========== PPPoE Management ==========

    async def create_or_update_ppp_profile(
        self,
        profile_name: str,
        velocidad_bajada_mbps: float,
        velocidad_subida_mbps: float,
        local_address: str | None = None,
        remote_address: str | None = None
    ) -> bool:
        """
        Create or update PPP profile for a plan

        Args:
            profile_name: Name of the profile (e.g., "PLAN-50MB")
            velocidad_bajada_mbps: Download speed in Mbps
            velocidad_subida_mbps: Upload speed in Mbps
            local_address: Local IP address (optional, MikroTik will use default if not specified)
            remote_address: Remote IP address or pool name (optional, MikroTik will use default if not specified)

        Returns:
            True if successful, False otherwise
        """
        try:
            api = await self._connect()
            try:
                ppp_profile = api.path("/ppp/profile")

                # Check if profile exists
                all_profiles = list(ppp_profile)
                existing_profile = [p for p in all_profiles if p.get("name") == profile_name]

                # Format rate limit: "upload/download" in bits per second
                # MikroTik expects format like "10M/50M" for 10Mbps upload / 50Mbps download
                # Convert to int to avoid decimals (10.00 -> 10)
                upload_speed = int(velocidad_subida_mbps)
                download_speed = int(velocidad_bajada_mbps)
                rate_limit = f"{upload_speed}M/{download_speed}M"

                if existing_profile:
                    # Update existing profile
                    profile_id = existing_profile[0][".id"]
                    update_data = {
                        ".id": profile_id,
                        "rate-limit": rate_limit
                    }

                    # Update local/remote address if provided
                    if local_address:
                        update_data["local-address"] = local_address
                    if remote_address:
                        update_data["remote-address"] = remote_address

                    ppp_profile.update(**update_data)
                    logger.info(f"Updated PPP profile {profile_name} with rate-limit={rate_limit}, local-address={local_address}, remote-address={remote_address}")
                else:
                    # Create new profile - only include network parameters if provided
                    profile_data = {
                        "name": profile_name,
                        "rate-limit": rate_limit,
                        "comment": "ISP Billing System - Auto-generated"
                    }

                    # Only add local/remote address if specified to avoid pool errors
                    if local_address:
                        profile_data["local-address"] = local_address
                    if remote_address:
                        profile_data["remote-address"] = remote_address

                    ppp_profile.add(**profile_data)
                    logger.info(f"Created PPP profile {profile_name} with rate-limit {rate_limit}")

                return True
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to create/update PPP profile {profile_name}: {str(e)}")
            return False

    async def add_ppp_secret(
        self,
        username: str,
        password: str,
        profile_name: str,
        disabled: bool = False,
        comment: str | None = None,
        remote_address: str | None = None
    ) -> bool:
        """
        Create or update PPP secret (PPPoE user)

        Args:
            username: PPPoE username
            password: PPPoE password
            profile_name: PPP profile to use
            disabled: Whether the user should be disabled
            comment: Optional comment
            remote_address: Fixed IP address for this specific user (optional)

        Returns:
            True if successful, False otherwise
        """
        try:
            api = await self._connect()
            try:
                ppp_secret = api.path("/ppp/secret")

                # Check if secret exists
                all_secrets = list(ppp_secret)
                existing_secret = [s for s in all_secrets if s.get("name") == username]

                if existing_secret:
                    # Update existing secret
                    secret_id = existing_secret[0][".id"]
                    update_data = {
                        ".id": secret_id,
                        "password": password,
                        "profile": profile_name,
                        "service": "pppoe",
                        "disabled": "yes" if disabled else "no"
                    }
                    if comment:
                        update_data["comment"] = comment
                    if remote_address:
                        update_data["remote-address"] = remote_address

                    ppp_secret.update(**update_data)
                    logger.info(f"Updated PPP secret for user {username} (disabled={disabled}, remote-address={remote_address})")
                else:
                    # Create new secret
                    add_data = {
                        "name": username,
                        "password": password,
                        "profile": profile_name,
                        "service": "pppoe",
                        "disabled": "yes" if disabled else "no",
                        "comment": comment or "ISP Billing System"
                    }
                    if remote_address:
                        add_data["remote-address"] = remote_address

                    ppp_secret.add(**add_data)
                    logger.info(f"Created PPP secret for user {username} with profile {profile_name} (remote-address={remote_address})")

                return True
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to add/update PPP secret for {username}: {str(e)}")
            return False

    async def remove_ppp_secret(self, username: str) -> bool:
        """
        Remove PPP secret (PPPoE user)

        Args:
            username: PPPoE username to remove

        Returns:
            True if successful, False otherwise
        """
        try:
            api = await self._connect()
            try:
                ppp_secret = api.path("/ppp/secret")

                # Find secret
                all_secrets = list(ppp_secret)
                matching_secrets = [s for s in all_secrets if s.get("name") == username]

                if not matching_secrets:
                    logger.info(f"No PPP secret found for user {username}")
                    return True

                # Remove all matching secrets (should only be one)
                for secret in matching_secrets:
                    secret_id = secret.get(".id")
                    ppp_secret.remove(secret_id)
                    logger.info(f"Removed PPP secret for user {username}")

                return True
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to remove PPP secret for {username}: {str(e)}")
            return False

    async def update_ppp_secret_status(self, username: str, disabled: bool) -> bool:
        """
        Enable or disable PPP secret (for suspension/activation)

        Args:
            username: PPPoE username
            disabled: True to disable (suspend), False to enable (activate)

        Returns:
            True if successful, False otherwise
        """
        try:
            api = await self._connect()
            try:
                ppp_secret = api.path("/ppp/secret")

                # Find secret
                all_secrets = list(ppp_secret)
                matching_secrets = [s for s in all_secrets if s.get("name") == username]

                if not matching_secrets:
                    logger.warning(f"No PPP secret found for user {username}")
                    return False

                # Update status
                secret_id = matching_secrets[0][".id"]
                ppp_secret.update(**{
                    ".id": secret_id,
                    "disabled": "yes" if disabled else "no"
                })
                status = "disabled" if disabled else "enabled"
                logger.info(f"PPP secret for user {username} {status}")

                return True
            finally:
                api.close()
        except Exception as e:
            logger.error(f"Failed to update PPP secret status for {username}: {str(e)}")
            return False
