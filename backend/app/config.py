import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URI", f"sqlite:///{BASE_DIR / 'blog.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = False  # exercise default; set timedelta in production
    POSTS_PER_PAGE = 20
    REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    CACHE_POST_LIST_TTL = int(os.getenv("CACHE_POST_LIST_TTL", "300"))
    CACHE_POST_DETAIL_TTL = int(os.getenv("CACHE_POST_DETAIL_TTL", "300"))
    CACHE_DISABLED = os.getenv("CACHE_DISABLED", "").lower() in ("1", "true", "yes")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    CACHE_DISABLED = False
    SECRET_KEY = "test-secret-" + "a" * 48
    JWT_SECRET_KEY = "test-jwt-secret-" + "b" * 48
