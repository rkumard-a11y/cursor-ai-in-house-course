"""Product catalog CRUD (GET public; POST/PUT/DELETE admin)."""

import pytest


@pytest.mark.crud
def test_get_products_list_public(client):
    r = client.get("/api/products")
    assert r.status_code == 200
    items = r.get_json()["items"]
    assert len(items) >= 1
    assert "sku" in items[0]


@pytest.mark.crud
def test_get_product_by_id(client):
    r = client.get("/api/products/1")
    assert r.status_code == 200
    assert r.get_json()["product"]["sku"] == "SKU-DEMO-1"


@pytest.mark.crud
def test_create_update_delete_product_admin(client, admin_headers):
    r = client.post(
        "/api/products",
        headers=admin_headers,
        json={
            "sku": "SKU-TEST-CRUD",
            "name": "CRUD Product",
            "description": "d",
            "price_cents": 500,
            "stock": 3,
            "active": True,
        },
    )
    assert r.status_code == 201
    pid = r.get_json()["product"]["id"]

    r2 = client.put(
        f"/api/products/{pid}",
        headers=admin_headers,
        json={"name": "CRUD Product Renamed", "stock": 5},
    )
    assert r2.status_code == 200

    r3 = client.delete(f"/api/products/{pid}", headers=admin_headers)
    assert r3.status_code == 204

    r4 = client.get(f"/api/products/{pid}")
    assert r4.status_code == 404
