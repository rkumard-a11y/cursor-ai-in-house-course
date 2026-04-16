import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db


@pytest.fixture
def app():
    application = create_app(TestConfig)
    yield application
    with application.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_client(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "password12",
        },
    )
    r = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password12"},
    )
    token = r.get_json()["access_token"]
    return client, {"Authorization": f"Bearer {token}"}


def register_user(client, username="alice", email=None, password="password12"):
    if email is None:
        email = f"{username}@example.com"
    return client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )
