"""Category: Profile updates (PROF-*)."""

from __future__ import annotations

from tests.unittest_profile import mock_data
from tests.unittest_profile.base import ProfileManagementTestCase


class TestProfileUpdatesPositive(ProfileManagementTestCase):
    """Successful PATCH /api/auth/me scenarios."""

    def setUp(self):
        super().setUp()
        self._email = mock_data.unique_email("prof_p")
        self.assertEqual(
            self.register("Old Name", self._email, "Ff123456!").status_code, 201
        )
        self._headers = self.login_headers(self._email, "Ff123456!")

    def test_PROF_P_01_update_display_name(self):
        """PROF-P-01: name updated."""
        r = self.patch_json(
            "/api/auth/me",
            {"name": "Jane Q. Doe"},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["user"]["name"], "Jane Q. Doe")

    def test_PROF_P_02_update_avatar_url(self):
        """PROF-P-02: https avatar URL stored."""
        r = self.patch_json(
            "/api/auth/me",
            {"avatar_url": mock_data.VALID_AVATAR_URL},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["user"]["avatar_url"], mock_data.VALID_AVATAR_URL)

    def test_PROF_P_03_partial_patch_name_only(self):
        """PROF-P-03: partial PATCH updates only supplied fields."""
        self.patch_json(
            "/api/auth/me",
            {"avatar_url": mock_data.VALID_AVATAR_URL},
            headers=self._headers,
        )
        r = self.patch_json(
            "/api/auth/me",
            {"name": "Partial Only"},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 200)
        u = r.get_json()["user"]
        self.assertEqual(u["name"], "Partial Only")
        self.assertEqual(u["avatar_url"], mock_data.VALID_AVATAR_URL)


class TestProfileUpdatesNegative(ProfileManagementTestCase):
    """Auth / validation failures."""

    def test_PROF_N_01_unauthenticated_patch(self):
        """PROF-N-01: PATCH without JWT → 401."""
        r = self.patch_json("/api/auth/me", {"name": "X"})
        self.assertEqual(r.status_code, 401)

    def test_PROF_N_04_invalid_avatar_url(self):
        """PROF-N-04: invalid URL → 400."""
        email = mock_data.unique_email("badav")
        self.register("U", email, "Gg123456!")
        h = self.login_headers(email, "Gg123456!")
        r = self.patch_json(
            "/api/auth/me",
            {"avatar_url": mock_data.INVALID_AVATAR_URL},
            headers=h,
        )
        self.assertEqual(r.status_code, 400)

    def test_PROF_empty_body_rejected(self):
        """Edge: PATCH with no updatable fields after validation → 400."""
        email = mock_data.unique_email("empty_patch")
        self.register("E", email, "Hh123456!")
        h = self.login_headers(email, "Hh123456!")
        r = self.patch_json("/api/auth/me", {}, headers=h)
        self.assertEqual(r.status_code, 400)


class TestProfileUpdatesSecurity(ProfileManagementTestCase):
    """RBAC / XSS on profile."""

    def test_PROF_unknown_role_field_ignored(self):
        """Role in body must not escalate privilege."""
        email = mock_data.unique_email("role_esc")
        self.register("R", email, "Ii123456!")
        h = self.login_headers(email, "Ii123456!")
        r = self.patch_json(
            "/api/auth/me",
            {"name": "OK", "role": "admin"},
            headers=h,
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["user"]["role"], "customer")

    def test_PROF_S_02_bio_xss_sanitized(self):
        """PROF-S-02: dangerous markup stripped from bio."""
        email = mock_data.unique_email("bioxss")
        self.register("Bio", email, "Jj123456!")
        h = self.login_headers(email, "Jj123456!")
        r = self.patch_json("/api/auth/me", {"bio": mock_data.XSS_BIO}, headers=h)
        self.assertEqual(r.status_code, 200)
        bio = r.get_json()["user"].get("bio") or ""
        self.assertNotIn("onerror", bio.lower())
