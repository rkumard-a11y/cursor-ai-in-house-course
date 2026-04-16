"""In-process response time smoke checks (< 500 ms per request)."""

import time

import pytest


@pytest.mark.performance
@pytest.mark.parametrize(
    "path,kwargs",
    [
        ("/api/products", {}),
        ("/api/products/1", {}),
        ("/api/health", {}),
    ],
)
def test_public_endpoints_under_500ms(client, path, kwargs):
    t0 = time.perf_counter()
    r = client.get(path, **kwargs)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert r.status_code == 200, (path, r.get_json())
    assert elapsed_ms < 500, f"{path} took {elapsed_ms:.1f}ms"


@pytest.mark.performance
def test_authenticated_list_users_under_500ms(client, admin_headers):
    t0 = time.perf_counter()
    r = client.get("/api/users", headers=admin_headers)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert r.status_code == 200
    assert elapsed_ms < 500
