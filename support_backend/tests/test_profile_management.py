"""Maps to docs/test-cases-user-profile-management.md (REG/PROF/PWD/DEL)."""

from tests.conftest import login


def _reg(client, name, email, password):
    return client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )


def test_REG_P_01_valid_registration(client):
    """REG-P-01: valid registration returns 201 and no password in body."""
    r = _reg(client, "Jane Doe", "jane.p1@example.com", "Str0ng!Pass9")
    assert r.status_code == 201
    body = r.get_json()
    assert "password_hash" not in body["user"]
    assert body["user"]["email"] == "jane.p1@example.com"


def test_REG_N_01_duplicate_email(client):
    """REG-N-01: duplicate email → 409."""
    _reg(client, "A", "dup@example.com", "Aa123456!")
    r = _reg(client, "B", "dup@example.com", "Bb123456!")
    assert r.status_code == 409


def test_REG_N_05_weak_password_rejected(client):
    """REG-N-05: common / weak password → 400."""
    r = _reg(client, "X", "weakuser@example.com", "password")
    assert r.status_code == 400


def test_REG_E_03_email_trimmed(client):
    """REG-E-03: leading/trailing spaces on email normalized."""
    r = _reg(client, "Trim", "  spaced@example.com  ", "Cc123456!")
    assert r.status_code == 201
    assert r.get_json()["user"]["email"] == "spaced@example.com"


def test_REG_N_06_xss_name_sanitized(client):
    """REG-N-06 / PROF-S-02: script stripped from name."""
    r = _reg(client, "<script>x</script>Bob", "xssname@example.com", "Dd123456!")
    assert r.status_code == 201
    assert "<script>" not in r.get_json()["user"]["name"]


def test_PROF_P_01_patch_name(client):
    """PROF-P-01: authenticated PATCH updates name."""
    _reg(client, "Old", "prof1@example.com", "Ee123456!")
    h = login(client, "prof1@example.com", "Ee123456!")
    r = client.patch("/api/auth/me", json={"name": "Jane Q. Doe"}, headers=h)
    assert r.status_code == 200
    assert r.get_json()["user"]["name"] == "Jane Q. Doe"


def test_PROF_P_02_patch_avatar_url(client):
    """PROF-P-02: valid avatar URL stored."""
    _reg(client, "Av", "prof2@example.com", "Ff123456!")
    h = login(client, "prof2@example.com", "Ff123456!")
    r = client.patch(
        "/api/auth/me",
        json={"avatar_url": "https://cdn.example.com/a.png"},
        headers=h,
    )
    assert r.status_code == 200
    assert r.get_json()["user"]["avatar_url"] == "https://cdn.example.com/a.png"


def test_PROF_N_01_patch_without_auth(client):
    """PROF-N-01: unauthenticated PATCH → 401."""
    assert client.patch("/api/auth/me", json={"name": "X"}).status_code == 401


def test_PROF_unknown_role_field_ignored(client):
    """Security: role in PATCH must not change user (unknown EXCLUDE)."""
    _reg(client, "R", "profrole@example.com", "Gg123456!")
    h = login(client, "profrole@example.com", "Gg123456!")
    r = client.patch(
        "/api/auth/me",
        json={"name": "OK", "role": "admin"},
        headers=h,
    )
    assert r.status_code == 200
    assert r.get_json()["user"]["role"] == "customer"


def test_PROF_N_04_invalid_avatar_url(client):
    """PROF-N-04: invalid URL → 400."""
    _reg(client, "U", "badav@example.com", "Hh123456!")
    h = login(client, "badav@example.com", "Hh123456!")
    r = client.patch("/api/auth/me", json={"avatar_url": "not-a-url"}, headers=h)
    assert r.status_code == 400


def test_PWD_P_01_change_password_success(client):
    """PWD-P-01: change password; login with new works."""
    _reg(client, "P", "pwd1@example.com", "Ii123456!")
    h = login(client, "pwd1@example.com", "Ii123456!")
    r = client.put(
        "/api/auth/password",
        json={"current_password": "Ii123456!", "new_password": "J0seph!New9"},
        headers=h,
    )
    assert r.status_code == 200
    assert client.post(
        "/api/auth/login",
        json={"email": "pwd1@example.com", "password": "J0seph!New9"},
    ).status_code == 200


def test_PWD_N_01_wrong_current_password(client):
    """PWD-N-01: wrong current password → 401."""
    _reg(client, "P", "pwd2@example.com", "Kk123456!")
    h = login(client, "pwd2@example.com", "Kk123456!")
    r = client.put(
        "/api/auth/password",
        json={"current_password": "wrong", "new_password": "Ll123456!"},
        headers=h,
    )
    assert r.status_code == 401


def test_PWD_N_02_new_equals_old(client):
    """PWD-N-02: new password same as current → 400."""
    _reg(client, "P", "pwd3@example.com", "Mm123456!")
    h = login(client, "pwd3@example.com", "Mm123456!")
    r = client.put(
        "/api/auth/password",
        json={"current_password": "Mm123456!", "new_password": "Mm123456!"},
        headers=h,
    )
    assert r.status_code == 400


def test_DEL_P_01_delete_account_success(client):
    """DEL-P-01: password + confirm DELETE → 204; login fails."""
    _reg(client, "D", "del1@example.com", "Nn123456!")
    h = login(client, "del1@example.com", "Nn123456!")
    r = client.delete(
        "/api/auth/me",
        json={"password": "Nn123456!", "confirm": "DELETE"},
        headers=h,
    )
    assert r.status_code == 204
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "del1@example.com", "password": "Nn123456!"},
        ).status_code
        == 401
    )


def test_DEL_N_01_wrong_password(client):
    """DEL-N-01: wrong password on delete → 401."""
    _reg(client, "D", "del2@example.com", "Oo123456!")
    h = login(client, "del2@example.com", "Oo123456!")
    r = client.delete(
        "/api/auth/me",
        json={"password": "wrong", "confirm": "DELETE"},
        headers=h,
    )
    assert r.status_code == 401


def test_DEL_N_03_missing_confirm(client):
    """DEL-N-03: wrong confirm phrase → 400."""
    _reg(client, "D", "del3@example.com", "Pp123456!")
    h = login(client, "del3@example.com", "Pp123456!")
    r = client.delete(
        "/api/auth/me",
        json={"password": "Pp123456!", "confirm": "NOPE"},
        headers=h,
    )
    assert r.status_code == 400


def test_profile_patch_bio_sanitizes_xss(client):
    """PROF-S-02: bio HTML stripped."""
    _reg(client, "Bio", "bioxss@example.com", "Qq123456!")
    h = login(client, "bioxss@example.com", "Qq123456!")
    r = client.patch(
        "/api/auth/me",
        json={"bio": '<img src=x onerror=alert(1)>hello'},
        headers=h,
    )
    assert r.status_code == 200
    assert "onerror" not in r.get_json()["user"]["bio"]
