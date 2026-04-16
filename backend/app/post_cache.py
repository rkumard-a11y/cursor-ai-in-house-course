"""Redis-backed cache for post list/detail responses."""

from __future__ import annotations

import json
from typing import Any

from flask import current_app

LIST_VERSION_KEY = "blog:posts:list_ver"


def _redis():
    return current_app.extensions.get("redis")


def _list_ver(redis_client) -> str:
    v = redis_client.get(LIST_VERSION_KEY)
    return "0" if v is None else str(v)


def list_page_cache_key(page: int) -> str:
    r = _redis()
    if r is None:
        return ""
    return f"blog:posts:list:{_list_ver(r)}:{page}"


def detail_cache_key(post_id: int) -> str:
    return f"blog:post:detail:{post_id}"


def get_cached_post_list(page: int) -> dict[str, Any] | None:
    r = _redis()
    if r is None:
        return None
    key = list_page_cache_key(page)
    if not key:
        return None
    raw = r.get(key)
    if raw is None:
        return None
    return json.loads(raw)


def set_cached_post_list(page: int, payload: dict[str, Any]) -> None:
    r = _redis()
    if r is None:
        return
    key = list_page_cache_key(page)
    if not key:
        return
    ttl = int(current_app.config.get("CACHE_POST_LIST_TTL", 300))
    r.setex(key, ttl, json.dumps(payload))


def get_cached_post_detail(post_id: int) -> dict[str, Any] | None:
    r = _redis()
    if r is None:
        return None
    raw = r.get(detail_cache_key(post_id))
    if raw is None:
        return None
    return json.loads(raw)


def set_cached_post_detail(post_id: int, payload: dict[str, Any]) -> None:
    r = _redis()
    if r is None:
        return
    ttl = int(current_app.config.get("CACHE_POST_DETAIL_TTL", 300))
    r.setex(detail_cache_key(post_id), ttl, json.dumps(payload))


def invalidate_post_caches(post_id: int | None = None) -> None:
    """Invalidate list caches (version bump) and optionally a single-post detail key."""
    r = _redis()
    if r is None:
        return
    if post_id is not None:
        r.delete(detail_cache_key(post_id))
    r.incr(LIST_VERSION_KEY)
