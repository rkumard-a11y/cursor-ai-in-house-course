import pytest

from tests.conftest import register_user


def test_register_login_flow(client):
    r = register_user(client, "bob", "bob@example.com")
    assert r.status_code == 201
    body = r.get_json()
    assert body["username"] == "bob"
    r = client.post(
        "/api/auth/login", json={"username": "bob", "password": "password12"}
    )
    assert r.status_code == 200
    assert "access_token" in r.get_json()


def test_register_duplicate_returns_409(client):
    register_user(client, "carl", "carl@example.com")
    r = register_user(client, "daryl", "carl@example.com")
    assert r.status_code == 409


def test_register_validation_short_password(client):
    r = register_user(client, "dana", "dana@example.com", password="short")
    assert r.status_code == 400
    assert "messages" in r.get_json()


def test_login_invalid_credentials(client):
    register_user(client, "erin", "erin@example.com")
    r = client.post(
        "/api/auth/login", json={"username": "erin", "password": "wrongpassword"}
    )
    assert r.status_code == 401
