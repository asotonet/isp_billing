"""
Encryption service using Fernet (symmetric encryption)
Used for encrypting/decrypting router passwords in database
"""
import logging

from cryptography.fernet import Fernet
from app.config import settings

logger = logging.getLogger(__name__)


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""

    def __init__(self):
        # Use ENCRYPTION_KEY from settings, or generate a temporary one for dev
        if not settings.ENCRYPTION_KEY:
            logger.warning(
                "ENCRYPTION_KEY not set. Generating temporary key for development. "
                "Set ENCRYPTION_KEY in .env for production!"
            )
            key = Fernet.generate_key()
        else:
            key = settings.ENCRYPTION_KEY
            if isinstance(key, str):
                key = key.encode()

        self.fernet = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string and return encrypted string

        Args:
            plaintext: The string to encrypt

        Returns:
            Encrypted string (base64 encoded)
        """
        if not plaintext:
            raise ValueError("Cannot encrypt empty string")

        encrypted_bytes = self.fernet.encrypt(plaintext.encode())
        return encrypted_bytes.decode()

    def decrypt(self, encrypted: str) -> str:
        """
        Decrypt encrypted string and return plaintext

        Args:
            encrypted: The encrypted string (base64 encoded)

        Returns:
            Decrypted plaintext string
        """
        if not encrypted:
            raise ValueError("Cannot decrypt empty string")

        decrypted_bytes = self.fernet.decrypt(encrypted.encode())
        return decrypted_bytes.decode()


# Singleton instance
encryption_service = EncryptionService()
