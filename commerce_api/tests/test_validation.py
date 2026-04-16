"""Input validation (400 + schema errors)."""

import pytest


@pytest.mark.validation
def test_register_invalid_email_400(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "longenough"},
    )
    assert r.status_code == 400
    assert r.get_json()["code"] == "VALIDATION_ERROR"


@pytest.mark.validation
def test_register_short_password_400(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "x@y.com", "password": "short"},
    )
    assert r.status_code == 400


@pytest.mark.validation
def test_order_empty_lines_400(client, customer_headers):
    r = client.post(
        "/api/orders",
        headers=customer_headers,
        json={"lines": []},
    )
    assert r.status_code == 400
