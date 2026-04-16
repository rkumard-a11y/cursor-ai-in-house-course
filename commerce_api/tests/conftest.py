import pytest

from app import create_app
from app.config import StrictRateTestConfig, TestConfig
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


def login_json(client, email: str, password: str):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.get_json()
    token = r.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client):
    return login_json(client, "admin@commerce.test", "AdminPassw0rd!")


@pytest.fixture
def customer_headers(client):
    return login_json(client, "customer@commerce.test", "Customer12!")


@pytest.fixture
def strict_rate_app():
    application = create_app(StrictRateTestConfig)
    yield application
    with application.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture
def strict_rate_client(strict_rate_app):
    return strict_rate_app.test_client()
