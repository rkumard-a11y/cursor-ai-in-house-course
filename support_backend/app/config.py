import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URI", f"sqlite:///{BASE_DIR / 'support.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_HOURS", "24"))
    )
    BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_PER_MINUTE", "100 per minute")
    RATELIMIT_DEFAULT = os.getenv("RATE_LIMIT_PER_MINUTE", "100 per minute")
    MAIL_BACKEND = os.getenv("MAIL_BACKEND", "log")
    TICKETS_PER_PAGE = 20
    MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
    MAX_ATTACHMENTS = 3
    ALLOWED_ATTACHMENT_EXT = frozenset({".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"})
    REOPEN_WINDOW_DAYS = 7
    SLA_APPROACHING_HOURS = int(os.getenv("SLA_APPROACHING_HOURS", "24"))


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SECRET_KEY = "test-secret-" + "x" * 48
    JWT_SECRET_KEY = "test-jwt-" + "y" * 48
    MAIL_BACKEND = "outbox"
    RATELIMIT_ENABLED = False
