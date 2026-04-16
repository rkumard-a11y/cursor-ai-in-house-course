"""Shared Flask test client fixture: per-test app + DB isolation."""

from __future__ import annotations

import unittest

from app import create_app
from app.config import TestConfig
from app.extensions import db


class ProfileManagementTestCase(unittest.TestCase):
    """Per-test in-memory app (mirrors pytest function-scoped ``app`` fixture)."""

    def setUp(self):
        self.app = create_app(TestConfig)
        self._ctx = self.app.app_context()
        self._ctx.push()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        self._ctx.pop()
        with self.app.app_context():
            db.engine.dispose()

    def post_json(self, path: str, payload: dict, headers=None):
        kw = {"json": payload}
        if headers:
            kw["headers"] = headers
        return self.client.post(path, **kw)

    def patch_json(self, path: str, payload: dict, headers=None):
        kw = {"json": payload}
        if headers:
            kw["headers"] = headers
        return self.client.patch(path, **kw)

    def put_json(self, path: str, payload: dict, headers=None):
        kw = {"json": payload}
        if headers:
            kw["headers"] = headers
        return self.client.put(path, **kw)

    def delete_json(self, path: str, payload: dict, headers=None):
        kw = {"json": payload}
        if headers:
            kw["headers"] = headers
        return self.client.delete(path, **kw)

    def register(self, name: str, email: str, password: str):
        return self.post_json(
            "/api/auth/register",
            {"name": name, "email": email, "password": password},
        )

    def login_headers(self, email: str, password: str) -> dict:
        r = self.post_json(
            "/api/auth/login",
            {"email": email, "password": password},
        )
        self.assertEqual(r.status_code, 200, r.get_json())
        token = r.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
