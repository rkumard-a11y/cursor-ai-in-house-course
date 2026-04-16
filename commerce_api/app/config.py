import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "commerce-dev-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URI", f"sqlite:///{BASE_DIR / 'commerce.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "commerce-jwt-dev")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "true").lower() in ("1", "true", "yes")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    # Callable limit for GET /api/products (see products blueprint)
    PRODUCTS_LIST_LIMIT = os.getenv("PRODUCTS_LIST_LIMIT", "200 per minute")
    TESTING = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SECRET_KEY = "test-secret-" + "a" * 40
    JWT_SECRET_KEY = "test-jwt-" + "b" * 40
    RATELIMIT_ENABLED = False
    PRODUCTS_LIST_LIMIT = "10000 per second"
    ENABLE_BOOM_ROUTE = True


class StrictRateTestConfig(TestConfig):
    """Rate limiter on for product list stress tests."""

    RATELIMIT_ENABLED = True
    PRODUCTS_LIST_LIMIT = "3 per minute"
