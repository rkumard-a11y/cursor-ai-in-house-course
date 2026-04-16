"""Category: User registration (REG-* from docs/test-cases-user-profile-management.md)."""

from __future__ import annotations

from tests.unittest_profile import mock_data
from tests.unittest_profile.base import ProfileManagementTestCase


class TestRegistrationPositive(ProfileManagementTestCase):
    """Positive registration paths."""

    def test_REG_P_01_valid_minimal_registration(self):
        """REG-P-01: 201, user created, no password hash in response."""
        email = mock_data.unique_email("reg_p01")
        r = self.register(mock_data.VALID_NAME, email, mock_data.VALID_PASSWORD)
        self.assertEqual(r.status_code, 201)
        body = r.get_json()
        self.assertEqual(body.get("status"), "success")
        self.assertIn("user", body)
        self.assertNotIn("password_hash", body["user"])
        self.assertEqual(body["user"]["email"], email.lower())

    def test_REG_P_03_email_normalized_lowercase(self):
        """REG-P-03: mixed-case email stored lower."""
        base = mock_data.unique_email("mixed")
        local, domain = base.split("@")
        mixed = local.upper() + "@" + domain.lower()
        r = self.register("Norm User", mixed, mock_data.VALID_PASSWORD)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.get_json()["user"]["email"], mixed.lower())


class TestRegistrationNegative(ProfileManagementTestCase):
    """Invalid registration inputs."""

    def test_REG_N_01_duplicate_email(self):
        """REG-N-01: second register with same email → 409."""
        email = mock_data.unique_email("dup")
        self.register("First", email, "Aa123456!")
        r = self.register("Second", email, "Bb123456!")
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.get_json().get("code"), "CONFLICT")

    def test_REG_N_05_weak_password_common(self):
        """REG-N-05: common password rejected."""
        email = mock_data.unique_email("weak")
        r = self.register("X", email, mock_data.WEAK_PASSWORD_COMMON)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json().get("code"), "VALIDATION_ERROR")

    def test_REG_N_05_weak_password_no_digit(self):
        """REG-N-05: letters-only password rejected."""
        email = mock_data.unique_email("weak2")
        r = self.register("X", email, mock_data.WEAK_PASSWORD_NO_DIGIT)
        self.assertEqual(r.status_code, 400)


class TestRegistrationEdgeCases(ProfileManagementTestCase):
    """Boundary / normalization."""

    def test_REG_E_03_email_trimmed(self):
        """REG-E-03: spaces around email stripped."""
        core = mock_data.unique_email("spaced").split("@")[0]
        spaced = f"  {core}@unittest.example.com  "
        r = self.register("Trim", spaced, "Cc123456!")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.get_json()["user"]["email"], spaced.strip().lower())

    def test_REG_E_04_empty_json_body(self):
        """REG-E-04: empty body → 400."""
        r = self.client.post("/api/auth/register", json={})
        self.assertEqual(r.status_code, 400)


class TestRegistrationSecurity(ProfileManagementTestCase):
    """Security-focused registration checks."""

    def test_REG_N_06_xss_name_sanitized(self):
        """REG-N-06: script tags not preserved in stored name."""
        email = mock_data.unique_email("xss_reg")
        r = self.register(mock_data.XSS_NAME, email, "Dd123456!")
        self.assertEqual(r.status_code, 201)
        name = r.get_json()["user"]["name"]
        self.assertNotIn("<script>", name.lower())

    def test_REG_S_03_response_has_no_password_hash_field(self):
        """REG-S-03: registration JSON never exposes hash internals."""
        email = mock_data.unique_email("nohash")
        r = self.register("Safe", email, "Ee123456!")
        self.assertEqual(r.status_code, 201)
        dumped = str(r.get_json())
        self.assertNotIn("password_hash", dumped)
        self.assertNotIn("bcrypt", dumped.lower())
