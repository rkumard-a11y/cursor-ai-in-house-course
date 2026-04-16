"""JWT and credential flows (valid / invalid tokens)."""

import pytest


@pytest.mark.auth
def test_login_success_returns_token(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "admin@commerce.test", "password": "AdminPassw0rd!"},
    )
    assert r.status_code == 200
    body = r.get_json()
    assert body["status"] == "ok"
    assert "access_token" in body


@pytest.mark.auth
def test_login_invalid_password_401(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "admin@commerce.test", "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert r.get_json()["code"] == "INVALID_CREDENTIALS"


@pytest.mark.auth
def test_me_requires_token_401(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


@pytest.mark.auth
def test_me_with_valid_token_200(client, admin_headers):
    r = client.get("/api/auth/me", headers=admin_headers)
    assert r.status_code == 200
    assert r.get_json()["user"]["role"] == "admin"


@pytest.mark.auth
def test_me_with_malformed_authorization_401(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401
    assert r.get_json()["code"] == "INVALID_TOKEN"


@pytest.mark.auth
def test_register_duplicate_email_409(client):
    # customer@commerce.test already seeded
    r = client.post(
        "/api/auth/register",
        json={
            "email": "customer@commerce.test",
            "password": "AnotherPwd1!",
            "name": "Dup",
        },
    )
    assert r.status_code == 409
    assert r.get_json()["code"] == "EMAIL_TAKEN"
