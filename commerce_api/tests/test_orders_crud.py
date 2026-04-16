"""Order CRUD and ownership rules."""

import pytest


@pytest.mark.crud
def test_create_order_customer(client, customer_headers):
    r = client.post(
        "/api/orders",
        headers=customer_headers,
        json={"lines": [{"product_id": 1, "quantity": 1}]},
    )
    assert r.status_code == 201
    body = r.get_json()
    assert body["order"]["status"] == "placed"
    assert body["order"]["lines"][0]["product_id"] == 1


@pytest.mark.crud
def test_list_orders_scoped_customer(client, customer_headers):
    r = client.get("/api/orders", headers=customer_headers)
    assert r.status_code == 200
    for item in r.get_json()["items"]:
        assert item["user_id"] == 2


@pytest.mark.crud
def test_get_order_forbidden_other_user(client, admin_headers, customer_headers):
    r0 = client.post(
        "/api/orders",
        headers=admin_headers,
        json={"lines": [{"product_id": 2, "quantity": 1}]},
    )
    assert r0.status_code == 201
    oid = r0.get_json()["order"]["id"]

    r = client.get(f"/api/orders/{oid}", headers=customer_headers)
    assert r.status_code == 403


@pytest.mark.crud
def test_customer_cancel_own_order(client, customer_headers):
    r0 = client.post(
        "/api/orders",
        headers=customer_headers,
        json={"lines": [{"product_id": 2, "quantity": 1}]},
    )
    oid = r0.get_json()["order"]["id"]
    r = client.put(
        f"/api/orders/{oid}",
        headers=customer_headers,
        json={"status": "cancelled"},
    )
    assert r.status_code == 200
    assert r.get_json()["order"]["status"] == "cancelled"


@pytest.mark.crud
def test_admin_delete_order(client, admin_headers, customer_headers):
    r0 = client.post(
        "/api/orders",
        headers=customer_headers,
        json={"lines": [{"product_id": 1, "quantity": 1}]},
    )
    oid = r0.get_json()["order"]["id"]
    r = client.delete(f"/api/orders/{oid}", headers=admin_headers)
    assert r.status_code == 204
