"""NFR-005 bcrypt password hashing (cost factor 12+)."""

from __future__ import annotations

import bcrypt
from flask import current_app


def hash_password(password: str) -> str:
    rounds = int(current_app.config.get("BCRYPT_ROUNDS", 12))
    salt = bcrypt.gensalt(rounds=rounds)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )
    except ValueError:
        return False
