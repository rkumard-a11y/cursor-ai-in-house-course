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


def login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.get_json()
    return {"Authorization": f"Bearer {r.get_json()['access_token']}"}


@pytest.fixture
def admin_headers(client):
    return login(client, "admin@example.com", "AdminPassw0rd!")


@pytest.fixture
def agent_headers(client):
    return login(client, "agent@example.com", "AgentPassw0rd!")


@pytest.fixture
def customer_headers(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Cust One",
            "email": "cust@example.com",
            "password": "Customer12!",
        },
    )
    return login(client, "cust@example.com", "Customer12!")
