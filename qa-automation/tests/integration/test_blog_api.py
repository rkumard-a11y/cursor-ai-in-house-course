"""
Integration smoke against the blog Flask API (optional — requires running server).

Set BASE_URL (default http://127.0.0.1:5000). Tests skip if server unreachable.
"""

import os

import pytest
import requests

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:5000").rstrip("/")


def _reachable() -> bool:
    try:
        r = requests.get(f"{BASE}/api/posts", timeout=2)
        return r.status_code == 200
    except OSError:
        return False


@pytest.mark.skipif(not _reachable(), reason=f"Blog API not reachable at {BASE}")
def test_list_posts_returns_json():
    r = requests.get(f"{BASE}/api/posts", timeout=5)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data or "page" in data
