"""Role-based access (admin vs customer)."""

import pytest


@pytest.mark.authz
def test_list_users_forbidden_for_customer(client, customer_headers):
    r = client.get("/api/users", headers=customer_headers)
    assert r.status_code == 403


@pytest.mark.authz
def test_list_users_ok_for_admin(client, admin_headers):
    r = client.get("/api/users", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.get_json()["items"]) >= 2


@pytest.mark.authz
def test_customer_can_read_own_user(client, customer_headers):
    r = client.get("/api/users/2", headers=customer_headers)
    assert r.status_code == 200
    assert r.get_json()["user"]["email"] == "customer@commerce.test"


@pytest.mark.authz
def test_customer_cannot_read_other_user(client, customer_headers):
    r = client.get("/api/users/1", headers=customer_headers)
    assert r.status_code == 403


@pytest.mark.authz
def test_create_product_forbidden_customer(client, customer_headers):
    r = client.post(
        "/api/products",
        headers=customer_headers,
        json={
            "sku": "X-1",
            "name": "X",
            "price_cents": 100,
            "stock": 1,
        },
    )
    assert r.status_code == 403


@pytest.mark.authz
def test_delete_order_requires_admin(client, customer_headers):
    r = client.delete("/api/orders/999", headers=customer_headers)
    assert r.status_code in (403, 404)
