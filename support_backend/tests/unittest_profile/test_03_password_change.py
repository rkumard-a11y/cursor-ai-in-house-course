"""Category: Password change (PWD-*)."""

from __future__ import annotations

from tests.unittest_profile import mock_data
from tests.unittest_profile.base import ProfileManagementTestCase


class TestPasswordChangePositive(ProfileManagementTestCase):
    """Successful password updates."""

    def test_PWD_P_01_change_password_login_with_new(self):
        """PWD-P-01: new password works at login."""
        email = mock_data.unique_email("pwd_ok")
        self.register("P", email, "Kk123456!")
        h = self.login_headers(email, "Kk123456!")
        new_pw = "L0ng!New9Val1d"
        r = self.put_json(
            "/api/auth/password",
            {"current_password": "Kk123456!", "new_password": new_pw},
            headers=h,
        )
        self.assertEqual(r.status_code, 200)
        login2 = self.post_json(
            "/api/auth/login",
            {"email": email, "password": new_pw},
        )
        self.assertEqual(login2.status_code, 200, login2.get_json())


class TestPasswordChangeNegative(ProfileManagementTestCase):
    """Invalid password change attempts."""

    def setUp(self):
        super().setUp()
        self._email = mock_data.unique_email("pwd_neg")
        self.register("P", self._email, "Mm123456!")
        self._headers = self.login_headers(self._email, "Mm123456!")

    def test_PWD_N_01_wrong_current_password(self):
        """PWD-N-01: wrong current → 401."""
        r = self.put_json(
            "/api/auth/password",
            {"current_password": "wrong", "new_password": "Nn123456!"},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 401)

    def test_PWD_N_02_new_equals_old(self):
        """PWD-N-02: same new as current → 400."""
        r = self.put_json(
            "/api/auth/password",
            {"current_password": "Mm123456!", "new_password": "Mm123456!"},
            headers=self._headers,
        )
        self.assertEqual(r.status_code, 400)

    def test_PWD_N_04_unauthenticated(self):
        """PWD-N-04: no JWT → 401."""
        r = self.put_json(
            "/api/auth/password",
            {"current_password": "Mm123456!", "new_password": "Oo123456!"},
        )
        self.assertEqual(r.status_code, 401)


class TestPasswordChangeEdgeCases(ProfileManagementTestCase):
    """Boundary behaviour."""

    def test_PWD_E_02_minimum_length_boundary(self):
        """PWD-E-02: exactly 8 chars with letter+digit accepted if not weak."""
        email = mock_data.unique_email("pwd_len")
        # 8 chars: Aaaaaa1! has digit and letter
        pw = "Aaaaaa1!"
        self.register("L", email, pw)
        h = self.login_headers(email, pw)
        new_pw = "Bbbbb1!!"  # 8 chars
        r = self.put_json(
            "/api/auth/password",
            {"current_password": pw, "new_password": new_pw},
            headers=h,
        )
        self.assertEqual(r.status_code, 200)
