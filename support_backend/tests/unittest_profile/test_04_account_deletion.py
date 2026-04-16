"""Category: Account deletion (DEL-*)."""

from __future__ import annotations

from tests.unittest_profile import mock_data
from tests.unittest_profile.base import ProfileManagementTestCase


class TestAccountDeletionPositive(ProfileManagementTestCase):
    """Successful account closure."""

    def test_DEL_P_01_delete_then_login_fails(self):
        """DEL-P-01: 204 then login 401."""
        email = mock_data.unique_email("del_ok")
        pw = "Pp123456!"
        self.register("D", email, pw)
        h = self.login_headers(email, pw)
        r = self.delete_json(
            "/api/auth/me",
            {"password": pw, "confirm": mock_data.DELETE_CONFIRM_PHRASE},
            headers=h,
        )
        self.assertEqual(r.status_code, 204)
        bad = self.post_json("/api/auth/login", {"email": email, "password": pw})
        self.assertEqual(bad.status_code, 401)


class TestAccountDeletionNegative(ProfileManagementTestCase):
    """Rejected deletion attempts."""

    def setUp(self):
        super().setUp()
        self._email = mock_data.unique_email("del_neg")
        self._pw = "Qq123456!"
        self.register("D", self._email, self._pw)
        self._headers = self.login_headers(self._email, self._pw)

    def test_DEL_N_01_wrong_password(self):
        """DEL-N-01: wrong password → 401."""
        r = self.delete_json(
            "/api/auth/me",
            {"password": "wrong", "confirm": mock_data.DELETE_CONFIRM_PHRASE},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 401)

    def test_DEL_N_03_wrong_confirm_phrase(self):
        """DEL-N-03: confirm not DELETE → 400."""
        r = self.delete_json(
            "/api/auth/me",
            {"password": self._pw, "confirm": "NOPE"},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 400)
