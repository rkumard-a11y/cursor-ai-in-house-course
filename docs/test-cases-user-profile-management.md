# Test Cases: User Profile Management Feature

This document defines **manual and automated test scenarios** for user profile management: registration, profile updates, password changes, and account deletion. Each scenario includes **objective**, **preconditions**, **test data**, **steps**, and **expected results**.

**Implementation (reference):** In `support_backend/`, profile flows are exposed under **`/api/auth`**: `PATCH /api/auth/me`, `PUT /api/auth/password`, `DELETE /api/auth/me`. Automated tests that map to these IDs live in **`support_backend/tests/test_profile_management.py`**.

**Run the automated tests (from repo root):**

```bash
cd support_backend && source .venv/bin/activate
# Profile scenarios only (add --no-cov: full-project coverage is enforced in pytest.ini)
pytest tests/test_profile_management.py -v --no-cov

# Entire support API suite + coverage gate (≥80% on app/)
pytest
```

**Conventions**

- **P** = Positive (happy path)  
- **N** = Negative (invalid input / business rules)  
- **E** = Edge / boundary  
- **S** = Security  

---

## 1. User registration

### 1.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| REG-P-01 | Valid minimal registration | No account for email | `name`: "Jane Doe", `email`: "jane.doe+1@example.com", `password`: "Str0ng!Pass9" | POST register with JSON body | `201`, user record created, password stored as hash (never plaintext in logs/response) |
| REG-P-02 | Valid registration with optional fields | API supports optional phone, locale | Same as P-01 + `phone`: "+1 415 555 0100", `locale`: "en-US" | Register | `201`, optional fields persisted |
| REG-P-03 | Email normalization | — | `email`: "User@EXAMPLE.com` (mixed case) | Register | Stored / compared as normalized lower-case; login works with any case variant agreed by spec |

### 1.2 Negative (N)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| REG-N-01 | Duplicate email | Same email as existing user | Register twice | Second: `409` or `422`, message indicates email taken |
| REG-N-02 | Invalid email format | `email`: "not-an-email" | Register | `400`, field-level error on `email` |
| REG-N-03 | Password too short | Password 7 chars meeting no other rule | Register | `400`, validation error (min length per policy, e.g. 8+) |
| REG-N-04 | Missing required field | Omit `email` or `password` | Register | `400`, schema/validation error |
| REG-N-05 | Weak password (if policy enforced) | `password`: "password" | Register | `400`, password policy violation message |
| REG-N-06 | XSS in name (if displayed) | `name`: `<script>alert(1)</script>` | Register then GET profile | Name stored escaped/sanitized; no script execution in UI/API output |

### 1.3 Edge (E)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| REG-E-01 | Maximum length name | `name`: 255× "A" (or max allowed) | Register | `201` if within limit; else `400` at limit+1 |
| REG-E-02 | Unicode name | `name`: "田中 太郎", `email`: unique valid | Register | `201`, correct UTF-8 round-trip |
| REG-E-03 | Leading/trailing whitespace | `email`: " user@example.com "` | Register | Trimmed or rejected consistently per spec |
| REG-E-04 | Empty JSON body | `{}` | Register | `400` |

### 1.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| REG-S-01 | SQL injection in email | `email`: `admin'--@x.com` | Register | Safe handling (parameterized queries); no DB error leakage; no auth bypass |
| REG-S-02 | Mass registration / rate limit | Script: 200 registrations/min from one IP | Burst register | `429` or CAPTCHA per policy after threshold |
| REG-S-03 | Response does not leak hash internals | Register, inspect response | No `password_hash`, no bcrypt salt details in JSON |

---

## 2. Profile updates

### 2.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| PROF-P-01 | Update display name | Authenticated user | `name`: "Jane Q. Doe" | PATCH/PUT profile | `200`, name updated, `updated_at` changed |
| PROF-P-02 | Update avatar URL (if supported) | Valid URL field | `avatar_url`: "https://cdn.example.com/a.png" | Update profile | `200`, URL stored |
| PROF-P-03 | Partial update | — | Only `name` in body | PATCH | Unchanged fields remain; omitted fields not nullified unless API is PUT-full-replace |

### 2.2 Negative (N)

| ID | Title | Test data | Steps | Expected result |
|----|--------|-----------|--------|-----------------|
| PROF-N-01 | Unauthenticated update | Any valid body | No `Authorization` header | `401` |
| PROF-N-02 | Update another user's profile | User A token, path or body targeting User B | PATCH B's profile | `403` or `404` (no IDOR) |
| PROF-N-03 | Read-only field in body | `email` or `role` not allowed to self-edit | PATCH with `email` | `400` or ignored per spec; must not privilege escalate |
| PROF-N-04 | Invalid avatar URL | `avatar_url`: "not-a-url" | PATCH | `400` field error |

### 2.3 Edge (E)

| ID | Title | Test data | Expected result |
|----|--------|-----------|-----------------|
| PROF-E-01 | Concurrent updates | Two PATCHes same user with different names | Last-write-wins or conflict `409` per spec; no corrupted partial state |
| PROF-E-02 | Null vs omit | `name`: null | Either reject `400` or clear field only if explicitly allowed |

### 2.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| PROF-S-01 | IDOR on profile GET | User A guesses `/users/{B_id}/profile` | `403`/`404`; never return B's PII to A |
| PROF-S-02 | HTML in bio | `bio`: `<img src=x onerror=alert(1)>` | Stored sanitized; API returns safe encoding; UI escapes |
| PROF-S-03 | JWT tampering | Modify payload sub/user_id, resign badly | `401` invalid signature |

---

## 3. Password change

### 3.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| PWD-P-01 | Change with correct current password | Logged in | `current_password`: old, `new_password`: "N3wStr0ng!Pass" | POST change-password | `200`, old password invalid, new works at login |
| PWD-P-02 | Session still valid after change (if policy) | Same session after change | Call authenticated endpoint | Still `200` OR all sessions revoked per product spec |

### 3.2 Negative (N)

| ID | Title | Test data | Expected result |
|----|--------|-----------|-----------------|
| PWD-N-01 | Wrong current password | `current_password`: "wrong" | `401` or `400`, generic message ("invalid credentials") — no hint which field wrong |
| PWD-N-02 | New equals old | Same as current | `400`, business rule error |
| PWD-N-03 | Weak new password | Policy requires complexity | `400` |
| PWD-N-04 | Unauthenticated | No token | `401` |

### 3.3 Edge (E)

| ID | Title | Test data | Expected result |
|----|--------|-----------|-----------------|
| PWD-E-01 | Minimum length boundary | New password exactly min length | `200` |
| PWD-E-02 | Min length minus one | min-1 | `400` |
| PWD-E-03 | Unicode in password (if allowed) | New password with emoji/CJK per policy | Per spec: accept or reject with clear message |

### 3.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| PWD-S-01 | Brute force current password | 50 attempts with wrong current | `429` / lockout / exponential backoff |
| PWD-S-02 | Timing attack mitigation | Compare wrong vs correct current (statistical) | Similar response time band or constant-time compare (best-effort test note) |
| PWD-S-03 | Password in query string | GET `/change-password?new=secret` | Not supported; `405`/`404`; never log query |

---

## 4. Account deletion

### 4.1 Positive (P)

| ID | Title | Preconditions | Test data | Steps | Expected result |
|----|--------|-----------------|-----------|--------|-----------------|
| DEL-P-01 | Self-delete with confirmation | User has no blocking deps (or policy allows) | `password`: current OR `confirm`: "DELETE" | POST delete-account | `204`/`200`, user cannot login; profile GET returns `404`/`410` |
| DEL-P-02 | Cascade / anonymize related data | User has posts/tickets | Delete | Related rows deleted, anonymized, or reassigned per GDPR/product spec |

### 4.2 Negative (N)

| ID | Title | Test data | Expected result |
|----|--------|-----------|-----------------|
| DEL-N-01 | Wrong password on delete | Incorrect `password` | `401`/`403`, account intact |
| DEL-N-02 | Admin cannot delete superadmin (if hierarchy) | Lower admin token | `403` |
| DEL-N-03 | Delete without confirmation when required | Omit `confirm` token | `400` |

### 4.3 Edge (E)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| DEL-E-01 | Double submit delete | Two DELETE requests race | Second returns idempotent `404`/`410` or `409` — no double credit/refund bugs |
| DEL-E-02 | Session use after delete | Keep old JWT, call API | `401` if tokens invalidated; else document risk |

### 4.4 Security (S)

| ID | Title | Steps | Expected result |
|----|--------|--------|-----------------|
| DEL-S-01 | CSRF on browser-based delete | Session cookie auth without CSRF token | Rejected or SameSite policy prevents cross-site POST |
| DEL-S-02 | IDOR delete | User A calls delete endpoint for user B | `403`/`404` |
| DEL-S-03 | Audit log | Admin deletes user | Audit entry with actor, target, timestamp; no password in log |

---

## 5. Cross-cutting security matrix

| Area | Check | Pass criteria |
|------|--------|----------------|
| Transport | TLS in production | No sensitive calls over plain HTTP in prod |
| Headers | `Secure`, `HttpOnly`, `SameSite` on cookies | If cookie-based auth |
| Headers | Security headers (CSP, X-Content-Type-Options) | Present on HTML responses if applicable |
| Auth | JWT expiry | Expired token → `401` |
| Auth | Refresh rotation (if used) | Refresh reuse detected → revoke family |
| Privacy | Error messages | No stack traces or DB errors to clients in prod |
| Privacy | Enumeration | Register/login errors generic enough to reduce email enumeration (product tradeoff documented) |

---

## 6. Sample test data sets (copy-paste)

**Valid user A**

```json
{
  "name": "Alice Example",
  "email": "alice.profile.test@example.com",
  "password": "T3st!LongP@ssw0rd"
}
```

**Valid user B (collision tests)**

```json
{
  "name": "Bob Example",
  "email": "bob.profile.test@example.com",
  "password": "Another!9CharsMin"
}
```

**Invalid emails**

- `plainaddress`
- `@missinglocal.com`
- `missingatsign.com`

**Boundary passwords** (adjust to your min length, e.g. 12)

- Exactly minimum: `Aa1!` + padding to meet length and complexity rules  
- Below minimum: one character shorter  

**XSS / injection strings** (for negative/security only; never run in prod without isolation)

- Name: `<svg onload=alert(1)>`
- Name: `'; DROP TABLE users;--`

---

## 7. Traceability checklist (for QA sign-off)

- [ ] All **REG-** scenarios executed for target release  
- [ ] All **PROF-** scenarios executed  
- [ ] All **PWD-** scenarios executed  
- [ ] All **DEL-** scenarios executed  
- [ ] Security matrix reviewed by engineering lead  
- [ ] Automated API tests map to IDs in comments or test names (e.g. `test_REG_P_01_valid_registration`)

---

## 8. Suggested automation mapping (pytest / API)

| Automated test name | Covers |
|----------------------|--------|
| `test_register_success_returns_201` | REG-P-01 |
| `test_register_duplicate_email_409` | REG-N-01 |
| `test_register_invalid_email_400` | REG-N-02 |
| `test_profile_update_authenticated_200` | PROF-P-01 |
| `test_profile_update_other_user_forbidden` | PROF-N-02, PROF-S-01 |
| `test_password_change_success` | PWD-P-01 |
| `test_password_change_wrong_current` | PWD-N-01 |
| `test_account_delete_confirmed` | DEL-P-01 |
| `test_account_delete_wrong_password` | DEL-N-01 |

Extend this table as APIs are implemented.

---

*Document version: 1.0 — generated for course / profile-management test planning.*
