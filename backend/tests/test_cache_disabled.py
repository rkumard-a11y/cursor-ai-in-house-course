from app import create_app
from app.config import TestConfig
from app.extensions import db


class NoCacheConfig(TestConfig):
    CACHE_DISABLED = True


def _dispose(app):
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


def test_cache_disabled_app_has_no_redis():
    app = create_app(NoCacheConfig)
    try:
        assert app.extensions["redis"] is None
    finally:
        _dispose(app)


def test_posts_work_without_redis():
    app = create_app(NoCacheConfig)
    try:
        c = app.test_client()
        c.post(
            "/api/auth/register",
            json={
                "username": "nocache",
                "email": "nocache@example.com",
                "password": "password12",
            },
        )
        tok = c.post(
            "/api/auth/login",
            json={"username": "nocache", "password": "password12"},
        ).get_json()["access_token"]
        h = {"Authorization": f"Bearer {tok}"}
        cat = c.get("/api/categories").get_json()[0]["id"]
        r = c.post(
            "/api/posts",
            json={"title": "T", "body": "B", "category_id": cat},
            headers=h,
        )
        assert r.status_code == 201
        pid = r.get_json()["id"]
        assert c.get(f"/api/posts/{pid}").status_code == 200
        assert c.get("/api/posts").status_code == 200
    finally:
        _dispose(app)
