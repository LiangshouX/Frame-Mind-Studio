"""API key encryption/decryption with Fernet."""

from cryptography.fernet import Fernet
from app.core.config import get_settings


def _get_fernet() -> Fernet:
    settings = get_settings()
    key = settings.fernet_key
    if not key:
        key = Fernet.generate_key().decode()
        # In production, write back to .env; for dev, just use in-memory
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_api_key(key: str) -> str:
    return _get_fernet().encrypt(key.encode()).decode()


def decrypt_api_key(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()


def mask_api_key(key: str) -> str:
    """Return masked key showing only last 4 chars."""
    if len(key) <= 4:
        return "****"
    return f"{'*' * (len(key) - 4)}{key[-4:]}"
