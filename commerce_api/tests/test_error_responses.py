"""404 / 400 / 500 error contracts."""

import pytest


@pytest.mark.errors
def test_product_not_found_404(client):
    r = client.get("/api/products/99999")
    assert r.status_code == 404
    assert r.get_json()["code"] == "NOT_FOUND"


@pytest.mark.errors
def test_order_not_found_404(client, admin_headers):
    r = client.get("/api/orders/99999", headers=admin_headers)
    assert r.status_code == 404


@pytest.mark.errors
def test_internal_error_500_boom_route(client):
    r = client.get("/api/health/boom")
    assert r.status_code == 500
    body = r.get_json()
    assert body["code"] == "INTERNAL_ERROR"
