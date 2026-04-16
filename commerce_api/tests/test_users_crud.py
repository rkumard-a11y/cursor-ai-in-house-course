"""User management CRUD (admin list/delete; self read/update)."""

import pytest


@pytest.mark.crud
def test_admin_put_user_role(client, admin_headers):
    r = client.put(
        "/api/users/2",
        headers=admin_headers,
        json={"role": "customer", "name": "Renamed Customer"},
    )
    assert r.status_code == 200
    assert r.get_json()["user"]["name"] == "Renamed Customer"


@pytest.mark.crud
def test_customer_put_own_name_only(client, customer_headers):
    r = client.put(
        "/api/users/2",
        headers=customer_headers,
        json={"name": "Me Only"},
    )
    assert r.status_code == 200
    assert r.get_json()["user"]["name"] == "Me Only"


@pytest.mark.crud
def test_customer_cannot_change_role(client, customer_headers):
    r = client.put(
        "/api/users/2",
        headers=customer_headers,
        json={"role": "admin"},
    )
    assert r.status_code == 403


@pytest.mark.crud
def test_admin_delete_user_roundtrip(client, admin_headers):
    r = client.post(
        "/api/auth/register",
        json={
            "email": "todelete@commerce.test",
            "password": "DeleteMe1!",
            "name": "Goner",
        },
    )
    assert r.status_code == 201
    uid = r.get_json()["user"]["id"]

    r2 = client.delete(f"/api/users/{uid}", headers=admin_headers)
    assert r2.status_code == 204

    r3 = client.get(f"/api/users/{uid}", headers=admin_headers)
    assert r3.status_code == 404
