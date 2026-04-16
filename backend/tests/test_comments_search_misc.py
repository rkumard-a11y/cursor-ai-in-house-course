from tests.conftest import register_user


def test_categories_list_contains_seeded_slugs(client):
    r = client.get("/api/categories")
    assert r.status_code == 200
    slugs = {c["slug"] for c in r.get_json()}
    assert "general" in slugs
    assert "technology" in slugs


def test_search_requires_q(client):
    r = client.get("/api/search")
    assert r.status_code == 400


def test_search_finds_post(auth_client):
    client, headers = auth_client
    cat = client.get("/api/categories").get_json()[0]["id"]
    client.post(
        "/api/posts",
        json={"title": "UniqueAlpha", "body": "Body text", "category_id": cat},
        headers=headers,
    )
    r = client.get("/api/search?q=UniqueAlpha")
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1


def test_comments_create_list_delete(auth_client):
    client, headers = auth_client
    cat = client.get("/api/categories").get_json()[0]["id"]
    pid = client.post(
        "/api/posts",
        json={"title": "C", "body": "D", "category_id": cat},
        headers=headers,
    ).get_json()["id"]
    r = client.post(
        f"/api/posts/{pid}/comments", json={"body": "Nice"}, headers=headers
    )
    assert r.status_code == 201
    cid = r.get_json()["id"]
    r2 = client.get(f"/api/posts/{pid}/comments")
    assert r2.status_code == 200
    assert len(r2.get_json()) == 1
    r3 = client.delete(f"/api/posts/{pid}/comments/{cid}", headers=headers)
    assert r3.status_code == 204


def test_comment_delete_forbidden_for_stranger(auth_client):
    client, headers = auth_client
    register_user(client, "stranger", "stranger@example.com")
    st = client.post(
        "/api/auth/login",
        json={"username": "stranger", "password": "password12"},
    ).get_json()["access_token"]
    cat = client.get("/api/categories").get_json()[0]["id"]
    pid = client.post(
        "/api/posts",
        json={"title": "P", "body": "B", "category_id": cat},
        headers=headers,
    ).get_json()["id"]
    cid = client.post(
        f"/api/posts/{pid}/comments", json={"body": "c1"}, headers=headers
    ).get_json()["id"]
    r = client.delete(
        f"/api/posts/{pid}/comments/{cid}",
        headers={"Authorization": f"Bearer {st}"},
    )
    assert r.status_code == 403


def test_integrity_error_returns_json(client):
    r = client.post("/__test/integrity")
    assert r.status_code == 409
    assert r.get_json()["error"] == "conflict"


def test_unknown_route_returns_json_404(client):
    r = client.get("/api/does-not-exist")
    assert r.status_code == 404
    body = r.get_json()
    assert "error" in body


def test_apidocs_available(client):
    r = client.get("/apidocs/")
    assert r.status_code == 200


def test_post_update_validation_empty_body(auth_client):
    client, headers = auth_client
    cat = client.get("/api/categories").get_json()[0]["id"]
    pid = client.post(
        "/api/posts",
        json={"title": "V", "body": "B", "category_id": cat},
        headers=headers,
    ).get_json()["id"]
    r = client.put(f"/api/posts/{pid}", json={}, headers=headers)
    assert r.status_code == 400
