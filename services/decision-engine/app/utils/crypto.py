"""AES-256 CBC encryption / decryption for PII fields.

Uses the ``cryptography`` library's high-level Fernet wrapper when the key
is 32 bytes (URL-safe base64 encoded), or raw AES-256-CBC when a hex key is
provided.
"""

from __future__ import annotations

import base64
import os
from typing import Optional

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding as sym_padding
from cryptography.hazmat.backends import default_backend

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_BLOCK_BYTES = 16  # AES block size


def _get_key_bytes() -> bytes:
    """Derive a 32-byte key from the configured hex string."""
    hex_key = settings.AES_ENCRYPTION_KEY
    raw = bytes.fromhex(hex_key)
    if len(raw) not in (16, 24, 32):
        raise ValueError(
            f"AES_ENCRYPTION_KEY must decode to 16, 24, or 32 bytes; got {len(raw)}."
        )
    return raw


def encrypt_pii(plaintext: str) -> str:
    """Encrypt *plaintext* with AES-256-CBC and return a base64 string.

    The output format is ``base64(iv + ciphertext)`` so it can be stored in a
    single database column.
    """
    if not plaintext:
        return ""

    key = _get_key_bytes()
    iv = os.urandom(_BLOCK_BYTES)

    padder = sym_padding.PKCS7(_BLOCK_BYTES * 8).padder()
    padded = padder.update(plaintext.encode("utf-8")) + padder.finalize()

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    return base64.urlsafe_b64encode(iv + ciphertext).decode("ascii")


def decrypt_pii(token: str) -> str:
    """Decrypt a token produced by :func:`encrypt_pii`."""
    if not token:
        return ""

    key = _get_key_bytes()
    raw = base64.urlsafe_b64decode(token)

    iv = raw[:_BLOCK_BYTES]
    ciphertext = raw[_BLOCK_BYTES:]

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()

    unpadder = sym_padding.PKCS7(_BLOCK_BYTES * 8).unpadder()
    plaintext = unpadder.update(padded) + unpadder.finalize()

    return plaintext.decode("utf-8")


def mask_email(email: str) -> str:
    """Return a masked version of an e-mail address for logging.

    Example: ``john.smith@example.com`` → ``j***.s****@example.com``
    """
    if "@" not in email:
        return "***"
    local, domain = email.rsplit("@", 1)
    parts = local.split(".")
    masked_parts = [p[0] + "*" * (len(p) - 1) if p else "*" for p in parts]
    return ".".join(masked_parts) + "@" + domain


def mask_phone(phone: Optional[str]) -> str:
    """Mask a phone number, keeping only the last 4 digits."""
    if not phone:
        return "***"
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) <= 4:
        return "***"
    return "***" + digits[-4:]
