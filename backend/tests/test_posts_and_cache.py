from unittest import mock

from app.post_cache import LIST_VERSION_KEY, detail_cache_key, list_page_cache_key
from tests.conftest import register_user


def test_list_posts_empty_then_cached(auth_client):
    client, headers = auth_client
    r = client.get("/api/posts")
    assert r.status_code == 200
    data = r.get_json()
    assert data["total"] == 0
    r2 = client.get("/api/posts")
    assert r2.status_code == 200
    assert r2.get_json() == data
    r = client.get("/api/posts?page=1")
    assert r.status_code == 200
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        assert redis is not None
        keys = [k for k in redis.scan_iter(match="blog:posts:list:*")]
        assert len(keys) >= 1


def test_get_post_detail_cached_and_invalidated_on_update(auth_client):
    client, headers = auth_client
    cat = client.get("/api/categories").get_json()[0]["id"]
    r = client.post(
        "/api/posts",
        json={"title": "T1", "body": "B1", "category_id": cat},
        headers=headers,
    )
    pid = r.get_json()["id"]
    r1 = client.get(f"/api/posts/{pid}")
    assert r1.status_code == 200
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        assert redis.get(detail_cache_key(pid)) is not None
    r2 = client.put(
        f"/api/posts/{pid}",
        json={"title": "T2"},
        headers=headers,
    )
    assert r2.status_code == 200
    assert r2.get_json()["title"] == "T2"
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        raw = redis.get(detail_cache_key(pid))
        assert raw is not None
        import json

        assert json.loads(raw)["title"] == "T2"


def test_create_post_bumps_list_version_so_old_list_keys_stale(auth_client):
    client, headers = auth_client
    client.get("/api/posts?page=1")
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        v_before = int(redis.get(LIST_VERSION_KEY) or 0)
        key_before = list_page_cache_key(1)
    cat = client.get("/api/categories").get_json()[0]["id"]
    client.post(
        "/api/posts",
        json={"title": "New", "body": "Body", "category_id": cat},
        headers=headers,
    )
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        v_after = int(redis.get(LIST_VERSION_KEY) or 0)
        assert v_after == v_before + 1
        assert redis.get(key_before) is not None
    r = client.get("/api/posts?page=1")
    assert r.status_code == 200
    assert r.get_json()["total"] == 1


def test_delete_post_invalidates_caches(auth_client):
    client, headers = auth_client
    cat = client.get("/api/categories").get_json()[0]["id"]
    pid = client.post(
        "/api/posts",
        json={"title": "Del", "body": "X", "category_id": cat},
        headers=headers,
    ).get_json()["id"]
    client.get(f"/api/posts/{pid}")
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        assert redis.get(detail_cache_key(pid)) is not None
    r = client.delete(f"/api/posts/{pid}", headers=headers)
    assert r.status_code == 204
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        assert redis.get(detail_cache_key(pid)) is None


def test_create_post_requires_auth(client):
    r = client.post("/api/posts", json={"title": "A", "body": "B"})
    assert r.status_code == 401


def test_update_post_forbidden_for_non_author(client):
    register_user(client, "author", "author@example.com")
    register_user(client, "other", "other@example.com")
    a = client.post(
        "/api/auth/login", json={"username": "author", "password": "password12"}
    ).get_json()["access_token"]
    o = client.post(
        "/api/auth/login", json={"username": "other", "password": "password12"}
    ).get_json()["access_token"]
    cat = client.get("/api/categories").get_json()[0]["id"]
    pid = client.post(
        "/api/posts",
        json={"title": "P", "body": "B", "category_id": cat},
        headers={"Authorization": f"Bearer {a}"},
    ).get_json()["id"]
    r = client.put(
        f"/api/posts/{pid}",
        json={"title": "Hacked"},
        headers={"Authorization": f"Bearer {o}"},
    )
    assert r.status_code == 403


def test_get_post_not_found_not_cached(client):
    r = client.get("/api/posts/99999")
    assert r.status_code == 404
    with client.application.app_context():
        redis = client.application.extensions["redis"]
        assert redis.get(detail_cache_key(99999)) is None


def test_list_posts_invalid_page_normalized(auth_client):
    client, _ = auth_client
    r = client.get("/api/posts?page=0")
    assert r.status_code == 200
    assert r.get_json()["page"] == 1


def test_create_app_disables_cache_when_redis_url_empty():
    from app import create_app
    from app.config import Config
    from app.extensions import db

    class EmptyRedisUrlConfig(Config):
        TESTING = False
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        REDIS_URL = ""

    app = create_app(EmptyRedisUrlConfig)
    try:
        assert app.extensions["redis"] is None
    finally:
        with app.app_context():
            db.session.remove()
            db.engine.dispose()


@mock.patch("app.__init__.redis.Redis")
def test_create_app_disables_cache_when_redis_unreachable(MockRedis):
    import redis as redis_mod

    from app import create_app
    from app.config import Config
    from app.extensions import db

    client = mock.MagicMock()
    client.ping.side_effect = redis_mod.exceptions.ConnectionError()
    MockRedis.from_url.return_value = client
    app = create_app(Config)
    try:
        assert app.extensions["redis"] is None
    finally:
        with app.app_context():
            db.session.remove()
            db.engine.dispose()
