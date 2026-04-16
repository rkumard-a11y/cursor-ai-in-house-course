"""Static and factory mock data for profile / auth unittest scenarios."""

from __future__ import annotations

import uuid


def unique_email(prefix: str = "user") -> str:
    return f"{prefix}.{uuid.uuid4().hex[:8]}@unittest.example.com"


# REG-P-01 style payloads
VALID_PASSWORD = "Str0ng!Pass9"
VALID_NAME = "Jane Doe"

# Weak / policy violations (REG-N-05)
WEAK_PASSWORD_COMMON = "password"
WEAK_PASSWORD_NO_DIGIT = "OnlyLetters!"

# XSS / injection samples (REG-N-06, PROF-S-02) — use only against test API
XSS_NAME = "<script>alert(1)</script>Bob"
XSS_BIO = '<img src=x onerror=alert(1)>hello'

# Profile PATCH
VALID_AVATAR_URL = "https://cdn.example.com/avatar.png"
INVALID_AVATAR_URL = "not-a-url"

# Account deletion (DEL-P-01)
DELETE_CONFIRM_PHRASE = "DELETE"
