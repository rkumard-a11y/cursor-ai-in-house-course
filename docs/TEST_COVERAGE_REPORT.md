# Test coverage report — Cursor AI in-house course (module 8)

**Document purpose:** Summary of automated test coverage and test inventory for code review.  
**Generated:** 2026-04-16 (evidence runs executed in this repository checkout).  
**Tooling:** pytest + Coverage.py (Python APIs), Jest + ts-jest (sample `src/` modules), Playwright (E2E; no line coverage).

---

## 1. Executive summary

| Component | Test framework | Tests (collected / run) | Line / statement coverage (`app/`) | Policy / gate |
|-----------|----------------|-------------------------|-------------------------------------|-----------------|
| **Blog API** (`backend/`) | pytest | 25 | **94.9%** (491 statements) | `pytest.ini`: **≥ 85%** — **pass** |
| **Support API** (`support_backend/`) | pytest | 69 | **83.2%** (1,041 statements) | `pytest.ini`: **≥ 80%** — **pass** |
| **Commerce API** (`commerce_api/`) | pytest | 35 | **92.3%** (441 statements) | No global fail-under in `pytest.ini`; suite green |
| **Frontend (`src/`)** — Jest via QA | Jest | 3 (2 suites) | **75%** of *exercised* files only (see §5) | QA target in runbook: **≥ 80%** line — **gap** |
| **QA automation** (`qa-automation/`) | pytest | 4 passed, 1 skipped | N/A (tests not measuring `app/`) | Integration skip if blog API down |
| **Root UI E2E** | Playwright | **80** scenarios (6 spec files; multiple projects) | N/A | Functional / regression |

**Overall:** All three Flask applications meet or exceed their configured coverage gates in a full local run. The React app’s **line coverage is not comprehensively measured** by Jest yet (only modules touched by unit tests are included in the Jest coverage map). E2E and API tests provide additional confidence outside line coverage.

---

## 2. Evidence artifacts (machine-readable)

Coverage.py JSON exports (for diffing or dashboards):

| File | Scope |
|------|--------|
| [`docs/coverage/cov-backend.json`](coverage/cov-backend.json) | `backend/app/` |
| [`docs/coverage/cov-support_backend.json`](coverage/cov-support_backend.json) | `support_backend/app/` |
| [`docs/coverage/cov-commerce_api.json`](coverage/cov-commerce_api.json) | `commerce_api/app/` |

Jest summary (this run):

| File | Scope |
|------|--------|
| [`qa-automation/reports/raw/jest-coverage/coverage-summary.json`](../qa-automation/reports/raw/jest-coverage/coverage-summary.json) | `src/**/*.ts(x)` per `jest.config.cjs` |

---

## 3. Blog API (`backend/`) — detail

- **Command:** `cd backend && .venv/bin/python -m pytest`  
- **Scope:** `--cov=app` (see `backend/pytest.ini`).

**Totals:** 466 / 491 statements covered (**94.9%**).

**Lowest modules (still above ~90% for most):**

| Module | Coverage |
|--------|----------|
| `app/schemas.py` | 90% |
| `app/api/comments.py` | 91% |
| `app/post_cache.py` | 93% |
| `app/api/posts.py` | 93% |
| `app/errors.py` | 94% |

**Review note:** Remaining misses are mostly branch/error paths in Marshmallow validators, cache helpers, and HTTP error handling.

---

## 4. Customer support API (`support_backend/`) — detail

- **Command:** `cd support_backend && .venv/bin/python -m pytest` (with project `addopts` enforcing **≥ 80%**).  
- **Scope:** `--cov=app`.

**Totals:** 866 / 1,041 statements covered (**83.2%**).

**Modules warranting deeper review (relative gaps):**

| Module | Coverage | Comment |
|--------|----------|---------|
| `app/errors.py` | **55%** | Extend tests for error handler branches |
| `app/extensions.py` | **56%** | Likely import/init paths not hit in test app factory |
| `app/api/tickets.py` | **72%** | Large surface; many filters and edge routes |
| `app/services/ticket_ops.py` | **71%** | Auto-assign / transition edge cases |
| `app/ticket_number.py` | **69%** | Date/sequence edge cases |

**Review note:** Overall gate passes; improving the above files would raise the aggregate most quickly.

---

## 5. Commerce API (`commerce_api/`) — detail

- **Command:** `cd commerce_api && .venv/bin/python -m pytest --cov=app --cov-report=term-missing`  
- **Scope:** `--cov=app`.

**Totals:** 407 / 441 statements covered (**92.3%**).

**Notable gaps:**

| Module | Coverage |
|--------|----------|
| `app/auth_util.py` | 72% |
| `app/errors.py` | 77% |
| `app/api/orders.py` | 87% |

Markers available for focused runs: `auth`, `authz`, `crud`, `validation`, `errors`, `ratelimit`, `performance` (see `commerce_api/pytest.ini`).

---

## 6. Frontend — Jest (via `qa-automation/`)

- **Command:** `cd qa-automation && npm run test:unit:cov`  
- **Configuration:** `collectCoverageFrom` = `src/**/*.ts(x)` (excluding `*.d.ts`), roots = `qa-automation/tests/unit`.

**Result (this run):**

- **Statements / lines:** **75%** (9 / 12) — only **`src/components/features/UserProfile/formatStats.ts`** is currently exercised by Jest tests.
- **Functions:** 100% (2 / 2) in that file.
- **Branches:** **28.6%** (2 / 7) in that file.

**Review note:** This is **not** whole-app coverage. Expanding `qa-automation/tests/unit/` imports against pure helpers under `src/` will raise aggregate line coverage toward the **80%** QA target in [`qa-automation/docs/QA-RUNBOOK.md`](qa-automation/docs/QA-RUNBOOK.md).

---

## 7. Playwright E2E (repository root)

- **Inventory:** **80** tests in **6** files under `tests/e2e/` (includes desktop + mobile projects per `playwright.config.ts`).
- **Specs:** `accessibility.spec.ts`, `errors.spec.ts`, `product-search.spec.ts`, `registration-multistep.spec.ts`, `responsive.spec.ts`, `task-workflow.spec.ts`.
- **Coverage type:** behavioral; **no** statement coverage for `src/`.

**Command:** `npm run test:e2e` (requires dev server or CI wiring as in `playwright.config.ts`).

---

## 8. QA automation package — pytest

- **Command:** `cd qa-automation && pytest`  
- **Outcome (this run):** 4 passed, **1 skipped** — integration test skipped when blog API is not running at `http://127.0.0.1:5000` (`tests/integration/test_blog_api.py`).

**Review note:** For a full QA pass including integration, start `backend` before `pytest`, or set `BASE_URL` to a reachable instance.

---

## 9. How reviewers can reproduce

**Python (each service uses its own venv):**

```bash
cd backend && source .venv/bin/activate && pip install -r requirements.txt && pytest
cd ../support_backend && source .venv/bin/activate && pip install -r requirements.txt && pytest
cd ../commerce_api && source .venv/bin/activate && pip install -r requirements.txt && pytest --cov=app --cov-report=term-missing
```

**HTML coverage (optional attachment for review):**

```bash
cd backend && source .venv/bin/activate && pytest --cov=app --cov-report=html:../docs/coverage/htmlcov-backend
# open docs/coverage/htmlcov-backend/index.html
```

Repeat with paths adjusted for `support_backend` and `commerce_api`.

**Jest:**

```bash
cd qa-automation && npm install && npm run test:unit:cov
```

**Playwright:**

```bash
npm install && npx playwright install
npm run test:e2e
```

---

## 10. Sign-off checklist (for reviewers)

- [ ] Blog API coverage gate **≥ 85%** verified locally or in CI.  
- [ ] Support API coverage gate **≥ 80%** verified.  
- [ ] Commerce API suite green; coverage **~92%** acceptable for demo scope.  
- [ ] Jest coverage acknowledged as **partial** until more `src/` units are tested.  
- [ ] E2E suite (`npm run test:e2e`) considered for release-critical flows.  
- [ ] Integration tests run with a live **blog** API when claiming full QA automation coverage.

---

*End of report.*
